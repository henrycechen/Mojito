import type { NextApiRequest, NextApiResponse } from 'next';
import { RestError } from '@azure/data-tables';
import { MongoError } from 'mongodb';
import CryptoJS from 'crypto-js';

import AzureTableClient from '../../../modules/AzureTableClient';
import AzureEmailCommunicationClient from '../../../modules/AzureEmailCommunicationClient';
import AtlasDatabaseClient from '../../../modules/AtlasDatabaseClient';

import { LangConfigs, TEmailMessage, TVerifyEmailAddressRequestInfo } from '../../../lib/types';
import { composeVerifyEmailAddressEmailContent } from '../../../lib/email';
import { loginProviderIdMapping } from '../auth/[...nextauth]';
import { logWithDate, response405, response500 } from '../../../lib/utils/general';
import { verifyEnvironmentVariable, verifyRecaptchaResponse } from '../../../lib/utils/verify';
import { IMemberComprehensive } from '../../../lib/interfaces/member';
import { getRandomHexStr } from '../../../lib/utils/create';
import { ILoginCredentials, IVerifyEmailAddressCredentials } from '../../../lib/interfaces/credentials';

const recaptchaServerSecret = process.env.INVISIABLE_RECAPTCHA_SECRET_KEY ?? '';

const domain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? '';
const lang = process.env.NEXT_PUBLIC_APP_LANG ?? 'tw';
const langConfigs: LangConfigs = {
    emailSubject: {
        tw: '验证您的 Mojito 账户',
        cn: '验证您的 Mojito 账户',
        en: 'Verify your Mojito Member'
    }
}

const fname = ReportMisbehaviour.name;

/** ReportMisbehaviour v0.1.1 FIXME:FIXME:FIXME:FIXME:FIXME:FIXME:FIXME:
 * 
 * Last update: 28/02/2023
 * 
 * This interface ONLY accepts POST requests
 * 
 * Info required for POST requests
 * - recaptchaResponse: string (query)
 * - memberId: string (body)
 * - nickname: string (body)
 * - referenceId: string (body)
 * - referenceContent: string (body)
 * - additionalInfo: string (body)
 */

export default async function ReportMisbehaviour(req: NextApiRequest, res: NextApiResponse) {

    const { method } = req;
    if ('POST' !== method) {
        response405(req, res)
        return;
    }

    res.status(200).send('ok')
    return

    //// Verify environment variables ////
    const environmentVariable = verifyEnvironmentVariable({ recaptchaServerSecret });
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
        const { providerId, emailAddressB64 } = req.body;

        //// Verify email address ////
        if (new RegExp(/^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/).test(emailAddressB64)) {
            res.status(403).send('Invalid base64 string');
            return;
        }
        const emailAddress = Buffer.from(emailAddressB64, 'base64').toString();
        if ('' === emailAddress) {
            res.status(403).send('Invalid email address');
            return;
        }

        //// Verify provider id ///
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

        //// Get email address hash ////
        const emailAddressHash = CryptoJS.SHA1(emailAddress).toString();

        //// Look up record (of ILoginCredentials) in [RL] Credentials ////
        const credentialsTableClient = AzureTableClient('Credentials');
        const loginCredentialsQuery = credentialsTableClient.listEntities<ILoginCredentials>({ queryOptions: { filter: `PartitionKey eq '${emailAddressHash}' and RowKey eq '${providerId}'` } });
        //// [!] attemp to reterieve entity makes the probability of causing RestError ////
        const loginCredentialsQueryResult = await loginCredentialsQuery.next();
        if (!loginCredentialsQueryResult.value) {
            res.status(400).send('Login credentials record not found');
            return;
        }
        const { MemberId: memberId } = loginCredentialsQueryResult.value;

        //// Look up member status (of IMemberComprehensive) in [C] memberComprehensive ////
        await atlasDbClient.connect();
        const memberComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IMemberComprehensive>('member');
        const memberComprehensiveQueryResult = await memberComprehensiveCollectionClient.findOne<IMemberComprehensive>({ memberId }, { projection: { _id: 0, status: 1 } });
        if (null === memberComprehensiveQueryResult) {
            //// [!] document (of IMemberComprehensive) not found ////
            const msg = 'Member management (document of IMemberComprehensive) not found in [C] memberComprehensive';
            response500(res, msg);
            logWithDate(msg, fname);
            return;
        }

        //// Verify member status ////
        const { status } = memberComprehensiveQueryResult;
        if (0 !== status) {
            res.status(409).send('Request for re-send verification email cannot be fulfilled');
            await atlasDbClient.close();
            return;
        }

        //// Create a new token and upsert entity (of IVerifyEmailAddressCredentials) in [RL] Credentials ////
        const verifyEmailAddressToken = getRandomHexStr(true);
        credentialsTableClient.upsertEntity<IVerifyEmailAddressCredentials>({
            partitionKey: emailAddressHash,
            rowKey: 'VerifyEmailAddress',
            VerifyEmailAddressToken: verifyEmailAddressToken,
            CreatedTimeBySecond: Math.floor(new Date().getTime() / 1000)
        }, 'Replace');
        await atlasDbClient.close();

        //// Response 200 ////
        res.status(200).send('Verification email sent');

        //// Send email ////
        const info: TVerifyEmailAddressRequestInfo = { emailAddress, providerId, verifyEmailAddressToken };
        const emailMessage: TEmailMessage = {
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