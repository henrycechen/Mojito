import type { NextApiRequest, NextApiResponse } from 'next';
import { RestError } from '@azure/data-tables';
import { getToken } from "next-auth/jwt";
import { MongoError } from 'mongodb';

import AzureTableClient from '../../../modules/AzureTableClient';
import AtlasDatabaseClient from "../../../modules/AtlasDatabaseClient";

import { IMemberMemberMapping, IMemberPostMapping } from '../../../lib/interfaces/mapping';
import { logWithDate, response405, response500 } from '../../../lib/utils/general';
import { verifyId } from '../../../lib/utils/verify';
import { IMemberComprehensive, IMemberStatistics } from '../../../lib/interfaces/member';
import { IPostComprehensive } from '../../../lib/interfaces/post';
import { IChannelStatistics } from '../../../lib/interfaces/channel';
import { ITopicComprehensive } from '../../../lib/interfaces/topic';
import { INoticeInfo, INotificationStatistics } from '../../../lib/interfaces/notification';
import { createNoticeId } from '../../../lib/utils/create';
import { getNicknameFromToken } from '../../../lib/utils/for/member';

const fname = SaveOrUndoSavePostById.name;

/** SaveOrUndoSavePostById v0.1.1
 * 
 * Last update: 24/02/2023
 * 
 * This interface accepts GET and POST method
 * 
 * Info required for POST request
 * - token: JWT
 * - postId: string (query, member id)
 */

