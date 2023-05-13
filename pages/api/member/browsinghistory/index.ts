import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import { RestError } from '@azure/data-tables';
import { MongoError } from 'mongodb';

import AzureTableClient from '../../../../modules/AzureTableClient';
import AtlasDatabaseClient from '../../../../modules/AtlasDatabaseClient';

import { IMemberComprehensive } from '../../../../lib/interfaces/member';
import { logWithDate, response405, response500 } from '../../../../lib/utils/general';
import { IConcisePostComprehensive } from '../../../../lib/interfaces/post';
import { IMemberPostMapping } from '../../../../lib/interfaces/mapping';
import { verifyId } from '../../../../lib/utils/verify';

const fnn = `${GetOrDeleteBrowsingHistory.name} (API)`;

/**
 * This interface accepts GET and DELETE requests
 * 
 * Info required for GET requests
 * -     token: JWT
 * -     quantity: number (query string, optional, maximum 20)
 * -     positionId: string (query string, the last post id of the last request, optional)
 * 
 * Info will be returned for GET requests
 * -     arr: IConcisePostComprehensive[]
 * 
 * Info required for DELETE requets
 * -     token: JWT
 * -     postId: string
 * 
 * Last update:
 * - 21/02/2023 v0.1.1
 * - 10/05/2023 v0.1.2
*/

export default async function GetOrDeleteBrowsingHistory(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;

    if (!['GET', 'DELETE'].includes(method ?? '')) {
        response405(req, res);
        return;
    }

    //// Verify identity ////
    const token = await getToken({ req });
    if (!(token && token?.sub)) {
        res.status(400).send('Invalid identity');
        return;
    }
    const { sub: memberId } = token;

    //// Declare DB client ////
    const atlasDbClient = AtlasDatabaseClient();
    try {
        await atlasDbClient.connect();

        //// Verify member status ////
        const memberComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IMemberComprehensive>('member');
        const memberComprehensiveQueryResult = await memberComprehensiveCollectionClient.findOne({ memberId }, { projection: { _id: 0, status: 1 } });
        if (null === memberComprehensiveQueryResult) {
            throw new Error(`Member attempt to get browsing history records but have no document (of IMemberComprehensive, member id: ${memberId}) in [C] memberComprehensive`);
        }
        const { status: memberStatus } = memberComprehensiveQueryResult;
        if (0 > memberStatus) {
            res.status(403).send('Method not allowed due to member suspended or deactivated');
            await atlasDbClient.close();
            return;
        }

        await atlasDbClient.close();
        const historyMappingTableClient = AzureTableClient('HistoryMapping');

        //// DELETE ////
        if ('DELETE' === method) {
            //// Verify post id ////
            const { isValid, category, id: postId } = verifyId(req.query?.postId);
            if (!(isValid && 'post' === category)) {
                res.status(400).send('Invalid post id');
                return;
            }

            await historyMappingTableClient.updateEntity({
                partitionKey: memberId,
                rowKey: postId,
                IsActive: false
            }, 'Merge');

            //// Response 200 ////
            res.status(200).send('Delete browsing history success');
            return;
        }

        //// GET ////
        let str = `PartitionKey eq '${memberId}' and IsActive eq true`;

        const { channelId } = req.query;
        if ('string' === typeof channelId && '' !== channelId && 'all' !== channelId) {
            str += ` and ChannelId eq '${channelId}'`;
        }

        let arr: IConcisePostComprehensive[] = [];
        const historyMappingQuery = historyMappingTableClient.listEntities<IMemberPostMapping>({ queryOptions: { filter: str } });

        // [!] attemp to reterieve entity makes the probability of causing RestError
        let historyMappingQueryResult = await historyMappingQuery.next();
        while (historyMappingQueryResult.value) {
            arr.push({
                postId: historyMappingQueryResult.value.rowKey,
                memberId: historyMappingQueryResult.value.AuthorId,
                nickname: historyMappingQueryResult.value.Nickname ?? '',
                createdTimeBySecond: historyMappingQueryResult.value.CreatedTimeBySecond,
                title: historyMappingQueryResult.value.Title,
                channelId: historyMappingQueryResult.value.ChannelId,
                hasImages: historyMappingQueryResult.value.HasImages,
                totalCommentCount: 0,
                totalHitCount: 0,
                totalLikedCount: 0,
                totalDislikedCount: 0
            });
            historyMappingQueryResult = await historyMappingQuery.next();
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


// if ('DELETE' !== method) {
//     response405(req, res);
//     return;
// }
// //// Verify identity ////
// const token = await getToken({ req });
// if (!(token && token?.sub)) {
//     res.status(400).send('Invalid identity');
//     return;
// }
// const { sub: memberId } = token;

// // Verify post id


// //// Declare DB client ////
// const atlasDbClient = AtlasDatabaseClient();
// try {
//     await atlasDbClient.connect();

//     //// Verify member status ////
//     const memberComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IMemberComprehensive>('member');
//     const memberComprehensiveQueryResult = await memberComprehensiveCollectionClient.findOne({ memberId }, { projection: { _id: 0, status: 1 } });
//     if (null === memberComprehensiveQueryResult) {
//         throw new Error(`Member attempt to delete browsing history record but have no document (of IMemberComprehensive, member id: ${memberId}) in [C] memberComprehensive`);
//     }
//     const { status: memberStatus } = memberComprehensiveQueryResult;
//     if (0 > memberStatus) {
//         res.status(403).send('Method not allowed due to member suspended or deactivated');
//         await atlasDbClient.close();
//         return;
//     }
//     await atlasDbClient.close();

