import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt'
import { MongoError } from 'mongodb';

import AtlasDatabaseClient from "../../../../modules/AtlasDatabaseClient";
import { logWithDate, response405, response500 } from '../../../../lib/utils/general';
import { IMemberComprehensive } from '../../../../lib/interfaces/member';
import { INotificationStatistics } from '../../../../lib/interfaces/notification';

const fname = GetOrUpdateNotificationStatistics.name;

/** GetOrUpdateNotificationStatistics v0.1.2 FIXME: test mode
 * 
 * Last update: 23/02/2023
 * 
 * This interface accepts GET and PUT requests
 * 
 * Info required for GET requests
 * - token: JWT
*/

export default async function GetOrUpdateNotificationStatistics(req: NextApiRequest, res: NextApiResponse) {

    const { method } = req;
    if (!['GET', 'PUT'].includes(method ?? '')) {
        response405(req, res);
        return;
    }


    if ('GET' === method) {
        res.send({ cue: 24, reply: 19, like: 166, pin: 7, save: 43, follow: 17 })
    }
    if ('PUT' === method) {
        res.status(200).end();
    }
    return;

    //// Verify identity ////
    const token = await getToken({ req });
    if (!(token && token?.sub)) {
        res.status(400).send('Invalid identity');
        return;
    }
    const { sub: memberId } = token;

    //// Declare DB client ////
    const atlasDbClient = AtlasDatabaseClient();
    try {

        //// Verify member status ////
        const memberComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IMemberComprehensive>('member');
        const memberComprehensiveQueryResult = await memberComprehensiveCollectionClient.findOne({ memberId }, { projection: { _id: 0, status: 1, } });
        if (null === memberComprehensiveQueryResult) {
            throw new Error(`Member attempt to GET/PUT notice statistics but have no document (of IMemberComprehensive, member id: ${memberId}) in [C] memberComprehensive`);
        }
        const { status: memberStatus } = memberComprehensiveQueryResult;
        if (0 > memberStatus) {
            res.status(403).send('Method not allowed due to member suspended or deactivated');
            await atlasDbClient.close();
            return;
        }

        const notificationStatisticsCollectionClient = atlasDbClient.db('statistics').collection<INotificationStatistics>('notification');

        if ('GET' === method) {
            const statistics: INotificationStatistics = { memberId, cue: 0, reply: 0, like: 0, pin: 0, save: 0, follow: 0 };
            const notificationStatisticsQueryResult = await notificationStatisticsCollectionClient.findOne({ memberId }, {
                projection: { _id: 0, cue: 1, reply: 1, like: 1, pin: 1, save: 1, follow: 1 }
            });
            if (null === notificationStatisticsQueryResult) {
                // logWithDate(`Member attempt to GET notice statistics but document (of INotificationStatistics, member id: ${memberId}) not found in [C] notificationStatistics`, fname);
                await notificationStatisticsCollectionClient.insertOne({ memberId, cue: 0, reply: 0, like: 0, pin: 0, save: 0, follow: 0, });
            } else {
                statistics.cue = notificationStatisticsQueryResult.cue;
                statistics.reply = notificationStatisticsQueryResult.reply;
                statistics.like = notificationStatisticsQueryResult.like;
                statistics.pin = notificationStatisticsQueryResult.pin;
                statistics.save = notificationStatisticsQueryResult.save;
                statistics.follow = notificationStatisticsQueryResult.follow;
            }
            res.status(200).send(statistics);
        }

        if ('PUT' === method) {
            const notificationStatisticsUpdateResult = await notificationStatisticsCollectionClient.updateOne({ memberId }, { $set: { cue: 0, reply: 0, like: 0, pin: 0, save: 0, follow: 0 } });
            if (!notificationStatisticsUpdateResult.acknowledged) {
                logWithDate(`Failed to reset notification statistics (of INotificationStatistics, member id: ${memberId}) in [C] notificationStatistics`, fname);
                res.status(500).end();
            } else {
                res.status(200).end();
            }
        }

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