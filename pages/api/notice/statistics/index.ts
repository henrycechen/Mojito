import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt'
import { RestError } from '@azure/data-tables';
import { MongoError } from 'mongodb';

import AtlasDatabaseClient from "../../../../modules/AtlasDatabaseClient";

import { IMemberMemberMapping, INoticeInfo, INotificationStatistics, IMemberComprehensive, IMemberStatistics } from '../../../../lib/interfaces';
import { createNoticeId, getNicknameFromToken, verifyId, response405, response500, log, } from '../../../../lib/utils';
const recaptchaServerSecret = process.env.INVISIABLE_RECAPTCHA_SECRET_KEY ?? '';

/** This interface ONLY accepts GET requests
 * 
 * Info required for GET requests
 * 
 * recaptchaResponse: string (query string)
 * token: JWT
 * 
*/

export default async function GetNotificationStatistics(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;
    if ('GET' !== method) {
        response405(req, res);
        return;
    }

    res.send({ cue: 1, reply: 1, like: 123, pin: 1, save: 1, follow: 1 })
    return;


    // FIXME: deactived human/bot verification for tests
    //// Verify human/bot ////
    // const { recaptchaResponse } = req.query;
    // const { status, message } = await verifyRecaptchaResponse(recaptchaServerSecret, recaptchaResponse);
    // if (200 !== status) {
    //     if (403 === status) {
    //         res.status(403).send(message);
    //         return;
    //     }
    //     if (500 === status) {
    //         response500(res, message);
    //         return;
    //     }
    // }
    //// Verify identity ////
    const token = await getToken({ req });
    if (!(token && token?.sub)) {
        res.status(400).send('Invalid identity');
        return;
    }
    //// Declare DB client ////
    const atlasDbClient = AtlasDatabaseClient();
    try {
        const { sub: memberId } = token;
        //// Verify member status ////
        const memberComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IMemberComprehensive>('member');
        const memberComprehensiveQueryResult = await memberComprehensiveCollectionClient.findOne({ memberId });
        if (null === memberComprehensiveQueryResult) {
            throw new Error(`Member attempt to GET notice statistics but have no document (of IMemberComprehensive, member id: ${memberId}) in [C] memberComprehensive`);
        }
        const { status: memberStatus } = memberComprehensiveQueryResult;
        if (0 > memberStatus) {
            res.status(403).send('Method not allowed due to member suspended or deactivated');
            await atlasDbClient.close();
            return;
        }
        const notificationStatisticsCollectionClient = atlasDbClient.db('statistics').collection<INotificationStatistics>('notification');
        const notificationStatisticsQueryResult = await notificationStatisticsCollectionClient.findOne({ memberId }, { projection: { _id: 0, memberId: 0, cue: 1, reply: 1, like: 1, pin: 1, save: 1, follow: 1 } });
        if (null === notificationStatisticsQueryResult) {
            log(`Document (of INotificationStatistics, member id: ${memberId}) not found in [C] notificationStatistics`);
            res.status(500).send('Notification statistics document not found');
            await atlasDbClient.close();
            return;
        }
        res.status(200).send(notificationStatisticsQueryResult);
        await atlasDbClient.close();
    } catch (e: any) {
        let msg;
        if (e instanceof MongoError) {
            msg = 'Attempt to communicate with atlas mongodb.';
        } else {
            msg = `Uncategorized. ${e?.msg}`;
        }
        if (!res.headersSent) {
            response500(res, msg);
        }
        log(msg, e);
        await atlasDbClient.close();
        return;
    }
}