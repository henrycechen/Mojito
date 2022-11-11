import type { NextApiRequest, NextApiResponse } from 'next';
import { RestError } from '@azure/data-tables';
import CryptoJS from 'crypto-js';

import { verifyRecaptchaResponse, verifyEnvironmentVariable, response405, response500 } from '../../../../../lib/utils';

const appSecret = process.env.APP_AES_SECRET ?? '';
const recaptchaServerSecret = process.env.INVISIABLE_RECAPTCHA_SECRET_KEY ?? '';

export default async function VerifyToken(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;
    if ('GET' !== method) {
        response405(req, res);
        return;
    }
    try {
        // Step #0 verify environment variables
        const environmentVariable = verifyEnvironmentVariable({ appSecret, recaptchaServerSecret });
        if (!!environmentVariable) {
            response500(res, `${environmentVariable} not found`);
            return;
        }
        const { requestInfo, recaptchaResponse } = req.query;
        // Step #1 verify if it is bot
        const { status, message } = await verifyRecaptchaResponse(recaptchaServerSecret, recaptchaResponse);
        if (200 !== status) {
            if (403 === status) {
                res.status(403).send(message);
                return;
            }
            if (500 === status) {
                response500(res, message);
                return;
            }
        }
        // Step #2 verify request info
        if ('string' !== typeof requestInfo || '' === requestInfo) {
            res.status(403).send('Invalid request info');
            return;
        }
        if ('' === appSecret) {
            response500(res, 'App scret not found');
            return;
        }
        // Step #3.1 decode base64 string to cypher
        const infoCypher = Buffer.from(requestInfo, 'base64').toString();
        // Step #3.2 decode cypher to json string
        const infoJsonStr = CryptoJS.AES.decrypt(infoCypher, appSecret).toString(CryptoJS.enc.Utf8);
        if (infoJsonStr.length === 0) {
            res.status(400).send('Inappropriate request info');
            return;
        }
        // [!] attemp to parse info json string makes the probability of causing SyntaxError
        const { memberId, resetPasswordToken, expireDate } = JSON.parse(infoJsonStr);
        if (!memberId || !resetPasswordToken || !expireDate) {
            res.status(400).send('Incomplete request info');
            return;
        }
        if (new Date().getTime() > expireDate) {
            res.status(403).send('Reset password token has expired');
            return;
        }
        // Step #4 verification pass, send { memberId, resetPasswordToken } in plain text
        res.status(200).send({ memberId, resetPasswordToken });
    } catch (e) {
        if (e instanceof SyntaxError) {
            res.status(400).send('Improperly normalized request info');
        }
        else if (e instanceof TypeError) {
            response500(res, `Was trying decoding recaptcha verification response. ${e}`);
        }
        else if (e instanceof RestError) {
            response500(res, `Was trying communicating with db. ${e}`);
        }
        else {
            response500(res, `Uncategorized Error occurred. ${e}`);
        }
        return;
    }
}