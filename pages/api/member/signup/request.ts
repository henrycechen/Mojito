import type { NextApiRequest, NextApiResponse } from 'next';
import { RestError } from '@azure/data-tables';
import { MongoError } from 'mongodb';
import CryptoJS from 'crypto-js';

import AzureTableClient from '../../../../modules/AzureTableClient';
import AzureEmailCommunicationClient from '../../../../modules/AzureEmailCommunicationClient';
import AtlasDatabaseClient from '../../../../modules/AtlasDatabaseClient';

import { IVerifyEmailAddressCredentials, IMemberComprehensive } from '../../../../lib/interfaces';
import { LangConfigs, EmailMessage, VerifyEmailAddressRequestInfo } from '../../../../lib/types';
import { getRandomHexStr, verifyRecaptchaResponse, verifyEnvironmentVariable, response405, response500, log } from '../../../../lib/utils';
import { composeVerifyEmailAddressEmailContent } from '../../../../lib/email';
import { loginProviderIdMapping } from '../../auth/[...nextauth]';

const recaptchaServerSecret = process.env.INVISIABLE_RECAPTCHA_SECRET_KEY ?? '';

const domain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? '';
const lang = process.env.NEXT_PUBLIC_APP_LANG ?? 'ch';
const langConfigs: LangConfigs = {
    emailSubject: {
        ch: '验证您的 Mojito 账户',
        en: 'Verify your Mojito Member'
    }
}

//// [!] {emailAddress, providerId} are needed for requesting re-send verification email

export default async function RequestVerificationEmail(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;
    if ('POST' !== method) {
        response405(req, res);
        return;
    }
    //// Verify environment variables ////
    const environmentVariable = verifyEnvironmentVariable({ recaptchaServerSecret });
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
        const { providerId, emailAddressB64 } = JSON.parse(requestInfo);
        //// [!] attemp to parse JSON string to object makes the probability of causing SyntaxError ////
        // Step #3.1 verify email address
        if ('string' !== typeof emailAddressB64 || '' === emailAddressB64) {
            res.status(403).send('Invalid email address base 64 string');
            return;
        }
        const emailAddress = Buffer.from(emailAddressB64, 'base64').toString();
        if ('' === emailAddress) {
            res.status(403).send('Invalid email address');
            return;
        }
        // Step #3.2 verify provider id
        let isSupported = false;
        Object.keys(loginProviderIdMapping).forEach(provider => {
            if (loginProviderIdMapping[provider] === providerId) {
                isSupported = true;
            }
        });
        if (!isSupported) {
            res.status(406).send('Login provider not supported');
            return;
        }
        const emailAddressHash = CryptoJS.SHA1(emailAddress).toString();
        // Step #3.3 look up email address hash in [RL] Credentials
        const credentialsTableClient = AzureTableClient('Credentials');
        const loginCredentialsQuery = credentialsTableClient.listEntities({ queryOptions: { filter: `PartitionKey eq '${emailAddressHash}' and RowKey eq '${providerId}'` } });
        //// [!] attemp to reterieve entity makes the probability of causing RestError ////
        const loginCredentialsQueryResult = await loginCredentialsQuery.next();
        if (!loginCredentialsQueryResult.value) {
            res.status(400).send('Login credentials record not found');
            return;
        }
        const { MemberId: memberId } = loginCredentialsQueryResult.value;
        // Step #4.1 look up member status (IMemberComprehensive) in [C] memberComprehensive
        await atlasDbClient.connect();
        const memberComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IMemberComprehensive>('member');
        const memberComprehensiveQueryResult = await memberComprehensiveCollectionClient.findOne<IMemberComprehensive>({ memberId, providerId });
        if (null === memberComprehensiveQueryResult) {
            //// [!] document (of IMemberComprehensive) not found ////
            const msg = 'Member management (document of IMemberComprehensive) not found in [C] memberComprehensive';
            response500(res, msg);
            log(msg);
            return;
        }
        const { status } = memberComprehensiveQueryResult;
        if ('number' !== typeof status) {
            //// [!] member status (property of IMemberComprehensive) not found or status (code) error ////
            const msg = 'Member status (property of IMemberComprehensive) error in [C] memberComprehensive';
            response500(res, msg);
            log(msg);
            return;
        }
        // Step #4.2 verify member status
        if (0 !== status) {
            res.status(409).send('Request for re-send verification email cannot be fulfilled');
            await atlasDbClient.close();
            return;
        }
        // Step #3.4 create a new email address verification token
        const verifyEmailAddressToken = getRandomHexStr(true);
        // Step #3.5 upsert entity (IVerifyEmailAddressCredentials) in [RL] Credentials
        credentialsTableClient.upsertEntity<IVerifyEmailAddressCredentials>({ partitionKey: emailAddressHash, rowKey: 'VerifyEmailAddress', VerifyEmailAddressToken: verifyEmailAddressToken }, 'Replace');
        //// Response 200 ////
        res.status(200).send('Verification email sent');
        await atlasDbClient.close();
        // Step #4 send email
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
            msg = 'Was trying communicating with azure table storage.';
        } else if (e instanceof MongoError) {
            msg = 'Was trying communicating with atlas mongodb.';
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