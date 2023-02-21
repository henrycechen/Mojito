import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt'
import { MongoError } from 'mongodb';

import AtlasDatabaseClient from "../../../../../../../modules/AtlasDatabaseClient";
import { logWithDate, response405, response500 } from '../../../../../../../lib/utils/general';

const fname = QueryTopicByIdFragment.name;

/** QueryTopicByIdFragment v0.1.1 FIXME: test mode
 * 
 * Last update: 
 * 
 * This interface ONLY accepts GET requests
 * 
 * Info required for GET requests
 * 
 * fragment: string (query, fragment of topic id string)
*/

export default async function QueryTopicByIdFragment(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;
    if ('GET' !== method) {
        response405(req, res);
        return;
    }

    res.send([
        {
            topicId: '5ZGo5p2w5Lym',
            channelId: 'chat',
            totalPostCount: 126
        },
        {
            topicId: '6K+05aW95LiN5ZOt',
            channelId: 'chat',
            totalPostCount: 75
        },
        {
            topicId: '5ZGK55m95rCU55CD',
            channelId: 'chat',
            totalPostCount: 64
        },
        {
            topicId: '6b6Z5Y236aOO',
            channelId: 'chat',
            totalPostCount: 12
        },
        {
            topicId: '5Y+N5pa55ZCR55qE6ZKf',
            channelId: 'chat',
            totalPostCount: 3
        },
    ]);
    return;

    // const { fragment } = req.query;

    // //// Verify notice category ////
    // if (!('string' === typeof fragment && new RegExp(/^[-A-Za-z0-9+/]*={0,3}$/).test(fragment))) {
    //     res.status(400).send('Invalid topic id fragment string');
    //     return;
    // }
    // //// Declare DB client ////
    // const atlasDbClient = AtlasDatabaseClient();
    // try {
    //     const topicComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IMemberComprehensive>('topic');
    //     const topicComprehensiveQueryResult = await topicComprehensiveCollectionClient.aggregate([
    //         {
    //             $match: { status: { $gt: 0 } }
    //         },
    //         {
    //             $search: { text: { path: 'topicId', query: fragment } }
    //         },
    //         {
    //             $limit: 5
    //         },
    //         {
    //             $sort: { totalHitCount: 1 }
    //         },
    //         {
    //             $project: { _id: 0, topicId: 1, channelId: 1 }
    //         }
    //     ])
    //     res.status(200).send(topicComprehensiveQueryResult);
    //     await atlasDbClient.close()
    // } catch (e: any) {
    //     let msg;
    //     if (e instanceof MongoError) {
    //         msg = `Attempt to communicate with atlas mongodb.`;
    //     } else {
    //         msg = `Uncategorized. ${e?.msg}`;
    //     }
    //     if (!res.headersSent) {
    //         response500(res, msg);
    //     }
    //     logWithDate(msg, fname, e);
    //     await atlasDbClient.close();
    //     return;
    // }
}