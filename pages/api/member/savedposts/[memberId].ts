import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import { RestError } from '@azure/data-tables';
import { MongoError } from 'mongodb';

import AzureTableClient from '../../../../modules/AzureTableClient';
import AtlasDatabaseClient from "../../../../modules/AtlasDatabaseClient";

import { IMemberComprehensive } from '../../../../lib/interfaces/member';
import { IConcisePostComprehensive } from '../../../../lib/interfaces/post';
import { logWithDate, response405, response500 } from '../../../../lib/utils/general';
import { verifyId } from '../../../../lib/utils/verify';
import { IMemberPostMapping } from '../../../../lib/interfaces/mapping';

const fnn = `${GetOrUndoSaveSavedPosts.name} (API)`;

/**
 * This interface ONLY accepts GET requests
 * 
 * Info required for GET requests
 * -     token: JWT (optional)
 * -     memberId: string (query)
 * 
 * Info will be returned
 * -     arr: IConcisePostComprehensive[]
 * 
 * Last update:
 * - 24/02/2023 v0.1.1
 * - 10/05/2023 v0.1.2
*/

export default async function GetOrUndoSaveSavedPosts(req: NextApiRequest, res: NextApiResponse) {

    const { method } = req;
    if ('GET' !== method) {
        response405(req, res);
        return;
    }

    //// Verify identity ////
    const token = await getToken({ req });
    if (!(token && token?.sub)) {
        res.status(400).send('Invalid identity');
        return;
    }
    const { sub: initiateId } = token;

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

        //// Verify initiate status ////
        const memberComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IMemberComprehensive>('member');
        const initiateComprehensiveQueryResult = await memberComprehensiveCollectionClient.findOne({ memberId: initiateId }, { projection: { _id: 0, status: 1 } });
        if (null === initiateComprehensiveQueryResult) {
            throw new Error(`Member attempt to get saved posts but have no document (of IMemberComprehensive, member id: ${initiateId}) in [C] memberComprehensive`);
        }

        const { status: initiateStatus } = initiateComprehensiveQueryResult;
        if (0 > initiateStatus) {
            res.status(403).send('Method not allowed due to member suspended or deactivated');
            await atlasDbClient.close();
            return;
        }

        //// Initate request for saved posts of other member ////
        if (memberId !== initiateId) {
            const memberComprehensiveQueryResult = await memberComprehensiveCollectionClient.findOne({ memberId: initiateId }, { projection: { _id: 0, status: 1, allowVisitingSavedPosts: 1 } });
            if (null === memberComprehensiveQueryResult) {
                throw new Error(`Member (initiate id: ${initiateId}) attempt to get saved posts of another member (member id: ${memberId}) but have no document (of IMemberComprehensive) in [C] memberComprehensive`);
            }

            const { status: memberStatus, allowVisitingSavedPosts: isAllowed } = initiateComprehensiveQueryResult;
            if (0 > memberStatus) {
                res.status(403).send('Method not allowed due to member suspended or deactivated');
                await atlasDbClient.close();
                return;
            }

            if (!isAllowed) {
                res.status(403).send('Method not allowed due to member\'s privacy settings');
                await atlasDbClient.close();
                return;
            }
        }

        await atlasDbClient.close();
        
        const { channelId } = req.query;

        let str = `PartitionKey eq '${memberId}' and IsActive eq true`;
        if ('string' === typeof channelId && '' !== channelId && 'all' !== channelId) {
            str += ` and ChannelId eq '${channelId}'`;
        }
        
        let arr: IConcisePostComprehensive[] = [];
        const savedMappingTableClient = AzureTableClient('SavedMapping');
        const savedMappingQuery = savedMappingTableClient.listEntities<IMemberPostMapping>({ queryOptions: { filter: str } });

        let savedMappingQueryResult = await savedMappingQuery.next();
        while (!savedMappingQueryResult.done) {
            arr.push({
                postId: savedMappingQueryResult.value.rowKey,
                memberId: savedMappingQueryResult.value.AuthorId,
                nickname: savedMappingQueryResult.value.Nickname,
                createdTimeBySecond: savedMappingQueryResult.value.CreatedTimeBySecond,
                title: savedMappingQueryResult.value.Title,
                channelId: savedMappingQueryResult.value.ChannelId,
                hasImages: savedMappingQueryResult.value.HasImages,
                totalHitCount: 0, // [!] statistics is not supplied in this case
                totalLikedCount: 0,
                totalCommentCount: 0,
                totalDislikedCount: 0
            });
            savedMappingQueryResult = await savedMappingQuery.next();
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