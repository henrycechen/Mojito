import type { NextApiRequest, NextApiResponse } from 'next';
import { MongoError } from 'mongodb';

import AtlasDatabaseClient from '../../../../../modules/AtlasDatabaseClient';

import { IPostComprehensive } from '../../../../../lib/interfaces/post';
import { logWithDate, response405, response500 } from '../../../../../lib/utils/general';

const fnn = `${PostsOfTopic.name} (API)`;

/**
 * This interface ONLY accepts GET requests
 * 
 * Info required for GET requests
 * -     topicId: string (query)
 * 
 * Info will be returned
 * -     IConcisePostComprehensive[]
 * 
 * Last update:
 * - 30/05/2023 v0.1.1
 */

export default async function PostsOfTopic(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;
    if ('GET' !== method) {
        response405(req, res);
        return;
    }

    const { topicId } = req.query;

    //// Verify notice category ////
    if (!('string' === typeof topicId && new RegExp(/^[-A-Za-z0-9+/]*={0,3}$/).test(topicId))) {
        res.status(400).send('Invalid topic id string');
        return;
    }

    //// Declare DB client ////
    const atlasDbClient = AtlasDatabaseClient();
    try {
        await atlasDbClient.connect();

        const conditions: any = [{ status: { $gt: 0 } }, {topicId: {$eq: topicId}}];
        const pipeline = [
            { $match: { $and: conditions } },
            { $limit: 30 },
            { $sort: { totalHitCount: 1 } },
            {
                $project: {
                    _id: 0,
                    postId: 1,
                    memberId: 1,
                    nickname: 1,
                    createdTimeBySecond: 1,
                    title: 1,
                    channelId: 1,
                    hasImages: 1,
                    totalCommentCount: 1,
                    totalHitCount: 1,
                    totalLikedCount: 1,
                    totalDislikedCount: 1,
                }
            }
        ];

        const topicPostMappingCollectionClient = atlasDbClient.db('mapping').collection<IPostComprehensive>('topic-post');
        const query = topicPostMappingCollectionClient.aggregate(pipeline);

        //// Response 200 ////
        res.status(200).send(await query.toArray());

        await atlasDbClient.close();
        return;
    } catch (e: any) {
        let msg;
        if (e instanceof MongoError) {
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