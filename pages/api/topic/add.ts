import type { NextApiRequest, NextApiResponse } from 'next';
import { MongoError } from 'mongodb';

import AtlasDatabaseClient from "../../../modules/AtlasDatabaseClient";
import { logWithDate, response405, response500 } from '../../../lib/utils/general';
import { ITopicComprehensive } from '../../../lib/interfaces/topic';
import { getTimeBySecond } from '../../../lib/utils/create';

const fname = Test_AddTopicByIdFragment.name;

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

export default async function Test_AddTopicByIdFragment(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;
    if ('GET' !== method) {
        response405(req, res);
        return;
    }

    //// Declare DB client ////
    const atlasDbClient = AtlasDatabaseClient();
    try {
        const content = '聖誕假期';
        const channelId = 'chat';
        const topicComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<ITopicComprehensive>('topic');
        await topicComprehensiveCollectionClient.insertOne({
            topicId: Buffer.from(content).toString('base64'),
            content,
            channelId,
            createdTimeBySecond: getTimeBySecond(),

            // Management
            status: 200,

            // Statistics
            totalHitCount: 0,
            totalSearchCount: 0,
            totalPostCount: 0,
            totalPostDeleteCount: 0,
            totalLikedCount: 0,
            totalUndoLikedCount: 0,
            totalCommentCount: 0,
            totalCommentDeleteCount: 0,
            totalSavedCount: 0,
            totalUndoSavedCount: 0,
        });

        //// Response 200 ////
        res.status(200).send('ok');

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