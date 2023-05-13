import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import { MongoError } from 'mongodb';

import AtlasDatabaseClient from '../../../../modules/AtlasDatabaseClient';

import { logWithDate, response405, response500 } from '../../../../lib/utils/general';
import { IMemberComprehensive } from '../../../../lib/interfaces/member';
import { INotificationStatistics } from '../../../../lib/interfaces/notification';

const fnn = `${GetOrUpdateNotificationStatistics.name} (API)`;

/** GetOrUpdateNotificationStatistics
 * 
 * 
 * This interface accepts GET and PUT requests
 * 
 * Info required for GET requests
 * -     token: JWT
 * 
 * Last update:
 * - 23/02/2023 v0.1.2
*/

export default async function GetOrUpdateNotificationStatistics(req: NextApiRequest, res: NextApiResponse) {

    const { method } = req;
    if (!['GET', 'PUT'].includes(method ?? '')) {
        response405(req, res);
        return;
    }

    //// Verify identity ////
    const token = await getToken({ req });
    if (!(token && token?.sub)) {
        res.status(400).send('Invalid identity');
        return;
    }

    //// Declare DB client ////
    const atlasDbClient = AtlasDatabaseClient();
    try {
        await atlasDbClient.connect();

        //// Verify member status ////
        const { sub: memberId } = token;
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

        if ('PUT' === method) {
            const notificationStatisticsUpdateResult = await notificationStatisticsCollectionClient.updateOne({ memberId }, { $set: { cue: 0, reply: 0, like: 0, pin: 0, save: 0, follow: 0 } });
            if (!notificationStatisticsUpdateResult.acknowledged) {
                logWithDate(`Failed to reset notification statistics (of INotificationStatistics, member id: ${memberId}) in [C] notificationStatistics`, fnn);
                res.status(500).end();
            } else {
                //// Response 200 ////
                res.status(200).end();
            }
            return;
        }

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

        //// Response 200 ////
        res.status(200).send(statistics);

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