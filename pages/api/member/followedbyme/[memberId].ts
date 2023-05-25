import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import { RestError } from '@azure/data-tables';
import { MongoError } from 'mongodb';

import AtlasDatabaseClient from '../../../../modules/AtlasDatabaseClient';
import AzureTableClient from '../../../../modules/AzureTableClient';

import { logWithDate, response405, response500 } from '../../../../lib/utils/general';
import { verifyId } from '../../../../lib/utils/verify';
import { IMemberInfo, IMemberComprehensive } from '../../../../lib/interfaces/member';
import { IMemberMemberMapping } from '../../../../lib/interfaces/mapping';

const fnn = `${GetMembersFollowedByMe.name} (API)`;

//////// Find out who am I following ////////

/**
 * This interface only accepts GET requests
 * 
 * Info required for GET requests
 * -     token: JWT (optional)
 * -     memberId: string (query)
 * 
 * Info will be returned
 * -     arr: IConciseMemberInfo[]
 * 
 * Last update:
 * - 23/02/2023 v0.1.3
*/

export default async function GetMembersFollowedByMe(req: NextApiRequest, res: NextApiResponse) {
    
    const { method } = req;
    if ('GET' !== method) {
        response405(req, res);
        return;
    }

    //// Verify identity ////
    let tokenId = ''; // v0.1.3
    const token = await getToken({ req });
    if (token && token?.sub) {
        tokenId = token.sub;
    }

    //// Verify member id ////
    const { isValid, category, id: memberId } = verifyId(req.query?.memberId);
    if (!(isValid && 'member' === category)) {
        res.status(400).send('Invalid member id');
        return;
    }

    //// Declare DB client ////
    const atlasDbClient = AtlasDatabaseClient();
    try {
        await atlasDbClient.connect();

        //// Verify member status ////
        const memberComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IMemberComprehensive>('member');
        const memberComprehensiveQueryResult = await memberComprehensiveCollectionClient.findOne({ memberId }, { projection: { _id: 0, status: 1, allowVisitingFollowedMembers: 1 } });
        if (null === memberComprehensiveQueryResult) {
            throw new Error(`Member attempt to GET followed member info but have no document (of IMemberComprehensive, member id: ${memberId}) in [C] memberComprehensive`);
        }

        const { status: memberStatus, allowVisitingFollowedMembers: isAllowed } = memberComprehensiveQueryResult;
        if (0 > memberStatus) {
            res.status(403).send('Method not allowed due to member suspended or deactivated');
            await atlasDbClient.close();
            return;
        }
        await atlasDbClient.close();

        const arr: IMemberInfo[] = [];
        if (tokenId === memberId || isAllowed) { // v0.1.3
            //// Look up record (of IMemberMemberMapping) in [RL] FollowingMemberMapping ////
            const followingMemberMappingTableClient = AzureTableClient('FollowingMemberMapping');
            const followingMemberMappingQuery = followingMemberMappingTableClient.listEntities<IMemberMemberMapping>({ queryOptions: { filter: `PartitionKey eq '${memberId}' and IsActive eq true` } });
            //// [!] attemp to reterieve entity makes the probability of causing RestError ////
            let followingMemberMappingQueryResult = await followingMemberMappingQuery.next();
            while (!followingMemberMappingQueryResult.done) {
                arr.push({
                    memberId: followingMemberMappingQueryResult.value.rowKey,
                    nickname: followingMemberMappingQueryResult.value.Nickname,
                    briefIntro: followingMemberMappingQueryResult.value.BriefIntro,
                    createdTimeBySecond: followingMemberMappingQueryResult.value.CreatedTimeBySecond,
                });
                followingMemberMappingQueryResult = await followingMemberMappingQuery.next();
            }
        }

        //// Response 200 ////
        res.status(200).send(arr);
        return;
    } catch (e: any) {
        let msg;
        if (e instanceof RestError) {
            msg = `Attempt to communicate with azure table storage.`;
        } else if (e instanceof MongoError) {
            msg = `Attempt to communicate with atlas mongodb.`;
        } else {
            msg = `Uncategorized. ${e?.msg}`;
        }
        if (!res.headersSent) {
            response500(res, msg);
        }
        logWithDate(msg, fnn, e);
        await atlasDbClient.close();
        return;
    }
}