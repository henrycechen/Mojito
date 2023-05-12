import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import { MongoError } from 'mongodb';

import AtlasDatabaseClient from "../../../modules/AtlasDatabaseClient";
import { logWithDate, response405, response500 } from '../../../lib/utils/general';
import { ITopicComprehensive } from '../../../lib/interfaces/topic';

const fname = QueryTopicByIdFragment.name;

/** 
 * This interface ONLY accepts GET requests
 * 
 * Info required for GET requests
 * -     fragment: string (query)
 * 
 * Info will be returned
 * -     IConciseTopicComprehensive[]
 * 
 * Last update:
 * - 12/05/2023 v0.1.1
*/

export default async function QueryTopicByIdFragment(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;
    if ('GET' !== method) {
        response405(req, res);
        return;
    }

    const { fragment } = req.query;

    //// Verify notice category ////
    if (!('string' === typeof fragment && new RegExp(/^[-A-Za-z0-9+/]*={0,3}$/).test(fragment))) {
        res.status(400).send('Invalid topic id fragment string');
        return;
    }

    //// Declare DB client ////
    const atlasDbClient = AtlasDatabaseClient();
    try {
        const pattern = new RegExp(fragment, 'i');
        const conditions = [{ status: { $gt: 0 } }, { topicId: { $regex: pattern } }];


        const pipeline = [
            // { $search: { text: { path: 'topicId', query: fragment } } },
            // { $match: { status: { $gt: 0 } } },
            { $match: { $and: conditions } },
            { $limit: 5 },
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
        logWithDate(msg, fname, e);
        await atlasDbClient.close();
        return;
    }
}