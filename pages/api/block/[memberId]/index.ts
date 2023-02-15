import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt'
import { RestError } from '@azure/data-tables';
import { MongoError } from 'mongodb';

import AzureTableClient from '../../../../modules/AzureTableClient';
import AtlasDatabaseClient from "../../../../modules/AtlasDatabaseClient";

import { IMemberMemberMapping, IMemberComprehensive, IMemberStatistics, } from '../../../../lib/interfaces';
import { verifyId, response405, response500, logWithDate } from '../../../../lib/utils';
const recaptchaServerSecret = process.env.INVISIABLE_RECAPTCHA_SECRET_KEY ?? '';

/** This interface ONLY accepts POST requests
 * 
 * Info required for POST requests
 * 
 * recaptchaResponse: string (query string)
 * token: JWT
 * id: string (query, member id)
*/

export default async function BlockOrUndoBlockMemberById(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;
    if ('POST' !== method) {
        response405(req, res);
        return;
    }
    // FIXME: deactived human/bot verification for tests
    //// Verify human/bot ////
    // const { recaptchaResponse } = req.query;
    // const { status, message } = await verifyRecaptchaResponse(recaptchaServerSecret, recaptchaResponse);
    // if (200 !== status) {
    //     if (403 === status) {
    //         res.status(403).send(message);
    //         return;
    //     }
    //     if (500 === status) {
    //         response500(res, message);
    //         return;
    //     }
    // }
    //// Verify identity ////
    const token = await getToken({ req });
    if (!(token && token?.sub)) {
        res.status(400).send('Invalid identity');
        return;
    }
    const { isValid, category, id: memberId_object } = verifyId(req.query?.id);
    //// Verify id ////
    if (!(isValid && 'member' === category)) {
        res.status(400).send('Invalid member id');
        return;
    }
    //// Declare DB client ////
    const atlasDbClient = AtlasDatabaseClient();
    try {
        const { sub: memberId } = token;
        await atlasDbClient.connect();
        //// Verify member status ////
        const memberComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IMemberComprehensive>('member');
        const memberComprehensiveQueryResult = await memberComprehensiveCollectionClient.findOne({ memberId });
        if (null === memberComprehensiveQueryResult) {
            throw new Error(`Member attempt to block or undo block on a member but have no document (of IMemberComprehensive, member id: ${memberId}) in [C] memberComprehensive`);
        }
        const { status: memberStatus } = memberComprehensiveQueryResult;
        if (0 > memberStatus) {
            res.status(403).send('Method not allowed due to member suspended or deactivated');
            await atlasDbClient.close();
            return;
        }
        let isBlocked: boolean;
        // Step #1 look up record (of IMemberMemberMapping) in [RL] BlockingMemberMapping
        const blockingMemberMappingTableClient = AzureTableClient('BlockingMemberMapping');
        const blockingMemberMappingQuery = blockingMemberMappingTableClient.listEntities({ queryOptions: { filter: `PartitionKey eq '${memberId}' and RowKey eq '${memberId_object}'` } });
        //// [!] attemp to reterieve entity makes the probability of causing RestError ////
        const blockingMemberMappingQueryResult = await blockingMemberMappingQuery.next();
        // Step #1.2 verify if member has been blocked
        if (!blockingMemberMappingQueryResult.value) {
            // Case [Block]
            isBlocked = false;
        } else {
            // verify isActive
            isBlocked = !!blockingMemberMappingQueryResult.value;
        }
        if (isBlocked) {
            // Case [Undo Block]
            await blockingMemberMappingTableClient.upsertEntity<IMemberMemberMapping>({
                partitionKey: memberId,
                rowKey: memberId_object,
                IsActive: false
            }, 'Replace');
            // Step #2.1 update totalUndoBlockingCount (of IMemberStatistics) in [C] memberStatistics
            const memberStatisticsCollectionClient = atlasDbClient.db('statistics').collection<IMemberStatistics>('member');
            const memberStatisticsUpdateResult = await memberStatisticsCollectionClient.updateOne({ memberId }, { $inc: { totalUndoBlockingCount: 1 } });
            if (!memberStatisticsUpdateResult.acknowledged) {
                logWithDate(`Failed to update totalUndoBlockingCount (of IMemberStatistics, member id: ${memberId}) in [C] memberStatistics`);
            }
            // Step #2.2 update totalUndoBlockedByCount (of IMemberStatistics) in [C] memberStatistics
            const memberBlockedStatisticsUpdateResult = await memberStatisticsCollectionClient.updateOne({ memberId: memberId_object }, { $inc: { totalUndoBlockedByCount: 1 } });
            if (!memberBlockedStatisticsUpdateResult.acknowledged) {
                logWithDate(`Failed to update totalUndoBlockedByCount (of IMemberStatistics, member id: ${memberId_object}) in [C] memberStatistics`);
            }
        } else {
            // Case [Block]
            await blockingMemberMappingTableClient.upsertEntity<IMemberMemberMapping>({
                partitionKey: memberId,
                rowKey: memberId_object,
                IsActive: true
            }, 'Replace');
            // Step #2.1 update totalBlockingCount (of IMemberStatistics) in [C] memberStatistics
            const memberStatisticsCollectionClient = atlasDbClient.db('statistics').collection<IMemberStatistics>('member');
            const memberStatisticsUpdateResult = await memberStatisticsCollectionClient.updateOne({ memberId }, { $inc: { totalBlockingCount: 1 } });
            if (!memberStatisticsUpdateResult.acknowledged) {
                logWithDate(`Failed to update totalBlockingCount (of IMemberStatistics, member id: ${memberId}) in [C] memberStatistics`);
            }
            // Step #2.2 update totalBlockedByCount (of IMemberStatistics) in [C] memberStatistics
            const memberBlockedStatisticsUpdateResult = await memberStatisticsCollectionClient.updateOne({ memberId: memberId_object }, { $inc: { totalBlockedByCount: 1 } });
            if (!memberBlockedStatisticsUpdateResult.acknowledged) {
                logWithDate(`Failed to update totalBlockedByCount (of IMemberStatistics, member id: ${memberId_object}) in [C] memberStatistics`);
            }
        }
        await atlasDbClient.close();
        // Step #4 upsert record (of IMemberMemberMapping) in [PRL] BlockedByMemberMapping
        const blockedByMemberMappingTableClient = AzureTableClient('BlockedByMemberMapping');
        await blockedByMemberMappingTableClient.upsertEntity<IMemberMemberMapping>({
            partitionKey: memberId_object,
            rowKey: memberId,
            IsActive: isBlocked
        }, 'Replace');
        res.status(200).send(`${isBlocked ? 'Block' : 'Undo Block'} success`);
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
        logWithDate(msg, e);
        await atlasDbClient.close();
        return;
    }
}