import type { NextApiRequest, NextApiResponse } from 'next';
import { RestError } from '@azure/data-tables';
import { MongoError } from 'mongodb';

import AtlasDatabaseClient from '../../../modules/AtlasDatabaseClient';

import { LangConfigs} from '../../../lib/types';
import { logWithDate, response405, response500 } from '../../../lib/utils/general';
import { verifyEnvironmentVariable, verifyRecaptchaResponse } from '../../../lib/utils/verify';

import { IAffairComprehensive } from '../../../lib/interfaces/affair';
import { createId, getTimeBySecond } from '../../../lib/utils/create';
import { verifyId } from '../../../lib/utils/verify';

const recaptchaServerSecret = process.env.INVISIABLE_RECAPTCHA_SECRET_KEY ?? '';
const fnn = ReportMisbehaviour.name;

/**
 * This interface ONLY accepts POST requests
 * 
 * Info required for POST requests
 * - recaptchaResponse: string (query)
 * - memberId: string (body)
 * - nickname: string (body)
 * - referenceId: string (body)
 * - referenceContent: string (body)
 * - category: number (body)
 * - additionalInfo: string (body)
 * 
 * Last update:
 * - 28/02/2023 v0.1.1
 * - 11/05/2023 v0.1.2
*/

export default async function ReportMisbehaviour(req: NextApiRequest, res: NextApiResponse) {

    const { method } = req;
    if ('POST' !== method) {
        response405(req, res);
        return;
    }

    //// Verify environment variables ////
    const environmentVariable = verifyEnvironmentVariable({ recaptchaServerSecret });
    if (!!environmentVariable) {
        const msg = `${environmentVariable} not found`;
        response500(res, msg);
        logWithDate(msg, fnn);
        return;
    }

    //// Verify if requested by human ////
    const { recaptchaResponse } = req.query;
    const { status: recaptchStatus, message } = await verifyRecaptchaResponse(recaptchaServerSecret, recaptchaResponse);
    if (200 !== recaptchStatus) {
        if (403 === recaptchStatus) {
            res.status(403).send(message);
            return;
        }
        if (500 === recaptchStatus) {
            response500(res, message);
            return;
        }
    }

    const { memberId: mId, referenceId: rId } = req.body;

    //// Verify member id ////
    const { isValid: isValidMemberId, category: c0, id: memberId } = verifyId(mId);
    if (!(isValidMemberId && 'member' === c0)) {
        res.status(400).send('Invalid member id');
        return;
    }

    //// Verify comment id ////
    const { isValid: isValidEntityId, category: c1, id: referenceId } = verifyId(rId);
    if (!(isValidEntityId && ['post', 'comment', 'subcomment'].includes(c1))) {
        res.status(400).send('Invalid reference id');
        return;
    }

    //// Declare DB client ////
    const atlasDbClient = AtlasDatabaseClient();
    try {
        const { nickname, referenceContent, category, additionalInfo } = req.body;

        const affairComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IAffairComprehensive>('affair');
        const result = await affairComprehensiveCollectionClient.insertOne({
            affairId: createId('affair'),
            defendantId: memberId,
            defendantName: nickname,
            referenceId: referenceId,
            referenceContent: referenceContent ?? '',
            category: category ?? 0,
            additionalInfo: additionalInfo,
            createdTimeBySecond: getTimeBySecond(),
            status: 200
        });

        if (!result.acknowledged) {
            res.status(500).send('Failed to log affair');
            await atlasDbClient.close();
            return;
        }

        //// Response 200 ////
        res.status(200).send('Verification email sent');

        await atlasDbClient.close();
        return;
    } catch (e: any) {
        let msg;
        if (e instanceof RestError) {
            msg = `Attempt to communicate with azure table storage.`;
        } else if (e instanceof MongoError) {
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