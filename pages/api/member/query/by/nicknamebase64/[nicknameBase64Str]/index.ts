import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt'
import { MongoError } from 'mongodb';

import AtlasDatabaseClient from "../../../../../../../modules/AtlasDatabaseClient";

import { IMemberMemberMapping, INoticeInfo, INotificationStatistics, IMemberComprehensive, IMemberStatistics } from '../../../../../../../lib/interfaces';
import { createNoticeId, getNicknameFromToken, verifyId, response405, response500, logWithDate, } from '../../../../../../../lib/utils';
const recaptchaServerSecret = process.env.INVISIABLE_RECAPTCHA_SECRET_KEY ?? '';

/** This interface ONLY accepts GET requests
 * 
 * Info required for GET requests
 * 
 * recaptchaResponse: string (query string)
 * str: string (query)
*/

export default async function QueryMemberByNicknameBase64(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;
    if ('GET' !== method) {
        response405(req, res);
        return;
    }
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
    const str = req.query?.str;
    //// Verify notice category ////
    if (!('string' === typeof str && new RegExp(/^[-A-Za-z0-9+/]*={0,3}$/).test(str))) {
        res.status(400).send('Invalid base64 string');
        return;
    }
    //// Declare DB client ////
    const atlasDbClient = AtlasDatabaseClient();
    try {
        //// Verify member status ////
        const memberComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IMemberComprehensive>('member');
        const memberComprehensiveQueryResult = await memberComprehensiveCollectionClient.aggregate([
            {
                $match: { status: { $gt: 0 } }
            },
            {
                $search: { text: { path: 'nicknameBase64', query: str } }
            },
            {
                $limit: 10
            },
            {
                $project: { _id: 0, memberId: 1, nickname: 1, avatarImageUrl: 1 }
            }
        ])
        res.status(200).send(memberComprehensiveQueryResult);
        await atlasDbClient.close()
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
        logWithDate(msg, e);
        await atlasDbClient.close();
        return;
    }
}