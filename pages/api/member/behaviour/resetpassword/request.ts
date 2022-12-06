import type { NextApiRequest, NextApiResponse } from 'next';
import { RestError } from '@azure/data-tables';
import CryptoJS from 'crypto-js';

import AzureTableClient from '../../../../../modules/AzureTableClient';
import AzureEmailCommunicationClient from '../../../../../modules/AzureEmailCommunicationClient';
import { IResetPasswordToken } from '../../../../../lib/interfaces';
import { LangConfigs, EmailMessage, ResetPasswordRequestInfo } from '../../../../../lib/types';
import { getRandomHexStr, verifyRecaptchaResponse, verifyEnvironmentVariable, response405, response500, log } from '../../../../../lib/utils';
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

export default async function RequestResetPassword(req: NextApiRequest, res: NextApiResponse) {
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
        // Step #2.2 find member id by email address in [T] LoginCredentialsMapping
        const loginCredentialsMappingTableClient = AzureTableClient('LoginCredentialsMapping');
        const mappingQuery = loginCredentialsMappingTableClient.listEntities({ queryOptions: { filter: `PartitionKey eq 'EmailAddress' and RowKey eq '${emailAddress}'` } });
        // [!] attemp to reterieve entity makes the probability of causing RestError
        const mappingQueryResult = await mappingQuery.next();
        if (!mappingQueryResult.value) {
            res.status(404).send('Login credential mapping not found');
            return;
        }
        const { MemberId: memberId } = mappingQueryResult.value; // Update: 6/12/2022: MemberIdStr -> MemberId
        if ('string' !== typeof memberId || '' === memberId) {
            response500(res, `Getting an invalid memberId from login credential mapping record`);
            return;
        }
        // Step #3 create reset password verification token
        const token = getRandomHexStr(true); // use UPPERCASE
        const info: ResetPasswordRequestInfo = {
            memberId,
            resetPasswordToken: token,
            expireDate: new Date().getTime() + 15 * 60 * 1000 // set valid time for 15 minutes
        }
        // Step #4 compose email to send verification link
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
        // Step #5 upsertEntity (resetPasswordToken) to [T] MemberLogin
        const resetPasswordToken: IResetPasswordToken = {
            partitionKey: memberId,
            rowKey: 'ResetPasswordToken',
            ResetPasswordToken: token,
            EmailMessageId: messageId,
            IsActive: true
        }
        const memberLoginTableClient = AzureTableClient('MemberLogin');
        await memberLoginTableClient.upsertEntity(resetPasswordToken, 'Replace');
        res.status(200).send('Email sent');
    } catch (e: any) {
        let msg: string;
        if (e instanceof TypeError) {
            msg = 'Was trying decoding recaptcha verification response.';
        }
        else if (e instanceof RestError) {
            msg = 'Was trying communicating with table storage.';
        }
        else {
            msg = 'Uncategorized Error occurred.';
        }
        response500(res, `${msg} ${e}`);
        log(msg, e);
        return;
    }
}