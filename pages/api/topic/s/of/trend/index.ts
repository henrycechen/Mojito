import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import { RestError } from '@azure/data-tables';
import { MongoError } from 'mongodb';

import AzureTableClient from '../../../../../../modules/AzureTableClient';
import AtlasDatabaseClient from "../../../../../../modules/AtlasDatabaseClient";
import { logWithDate, response405, response500 } from '../../../../../../lib/utils/general';
import { IMemberComprehensive } from '../../../../../../lib/interfaces/member';
import { createId, createTopicId } from '../../../../../../lib/utils/create';

const fname = GetTopicsByChannelId.name;

/** GetTopicsByChannelId v0.1.1
 * 
 * Last update: 
 * 
 * This interface ONLY accepts GET requests
 * 
 * Info required for GET requests
 * - channelId: string (query)
 * - quantity: number (body, optional, maximum 20)
*/

export default async function GetTopicsByChannelId(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;
    if ('GET' !== method) {
        response405(req, res);
        return;
    }

    res.send([
        {
            topicId: createTopicId('白紙革命'),
            name: '白紙革命',
            channelId: 'chat',
            totalHitCount: 1124,
            totalPostCount: 157,
        },
        {
            topicId: createTopicId('生活'),
            name: '生活',
            channelId: 'life',
            totalHitCount: 657,
            totalPostCount: 135,
        },
        {
            topicId: createTopicId('聖誕節'),
            name: '聖誕節',
            channelId: 'event',
            totalHitCount: 245,
            totalPostCount: 74,
        },
        {
            topicId: createTopicId('貓'),
            name: '貓',
            channelId: 'chat',
            totalHitCount: 674,
            totalPostCount: 57,
        },
        {
            topicId: createTopicId('新人打卡'),
            name: '新人打卡',
            channelId: 'chat',
            totalHitCount: 248,
            totalPostCount: 49,
        },
    ]);
    return;

    const fragment = req.query?.str;
    //// Verify notice category ////
    if (!('string' === typeof fragment && new RegExp(/^[-A-Za-z0-9+/]*={0,3}$/).test(fragment))) {
        res.status(400).send('Invalid base64 string');
        return;
    }
    //// Declare DB client ////
    const atlasDbClient = AtlasDatabaseClient();
    try {
        let quantity: number;
        if ('string' === typeof req.query?.quantity) {
            quantity = parseInt(req.query.quantity);
        } else {
            quantity = 10;
        }
        if (10 < quantity) {
            quantity = 10;
        }
        const topicComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IMemberComprehensive>('topic');
        const topicComprehensiveQueryResult = await topicComprehensiveCollectionClient.aggregate([
            {
                $match: { status: { $gt: 0 } }
            },
            {
                $limit: quantity
            },
            {
                $sort: { totalHitCount: 1 }
            },
            {
                $project: { _id: 0, topicId: 1, channelId: 1 }
            }
        ]);
        res.status(200).send(topicComprehensiveQueryResult);
        await atlasDbClient.close();
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