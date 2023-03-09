import type { NextApiRequest, NextApiResponse } from 'next';
import { RestError } from '@azure/data-tables';
import { MongoError } from 'mongodb';
import CryptoJS from 'crypto-js';

import AzureTableClient from '../../../../modules/AzureTableClient';
import AtlasDatabaseClient from '../../../../modules/AtlasDatabaseClient';

import { ILoginJournal } from '../../../../lib/interfaces/member';
import { ILoginCredentials, IMojitoMemberSystemLoginCredentials, IResetPasswordCredentials } from '../../../../lib/interfaces/credentials';
import { verifyRecaptchaResponse, verifyEnvironmentVariable, verifyEmailAddress, verifyPassword } from '../../../../lib/utils/verify';
import { response405, response500, logWithDate } from '../../../../lib/utils/general';
import { getTimeBySecond } from '../../../../lib/utils/create';

const recaptchaServerSecret = process.env.INVISIABLE_RECAPTCHA_SECRET_KEY ?? '';
const salt = process.env.APP_PASSWORD_SALT ?? '';
const fname = ResetPassword.name;

/** ResetPassword v0.1.1
 * 
 * Last update: 21/02/2023
 * 
 * This interface ONLY accepts POST method
 * 
 * Info required for POST request
 * - emailAddressHash: string
 * - resetPasswordToken: string
 * - password: string
 */

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
        logWithDate(msg, fname);
        return;
    }

    //// Declare DB client ////
    const atlasDbClient = AtlasDatabaseClient();
    try {
        const { recaptchaResponse } = req.query;
        // #1 verify if requested by human
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
        // #2.1 verify request info
        const { emailAddress, resetPasswordToken, password } = req.body;
        if (!('string' === typeof emailAddress && 'string' === typeof resetPasswordToken)) {
            res.status(400).send('Invalid request info');
            return;
        }
        // #2.2 verify password
        if (!('string' === typeof password && verifyPassword(password))) {
            res.status(400).send('Password unsatisfied');
        }
        // #3.1 verify email address
        if (!verifyEmailAddress(emailAddress)) {
            res.status(403).send('Invalid email address');
            return;
        }
        const emailAddressHash = CryptoJS.SHA1(emailAddress).toString();
        // #3.2 look up login credentials record (by email address hash) in [RL] Credentials
        const credentialsTableClient = AzureTableClient('Credentials');
        const loginCredentialsQuery = credentialsTableClient.listEntities<ILoginCredentials>({ queryOptions: { filter: `PartitionKey eq '${emailAddressHash}' and RowKey eq 'MojitoMemberSystem'` } });
        //// [!] attemp to reterieve entity makes the probability of causing RestError ////
        const loginCredentialsQueryResult = await loginCredentialsQuery.next();
        if (loginCredentialsQueryResult.done) {
            const msg = 'Login credentials record not found';
            response500(res, msg);
            return;
        }
        const { MemberId: memberId } = loginCredentialsQueryResult.value;
        // #3.2 look up reset password credentials record (by email address hash) in [RL] Credentials
        const resetPasswordCredentialsQuery = credentialsTableClient.listEntities<IResetPasswordCredentials>({ queryOptions: { filter: `PartitionKey eq '${emailAddressHash}' and RowKey eq 'ResetPassword'` } });
        //// [!] attemp to reterieve entity makes the probability of causing RestError ////
        const resetPasswordCredentialsQueryResult = await resetPasswordCredentialsQuery.next();
        if (resetPasswordCredentialsQueryResult.done) {
            res.status(404).send('Password reset credentials not found');
            return;
        }
        const { ResetPasswordToken: resetPasswordTokenReference, CreateTimeBySecond: createTimeBySecond } = resetPasswordCredentialsQueryResult.value;
        // #3.2 verify timestamp
        if (900 < (getTimeBySecond() - createTimeBySecond)) { // valid for 15 minutes
            res.status(408).send('Reset password token expired');
            return;
        }
        // #3.3 match reset password tokens
        if (resetPasswordTokenReference !== resetPasswordToken) {
            res.status(403).send('Reset password tokens not match');
            return;
        }
        // #4 update enitity (ILoginCredentials) in [RL] Credentials
        await credentialsTableClient.upsertEntity<IMojitoMemberSystemLoginCredentials>({
            partitionKey: emailAddressHash,
            rowKey: 'MojitoMemberSystem',
            PasswordHash: CryptoJS.SHA256(password + salt).toString(),
            MemberId: memberId,
            LastUpdatedTimeBySecond: getTimeBySecond()
        }, 'Merge');
        res.status(200).send('Password reset');

        // #5 write journal (ILoginJournal) in [C] loginJournal
        await atlasDbClient.connect();
        const loginJournalCollectionClient = atlasDbClient.db('journal').collection<ILoginJournal>('login');
        await loginJournalCollectionClient.insertOne({
            memberId,
            category: 'success',
            providerId: 'MojitoMemberSystem',
            timestamp: new Date().toISOString(),
            message: 'Password reset.'
        });

        await atlasDbClient.close();
        return;
    } catch (e: any) {
        let msg: string;
        if (e instanceof SyntaxError) {
            res.status(400).send('Improperly normalized request info');
            return;
        } else if (e instanceof RestError) {
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