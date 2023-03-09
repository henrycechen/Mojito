import type { NextApiRequest, NextApiResponse } from 'next';
import { getTimeBySecond } from '../../../../lib/utils/create';
import { logWithDate, response405, response500 } from '../../../../lib/utils/general';
import { verifyEnvironmentVariable, verifyRecaptchaResponse } from '../../../../lib/utils/verify';

const recaptchaServerSecret = process.env.INVISIABLE_RECAPTCHA_SECRET_KEY ?? '';
const fname = VerifyToken.name;

/** VerifyToken v0.1.1
 * 
 * Last update: 16/02/2023
 * 
 * This interface ONLY accepts POST method
 * 
 * Info required for POST request
 * - requestInfo: string, stringified { emailAddress, resetPasswordToken, expireDate }
 * - recaptchaResponse: string
 */

export default async function VerifyToken(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;
    if ('GET' !== method) {
        response405(req, res);
        return;
    }
    
    //// Verify environment variables ////
    const environmentVariable = verifyEnvironmentVariable({ recaptchaServerSecret });
    if (!!environmentVariable) {
        const msg = `${environmentVariable} not found`;
        response500(res, msg);
        logWithDate(msg, fname);
        return;
    }
    try {
        const { requestInfo, recaptchaResponse } = req.query;
        //// Verify if requested by human ////
        const { status: recaptchaStatus, message } = await verifyRecaptchaResponse(recaptchaServerSecret, recaptchaResponse);
        if (200 !== recaptchaStatus) {
            if (403 === recaptchaStatus) {
                res.status(403).send(message);
                return;
            }
            if (500 === recaptchaStatus) {
                response500(res, message);
                return;
            }
        }

        //// Verify request info ////
        if ('string' !== typeof requestInfo || '' === requestInfo) {
            res.status(403).send('Invalid request info');
            return;
        }

        //// Decode base64 string to plain string ////
        const requestInfoStr = Buffer.from(requestInfo, 'base64').toString();
        // [!] attemp to parse info json string makes the probability of causing SyntaxError
        const { emailAddress, resetPasswordToken, expireDateBySecond } = JSON.parse(requestInfoStr);
        if (!(emailAddress && resetPasswordToken && expireDateBySecond)) {
            res.status(400).send('Defactive request info');
            return;
        }
        if (getTimeBySecond() > parseInt(expireDateBySecond)) {
            res.status(403).send('Reset password token expired');
            return;
        }

        //// Verification pass ////
        res.status(200).send({ emailAddress, resetPasswordToken });
    } catch (e: any) {
        let msg: string;
        if (e instanceof SyntaxError) {
            res.status(400).send('Improperly normalized request info');
            return;
        } else if (e instanceof TypeError) {
            msg = 'Attempt to decode recaptcha verification response.';
        } else {
            msg = `Uncategorized. ${e.msg}`;
        }
        if (!res.headersSent) {
            response500(res, msg);
        }
        logWithDate(msg, fname, e);
        return;
    }
}