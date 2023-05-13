import type { NextApiRequest, NextApiResponse } from 'next';
import { MongoError } from 'mongodb';

import AtlasDatabaseClient from '../../../modules/AtlasDatabaseClient';

import { logWithDate, response405, response500 } from '../../../lib/utils/general';
import { ITopicComprehensive } from '../../../lib/interfaces/topic';

const fnn = `${GetTopicsByHits} (API)`;

/** 
 * This interface ONLY accepts GET requests
 * 
 * Info required for GET requests
 * -     channelId: string (query, optional)
 * 
 * Info will be returned
 * -     IConciseTopicComprehensive[]
 * 
 * Last update:
 * - 12/05/2023 v0.1.1
*/

export default async function GetTopicsByHits(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;
    if ('GET' !== method) {
        response405(req, res);
        return;
    }

    //// Declare DB client ////
    const atlasDbClient = AtlasDatabaseClient();
    try {

        const { channelId } = req.query;
        const conditions = [{ status: { $gt: 0 } }, ('string' === typeof channelId && '' !== channelId) ? { channelId: channelId } : {}];
        const pipeline = [
            { $match: { $and: conditions } },
            { $limit: 10 },
            { $sort: { totalHitCount: 1 } },
            {
                $project: {
                    _id: 0,
                    topicId: 1,
                    content: 1,
                    channelId: 1,
                    totalHitCount: 1,
                    totalPostCount: 1,
                }
            }
        ];

        const topicComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<ITopicComprehensive>('topic');
        const topicComprehensiveQuery = topicComprehensiveCollectionClient.aggregate(pipeline);

        //// Response 200 ////
        res.status(200).send(await topicComprehensiveQuery.toArray());

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