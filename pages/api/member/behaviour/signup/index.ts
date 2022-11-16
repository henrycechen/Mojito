import type { NextApiRequest, NextApiResponse } from 'next';
import { RestError } from '@azure/data-tables';
import CryptoJS from 'crypto-js';

import AzureTableClient from '../../../../../modules/AzureTableClient';
import AzureEmailCommunicationClient from '../../../../../modules/AzureEmailCommunicationClient';
import { LangConfigs, EmailMessage, AzureTableEntity, PasswordHash, LoginCredentialsMapping, VerifyAccountRequestInfo } from '../../../../../lib/types';
import { getRandomStr, verifyEmailAddress, verifyRecaptchaResponse, verifyEnvironmentVariable, response405, response500 } from '../../../../../lib/utils';
import { composeVerifyAccountEmail } from '../../../../../lib/email';

const appSecret = process.env.APP_AES_SECRET ?? '';
const recaptchaServerSecret = process.env.INVISIABLE_RECAPTCHA_SECRET_KEY ?? '';
const salt = process.env.APP_PASSWORD_SALT ?? '';

const domain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? '';
const lang = process.env.NEXT_PUBLIC_APP_LANG ?? 'ch';
const langConfigs: LangConfigs = {
    emailSubject: {
        ch: '验证您的 Mojito 账户',
        en: 'Verify your Mojito account'
    }
}

export default async function SignUp(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;
    if ('POST' !== method) {
        response405(req, res);
        return;
    }
    try {
        // Step #0 verify environment variables
        const environmentVariable = verifyEnvironmentVariable({ appSecret, recaptchaServerSecret, salt });
        if (!!environmentVariable) {
            response500(res, `${environmentVariable} not found`);
            return;
        }
        const { recaptchaResponse } = req.query;
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
        const { emailAddress, password } = JSON.parse(req.body);
        // Step #2.1 verify email address
        if ('string' !== typeof emailAddress || '' === emailAddress) {
            res.status(403).send('Invalid email address');
            return;
        }
        if (!verifyEmailAddress(emailAddress)) {
            res.status(403).send('Email address not satisfied');
            return;
        }
        // Step #2.2 look up email address from [Table] LoginCredentialsMapping
        const loginCredentialsMappingTableClient = AzureTableClient('LoginCredentialsMapping');
        const mappingQuery = loginCredentialsMappingTableClient.listEntities({ queryOptions: { filter: `PartitionKey eq 'EmailAddress' and RowKey eq '${emailAddress}'` } });
        // [!] attemp to reterieve entity makes the probability of causing RestError
        const mappingQueryResult = await mappingQuery.next();
        if (mappingQueryResult.value && mappingQueryResult.value.IsActive) {
            res.status(400).send('Email address has been registered');
            return;
        }
        // Step #3.1 create a memberId
        const memberId = getRandomStr();
        // Step #3.2 upsertEntity to [Table] LoginCredentialsMapping
        const loginCredentialsMapping: LoginCredentialsMapping = {
            partitionKey: 'EmailAddress',
            rowKey: emailAddress,
            MemberIdStr: memberId,
            IsActive: true
        }
        await loginCredentialsMappingTableClient.upsertEntity(loginCredentialsMapping, 'Replace');
        // Step #3.3 upsertEntity to [Table] MemberLogin
        const passwordHash: PasswordHash = {
            partitionKey: memberId,
            rowKey: 'PasswordHash',
            PasswordHashStr: CryptoJS.SHA256(password + salt).toString()
        }
        const memberLoginTableClient = AzureTableClient('MemberLogin');
        await memberLoginTableClient.upsertEntity(passwordHash, 'Replace');
        // Step #3.4 upsertEntity to [Table] MemberInfo
        const memberInfoEmailAddress: AzureTableEntity = {
            partitionKey: memberId,
            rowKey: 'EmailAddress',
            EmailAddressStr: emailAddress
        }
        const memberInfoTableClient = AzureTableClient('MemberInfo');
        await memberInfoTableClient.upsertEntity(memberInfoEmailAddress, 'Replace');
        // Step #3.4 upsertEntity to [Table] MemberManagement
        const memberManagementMemberStatus: AzureTableEntity = {
            partitionKey: memberId,
            rowKey: 'MemberStatus',
            MemberStatusValue: 0 // Established, email address not verified
        }
        const memberManagementTableClient = AzureTableClient('MemberManagement');
        await memberManagementTableClient.upsertEntity(memberManagementMemberStatus, 'Replace');
        // Step #4 componse and send email
        const info: VerifyAccountRequestInfo = {
            memberId
        }
        const emailMessage: EmailMessage = {
            sender: '<donotreply@mojito.co.nz>',
            content: {
                subject: langConfigs.emailSubject[lang],
                html: composeVerifyAccountEmail(domain, Buffer.from(CryptoJS.AES.encrypt(JSON.stringify(info), appSecret).toString()).toString('base64'), lang)
            },
            recipients: {
                to: [{ email: emailAddress }]
            }
        }
        const mailClient = AzureEmailCommunicationClient();
        const { messageId } = await mailClient.send(emailMessage);
        if (!messageId) {
            response500(res, 'Was trying sending email');
        } else {
            res.status(200).send('Account established, email sent, email address verification required to get full access');
        }
    } catch (e) {
        if (e instanceof RestError) {
            response500(res, `Was trying communicating with db. ${e}`);
        }
        else {
            response500(res, `Uncategorized Error occurred. ${e}`);
        }
        return;
    }
}