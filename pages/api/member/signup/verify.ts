import type { NextApiRequest, NextApiResponse } from 'next';
import { RestError } from '@azure/data-tables';
import { MongoError } from 'mongodb';
import CryptoJS from 'crypto-js';

import AzureTableClient from '../../../../modules/AzureTableClient';
import AtlasDatabaseClient from '../../../../modules/AtlasDatabaseClient';
import { logWithDate, response405, response500 } from '../../../../lib/utils/general';
import { verifyEmailAddress, verifyEnvironmentVariable, verifyRecaptchaResponse } from '../../../../lib/utils/verify';
import { ILoginJournal, IMemberComprehensive, IMemberStatistics } from '../../../../lib/interfaces/member';
import { INotificationStatistics } from '../../../../lib/interfaces/notification';


const recaptchaServerSecret = process.env.INVISIABLE_RECAPTCHA_SECRET_KEY ?? '';
const fname = VerifyEmailAddressToken.name;


/** VerifyEmailAddressToken v0.1.1
 * 
 * Last update: 21/02/2023
 * 
 * This interface ONLY accepts POST requests
 * 
 * Info required for POST requests
 * - recaptchaResponse: string (query)
 * - requestInfo: {emailAddress, providerId, verifyEmailAddressToken} (body)
 */
