import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt'
import { RestError } from '@azure/data-tables';
import { MongoError } from 'mongodb';

import AzureTableClient from '../../../../../../modules/AzureTableClient';
import AtlasDatabaseClient from "../../../../../../modules/AtlasDatabaseClient";
import { logWithDate, response405, response500 } from '../../../../../../lib/utils/general';
import { IMemberComprehensive } from '../../../../../../lib/interfaces/member';

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
        ])
        res.status(200).send(topicComprehensiveQueryResult);
        await atlasDbClient.close()
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