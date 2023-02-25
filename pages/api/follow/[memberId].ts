import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt'
import { RestError } from '@azure/data-tables';
import { MongoError } from 'mongodb';

import AzureTableClient from '../../../modules/AzureTableClient';
import AtlasDatabaseClient from "../../../modules/AtlasDatabaseClient";

import { verifyId } from '../../../lib/utils/verify';
import { response405, response500, logWithDate, } from '../../../lib/utils/general';
import { IMemberMemberMapping } from '../../../lib/interfaces/mapping';
import { INoticeInfo, INotificationStatistics } from '../../../lib/interfaces/notification';
import { IMemberComprehensive, IMemberStatistics } from '../../../lib/interfaces/member';
import { createNoticeId } from '../../../lib/utils/create';
import { getNicknameFromToken } from '../../../lib/utils/for/member';

const fname = FollowOrUndoFollowMemberById.name;

/** FollowOrUndoFollowMemberById v0.1.1
 * 
 * Last update: 21/02/2023
 * 
 * This interface accepts GET and POST requests
 * 
 * Info required for GET requests
 * - token: JWT
 * 
 * Info will be returned for GET requests
 * - isFollowed: boolean
 * 
 * 
 * Info required for POST requests
 * token: JWT
 * id: string (query, member id)
*/