export default async function VerifyEmailAddressToken(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;
    if ('POST' !== method) {
        response405(req, res);
        return;
    }
    const environmentVariable = verifyEnvironmentVariable({ recaptchaServerSecret });
    //// Verify environment variables ////
    if (!!environmentVariable) {
        const msg = `${environmentVariable} not found`;
        response500(res, msg);
        logWithDate(msg,);
        return;
    }
    //// Declare DB client ////
    const atlasDbClient = AtlasDatabaseClient();
    try {
        const { recaptchaResponse } = req.query;
        // Step #1 verify if requested by human
        const { status: recaptchaStatus, message } = await verifyRecaptchaResponse(recaptchaServerSecret, recaptchaResponse);
        if (200 !== recaptchaStatus) {
            if (403 === recaptchaStatus) {
                res.status(403).send(message);
                return;
            }
            if (500 === recaptchaStatus) {
                response500(res, message);
                return;
            }
        }
        // Step #2 verify request info
        const { requestInfo } = req.query;
        if ('string' !== typeof requestInfo || '' === requestInfo) {
            res.status(403).send('Invalid request info');
            return;
        }
        // Step #3 decode base64 string to plain string
        const requestInfoStr = Buffer.from(requestInfo, 'base64').toString();
        if ('' === requestInfoStr) {
            res.status(403).send('Invalid request info');
            return;
        }
        const { emailAddress, providerId, verifyEmailAddressToken } = JSON.parse(requestInfoStr);
        //// [!] attemp to parse info JSON string makes the probability of causing SyntaxError ////
        if (!(emailAddress && providerId && verifyEmailAddressToken)) {
            res.status(400).send('Defactive request info');
            return;
        }
        if (!verifyEmailAddress(emailAddress)) {
            res.status(400).send('Improper email address');
            return;
        }
        const emailAddressHash = CryptoJS.SHA1(emailAddress).toString();
        // Step #4.1 look up verify email address credentials record (by email address hash) in [RL] Credentials
        const credentialsTableClient = AzureTableClient('Credentials');
        const emailVerificationCredentialsQuery = credentialsTableClient.listEntities({ queryOptions: { filter: `PartitionKey eq '${emailAddressHash}' and RowKey eq 'VerifyEmailAddress'` } });
        //// [!] attemp to reterieve entity makes the probability of causing RestError ////
        const emailVerificationCredentialsQueryResult = await emailVerificationCredentialsQuery.next();
        if (!emailVerificationCredentialsQueryResult.value) {
            res.status(404).send('Email verification credentials record not found');
            return;
        }
        const { VerifyEmailAddressToken: verifyEmailAddressTokenReference } = emailVerificationCredentialsQueryResult.value;
        // Step #4.2 match tokens
        if (verifyEmailAddressTokenReference !== verifyEmailAddressToken) {
            res.status(404).send('Email verification tokens not match');
            return;
        }
        // Step #4.3 look up login credentials record in [RL] Credentials
        const loginCredentialsQuery = credentialsTableClient.listEntities({ queryOptions: { filter: `PartitionKey eq '${emailAddressHash}' and RowKey eq '${providerId}'` } });
        const loginCredentialsQueryResult = await loginCredentialsQuery.next();
        if (!loginCredentialsQueryResult.value) {
            res.status(404).send('Login credentials record not found');
            return;
        }
        const { MemberId: memberId } = loginCredentialsQueryResult.value;
        // Step #4.4 look up member status (IMemberComprehensive) in [C] memberComprehensive
        await atlasDbClient.connect();
        const memberComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IMemberComprehensive>('member');
        const memberComprehensiveQueryResult = await memberComprehensiveCollectionClient.findOne<IMemberComprehensive>({ memberId, providerId });
        if (null === memberComprehensiveQueryResult) {
            //// [!] document not found ////
            throw new Error(`Member management (document of IMemberComprehensive, member id: ${memberId}) not found in [C] memberComprehensive`);
        }
        const { status } = memberComprehensiveQueryResult;
        if ('number' !== typeof status) {
            //// [!] member status (property of IMemberComprehensive) not found or status (code) error ////
            throw new Error(`Member status (of IMemberComprehensive, member id: ${memberId}) error in [C] memberComprehensive`);
        }
        // Step #4.5 verify member status
        if (0 !== status) {
            res.status(409).send('Request for activating member cannot be fulfilled');
            await atlasDbClient.close();
            return;
        }
        // Step #5 update status code (IMemberComprehensive) in [C] memberComprehensive
        const memberComprehensiveCollectionUpdateResult = await memberComprehensiveCollectionClient.updateOne({ memberId, providerId }, {
            $set: {
                //// info ////
                verifiedTimeBySecond: Math.floor(new Date().getTime() / 1000),
                gender: -1, // "keep as secret"
                //// management ////
                status: 200,
                allowPosting: true,
                allowCommenting: true
            }
        }, { upsert: true });
        if (!memberComprehensiveCollectionUpdateResult.acknowledged) {
            throw new Error(`Attempt to update document (IMemberComprehensive, member id: ${memberId}) in [C] memberComprehensive`);
        }
        // Step #6 insert a new document (IMemberStatistics) in [C] memberStatistics
        const memberStatisticsCollectionClient = atlasDbClient.db('statistics').collection<IMemberStatistics>('member');
        const memberStatisticsCollectionInsertResult = await memberStatisticsCollectionClient.insertOne({
            memberId,

            // creation
            totalCreationCount: 0, // info page required
            totalCreationHitCount: 0,
            totalCreationEditCount: 0,
            totalCreationDeleteCount: 0,
            totalCreationLikedCount: 0, // info page required
            totalCreationUndoLikedCount: 0,
            totalCreationDislikedCount: 0,
            totalCreationUndoDislikedCount: 0,
            totalCreationSavedCount: 0, // info page required
            totalCreationUndoSavedCount: 0,

            // attitude
            totalLikeCount: 0,
            totalUndoLikeCount: 0,
            totalDislikeCount: 0,
            totalUndoDislikeCount: 0,

            // comment
            totalCommentCount: 0,
            totalCommentEditCount: 0,
            totalCommentDeleteCount: 0,
            totalCommentLikedCount: 0,
            totalCommentUndoLikedCount: 0,
            totalCommentDislikedCount: 0,
            totalCommentUndoDislikedCount: 0,

            // post
            totalSavedCount: 0,
            totalUndoSavedCount: 0,

            // on other members
            totalFollowingCount: 0,
            totalUndoFollowingCount: 0,
            totalBlockingCount: 0,
            totalUndoBlockingCount: 0,

            // by other members
            totalFollowedByCount: 0, // info page required
            totalUndoFollowedByCount: 0,
            totalBlockedByCount: 0,
            totalUndoBlockedByCount: 0
        });
        if (!memberStatisticsCollectionInsertResult.acknowledged) {
            throw new Error(`Attempt to insert document (IMemberStatistics, member id: ${memberId}) in [C] memberStatistics`)
        }
        // Step #7 insert a new document (INotificationStatistics) in [C] notificationStatistics
        const notificationStatisticsCollectionClient = atlasDbClient.db('statistics').collection<INotificationStatistics>('notification');
        const notificationCollectionInsertResult = await notificationStatisticsCollectionClient.insertOne({
            memberId,
            cue: 0, // cued times accumulated from last count reset
            reply: 0,
            like: 0,
            pin: 0,
            save: 0,
            follow: 0,
        });
        if (!notificationCollectionInsertResult.acknowledged) {
            throw new Error(`Attempt to insert document (of INotificationStatistics, member id: ${memberId}) in [C] notificationStatistics`);
        }
        res.status(200).send('Email address verified');
        // Step #8 write journal (ILoginJournal) in [C] loginJournal
        const loginJournalCollectionClient = atlasDbClient.db('journal').collection<ILoginJournal>('login');
        await loginJournalCollectionClient.insertOne({
            memberId,
            category: 'success',
            providerId,
            timestamp: new Date().toISOString(),
            message: 'Email address verified.'
        });
        await atlasDbClient.close();
    } catch (e: any) {
        let msg: string;
        if (e instanceof SyntaxError) {
            res.status(400).send('Improperly normalized request info');
            return;
        } else if (e instanceof TypeError) {
            msg = 'Attempt to decode recaptcha verification response.';
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