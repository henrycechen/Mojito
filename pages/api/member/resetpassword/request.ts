import type { NextApiRequest, NextApiResponse } from 'next';
import { RestError } from '@azure/data-tables';
import CryptoJS from 'crypto-js';

import AzureTableClient from '../../../../modules/AzureTableClient';
import AzureEmailCommunicationClient from '../../../../modules/AzureEmailCommunicationClient';
import { EmailMessage } from '@azure/communication-email';

import { ILoginCredentials, IResetPasswordCredentials } from '../../../../lib/interfaces/credentials';
import { LangConfigs, TResetPasswordRequestInfo } from '../../../../lib/types';
import { composeResetPasswordEmailContent } from '../../../../lib/email';
import { logWithDate, response405, response500 } from '../../../../lib/utils/general';
import { verifyEnvironmentVariable, verifyRecaptchaResponse } from '../../../../lib/utils/verify';
import { getRandomHexStr, getTimeBySecond } from '../../../../lib/utils/create';

const appSecret = process.env.APP_AES_SECRET ?? '';
const recaptchaServerSecret = process.env.INVISIABLE_RECAPTCHA_SECRET_KEY ?? '';

const domain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? '';
const lang = process.env.NEXT_PUBLIC_APP_LANG ?? 'tw';
const langConfigs: LangConfigs = {
    emailSubject: {
        tw: '重置您的账户密码',
        cn: '重置您的賬戶密碼',
        en: 'Reset your account password'
    }
}

const fname = RequestResetPassword.name;

/** RequestResetPassword v0.1.2
 * 
 * Last update: 21/02/2023
 * 
 * This interface ONLY accepts POST method
 * 
 * Info required for POST request
 * - emailAddressHash: string
 * - resetPasswordToken: string
 * - password: string
 */

export default async function RequestResetPassword(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;
    if ('POST' !== method) {
        response405(req, res);
        return;
    }
    //// Verify environment variables ////
    const environmentVariable = verifyEnvironmentVariable({ appSecret, recaptchaServerSecret });
    if (!!environmentVariable) {
        response500(res, `${environmentVariable} not found`);
        return;
    }
    try {
        const { recaptchaResponse } = req.query;
        // #1 verify if it is requested by a bot
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
        // #2.1 prepare email address
        const { emailAddress } = req.query;
        if ('string' !== typeof emailAddress || '' === emailAddress) {
            res.status(403).send('Invalid email address');
            return;
        }
        const emailAddressHash = CryptoJS.SHA1(emailAddress).toString();

        //// Look up record (of ILoginCredentials) in [RL] Credentials
        const credentialsTableClient = AzureTableClient('Credentials');
        const loginCredentialsQuery = credentialsTableClient.listEntities<ILoginCredentials>({ queryOptions: { filter: `PartitionKey eq '${emailAddressHash}' and RowKey eq 'MojitoMemberSystem'` } });
        //// [!] attemp to reterieve entity makes the probability of causing RestError ////
        const loginCredentialsQueryResult = await loginCredentialsQuery.next();
        if (loginCredentialsQueryResult.done) {
            res.status(404).send('Login credentials record not found');
            return;
        }

        //// Create a new reset password verification token ///
        const resetPasswordToken = getRandomHexStr(true);
        const info: TResetPasswordRequestInfo = {
            emailAddress,
            resetPasswordToken: resetPasswordToken,
            expireDateBySecond: getTimeBySecond() + 54000 // set valid time for 15 minutes // Updated v0.1.2
        }

        //// Upsert entity (IResetPasswordCredentials) in [RL] Credentials ////
        credentialsTableClient.upsertEntity<IResetPasswordCredentials>({ partitionKey: emailAddressHash, rowKey: 'ResetPassword', ResetPasswordToken: resetPasswordToken, CreateTimeBySecond: getTimeBySecond() }, 'Replace');

        //// Send email ////
        const emailMessage: EmailMessage = {
            senderAddress: '<donotreply@mojito.co.nz>',
            content: {
                subject: langConfigs.emailSubject[lang],
                html: composeResetPasswordEmailContent(domain, Buffer.from(JSON.stringify(info)).toString('base64'), lang)
            },
            recipients: {
                to: [{ address: emailAddress }]
            }
        }
        const mailClient = AzureEmailCommunicationClient();
        await mailClient.beginSend(emailMessage);

        //// Response 200 ////
        res.status(200).send('Email sent');
        return;
    } catch (e: any) {
        let msg: string;
        if (e instanceof TypeError) {
            msg = 'Attempt to decode recaptcha verification response.';
        } else if (e instanceof RestError) {
            msg = `Attempt to communicate with azure table storage.`;
        } else {
            msg = `Uncategorized. ${e?.msg}`;
        }
        if (!res.headersSent) {
            response500(res, msg);
        }
        logWithDate(msg, fname, e);
        return;
    }
}