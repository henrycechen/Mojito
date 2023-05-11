import type { NextApiRequest, NextApiResponse } from 'next';
import { RestError } from '@azure/data-tables';
import { MongoError } from 'mongodb';
import CryptoJS from 'crypto-js';

import AzureTableClient from '../../../../modules/AzureTableClient';
import AzureEmailCommunicationClient from '../../../../modules/AzureEmailCommunicationClient';
import AtlasDatabaseClient from '../../../../modules/AtlasDatabaseClient';
import { EmailMessage } from '@azure/communication-email';

import { ILoginCredentials, IMojitoMemberSystemLoginCredentials, IVerifyEmailAddressCredentials } from '../../../../lib/interfaces/credentials';
import { LangConfigs, TVerifyEmailAddressRequestInfo } from '../../../../lib/types';
import { logWithDate, response405, response500 } from '../../../../lib/utils/general';
import { verifyEmailAddress, verifyEnvironmentVariable, verifyRecaptchaResponse } from '../../../../lib/utils/verify';
import { getRandomHexStr, getRandomIdStr, getTimeBySecond } from '../../../../lib/utils/create';
import { ILoginJournal, IMinimumMemberComprehensive } from '../../../../lib/interfaces/member';
import { composeVerifyEmailAddressEmailContent } from '../../../../lib/email';

const recaptchaServerSecret = process.env.INVISIABLE_RECAPTCHA_SECRET_KEY ?? '';
const salt = process.env.APP_PASSWORD_SALT ?? '';

const domain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? '';
const lang = process.env.NEXT_PUBLIC_APP_LANG ?? 'tw';
const langConfigs: LangConfigs = {
    emailSubject: {
        tw: '驗證您的 Mojito 賬號',
        cn: '验证您的 Mojito 账户',
        en: 'Verify your Mojito Member'
    }
}

const fname = SignUp.name;

/** SignUp v0.1.1
 * 
 * Last update: 21/02/2023
 * 
 * This interface ONLY accepts POST requests
 * 
 * Info required for POST requests
 * - token: JWT
 * 
 */
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
        logWithDate(msg, fname);
        return;
    }

    //// Verify if requested by human ////
    const { recaptchaResponse } = req.query;
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

    //// Declare DB client ////
    const atlasDbClient = AtlasDatabaseClient();
    try {
        //// Verify request info ////
        const requestInfo = req.body;
        if (null === requestInfo || 'string' !== typeof requestInfo || '' === requestInfo) {
            res.status(403).send('Invalid request body');
            return;
        }

        //// [!] attemp to parse JSON string makes the probability of causing SyntaxError ////
        const { emailAddress, password } = JSON.parse(requestInfo);

        //// Verify email address ////
        if (!verifyEmailAddress(emailAddress)) {
            res.status(403).send('Invalid email address or not satisfied');
            return;
        }
        const emailAddressHash = CryptoJS.SHA1(emailAddress).toString();

        //// Look up record (of ILoginCredentials, by emailAddressHash) in [RL] Credentials ////
        const credentialsTableClient = AzureTableClient('Credentials');
        const loginCredentialsQuery = credentialsTableClient.listEntities<ILoginCredentials>({ queryOptions: { filter: `PartitionKey eq '${emailAddressHash}' and RowKey eq 'MojitoMemberSystem'` } });
        //// [!] attemp to reterieve entity makes the probability of causing RestError ////
        const loginCredentialsQueryResult = await loginCredentialsQuery.next();
        if (loginCredentialsQueryResult.value) {
            res.status(400).send('Email address has been registered');
            return;
        }

        //// Create a new member id////
        const memberId = getRandomIdStr(true);
        const providerId = 'MojitoMemberSystem';

        //// Upsert entity (of ILoginCredentials) in [RL] Credentials
        await credentialsTableClient.upsertEntity<IMojitoMemberSystemLoginCredentials>({
            partitionKey: emailAddressHash,
            rowKey: providerId,
            MemberId: memberId,
            PasswordHash: CryptoJS.SHA256(password + salt).toString(),
            LastUpdatedTimeBySecond: getTimeBySecond()
        }, 'Replace');

        //// Create a new token and Upsert entity (of IVerifyEmailAddressCredentials) in [RL] Credentials ////
        const verifyEmailAddressToken = getRandomHexStr(true);
        await credentialsTableClient.upsertEntity<IVerifyEmailAddressCredentials>({
            partitionKey: emailAddressHash,
            rowKey: 'VerifyEmailAddress',
            VerifyEmailAddressToken: verifyEmailAddressToken,
            CreatedTimeBySecond: getTimeBySecond()
        }, 'Replace');

        //// Create document (IMemberComprehensive) in [C] memberComprehensive ////
        await atlasDbClient.connect();
        const memberComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IMinimumMemberComprehensive>('member');
        const memberComprehensiveQueryResult = await memberComprehensiveCollectionClient.insertOne({
            memberId,
            providerId,
            registeredTimeBySecond: getTimeBySecond(),
            emailAddress,
            nickname: emailAddress.split('@')[0],
            status: 0, // email address not verified
            allowPosting: false,
            allowCommenting: false
        });
        if (!memberComprehensiveQueryResult.acknowledged) {
            const msg = 'Attempt to insert document (IMemberComprehensive) in [C] memberComprehensive';
            response500(res, msg);
            logWithDate(msg, fname);
            return;
        }

        //// Write journal (ILoginJournal) in [C] loginJournal ////
        const loginJournalCollectionClient = atlasDbClient.db('journal').collection<ILoginJournal>('login');
        await loginJournalCollectionClient.insertOne({
            memberId,
            category: 'success',
            providerId,
            timestamp: new Date().toISOString(),
            message: 'Registered.'
        });
        await atlasDbClient.close();

        //// Componse and send email ////
        const info: TVerifyEmailAddressRequestInfo = { emailAddress, providerId, verifyEmailAddressToken };
        const emailMessage: EmailMessage = {
            senderAddress: '<donotreply@mojito.co.nz>',
            content: {
                subject: langConfigs.emailSubject[lang],
                html: composeVerifyEmailAddressEmailContent(domain, Buffer.from(JSON.stringify(info)).toString('base64'), lang)
            },
            recipients: {
                to: [{ address: emailAddress }]
            }
        }
        const mailClient = AzureEmailCommunicationClient();
        await mailClient.beginSend(emailMessage);

        //// Response 200 ////
        res.status(200).send('Member established, email sent');
        return;
    } catch (e: any) {
        let msg;
        if (e instanceof RestError) {
            msg = `Attempt to communicate with azure table storage.`;
        } else if (e instanceof MongoError) {
            msg = `Attempt to communicate with atlas mongodb.`;
        } else {
            msg = `Uncategorized. ${e?.msg}`;
        }
        if (!res.headersSent) {
            response500(res, msg);
        }
        logWithDate(msg, fname, e);
        await atlasDbClient.close();
        return;
    }
}