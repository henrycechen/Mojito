import type { NextApiRequest, NextApiResponse } from 'next';
import { RestError } from '@azure/data-tables';
import { MongoError } from 'mongodb';
import CryptoJS from 'crypto-js';

import AzureTableClient from '../../../../modules/AzureTableClient';
import AzureEmailCommunicationClient from '../../../../modules/AzureEmailCommunicationClient';
import AtlasDatabaseClient from '../../../../modules/AtlasDatabaseClient';

import { IMojitoMemberSystemLoginCredentials, IVerifyEmailAddressCredentials, IMemberComprehensive, ILoginJournal } from '../../../../lib/interfaces';
import { LangConfigs, EmailMessage, VerifyEmailAddressRequestInfo } from '../../../../lib/types';
import { getRandomIdStr, verifyEmailAddress, verifyRecaptchaResponse, verifyEnvironmentVariable, response405, response500, log, getRandomHexStr } from '../../../../lib/utils';
import { composeVerifyEmailAddressEmailContent } from '../../../../lib/email';

const recaptchaServerSecret = process.env.INVISIABLE_RECAPTCHA_SECRET_KEY ?? '';
const salt = process.env.APP_PASSWORD_SALT ?? '';

const domain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? '';
const lang = process.env.NEXT_PUBLIC_APP_LANG ?? 'tw';
const langConfigs: LangConfigs = {
    emailSubject: {
        tw: '验证您的 Mojito 账户',
        cn: '验证您的 Mojito 账户',
        en: 'Verify your Mojito Member'
    }
}

export default async function SignUp(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;
    if ('POST' !== method) {
        response405(req, res);
        return;
    }
    //// Verify environment variables ////
    const environmentVariable = verifyEnvironmentVariable({ recaptchaServerSecret, salt });
    if (!!environmentVariable) {
        const msg = `${environmentVariable} not found`;
        response500(res, msg);
        log(msg);
        return;
    }
    //// Declare DB client ////
    const atlasDbClient = AtlasDatabaseClient();
    try {
        const { recaptchaResponse } = req.query;
        // Step #1 verify if it is bot
        const { status: recaptchStatus, message } = await verifyRecaptchaResponse(recaptchaServerSecret, recaptchaResponse);
        if (200 !== recaptchStatus) {
            if (403 === recaptchStatus) {
                res.status(403).send(message);
                return;
            }
            if (500 === recaptchStatus) {
                response500(res, message);
                return;
            }
        }
        // Step #2 verify request info
        const requestInfo = req.body;
        if (null === requestInfo || 'string' !== typeof requestInfo || '' === requestInfo) {
            res.status(403).send('Invalid request body');
            return;
        }
        const { emailAddress, password } = JSON.parse(requestInfo);
        //// [!] attemp to parse JSON string to object makes the probability of causing SyntaxError ////
        // Step #3.1 verify email address
        if ('string' !== typeof emailAddress || '' === emailAddress) {
            res.status(403).send('Invalid email address');
            return;
        }
        if (!verifyEmailAddress(emailAddress)) {
            res.status(403).send('Email address not satisfied');
            return;
        }
        const emailAddressHash = CryptoJS.SHA1(emailAddress).toString();
        // Step #3.2 look up login credentials (by email address hash) in [RL] Credentials
        const credentialsTableClient = AzureTableClient('Credentials');
        const loginCredentialsQuery = credentialsTableClient.listEntities({ queryOptions: { filter: `PartitionKey eq '${emailAddressHash}' and RowKey eq 'MojitoMemberSystem'` } });
        //// [!] attemp to reterieve entity makes the probability of causing RestError ////
        const loginCredentialsQueryResult = await loginCredentialsQuery.next();
        if (loginCredentialsQueryResult.value) {
            res.status(400).send('Email address has been registered');
            return;
        }
        // Step #4.1 create a new member id
        const memberId = getRandomIdStr(true);
        const providerId = 'MojitoMemberSystem';
        // Step #4.2 upsert entity (ILoginCredentials) in [RL] Credentials
        await credentialsTableClient.upsertEntity<IMojitoMemberSystemLoginCredentials>({ partitionKey: emailAddressHash, rowKey: providerId, MemberId: memberId, PasswordHash: CryptoJS.SHA256(password + salt).toString() }, 'Replace');
        // Step #4.3 create a new email address verification token
        const verifyEmailAddressToken = getRandomHexStr(true);
        // Step #4.4 upsert entity (IVerifyEmailAddressCredentials) in [RL] Credentials
        await credentialsTableClient.upsertEntity<IVerifyEmailAddressCredentials>({ partitionKey: emailAddressHash, rowKey: 'VerifyEmailAddress', VerifyEmailAddressToken: verifyEmailAddressToken }, 'Replace');
        // Step #4.5 create document (IMemberComprehensive) in [C] memberComprehensive
        await atlasDbClient.connect();
        const memberComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IMemberComprehensive>('member');
        const memberComprehensiveQueryResult = await memberComprehensiveCollectionClient.insertOne({
            memberId,
            providerId,
            registeredTime: new Date().getTime(),
            emailAddress,
            nickname: emailAddress.split('@')[0],
            status: 0, // email address not verified
            allowPosting: false,
            allowCommenting: false
        });
        if (!memberComprehensiveQueryResult.acknowledged) {
            const msg = 'Attempt to insert document (IMemberComprehensive) in [C] memberComprehensive';
            response500(res, msg);
            log(msg);
            return;
        }
        res.status(200).send('Member established');
        // Step #5 write journal (ILoginJournal) in [C] loginJournal
        const loginJournalCollectionClient = atlasDbClient.db('journal').collection<ILoginJournal>('login');
        await loginJournalCollectionClient.insertOne({
            memberId,
            category: 'success',
            providerId,
            timestamp: new Date().toISOString(),
            message: 'Registered.'
        });
        await atlasDbClient.close();
        // Step #6 send email
        const info: VerifyEmailAddressRequestInfo = { emailAddress, providerId, verifyEmailAddressToken };
        const emailMessage: EmailMessage = {
            sender: '<donotreply@mojito.co.nz>',
            content: {
                subject: langConfigs.emailSubject[lang],
                html: composeVerifyEmailAddressEmailContent(domain, Buffer.from(JSON.stringify(info)).toString('base64'), lang)
            },
            recipients: {
                to: [{ email: emailAddress }]
            }
        }
        const mailClient = AzureEmailCommunicationClient();
        await mailClient.send(emailMessage);
    } catch (e: any) {
        let msg;
        if (e instanceof RestError) {
            msg = 'Attempt to communicate with azure table storage.';
        } else if (e instanceof MongoError) {
            msg = 'Attempt to communicate with atlas mongodb.';
        } else {
            msg = `Uncategorized. ${e?.msg}`;
        }
        if (!res.headersSent) {
            response500(res, msg);
        }
        log(msg, e);
        await atlasDbClient.close();
        return;
    }
}