export default async function FollowOrUndoFollowMemberById(req: NextApiRequest, res: NextApiResponse) {

    const { method } = req;
    if (!['GET', 'POST'].includes(method ?? '')) {
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

    //// Verify member id ////
    const { isValid, category, id: objectId } = verifyId(req.query?.memberId);
    if (!(isValid && 'member' === category)) {
        res.status(400).send('Invalid member id');
        return;
    }
    if ('POST' === method && memberId === objectId) {
        res.status(400).send('Unable to follow yourself');
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
            throw new Error(`Member attempt to follow or undo follow on a member but have no document (of IMemberComprehensive, member id: ${memberId}) in [C] memberComprehensive`);
        }
        const { status: memberStatus } = memberComprehensiveQueryResult;
        if (0 > memberStatus) {
            res.status(403).send('Method not allowed due to member suspended or deactivated');
            await atlasDbClient.close();
            return;
        }

        let isFollowed: boolean;
        // Step #1.1 look up record (of IMemberMemberMapping) in [RL] FollowingMemberMapping
        const followingMemberMappingTableClient = AzureTableClient('FollowingMemberMapping');
        const followingMemberMappingQuery = followingMemberMappingTableClient.listEntities({ queryOptions: { filter: `PartitionKey eq '${memberId}' and RowKey eq '${objectId}'` } });
        //// [!] attemp to reterieve entity makes the probability of causing RestError ////
        const followingMemberMappingQueryResult = await followingMemberMappingQuery.next();
        // Step #1.2 verify if member has been followed
        if (!followingMemberMappingQueryResult.value) {
            // Case [Follow]
            isFollowed = false;
        } else {
            // Case [Depends]
            isFollowed = !!followingMemberMappingQueryResult.value?.IsActive;
        }

        //// GET | verify if followed ////
        if ('GET' === method) {
            res.status(200).send(isFollowed);
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

        //// POST | do follow or undo follow ////
        if (isFollowed) {
            // Case [Undo follow]
            // Step #2A.1 update record (of IMemberMemberMapping) in [RL] FollowingMemberMapping
            await followingMemberMappingTableClient.upsertEntity({
                partitionKey: memberId,
                rowKey: objectId,
                IsActive: false
            }, 'Merge');

            // Step #2A.2 update totalUndoFollowingCount (of IMemberStatistics) in [C] memberStatistics
            const memberStatisticsCollectionClient = atlasDbClient.db('statistics').collection<IMemberStatistics>('member');
            const memberStatisticsUpdateResult = await memberStatisticsCollectionClient.updateOne({ memberId }, { $inc: { totalUndoFollowingCount: 1 } });
            if (!memberStatisticsUpdateResult.acknowledged) {
                logWithDate(`Failed to update totalUndoFollowingCount (of IMemberStatistics, member id: ${memberId}) in [C] memberStatistics`, fname);
            }

            // Step #2A.3 update totalUndoFollowedByCount (of IMemberStatistics) in [C] memberStatistics
            const memberFollowedStatisticsUpdateResult = await memberStatisticsCollectionClient.updateOne({ memberId: objectId }, { $inc: { totalUndoFollowedByCount: 1 } });
            if (!memberFollowedStatisticsUpdateResult.acknowledged) {
                logWithDate(`Failed to update totalUndoFollowedByCount (of IMemberStatistics, member id: ${objectId}) in [C] memberStatistics`, fname);
            }
        } else {
            // Case [Do follow]
            // Step #2B.1 update record (of IMemberMemberMapping) in [RL] FollowingMemberMapping
            await followingMemberMappingTableClient.upsertEntity<IMemberMemberMapping>({
                partitionKey: memberId,
                rowKey: objectId,
                Nickname: nickname ?? '',
                BriefIntro: briefIntro ?? '',
                CreatedTimeBySecond: Math.floor(new Date().getTime() / 1000),
                IsActive: true
            }, 'Replace');

            // Step #2B.1 update totalFollowingCount (of IMemberStatistics) in [C] memberStatistics
            const memberStatisticsCollectionClient = atlasDbClient.db('statistics').collection<IMemberStatistics>('member');
            const memberStatisticsUpdateResult = await memberStatisticsCollectionClient.updateOne({ memberId }, { $inc: { totalFollowingCount: 1 } });
            if (!memberStatisticsUpdateResult.acknowledged) {
                logWithDate(`Failed to update totalFollowingCount (of IMemberStatistics, member id: ${memberId}) in [C] memberStatistics`, fname);
            }
            // Step #2B.2 update totalFollowedByCount (of IMemberStatistics) in [C] memberStatistics
            const memberFollowedStatisticsUpdateResult = await memberStatisticsCollectionClient.updateOne({ memberId: objectId }, { $inc: { totalFollowedByCount: 1 } });
            if (!memberFollowedStatisticsUpdateResult.acknowledged) {
                logWithDate(`Failed to update totalFollowedByCount (of IMemberStatistics, member id: ${objectId}) in [C] memberStatistics`, fname);
            }

            //// Handle notice.follow (cond.) ////
            // Step #2B.3 (cond.) look up record (of IMemberMemberMapping) in [RL] BlockingMemberMapping
            const blockingMemberMappingTableClient = AzureTableClient('BlockingMemberMapping');
            const blockingMemberMappingQuery = blockingMemberMappingTableClient.listEntities({ queryOptions: { filter: `PartitionKey eq '${objectId}' and RowKey eq '${memberId}'` } });
            if ((await blockingMemberMappingQuery.next()).done) {
                //// [!] member expressed attitude has not been blocked by object member ////
                // Step #2B.4 upsert record (of INoticeInfo.Follow) in [PRL] Notice
                const noticeTableClient = AzureTableClient('Notice');
                await noticeTableClient.upsertEntity<INoticeInfo>({
                    partitionKey: objectId, // notified member id, in this case, member having been followed by
                    rowKey: createNoticeId('follow', memberId), // combined id
                    Category: 'follow',
                    InitiateId: memberId,
                    Nickname: getNicknameFromToken(token),
                    PostTitle: '', // [!] post title is not supplied in this case
                    CommentBrief: '', // [!] comment brief is not supplied in this case
                    CreatedTimeBySecond: Math.floor(new Date().getTime() / 1000),
                    IsActive: true
                }, 'Replace');
                // Step #2B.5 update follow (of INotificationStatistics, of the member having been followed by) in [C] notificationStatistics
                const notificationStatisticsCollectionClient = atlasDbClient.db('statistics').collection<INotificationStatistics>('notification');
                const notificationStatisticsUpdateResult = await notificationStatisticsCollectionClient.updateOne({ memberId: objectId }, { $inc: { follow: 1 } });
                if (!notificationStatisticsUpdateResult.acknowledged) {
                    logWithDate(`Failed to update follow (of INotificationStatistics, member id: ${objectId}) in [C] notificationStatistics`, fname);
                }
            }
        }
        await atlasDbClient.close();

        // Step #4 upsert record (of IMemberMemberMapping) in [PRL] FollowedByMemberMapping
        const followedByMemberMappingTableClient = AzureTableClient('FollowedByMemberMapping');
        await followedByMemberMappingTableClient.upsertEntity<IMemberMemberMapping>({
            partitionKey: objectId,
            rowKey: memberId,
            Nickname: nickname ?? '',
            BriefIntro: briefIntro ?? '',
            CreatedTimeBySecond: Math.floor(new Date().getTime() / 1000),
            IsActive: !isFollowed
        }, 'Replace');
        res.status(200).send(`${isFollowed ? 'Undo follow' : 'Follow'} success`);
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