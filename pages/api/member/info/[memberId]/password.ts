import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import { RestError } from '@azure/storage-blob';
import { MongoError } from 'mongodb';

import AtlasDatabaseClient from '../../../../../modules/AtlasDatabaseClient';
import AzureTableClient from '../../../../../modules/AzureTableClient';

import { response405, response500, logWithDate } from '../../../../../lib/utils/general';
import { ILoginJournal, IMemberComprehensive } from '../../../../../lib/interfaces/member';
import { INicknameRegistry } from '../../../../../lib/interfaces/registry';

import CryptoJS from 'crypto-js';

import { verifyId, verifyPassword } from '../../../../../lib/utils/verify';
import { IMojitoMemberSystemLoginCredentials } from '../../../../../lib/interfaces/credentials';

const salt = process.env.APP_PASSWORD_SALT ?? '';
const fname = UpdatePassword.name;

/** UpdatePassword v0.1.1
 * 
 * Last update: 16/02/2023
 * 
 * This interface ONLY accepts PUT requests
 * 
 * Info required for PUT requests
 * - token: JWT
 * - currentPassword: string (body)
 * - newPassword: string (body)
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
        res.status(401).send('Unauthorized');
        return;
    }
    const { sub: tokenId } = token;

    //// Verify member id ////
    const { isValid, category, id: memberId } = verifyId(req.query?.memberId);

    if (!(isValid && 'member' === category)) {
        res.status(400).send('Invalid member id');
        return;
    }

    //// Match the member id in token and the one in request ////
    if (tokenId !== memberId) {
        res.status(400).send('Requested member id and identity not matched');
        return;
    }


    //// Declare DB client ////
    const atlasDbClient = AtlasDatabaseClient();
    try {
        // await atlasDbClient.connect();

        //// Verify member status ////
        const memberComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IMemberComprehensive>('member');
        const memberComprehensiveQueryResult = await memberComprehensiveCollectionClient.findOne({ memberId }, { projection: { _id: 0, providerId: 1, emailAddress: 1, status: 1 } });
        if (null === memberComprehensiveQueryResult) {
            throw new Error(`Member attempt to upload avatar image but have no document (of IMemberComprehensive, member id: ${memberId}) in [C] memberComprehensive`);
        }

        const { providerId, emailAddress, status: memberStatus } = memberComprehensiveQueryResult;
        if (0 > memberStatus) {
            res.status(403).send('Method not allowed due to member suspended or deactivated');
            await atlasDbClient.close();
            return;
        }

        //// Verify provider id (Only members with Mojito member system can change password)
        if ('MojitoMemberSystem' !== providerId) {
            res.status(422).send('Updating password is not applicable with this member as third-party login provider');
            return;
        }

        const { currentPassword, newPassword } = req.body;

        //// Verify new password ////
        if (!verifyPassword(newPassword)) {
            res.status(422).send('New password does not meet the requirement');
            return;
        }

        const emailAddressHash = CryptoJS.SHA1(emailAddress).toString()

        //// Match the current passwords (hash) ////
        const credentialsTableClient = AzureTableClient('Credentials');
        const loginCredentialsQuery = credentialsTableClient.listEntities({ queryOptions: { filter: `PartitionKey eq '${emailAddressHash}' and RowKey eq 'MojitoMemberSystem'` } });
        //// [!] attemp to reterieve entity makes the probability of causing RestError ////
        const loginCredentialsQueryResult = await loginCredentialsQuery.next();
        if (!loginCredentialsQueryResult.value) {
            //// [!] login credential mapping record not found deemed member deactivated / suspended / not registered ////
            res.status(500).send('Provided current password does not match the record');
            response500(res, `Member attempt to update (PUT) password but have no record (of ILoginCredentials) in [RL] Credentials`);
            return;
        }

        const { PasswordHash: currentPasswordHashReference } = loginCredentialsQueryResult.value;
        const currentPasswordHash = CryptoJS.SHA256(currentPassword + salt).toString();
        if (currentPasswordHashReference !== currentPasswordHash) {
            //// [!] password hashes not match ///
            res.status(400).send('Provided current password does not match the record');
            return;
        }

        //// Update PasswordHash (of IMojitoMemberSystemLoginCredentials) in [RL] Credentials ////
        await credentialsTableClient.upsertEntity<IMojitoMemberSystemLoginCredentials>({
            partitionKey: emailAddressHash,
            rowKey: 'MojitoMemberSystem',
            PasswordHash: CryptoJS.SHA256(newPassword + salt).toString(),
            MemberId: memberId,
            LastUpdatedTimeBySecond: getTimeBySecond()
        }, 'Merge');


        //// Update lastPasswordUpdatedTimeBySecond (of IMemberComprehensive) in [C] memberComprehensive ////
        const memberComprehensiveUpdateResult = await memberComprehensiveCollectionClient.updateOne({ memberId }, {
            $set: {
                lastPasswordUpdatedTimeBySecond: getTimeBySecond()
            }
        })

        if (!memberComprehensiveUpdateResult.acknowledged) {
            logWithDate(`Failed to update lastPasswordUpdatedTimeBySecond (of IMemberComprehensive, member id: ${memberId}) in [C] memberComprehensive`, fname);
            return;
        }

        res.status(200).send('Password updated');
        //// Write journal (ILoginJournal) in [C] loginJournal ////
        const loginJournalCollectionClient = atlasDbClient.db('journal').collection<ILoginJournal>('login');
        await loginJournalCollectionClient.insertOne({
            memberId,
            category: 'success',
            providerId: 'MojitoMemberSystem',
            timestamp: new Date().toISOString(),
            message: 'Password updated.'
        });

        await atlasDbClient.close();
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