
import type { NextApiRequest, NextApiResponse } from 'next';
import { RestError } from '@azure/data-tables';
import { MongoError } from 'mongodb';
import CryptoJS from 'crypto-js';

import AzureTableClient from '../../../../../modules/AzureTableClient';
import AtlasDatabaseClient from '../../../../../modules/AtlasDatabaseClient';

import { verifyRecaptchaResponse, verifyEnvironmentVariable, response405, response500, log, verifyEmailAddress } from '../../../../../lib/utils';
import { IMojitoMemberSystemLoginCredentials, ILoginJournal } from '../../../../../lib/interfaces';

const recaptchaServerSecret = process.env.INVISIABLE_RECAPTCHA_SECRET_KEY ?? '';
const salt = process.env.APP_PASSWORD_SALT ?? '';

//// [!] {emailAddressHash, resetPasswordToken, password (new)} is required for this api

export default async function ResetPassword(req: NextApiRequest, res: NextApiResponse) {
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
        // Step #2 verify request info
        const requestInfo = req.body;
        if (null === requestInfo || 'string' !== typeof requestInfo || '' === requestInfo) {
            res.status(403).send('Invalid request body');
            return;
        }
        const { emailAddress, resetPasswordToken, password } = JSON.parse(requestInfo);
        //// [!] attemp to parse JSON string to object makes the probability of causing SyntaxError ////
        // Step #3.1 verify email address
        if (!verifyEmailAddress(emailAddress)) {
            res.status(403).send('Invalid email address');
            return;
        }
        const emailAddressHash = CryptoJS.SHA1(emailAddress).toString();
        // Step #3.2 look up login credentials record (by email address hash) in [RL] Credentials
        const credentialsTableClient = AzureTableClient('Credentials');
        const loginCredentialsQuery = credentialsTableClient.listEntities({ queryOptions: { filter: `PartitionKey eq '${emailAddressHash}' and RowKey eq 'MojitoMemberSystem'` } });
        //// [!] attemp to reterieve entity makes the probability of causing RestError ////
        const loginCredentialsQueryResult = await loginCredentialsQuery.next();
        if (!loginCredentialsQueryResult.value) {
            const msg = 'Login credentials record not found';
            response500(res, msg);
            return;
        }
        const { MemberId: memberId } = loginCredentialsQueryResult.value;
        // Step #3.2 look up reset password credentials record (by email address hash) in [RL] Credentials
        const resetPasswordCredentialsQuery = credentialsTableClient.listEntities({ queryOptions: { filter: `PartitionKey eq '${emailAddressHash}' and RowKey eq 'ResetPassword'` } });
        //// [!] attemp to reterieve entity makes the probability of causing RestError ////
        const resetPasswordCredentialsQueryResult = await resetPasswordCredentialsQuery.next();
        if (!resetPasswordCredentialsQueryResult.value) {
            res.status(404).send('Password reset credentials not found');
            return;
        }
        const { ResetPasswordToken: resetPasswordTokenReference, Timestamp: timestamp } = resetPasswordCredentialsQueryResult.value;
        // Step #3.2 verify timestamp
        if (15 * 60 * 1000 < new Date().getTime() - new Date(timestamp).getTime()) {
            res.status(403).send('Reset password token expired');
            return;
        }
        // Step #3.3 match reset password tokens
        if (resetPasswordTokenReference !== resetPasswordToken) {
            res.status(403).send('Reset password tokens not match');
            return;
        }
        // Step #4 update enitity (ILoginCredentials) in [RL] Credentials
        await credentialsTableClient.upsertEntity<IMojitoMemberSystemLoginCredentials>({ partitionKey: emailAddressHash, rowKey: 'MojitoMemberSystem', PasswordHash: CryptoJS.SHA256(password + salt).toString(), MemberId: memberId }, 'Merge');
        //// Response 200 ////
        res.status(200).send('Password upserted');
        // Step #5 write journal (ILoginJournal) in [C] loginJournal
        const loginJournalCollectionClient = atlasDbClient.db('journal').collection<ILoginJournal>('login');
        await loginJournalCollectionClient.insertOne({
            memberId,
            category: 'success',
            providerId: 'MojitoMemberSystem',
            timestamp: new Date().toISOString(),
            message: 'Password reset.'
        });
        atlasDbClient.close();
    } catch (e) {
        let msg: string;
        if (e instanceof RestError) {
            msg = 'Was trying communicating with azure table storage.';
        } else if (e instanceof MongoError) {
            msg = 'Was trying communicating with atlas database.';
            atlasDbClient.close();
        } else {
            msg = 'Uncategorized Error occurred.';
        }
        if (!res.headersSent) {
            response500(res, msg);
        }
        log(msg, e);
        return;
    }
}