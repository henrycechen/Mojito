import type { NextApiRequest, NextApiResponse } from 'next';
import { MongoError } from 'mongodb';

import AtlasDatabaseClient from '../../../../../modules/AtlasDatabaseClient';

import { IPostComprehensive } from '../../../../../lib/interfaces/post';
import { logWithDate, response405, response500 } from '../../../../../lib/utils/general';
import { verifyId } from '../../../../../lib/utils/verify';

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
 * 
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
    const { memberId, channelId, quantity } = req.query;
    const { isValid, category, id: authorId } = verifyId(memberId);
    if (!(isValid && 'member' === category)) {
        res.status(400).send('Invalid member id');
        return;
    }

    const atlasDbClient = AtlasDatabaseClient();
    try {
        let q: number = 5;
        if ('string' === typeof quantity && 5 < parseInt(quantity)) {
            const n = parseInt(quantity);
            q = (30 >= n) ? n : 30;
        }

        const conditions = [{ memberId: { $eq: authorId }, status: { $gt: 0 } }, ('string' === typeof channelId && !['', 'all'].includes(channelId)) ? { channelId: channelId } : {}];
        const pipeline = [
            { $match: { $and: conditions } },
            { $limit: q },
            { $sort: { totalHitCount: -1 } },
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
        return;
    }
}