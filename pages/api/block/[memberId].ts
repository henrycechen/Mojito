import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt'
import { RestError } from '@azure/data-tables';
import { MongoError } from 'mongodb';

import AzureTableClient from '../../../modules/AzureTableClient';
import AtlasDatabaseClient from "../../../modules/AtlasDatabaseClient";

import { IMemberMemberMapping } from '../../../lib/interfaces/mapping';
import { IMemberComprehensive, IMemberStatistics, } from '../../../lib/interfaces/member';
import { response405, response500, logWithDate } from '../../../lib/utils/general';
import { verifyId } from '../../../lib/utils/verify';

const fname = BlockOrUndoBlockMemberById.name;

/** BlockOrUndoBlockMemberById v0.1.2
 * 
 * Last update: 21/02/2023
 * 
 * This interface ONLY accepts POST requests
 * 
 * Info required for POST requests
 * - token: JWT
 * - id: string (query, member id)
 * 
*/

export default async function BlockOrUndoBlockMemberById(req: NextApiRequest, res: NextApiResponse) {

    const { method } = req;
    if ('POST' !== method) {
        response405(req, res);
        return;
    }

    //// Verify identity ////
    const token = await getToken({ req });
    if (!(token && token?.sub)) {
        res.status(400).send('Invalid identity');
        return;
    }
    const { sub: memberId } = token;

    //// Verify id ////
    const { isValid, category, id: objectId } = verifyId(req.query?.memberId);
    if (!(isValid && 'member' === category)) {
        res.status(400).send('Invalid member id');
        return;
    }
    if (memberId === objectId) {
        res.status(400).send('Unable to block yourself');
        return;
    }

    //// Declare DB client ////
    const atlasDbClient = AtlasDatabaseClient();
    try {
        await atlasDbClient.connect();

        //// Verify member status ////
        const memberComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IMemberComprehensive>('member');
        const memberComprehensiveQueryResult = await memberComprehensiveCollectionClient.findOne({ memberId }, { projection: { _id: 0, status: 1 } });
        if (null === memberComprehensiveQueryResult) {
            throw new Error(`${fname}: Member attempt to block or undo block on a member but have no document (of IMemberComprehensive, member id: ${memberId}) in [C] memberComprehensive`);
        }
        const { status: memberStatus } = memberComprehensiveQueryResult;
        if (0 > memberStatus) {
            res.status(403).send('Method not allowed due to member suspended or deactivated');
            await atlasDbClient.close();
            return;
        }

        //// Verify object existence (v0.1.2) ////
        const objectConciseQueryResult = await memberComprehensiveCollectionClient.findOne({ memberId: objectId }, { projection: { _id: 0, nickname: 1, briefIntro: 1 } });
        if (!objectConciseQueryResult) {
            res.status(403).send('Method not allowed due to object member not found');
            await atlasDbClient.close();
            return;
        }
        const { nickname, briefIntro } = objectConciseQueryResult;

        let isBlocked: boolean;
        // Step #1.1 look up record (of IMemberMemberMapping) in [RL] BlockingMemberMapping
        const blockingMemberMappingTableClient = AzureTableClient('BlockingMemberMapping');
        const blockingMemberMappingQuery = blockingMemberMappingTableClient.listEntities({ queryOptions: { filter: `PartitionKey eq '${memberId}' and RowKey eq '${objectId}'` } });
        //// [!] attemp to reterieve entity makes the probability of causing RestError ////
        const blockingMemberMappingQueryResult = await blockingMemberMappingQuery.next();

        // Step #1.2 verify if member has been blocked
        if (!blockingMemberMappingQueryResult.value) {
            // Case [Block]
            isBlocked = false;
        } else {
            // Case [Depends]
            isBlocked = !!blockingMemberMappingQueryResult.value.IsActive;
        }

        if (isBlocked) {
            // Case [Undo block]
            // Step #2A.1 update record (of IMemberMemberMapping) in [RL] BlockingMemberMapping
            await blockingMemberMappingTableClient.upsertEntity({
                partitionKey: memberId,
                rowKey: objectId,
                IsActive: false
            }, 'Merge');
            // Step #2A.2 update totalUndoBlockingCount (of IMemberStatistics) in [C] memberStatistics
            const memberStatisticsCollectionClient = atlasDbClient.db('statistics').collection<IMemberStatistics>('member');
            const memberStatisticsUpdateResult = await memberStatisticsCollectionClient.updateOne({ memberId }, { $inc: { totalUndoBlockingCount: 1 } });
            if (!memberStatisticsUpdateResult.acknowledged) {
                logWithDate(`Failed to update totalUndoBlockingCount (of IMemberStatistics, member id: ${memberId}) in [C] memberStatistics`, fname);
            }
            // Step #2A.3 update totalUndoBlockedByCount (of IMemberStatistics) in [C] memberStatistics
            const memberBlockedStatisticsUpdateResult = await memberStatisticsCollectionClient.updateOne({ memberId: objectId }, { $inc: { totalUndoBlockedByCount: 1 } });
            if (!memberBlockedStatisticsUpdateResult.acknowledged) {
                logWithDate(`Failed to update totalUndoBlockedByCount (of IMemberStatistics, member id: ${objectId}) in [C] memberStatistics`, fname);
            }
        } else {
            // Case [Do block]
            // Step #2B.1 upsert record (of IMemberMemberMapping) in [RL] BlockingMemberMapping
            await blockingMemberMappingTableClient.upsertEntity<IMemberMemberMapping>({
                partitionKey: memberId,
                rowKey: objectId,
                Nickname: nickname ?? '',
                BriefIntro: briefIntro ?? '',
                CreatedTimeBySecond: Math.floor(new Date().getTime() / 1000),
                IsActive: true
            }, 'Replace');
            // Step #2B.2 update totalBlockingCount (of IMemberStatistics) in [C] memberStatistics
            const memberStatisticsCollectionClient = atlasDbClient.db('statistics').collection<IMemberStatistics>('member');
            const memberStatisticsUpdateResult = await memberStatisticsCollectionClient.updateOne({ memberId }, { $inc: { totalBlockingCount: 1 } });
            if (!memberStatisticsUpdateResult.acknowledged) {
                logWithDate(`Failed to update totalBlockingCount (of IMemberStatistics, member id: ${memberId}) in [C] memberStatistics`, fname);
            }
            // Step #B2.3 update totalBlockedByCount (of IMemberStatistics) in [C] memberStatistics
            const memberBlockedStatisticsUpdateResult = await memberStatisticsCollectionClient.updateOne({ memberId: objectId }, { $inc: { totalBlockedByCount: 1 } });
            if (!memberBlockedStatisticsUpdateResult.acknowledged) {
                logWithDate(`Failed to update totalBlockedByCount (of IMemberStatistics, member id: ${objectId}) in [C] memberStatistics`, fname);
            }
        }
        await atlasDbClient.close();

        // Step #3 upsert record (of IMemberMemberMapping) in [PRL] BlockedByMemberMapping
        const blockedByMemberMappingTableClient = AzureTableClient('BlockedByMemberMapping');
        await blockedByMemberMappingTableClient.upsertEntity<IMemberMemberMapping>({
            partitionKey: objectId,
            rowKey: memberId,
            Nickname: nickname ?? '',
            BriefIntro: briefIntro ?? '',
            CreatedTimeBySecond: Math.floor(new Date().getTime() / 1000),
            IsActive: !isBlocked
        }, 'Replace');

        //// Response 200 ////
        res.status(200).send(`${isBlocked ? 'Block' : 'Undo Block'} success`);
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