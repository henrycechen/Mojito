import type { NextApiRequest, NextApiResponse } from 'next';
import { RestError } from '@azure/data-tables';
import CryptoJS from 'crypto-js';

import AzureTableClient from '../../../../../modules/AzureTableClient';
import AzureEmailCommunicationClient from '../../../../../modules/AzureEmailCommunicationClient';

import { IResetPasswordCredentials } from '../../../../../lib/interfaces';
import { LangConfigs, EmailMessage, ResetPasswordRequestInfo } from '../../../../../lib/types';
import { getRandomHexStr, verifyRecaptchaResponse, verifyEnvironmentVariable, response405, response500, log } from '../../../../../lib/utils';
import { composeResetPasswordEmailContent } from '../../../../../lib/email';

const appSecret = process.env.APP_AES_SECRET ?? '';
const recaptchaServerSecret = process.env.INVISIABLE_RECAPTCHA_SECRET_KEY ?? '';

const domain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? '';
const lang = process.env.NEXT_PUBLIC_APP_LANG ?? 'ch';
const langConfigs: LangConfigs = {
    emailSubject: {
        ch: '重置您的账户密码',
        en: 'Reset your account password'
    }
}

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
        // Step #1 verify if it is requested by a bot
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
        // Step #2.1 prepare email address
        const { emailAddress } = req.query;
        if ('string' !== typeof emailAddress || '' === emailAddress) {
            res.status(403).send('Invalid email address');
            return;
        }
        const emailAddressHash = CryptoJS.SHA1(emailAddress).toString();
        // Step #2.2 find member id by email address in [RL] Credentials
        const credentialsTableClient = AzureTableClient('Credentials');
        const loginCredentialsQuery = credentialsTableClient.listEntities({ queryOptions: { filter: `PartitionKey eq '${emailAddressHash}' and RowKey eq 'MojitoMemberSystem'` } });
        //// [!] attemp to reterieve entity makes the probability of causing RestError ////
        const loginCredentialsQueryResult = await loginCredentialsQuery.next();
        if (!loginCredentialsQueryResult.value) {
            res.status(404).send('Login credentials record not found');
            return;
        }
        // Step #3.1 create a new reset password verification token
        const resetPasswordToken = getRandomHexStr(true); // use UPPERCASE
        const info: ResetPasswordRequestInfo = {
            emailAddress,
            resetPasswordToken: resetPasswordToken,
            expireDate: new Date().getTime() + 15 * 60 * 1000 // set valid time for 15 minutes
        }
        // Step #3.2 upsert entity (IResetPasswordCredentials) in [RL] Credentials
        credentialsTableClient.upsertEntity<IResetPasswordCredentials>({ partitionKey: emailAddressHash, rowKey: 'ResetPassword', ResetPasswordToken: resetPasswordToken }, 'Replace');
        //// Response 200 ////
        res.status(200).send('Email sent');
        // Step #4 send email
        const emailMessage: EmailMessage = {
            sender: '<donotreply@mojito.co.nz>',
            content: {
                subject: langConfigs.emailSubject[lang],
                html: composeResetPasswordEmailContent(domain, Buffer.from(JSON.stringify(info)).toString('base64'), lang)
            },
            recipients: {
                to: [{ email: emailAddress }]
            }
        }
        const mailClient = AzureEmailCommunicationClient();
        await mailClient.send(emailMessage);
    } catch (e: any) {
        let msg: string;
        if (e instanceof TypeError) {
            msg = 'Was trying decoding recaptcha verification response.';
        } else if (e instanceof RestError) {
            msg = 'Was trying communicating with azure table storage.';
        } else {
            msg = `Uncategorized. ${e?.msg}`;
        }
        if (!res.headersSent) {
            response500(res, msg);
        }
        log(msg, e);
        return;
    }
}