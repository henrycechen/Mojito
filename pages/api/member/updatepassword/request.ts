import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import { RestError } from '@azure/data-tables';
import { MongoError } from 'mongodb';

import CryptoJS from 'crypto-js';

import AzureTableClient from '../../../../modules/AzureTableClient';
import AtlasDatabaseClient from "../../../../modules/AtlasDatabaseClient";


import { IMemberComprehensive, IUpdatePasswordCredentials } from '../../../../lib/interfaces';
import { LangConfigs, EmailMessage, TResetPasswordRequestInfo } from '../../../../lib/types';
import { getRandomHexStr, verifyRecaptchaResponse, verifyEnvironmentVariable, response405, response500, logWithDate } from '../../../../lib/utils';
import { composeResetPasswordEmailContent } from '../../../../lib/email';

const appSecret = process.env.APP_AES_SECRET ?? '';
const recaptchaServerSecret = process.env.INVISIABLE_RECAPTCHA_SECRET_KEY ?? '';

/** This interface ONLY accepts POST method
 * Info required for POST request
 * - recaptchaResponse: string
 * - token: JWT
 * 
 * Info will be returned
 * - updatePasswordToken: string
 */

export default async function RequestUpdatePassword(req: NextApiRequest, res: NextApiResponse) {
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
    //// Declare DB client ////
    const atlasDbClient = AtlasDatabaseClient();
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
        //// Verify identity ////
        const token = await getToken({ req });
        if (!(token && token?.sub)) {
            res.status(400).send('Invalid identity');
            return;
        }
        //// Verify member status ////
        await atlasDbClient.connect();
        const { memberId } = token;
        const memberComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IMemberComprehensive>('member');
        const memberComprehensiveQueryResult = await memberComprehensiveCollectionClient.findOne({ memberId });
        if (null === memberComprehensiveQueryResult) {
            throw new Error(`Member attempt to updating password (of ICommentComprehensive) but have no document (of IMemberComprehensive, member id: ${memberId}) in [C] memberComprehensive`);
        }
        const { status: memberStatus, allowCommenting } = memberComprehensiveQueryResult;
        if (!(0 < memberStatus && allowCommenting)) {
            res.status(403).send('Method not allowed due to member suspended or deactivated');
            await atlasDbClient.close();
            return;
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
            res.status(405).send('Provider of this member is not MojitoMemberSystem');
            return;
        }
        // Step #3.1 create a new reset password verification token
        const updatePasswordToken = getRandomHexStr(true); // use UPPERCASE
        // Step #3.2 upsert entity (IUpdatePasswordCredentials) in [RL] Credentials
        credentialsTableClient.upsertEntity<IUpdatePasswordCredentials>({ partitionKey: emailAddressHash, rowKey: 'UpdatePassword', ResetPasswordToken: updatePasswordToken }, 'Replace');
        res.status(200).send(updatePasswordToken);
        await atlasDbClient.close();
        return;
    } catch (e: any) {
        let msg;
        if (e instanceof SyntaxError) {
            res.status(400).send('Improperly normalized request info');
            return;
        } else if (e instanceof RestError) {
            msg = 'Attempt to communicate with azure table storage.';
        } else if (e instanceof MongoError) {
            msg = 'Attempt to communicate with atlas mongodb.';
        } else {
            msg = `Uncategorized. ${e?.msg}`;
        }
        if (!res.headersSent) {
            response500(res, msg);
        }
        logWithDate(msg, e);
        await atlasDbClient.close();
        return;
    }
}