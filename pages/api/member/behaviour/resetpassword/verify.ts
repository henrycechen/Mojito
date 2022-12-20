import type { NextApiRequest, NextApiResponse } from 'next';

import { verifyRecaptchaResponse, verifyEnvironmentVariable, response405, response500, log } from '../../../../../lib/utils';

const recaptchaServerSecret = process.env.INVISIABLE_RECAPTCHA_SECRET_KEY ?? '';

export default async function VerifyToken(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;
    if ('GET' !== method) {
        response405(req, res);
        return;
    }
    const environmentVariable = verifyEnvironmentVariable({ recaptchaServerSecret });
    //// Verify environment variables ////
    if (!!environmentVariable) {
        const msg = `${environmentVariable} not found`;
        response500(res, msg);
        log(msg);
        return;
    }
    try {
        const { requestInfo, recaptchaResponse } = req.query;
        // Step #1 verify if it is bot
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
        // Step #2 verify request info
        if ('string' !== typeof requestInfo || '' === requestInfo) {
            res.status(403).send('Invalid request info');
            return;
        }
        // Step #3.1 decode base64 string to plain string
        const requestInfoStr = Buffer.from(requestInfo, 'base64').toString();
        // [!] attemp to parse info json string makes the probability of causing SyntaxError
        const { emailAddress, resetPasswordToken, expireDate } = JSON.parse(requestInfoStr);
        if (!(emailAddress && resetPasswordToken && expireDate)) {
            res.status(400).send('Defactive request info');
            return;
        }
        if (new Date().getTime() > parseInt(expireDate)) {
            res.status(403).send('Reset password token expired');
            return;
        }
        //// Response 200, verification pass ////
        res.status(200).send({ emailAddress, resetPasswordToken });
    } catch (e: any) {
        let msg: string;
        if (e instanceof SyntaxError) {
            res.status(400).send('Improperly normalized request info');
            return;
        } else if (e instanceof TypeError) {
            msg = 'Was trying decoding recaptcha verification response.';
        } else {
            msg = 'Uncategorized Error occurred.';
        }
        if (!res.headersSent) {
            response500(res, msg);
        }
        log(msg, e);
        return;
    }
}