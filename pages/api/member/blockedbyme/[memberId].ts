import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt'
import { RestError } from '@azure/data-tables';
import { MongoError } from 'mongodb';

import AzureTableClient from '../../../../modules/AzureTableClient';
import AtlasDatabaseClient from "../../../../modules/AtlasDatabaseClient";

import { IMemberMemberMapping } from '../../../../lib/interfaces/mapping';
import { IMemberComprehensive, IConciseMemberInfo } from '../../../../lib/interfaces/member';
import { logWithDate, response405, response500 } from '../../../../lib/utils/general';
import { verifyId } from '../../../../lib/utils/verify';

const fname = GetMembersBlockedByMe.name;

//////// Find out who I have blocked ////////

/** GetMembersBlockedByMyself v0.1.2 FIXME: test mode
 * 
 * Last update: 21/02/2023
 * 
 * This interface ONLY accepts GET requests
 * 
 * Info required for GET requests
 * - memberId: string
 * 
*/

const bb1 = [
    {
        memberId: 'M3380ACMB',
        nickname: '測試一下名字',
        createdTimeBySecond: 1675795871,
    },
    {
        memberId: 'M3380ACMM',
        nickname: '測試一下名字最長可以有多長',
        createdTimeBySecond: 1675645871,
    },
    {
        memberId: 'M3380ACMD',
        nickname: '測試一下名字nggg可以有多長',
        createdTimeBySecond: 1675145871,
    }
]

export default async function GetMembersBlockedByMe(req: NextApiRequest, res: NextApiResponse) {

    res.send(bb1);
    return;

    const { method } = req;
    if ('GET' !== method) {
        response405(req, res);
        return;
    }

    //// Verify identity ////
    const token = await getToken({ req });
    if (!(token && token?.sub)) {
        res.status(401).send('Unauthorized');
        return;
    }
    const { sub: tokenId } = token;

    //// Verify id ////
    const { isValid, category, id: memberId } = verifyId(req.query?.memberId);

    if (!(isValid && 'member' === category)) {
        res.status(400).send('Invalid member id');
        return;
    }

    //// Match the member id in token and the one in request ////
    if (tokenId !== memberId) {
        res.status(400).send('Requested member id and identity not matched');
        return;
    }

    //// Declare DB client ////
    const atlasDbClient = AtlasDatabaseClient();
    try {
        await atlasDbClient.connect();

        //// Verify member status ////
        const memberComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IMemberComprehensive>('member');
        const memberComprehensiveQueryResult = await memberComprehensiveCollectionClient.findOne({ memberId }, { projection: { _id: 0, status: 1 } });
        if (null === memberComprehensiveQueryResult) {
            throw new Error(`Member attempt to GET blocked member info but have no document (of IMemberComprehensive, member id: ${memberId}) in [C] memberComprehensive`);
        }

        const { status: memberStatus } = memberComprehensiveQueryResult;
        if (0 > memberStatus) {
            res.status(403).send('Method not allowed due to member suspended or deactivated');
            await atlasDbClient.close();
            return;
        }
        await atlasDbClient.close();

        //// Look up record (of IMemberMemberMapping) in [RL] BlockingMemberMapping ////
        const blockingMemberMappingTableClient = AzureTableClient('BlockingMemberMapping');
        const blockingMemberMappingQuery = blockingMemberMappingTableClient.listEntities<IMemberMemberMapping>({ queryOptions: { filter: `PartitionKey eq '${memberId}' and IsActive eq true` } });
        //// [!] attemp to reterieve entity makes the probability of causing RestError ////
        let blockingMemberMappingQueryResult = await blockingMemberMappingQuery.next();
        const arr: IConciseMemberInfo[] = [];
        while (!blockingMemberMappingQueryResult.done) {
            arr.push({
                memberId: blockingMemberMappingQueryResult.value.rowKey,
                nickname: blockingMemberMappingQueryResult.value.Nickname,
                briefIntro: '', // [!] brief intro is not supplied in this case
                createdTimeBySecond: blockingMemberMappingQueryResult.value.CreatedTimeBySecond,
            })
            blockingMemberMappingQueryResult = await blockingMemberMappingQuery.next();
        }
        res.status(200).send(arr);

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
        logWithDate(msg, fname, e);
        await atlasDbClient.close();
        return;
    }
}









