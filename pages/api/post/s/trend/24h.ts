import type { NextApiRequest, NextApiResponse } from 'next';
import { MongoError } from 'mongodb';

import AtlasDatabaseClient from '../../../../../modules/AtlasDatabaseClient';

import { IPostComprehensive } from '../../../../../lib/interfaces/post';
import { logWithDate, response405, response500 } from '../../../../../lib/utils/general';
import { getTimeBySecond } from '../../../../../lib/utils/create';

const fnn = `${PostsOf24HoursHot.name} (API)`;

/**
 * This interface ONLY accepts GET requests
 * 
 * Info required for GET requests
 * -     channelId: string (query, optional)
 * 
 * Info will be returned
 * -     IConcisePostComprehensive[]
 * 
 * TODO:
 * - Accept requesting posts by browsing position (createdTimeById)
 * 
 * Last update:
 * - 10/05/2023 v0.1.1
 */

export default async function PostsOf24HoursHot(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;
    if ('GET' !== method) {
        response405(req, res);
        return;
    }

    //// Declare DB client ////
    const atlasDbClient = AtlasDatabaseClient();
    try {

        const { channelId } = req.query;
        const conditions = [{ status: { $gt: 0 }, createdTimeBySecond: { $gt: getTimeBySecond() - 24 * 60 * 60 } }, ('string' === typeof channelId &&  !['', 'all'].includes(channelId)) ? { channelId: channelId } : {}];
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

        const collectionClient = atlasDbClient.db('comprehensive').collection<IPostComprehensive>('post');
        const query = collectionClient.aggregate(pipeline);

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