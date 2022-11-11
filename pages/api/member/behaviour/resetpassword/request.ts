import type { NextApiRequest, NextApiResponse } from 'next';
import { RestError } from '@azure/data-tables';
import CryptoJS from 'crypto-js';

import AzureTableClient from '../../../../../modules/AzureTableClient';
import AzureEmailCommunicationClient from '../../../../../modules/AzureEmailCommunicationClient';
import { LangConfigs, EmailMessage, ResetPasswordRequestInfo, ResetPasswordToken } from '../../../../../lib/types';
import { getRandomHexStr, verifyRecaptchaResponse, verifyEnvironmentVariable, response405, response500 } from '../../../../../lib/utils';
import { composeResetPasswordEmail } from '../../../../../lib/email';

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

export default async function Request(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;
    if ('POST' !== method) {
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
        const { recaptchaResponse } = req.query;
        // Step #1 check if it is requested by a bot
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
        // Step #2 find cooresponding memberId
        const { emailAddress } = req.query;
        if ('string' !== typeof emailAddress || '' === emailAddress) {
            res.status(403).send('Invalid email address');
            return;
        }
        const loginCredentialsMappingTableClient = AzureTableClient('LoginCredentialsMapping');
        const mappingQuery = loginCredentialsMappingTableClient.listEntities({ queryOptions: { filter: `PartitionKey eq 'EmailAddress' and RowKey eq '${emailAddress}'` } });
        // [!] attemp to reterieve entity makes the probability of causing RestError
        const mappingQueryResult = await mappingQuery.next();
        if (!mappingQueryResult.value) {
            res.status(404).send('Login credential mapping not found');
            return;
        }
        const { MemberIdStr: memberId } = mappingQueryResult.value;
        if ('string' !== typeof memberId || '' === memberId) {
            response500(res, `Getting an invalid memberId`);
            return;
        }
        // Step #3 create token
        const token = getRandomHexStr();
        const info: ResetPasswordRequestInfo = {
            memberId,
            resetPasswordToken: token,
            expireDate: new Date().getTime() + 15 * 60 * 1000 // set valid time for 15 minutes
        }
        // Step #4 componse and send email
        const emailMessage: EmailMessage = {
            sender: '<donotreply@mojito.co.nz>',
            content: {
                subject: langConfigs.emailSubject[lang],
                html: composeResetPasswordEmail(domain, Buffer.from(CryptoJS.AES.encrypt(JSON.stringify(info), appSecret).toString()).toString('base64'), lang)
            },
            recipients: {
                to: [{ email: emailAddress }]
            }
        }
        const mailClient = AzureEmailCommunicationClient();
        const { messageId } = await mailClient.send(emailMessage);
        // Step #5 upsert reset password token to [Table] MemberLogin
        const memberLoginTableClient = AzureTableClient('MemberLogin');
        const resetPasswordToken: ResetPasswordToken = {
            partitionKey: memberId,
            rowKey: 'ResetPasswordToken',
            IsActive: true,
            ResetPasswordTokenStr: token,
            EmailMessageId: messageId
        }
        await memberLoginTableClient.upsertEntity(resetPasswordToken, 'Replace');
        res.status(200).send('Email sent');
    } catch (e) {
        if (e instanceof TypeError) {
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