export default async function SaveOrUndoSavePostById(req: NextApiRequest, res: NextApiResponse) {

    const { method } = req;
    if (!['GET', 'POST'].includes(method ?? '')) {
        response405(req, res);
        return;
    }

    if ('GET' === method) {
        res.send(true);
        return;
    }

    //// Verify identity ////
    const token = await getToken({ req });
    if (!(token && token?.sub)) {
        res.status(400).send('Invalid identity');
        return;
    }
    const { sub: memberId } = token;

    //// Verify post id ////
    const { isValid, category, id: postId } = verifyId(req.query?.postId);
    if (!(isValid && 'post' === category)) {
        res.status(400).send('Invalid post id');
        return;
    }

    //// Declare DB client ////
    const atlasDbClient = AtlasDatabaseClient();
    try {
        await atlasDbClient.connect();

        //// Verify member status ////
        const memberComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IMemberComprehensive>('member');
        const memberComprehensiveQueryResult = await memberComprehensiveCollectionClient.findOne({ memberId });
        if (null === memberComprehensiveQueryResult) {
            throw new Error(`Member attempt to saving or undo saving a post but have no document (of IMemberComprehensive, member id: ${memberId}) in [C] memberComprehensive`);
        }
        const { nickname: memberName, status: memberStatus } = memberComprehensiveQueryResult;
        if (0 > memberStatus) {
            res.status(403).send('Method not allowed due to member suspended or deactivated');
            await atlasDbClient.close();
            return;
        }

        //// Verify post status ////
        const postComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IPostComprehensive>('post');
        const postComprehensiveQueryResult = await postComprehensiveCollectionClient.findOne({ postId });
        if (null === postComprehensiveQueryResult) {
            res.status(404).send('Post not found');
            await atlasDbClient.close();
            return;
        }
        const { memberId: authorId, title, channelId, topicIdsArr, status: postStatus } = postComprehensiveQueryResult;
        if (0 > postStatus) {
            res.status(403).send('Method not allowed due to post deleted');
            await atlasDbClient.close();
            return;
        }

        //// Verify member status ////
        const authorComprehensiveQueryResult = await memberComprehensiveCollectionClient.findOne({ memberId: authorId });
        if (null === authorComprehensiveQueryResult) {
            throw new Error(`Member attempt to saving or undo saving a post but the post author has no document (of IMemberComprehensive, member (author) id: ${memberId}) in [C] memberComprehensive`);
        }
        const { nickname: authorName, status: authorStatus } = authorComprehensiveQueryResult;
        if (0 > authorStatus) {
            res.status(403).send('Method not allowed due to author suspended or deactivated');
            await atlasDbClient.close();
            return;
        }

        let isSaved: boolean;
        // Step #1.1 look up record (of IMemberPostMapping) in [RL] SavedMapping
        const savedMappingTableClient = AzureTableClient('SavedMapping');
        const savedMappingQuery = savedMappingTableClient.listEntities({ queryOptions: { filter: `PartitionKey eq '${memberId}' and RowKey eq '${postId}'` } });
        //// [!] attemp to reterieve entity makes the probability of causing RestError ////
        const savedMappingQueryResult = await savedMappingQuery.next();
        // Step #1.2 verify if post has been saved
        if (!savedMappingQueryResult.value) {
            // Case [Save]
            isSaved = false;
        } else {
            // Case [Depends]
            isSaved = !!savedMappingQueryResult.value?.IsActive;
        }

        //// GET | verify if saved ////
        if ('GET' === method) {

            //// Response 200 ////
            res.status(200).send(isSaved);
            await atlasDbClient.close();
            return;
        }

        const memberStatisticsCollectionClient = atlasDbClient.db('statistics').collection<IMemberStatistics>('member');

        //// POST | do save or undo save ////
        if (isSaved) {
            // Case [Undo save]
            // Step #2A.1 update record (of IMemberPostMapping) in [C] SavedMapping
            await savedMappingTableClient.upsertEntity({
                partitionKey: memberId,
                rowKey: postId,
                IsActive: false
            }, 'Merge');

            //// Response 200 ////
            res.status(200).send(`Undo save post success`);

            // Step #2A.2 update totalUndoSavedCount (of IMemberStatistics) in [C] memberStatistics
            const memberStatisticsUpdateResult = await memberStatisticsCollectionClient.updateOne({ memberId }, { $inc: { totalUndoSavedCount: 1 } });
            if (!memberStatisticsUpdateResult.acknowledged) {
                logWithDate(`Failed to update totalUndoSavedCount (of IMemberStatistics, member id: ${memberId}) in [C] memberStatistics`, fname);
            }
            // Step #2A.3 update totalCreationUndoSavedCount (of IMemberStatistics) in [C] memberStatistics (post author)
            const authorStatisticsUpdateResult = await memberStatisticsCollectionClient.updateOne({ memberId: authorId }, { $inc: { totalCreationUndoSavedCount: 1 } });
            if (!authorStatisticsUpdateResult.acknowledged) {
                logWithDate(`Failed to update totalCreationUndoSavedCount (of IMemberStatistics, member id: ${authorId}) in [C] memberStatistics`, fname);
            }
            // Step #A2.4 update totalUndoSavedCount (of IPostComprehensive) in [C] postComprehensive
            const postComprehensiveUpdateResult = await postComprehensiveCollectionClient.updateOne({ postId }, { $inc: { totalUndoSavedCount: 1 } });
            if (!postComprehensiveUpdateResult.acknowledged) {
                logWithDate(`Failed to update totalUndoSavedCount (of IPostComprehensive, post id: ${postId}) in [C] postComprehensive`, fname);
            }
            // Step #2A.5 update totalUndoSavedCount (of IChannelStatistics) in [C] channelStatistics
            const channelStatisticsCollectionClient = atlasDbClient.db('statistics').collection<IChannelStatistics>('channel');
            const channelStatisticsUpdateResult = await channelStatisticsCollectionClient.updateOne({ channelId }, { $inc: { totalUndoSavedCount: 1 } });
            if (!channelStatisticsUpdateResult.acknowledged) {
                logWithDate(`Failed to update totalUndoSavedCount (of IChannelStatistics, channel id: ${channelId}) in [C] channelStatistics`, fname);
            }
            // Step #2A.6 (cond.) update totalUndoSavedCount (of ITopicComprehensive) in [C] topicComprehensive
            if (Array.isArray(topicIdsArr) && topicIdsArr.length !== 0) {
                const topicComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<ITopicComprehensive>('topic');
                for await (const topicId of topicIdsArr) {
                    const topicComprehensiveUpdateResult = await topicComprehensiveCollectionClient.updateOne({ topicId }, { $inc: { totalUndoSavedCount: 1 } });
                    if (!topicComprehensiveUpdateResult.acknowledged) {
                        logWithDate(`Failed to update totalUndoSavedCount (of ITopicComprehensive, topic id: ${topicId}) in [C] topicComprehensive`, fname);
                    }
                }
            }
        } else {
            // Case [Do save]
            // Step #2B.1 update record (of IMemberPostMapping) in [C] SavedMapping
            await savedMappingTableClient.upsertEntity<IMemberPostMapping>({
                partitionKey: memberId,
                rowKey: postId,
                Nickname: authorName,
                Title: title,
                CreatedTimeBySecond: Math.floor(new Date().getTime() / 1000),
                IsActive: true
            }, 'Replace');

            //// Response 200 ////
            res.status(200).send(`Save post success`);

            // Step #2B.2 update totalSavedCount (of IMemberStatistics) in [C] memberStatistics
            const memberStatisticsUpdateResult = await memberStatisticsCollectionClient.updateOne({ memberId }, { $inc: { totalSavedCount: 1 } });
            if (!memberStatisticsUpdateResult.acknowledged) {
                logWithDate(`Failed to update total totalSavedCount (of IMemberStatistics, member id: ${memberId}) in [C] memberStatistics`, fname);
            }
            // Step #2B.3 update totalCreationSavedCount (of IMemberStatistics) in [C] memberStatistics (post author)
            const authorStatisticsUpdateResult = await memberStatisticsCollectionClient.updateOne({ memberId: authorId }, { $inc: { totalCreationSavedCount: 1 } });
            if (!authorStatisticsUpdateResult.acknowledged) {
                logWithDate(`Failed to update total totalCreationLikedCount (of IMemberStatistics, member id: ${authorId}) in [C] memberStatistics`, fname);
            }
            // Step #2B.4 update totalSavedCount (of IPostComprehensive) in [C] postComprehensive
            const postComprehensiveUpdateResult = await postComprehensiveCollectionClient.updateOne({ postId }, { $inc: { totalSavedCount: 1 } });
            if (!postComprehensiveUpdateResult.acknowledged) {
                logWithDate(`Failed to update totalSavedCount (of IPostComprehensive, post id: ${postId}) in [C] postComprehensive`, fname);
            }
            // Step #2B.5 update totalSavedCount (of IChannelStatistics) in [C] channelStatistics
            const channelStatisticsCollectionClient = atlasDbClient.db('statistics').collection<IChannelStatistics>('channel');
            const channelStatisticsUpdateResult = await channelStatisticsCollectionClient.updateOne({ channelId }, { $inc: { totalSavedCount: 1 } });
            if (!channelStatisticsUpdateResult.acknowledged) {
                logWithDate(`Failed to update totalSavedCount (of IChannelStatistics, channel id: ${channelId}) in [C] channelStatistics`, fname);
            }
            // Step #2B.6 (cond.) update totalSavedCount (of ITopicComprehensive) in [C] topicComprehensive
            if (Array.isArray(topicIdsArr) && topicIdsArr.length !== 0) {
                const topicComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<ITopicComprehensive>('topic');
                for await (const topicId of topicIdsArr) {
                    const topicComprehensiveUpdateResult = await topicComprehensiveCollectionClient.updateOne({ topicId }, { $inc: { totalSavedCount: 1 } });
                    if (!topicComprehensiveUpdateResult.acknowledged) {
                        logWithDate(`Failed to update totalSavedCount (of ITopicComprehensive, topic id: ${topicId}) in [C] topicComprehensive`, fname);
                    }
                }
            }

            //// Handle notice.save (cond.) ////
            if (memberId !== authorId) {
                // Step #2B.7 (cond.) look up record (of IMemberMemberMapping) in [RL] BlockingMemberMapping
                const blockingMemberMappingTableClient = AzureTableClient('BlockingMemberMapping');
                const blockingMemberMappingQuery = blockingMemberMappingTableClient.listEntities<IMemberMemberMapping>({ queryOptions: { filter: `PartitionKey eq '${authorId}' and RowKey eq '${memberId}'` } });
                //// [!] attemp to reterieve entity makes the probability of causing RestError ////
                const blockingMemberMappingQueryResult = await blockingMemberMappingQuery.next();
                if (!blockingMemberMappingQueryResult.value) {
                    //// [!] member saved post has not been blocked by post author ////
                    // Step #2B.8 upsert record (of INoticeInfo.Save) in [PRL] Notice
                    const noticeTableClient = AzureTableClient('Notice');
                    await noticeTableClient.upsertEntity<INoticeInfo>({
                        partitionKey: authorId, // notified member id, in this case, post author
                        rowKey: createNoticeId('save', memberId, postId), // combined id
                        Category: 'save',
                        InitiateId: memberId,
                        Nickname: memberName,
                        PostTitle: title,
                        CommentBrief: '', // [!] comment brief is not supplied in this case
                        CreatedTimeBySecond: Math.floor(new Date().getTime() / 1000),
                        IsActive: true
                    }, 'Replace');
                    // Step #B2.9 update save (of INotificationStatistics, of the post author) in [C] notificationStatistics
                    const notificationStatisticsCollectionClient = atlasDbClient.db('statistics').collection<INotificationStatistics>('notification');
                    const notificationStatisticsUpdateResult = await notificationStatisticsCollectionClient.updateOne({ memberId: authorId }, { $inc: { save: 1 } });
                    if (!notificationStatisticsUpdateResult.acknowledged) {
                        logWithDate(`Failed to update save (of INotificationStatistics, member id: ${authorId}) in [C] notificationStatistics`, fname);
                    }
                }
            }
        }
        await atlasDbClient.close();
        return;
    }
    catch (e: any) {
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