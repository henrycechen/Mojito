import type { NextApiRequest, NextApiResponse } from 'next';
import { RestError } from '@azure/data-tables';
import { MongoError } from 'mongodb';

import AzureTableClient from '../../../../modules/AzureTableClient';

import { logWithDate, response405, response500 } from '../../../../lib/utils/general';
import { verifyId } from '../../../../lib/utils/verify';
import { IConcisePostComprehensive } from '../../../../lib/interfaces/post';
import { IMemberPostMapping } from '../../../../lib/interfaces/mapping';

const fnn = `${GetCreationsByMemberId.name} (API)`;

/** 
 * This interface ONLY accepts GET requests
 * 
 * Info required for GET requests
 * -     memberId: string (query)
 * -     channelId: string (query string, optional)
 * -     quantity: number (query string, optional, maximum 20)
 * -     positionId: string (query string, the last post id of the last request, optional)
 * 
 * Info will be returned
 * -     arr: IConcisePostComprehensive[]
 * Last update: 
 * - 21/02/2023 v0.1.1
 * - 09/05/2023 v0.1.2
*/

export default async function GetCreationsByMemberId(req: NextApiRequest, res: NextApiResponse) {

    const { method } = req;
    if ('GET' !== method) {
        response405(req, res);
        return;
    }

    // Verify author id
    const { memberId } = req.query;
    const { isValid, category, id: authorId } = verifyId(memberId);
    if (!(isValid && 'member' === category)) {
        res.status(400).send('Invalid member id');
        return;
    }

    try {
        let str = `PartitionKey eq '${authorId}' and IsActive eq true`;

        const { channelId } = req.query;
        if ('string' === typeof channelId && '' !== channelId && 'all' !== channelId) {
            str += ` and ChannelId eq '${channelId}'`;
        }

        let arr: IConcisePostComprehensive[] = [];
        const creationsMappingTableClient = AzureTableClient('CreationsMapping');
        const creationsMappingQuery = creationsMappingTableClient.listEntities<IMemberPostMapping>({ queryOptions: { filter: str } });

        // [!] attemp to reterieve entity makes the probability of causing RestError
        let creationsMappingQueryResult = await creationsMappingQuery.next();
        while (!creationsMappingQueryResult.done) {
            arr.push({
                postId: creationsMappingQueryResult.value.rowKey,
                memberId: authorId,
                nickname: creationsMappingQueryResult.value.Nickname ?? '',
                createdTimeBySecond: creationsMappingQueryResult.value.CreatedTimeBySecond,
                title: creationsMappingQueryResult.value.Title,
                channelId: creationsMappingQueryResult.value.ChannelId,
                hasImages: creationsMappingQueryResult.value.HasImages,
                totalCommentCount: 0,
                totalHitCount: 0,
                totalLikedCount: 0,
                totalDislikedCount: 0
            });
            creationsMappingQueryResult = await creationsMappingQuery.next();
        }

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
        return;
    }
}