import type { NextApiRequest, NextApiResponse } from 'next';
import { RestError } from '@azure/data-tables';
import { MongoError } from 'mongodb';
import { getToken } from "next-auth/jwt"

import AzureTableClient from '../../../../modules/AzureTableClient';
import AtlasDatabaseClient from '../../../../modules/AtlasDatabaseClient';

import { ILoginJournal, IMemberComprehensive, IMemberPostMapping, IMojitoMemberSystemLoginCredentials } from '../../../../lib/interfaces';
import { MemberInfo } from '../../../../lib/types';
import { createNoticeId, verifyId, response405, response500, log, verifyEnvironmentVariable, verifyRecaptchaResponse, verifyPassword } from '../../../../lib/utils';

const recaptchaServerSecret = process.env.INVISIABLE_RECAPTCHA_SECRET_KEY ?? '';
const salt = process.env.APP_PASSWORD_SALT ?? '';

/** This interface ONLY accepts PUT method
 * 
 * Info required for PUT request
 * - token: JWT
 * - updatePasswordToken: string
 * - password: string
 */

export default async function UpdatePassword(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;
    if ('PUT' !== method) {
        response405(req, res);
        return;
    }
    //// Verify identity ////
    const token = await getToken({ req });
    if (!(token && token?.sub)) {
        res.status(400).send('Invalid identity');
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
        //// Verify human/bot ////
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
        //// Verify request info ////
        const { updatePasswordToken, password } = req.body;
        if (!('string' === typeof updatePasswordToken && '' !== updatePasswordToken)) {
            res.status(403).send('Invalid update password token');
            return;
        }
        if (!('string' === typeof password && verifyPassword(password))) {
            res.status(400).send('Password unsatisfied');
            return;
        }
        const { sub: memberId, email: emailAddress } = token;
        //// Verify member status ////
        const memberComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IMemberComprehensive>('member');
        const memberComprehensiveQueryResult = await memberComprehensiveCollectionClient.findOne({ memberId });
        if (null === memberComprehensiveQueryResult) {
            throw new Error(`Member was trying getting browsing history records but have no document (of IMemberComprehensive, member id: ${memberId}) in [C] memberComprehensive`);
        }
        const { status: memberStatus } = memberComprehensiveQueryResult;
        if (0 > memberStatus) {
            res.status(403).send('Method not allowed due to member suspended or deactivated');
            await atlasDbClient.close();
            return;
        }
        const emailAddressHash = CryptoJS.SHA1(emailAddress ?? '').toString();
        // Step #1 look up login credentials record (by email address hash) in [RL] Credentials
        const credentialsTableClient = AzureTableClient('Credentials');
        const loginCredentialsQuery = credentialsTableClient.listEntities({ queryOptions: { filter: `PartitionKey eq '${emailAddressHash}' and RowKey eq 'MojitoMemberSystem'` } });
        //// [!] attemp to reterieve entity makes the probability of causing RestError ////
        const loginCredentialsQueryResult = await loginCredentialsQuery.next();
        if (!loginCredentialsQueryResult.value) {
            res.status(405).send('Provider of this member is not MojitoMemberSystem');
            return;
        }
        // Step #2.1 look up record (of IUpdatePasswordCredentials) in [RL] Credentials
        const updatePasswordCredentialsQuery = credentialsTableClient.listEntities({ queryOptions: { filter: `PartitionKey eq '${emailAddressHash}' and RowKey eq 'UpdatePassword'` } });
        //// [!] attemp to reterieve entity makes the probability of causing RestError ////
        const updatePasswordCredentialsQueryResult = await updatePasswordCredentialsQuery.next();
        if (!updatePasswordCredentialsQueryResult.value) {
            res.status(404).send('Password update credentials not found');
            return;
        }
        const { UpdatePasswordToken: updatePasswordTokenReference, Timestamp: timestamp } = updatePasswordCredentialsQueryResult.value;
        // Step #2.2 verify timestamp
        if (15 * 60 * 1000 < new Date().getTime() - new Date(timestamp).getTime()) {
            res.status(408).send('Update password token expired');
            return;
        }
        // Step #2.3 match update password tokens
        if (updatePasswordTokenReference !== updatePasswordToken) {
            res.status(403).send('Update password tokens not match');
            return;
        }
        // Step #4 update enitity (ILoginCredentials) in [RL] Credentials
        await credentialsTableClient.upsertEntity<IMojitoMemberSystemLoginCredentials>({ partitionKey: emailAddressHash, rowKey: 'MojitoMemberSystem', PasswordHash: CryptoJS.SHA256(password + salt).toString(), MemberId: memberId }, 'Merge');
        res.status(200).send('Password updated');
        // Step #5 write journal (ILoginJournal) in [C] loginJournal
        await atlasDbClient.connect();
        const loginJournalCollectionClient = atlasDbClient.db('journal').collection<ILoginJournal>('login');
        await loginJournalCollectionClient.insertOne({
            memberId,
            category: 'success',
            providerId: 'MojitoMemberSystem',
            timestamp: new Date().toISOString(),
            message: 'Password updated.'
        });
        await atlasDbClient.close();
        return;
    } catch (e: any) {
        let msg: string;
        if (e instanceof SyntaxError) {
            res.status(400).send('Improperly normalized request info');
            return;
        } else if (e instanceof RestError) {
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