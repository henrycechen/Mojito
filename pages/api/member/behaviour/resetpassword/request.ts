import type { NextApiRequest, NextApiResponse } from 'next';
import { RestError } from '@azure/data-tables';
import CryptoJS from 'crypto-js';

import AzureTableClient from '../../../../../modules/AzureTableClient';
import AzureEmailCommunicationClient from '../../../../../modules/AzureEmailCommunicationClient';
import { LangConfigs, EmailMessage, ResetPasswordRequestInfo, ResetPasswordToken } from '../../../../../lib/types';
import { getRandomHexStr, response405, response500 } from '../../../../../lib/utils';

const appSecret = process.env.APP_AES_SECRET ?? '';
const recaptchaServerSecret = process.env.RECAPTCHA_SHARED_KEY ?? '';

const domain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? '';
const lang = process.env.NEXT_PUBLIC_APP_LANG ?? 'ch';
const langConfigs: LangConfigs = {
    resetPasswordEmailContent: {
        ch: (domain: string, info: string) => `您可以通过单击以下链接重置您的 Mojito 账户密码：${domain}/forgot/resetpassword?requestInfo=${info} 该链接在您收到这封邮件的10分钟内有效；如果链接过期，请重新发起修改密码请求。`,
        en: (domain: string, info: string) => `You can reset your Mojito account password by clicking the link below: ${domain}/forgot/resetpassword?requestInfo=${info} The link is valid for 10 minutes after you receive this email; if the link expires, please resubmit change password request.`
    }
}

export default async function Request(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;
    if ('POST' !== method) {
        response405(req, res);
        return;
    }
    try {
        const { emailAddress, recaptchaResponse } = req.query;
        // step #1 check if it is requested by a bot
        if ('string' !== typeof recaptchaResponse || '' === recaptchaResponse) {
            res.status(403).send('Invalid ReCAPTCHA response');
            return;
        }
        if ('' === recaptchaServerSecret) {
            response500(res, 'ReCAPTCHA shared key not found');
            return;
        }
        const recaptchaVerifyResp = await fetch(`https://www.google.com/recaptcha/api/siteverify?secret=${recaptchaServerSecret}&response=${recaptchaResponse}`, { method: 'POST' })
        // [!] invoke of json() makes the probability of causing TypeError
        const { success } = await recaptchaVerifyResp.json();
        if (!success) {
            res.status(403).send('ReCAPTCHA failed');
            return;
        }
        // step #2 find cooresponding memberId
        if ('string' !== typeof emailAddress || '' === emailAddress) {
            res.status(403).send('Invalid email address');
            return;
        }
        const loginCredentialsMappingTableClient = AzureTableClient('LoginCredentialsMapping');
        const mappingQuery = loginCredentialsMappingTableClient.listEntities({ queryOptions: { filter: `PartitionKey eq 'Email' and RowKey eq '${emailAddress}'` } });
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
        // step #3 create token
        const token = getRandomHexStr();
        const info: ResetPasswordRequestInfo = {
            memberId,
            resetPasswordToken: token,
            expireDate: new Date().getTime() + 15 * 60 * 1000 // set valid time for 15 minutes
        }
        // step #4 componse and send email
        if ('' === appSecret) {
            response500(res, 'App scret not found');
            return;
        }
        const emailMessage: EmailMessage = {
            sender: '<donotreply@mojito.co.nz>',
            content: {
                subject: 'Reset your password',
                plainText: langConfigs.resetPasswordEmailContent[lang](
                    domain,
                    Buffer.from(CryptoJS.AES.encrypt(JSON.stringify(info), appSecret).toString()).toString('base64')
                )
            },
            recipients: {
                to: [{ email: emailAddress }]
            }
        }
        const mailClient = AzureEmailCommunicationClient();
        const { messageId } = await mailClient.send(emailMessage);
        // step #5 update DB
        const memeberLoginTableClient = AzureTableClient('MemberLogin');
        const resetPasswordToken: ResetPasswordToken = {
            partitionKey: memberId,
            rowKey: 'ResetPasswordToken',
            IsActive: true,
            ResetPasswordTokenStr: token,
            EmailMessageId: messageId
        }
        const { clientRequestId } = await memeberLoginTableClient.upsertEntity(resetPasswordToken, 'Replace');
        // step #6 send response
        // here use clientRequestId to verify the table operation result
        if (!clientRequestId) {
            response500(res, 'Was trying creating resetPasswordToken (Table Operation)');
        } else {
            res.status(200).send('Email sent');
        }
    } catch (e) {
        if (e instanceof TypeError) {
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