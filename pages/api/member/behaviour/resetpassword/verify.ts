import type { NextApiRequest, NextApiResponse } from 'next';
import { RestError } from '@azure/data-tables';
import CryptoJS from 'crypto-js';

import { verifyEnvironmentVariable, response405, response500 } from '../../../../../lib/utils';

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
        // step #1 verify if it is bot
        if ('string' !== typeof recaptchaResponse || '' === recaptchaResponse) {
            res.status(403).send('Invalid ReCAPTCHA response');
            return;
        }
        if ('' === recaptchaServerSecret) {
            response500(res, 'ReCAPTCHA shared key not found');
            return;
        }
        const recaptchaVerifyResp = await fetch(`https://www.google.com/recaptcha/api/siteverify?secret=${recaptchaServerSecret}&response=${recaptchaResponse}`, { method: 'POST' })
        // [!] invoke of json() make the probability of causing TypeError
        const { success } = await recaptchaVerifyResp.json();
        if (!success) {
            res.status(403).send('ReCAPTCHA failed');
            return;
        }
        // step #2 verify request info
        if ('string' !== typeof requestInfo || '' === requestInfo) {
            res.status(403).send('Invalid request info');
            return;
        }
        if ('' === appSecret) {
            response500(res, 'App scret not found');
            return;
        }
        // step #3.1 decode base64 string to cypher
        const infoCypher = Buffer.from(requestInfo, 'base64').toString();
        // step #3.2 decode cypher to json string
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
        // pass
        res.status(200).send({ memberId, resetPasswordToken });
    } catch (e) {
        if (e instanceof SyntaxError) {
            res.status(400).send('Improperly normalized request info');
        }
        else if (e instanceof TypeError) {
            response500(res, `Was trying decoding recaptcha verification response. ${e}`);
        }
        else if (e instanceof RestError) {
            response500(res, `Was trying querying entity. ${e}`);
        }
        else {
            response500(res, `Uncategorized Error occurred. ${e}`);
        }
        return;
    }
}