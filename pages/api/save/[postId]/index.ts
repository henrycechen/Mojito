import type { NextApiRequest, NextApiResponse } from 'next';
import { RestError } from '@azure/data-tables';
import { getToken } from "next-auth/jwt"
import { MongoError } from 'mongodb';

import AzureTableClient from '../../../../modules/AzureTableClient';
import AtlasDatabaseClient from "../../../../modules/AtlasDatabaseClient";

import { IMemberComprehensive, IMemberPostMapping, IMemberStatistics, INoticeInfo, INotificationStatistics, IChannelStatistics, ITopicComprehensive, IPostComprehensive } from '../../../../lib/interfaces';
import { verifyId, response405, response500, log, createNoticeId, getNicknameFromToken } from '../../../../lib/utils';

/** This interface accepts GET and POST method
 * Info required for POST request
 * - token: JWT
 * - postId: string
 */

export default async function SaveOrUndoSavePostById(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;
    if (!['GET', 'POST'].includes(method ?? '')) {
        response405(req, res);
        return;
    }
    
    // FIXME: test
    res.send(true);
    return

    
    //// Verify identity ////
    const token = await getToken({ req });
    if (!(token && token?.sub)) {
        res.status(400).send('Invalid identity');
        return;
    }
    //// Verify post id ////
    const { isValid, category, id: postId } = verifyId(req.query?.postId);
    //// Verify post id ////
    if (!(isValid && 'post' === category)) {
        res.status(400).send('Invalid post id');
        return;
    }
    //// Declare DB client ////
    const atlasDbClient = AtlasDatabaseClient();
    try {
        const { sub: memberId } = token;
        await atlasDbClient.connect()
        //// Verify member status ////
        const memberComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IMemberComprehensive>('member');
        const memberComprehensiveQueryResult = await memberComprehensiveCollectionClient.findOne({ memberId });
        if (null === memberComprehensiveQueryResult) {
            throw new Error(`Member attempt to saving or undo saving a post but have no document (of IMemberComprehensive, member id: ${memberId}) in [C] memberComprehensive`);
        }
        const { status: memberStatus } = memberComprehensiveQueryResult;
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
        const { status: postStatus } = postComprehensiveQueryResult;
        if (0 > postStatus) {
            res.status(403).send('Method not allowed due to post deleted');
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
            // Pending
            isSaved = !!savedMappingQueryResult.value?.IsActive;
        }
        //// GET | verify if saved ////
        if ('GET' === method) {
            res.status(200).send(isSaved);
            await atlasDbClient.close();
            return;
        }
        //// POST | save or undo save ////
        const memberStatisticsCollectionClient = atlasDbClient.db('statistics').collection<IMemberStatistics>('member');
        if (isSaved) {
            // Case [Undo save]
            // Step #2.1 update record (of IMemberPostMapping) in [C] SavedMapping
            await savedMappingTableClient.upsertEntity<IMemberPostMapping>({ partitionKey: memberId, rowKey: postId, IsActive: false }, 'Replace');
            res.status(200).send(`Undo save post success`);

            // Step #2.2 update totalUndoSavedCount (of IMemberStatistics) in [C] memberStatistics
            const memberStatisticsUpdateResult = await memberStatisticsCollectionClient.updateOne({ memberId }, { $inc: { totalUndoSavedCount: 1 } });
            if (!memberStatisticsUpdateResult.acknowledged) {
                log(`Failed to update totalUndoSavedCount (of IMemberStatistics, member id: ${memberId}) in [C] memberStatistics`);
            }
            // Step #2.3 update totalCreationUndoSavedCount (of IMemberStatistics) in [C] memberStatistics (post author)
            const { memberId: authorId } = postComprehensiveQueryResult;
            const authorStatisticsUpdateResult = await memberStatisticsCollectionClient.updateOne({ memberId: authorId }, { $inc: { totalCreationUndoSavedCount: 1 } });
            if (!authorStatisticsUpdateResult.acknowledged) {
                log(`Failed to update totalCreationUndoSavedCount (of IMemberStatistics, member id: ${authorId}) in [C] memberStatistics`);
            }
            // Step #2.4 update totalUndoSavedCount (of IPostComprehensive) in [C] postComprehensive
            const postComprehensiveUpdateResult = await postComprehensiveCollectionClient.updateOne({ postId }, { $inc: { totalUndoSavedCount: 1 } });
            if (!postComprehensiveUpdateResult.acknowledged) {
                log(`Failed to update totalUndoSavedCount (of IPostComprehensive, post id: ${postId}) in [C] postComprehensive`);
            }
            // Step #2.5 update totalUndoSavedCount (of IChannelStatistics) in [C] channelStatistics
            const { channelId } = postComprehensiveQueryResult;
            const channelStatisticsCollectionClient = atlasDbClient.db('statistics').collection<IChannelStatistics>('channel');
            const channelStatisticsUpdateResult = await channelStatisticsCollectionClient.updateOne({ channelId }, { $inc: { totalUndoSavedCount: 1 } });
            if (!channelStatisticsUpdateResult.acknowledged) {
                log(`Failed to update totalUndoSavedCount (of IChannelStatistics, channel id: ${channelId}) in [C] channelStatistics`);
            }
            // Step #2.6 (cond.) update totalUndoSavedCount (of ITopicComprehensive) in [C] topicComprehensive
            const { topicIdsArr } = postComprehensiveQueryResult;
            if (Array.isArray(topicIdsArr) && topicIdsArr.length !== 0) {
                const topicComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<ITopicComprehensive>('topic');
                for await (const topicId of topicIdsArr) {
                    const topicComprehensiveUpdateResult = await topicComprehensiveCollectionClient.updateOne({ topicId }, { $inc: { totalUndoSavedCount: 1 } });
                    if (!topicComprehensiveUpdateResult.acknowledged) {
                        log(`Failed to update totalUndoSavedCount (of ITopicComprehensive, topic id: ${topicId}) in [C] topicComprehensive`);
                    }
                }
            }
        } else {
            // Case [Save]
            // Step #2.1 update record (of IMemberPostMapping) in [C] SavedMapping
            await savedMappingTableClient.upsertEntity<IMemberPostMapping>({ partitionKey: memberId, rowKey: postId, IsActive: true }, 'Replace');
            res.status(200).send(`Save post success`);

            // Step #2.2 update totalSavedCount (of IMemberStatistics) in [C] memberStatistics
            const memberStatisticsUpdateResult = await memberStatisticsCollectionClient.updateOne({ memberId }, { $inc: { totalSavedCount: 1 } });
            if (!memberStatisticsUpdateResult.acknowledged) {
                log(`Failed to update total totalSavedCount (of IMemberStatistics, member id: ${memberId}) in [C] memberStatistics`);
            }
            // Step #2.3 update totalCreationSavedCount (of IMemberStatistics) in [C] memberStatistics (post author)
            const { memberId: authorId } = postComprehensiveQueryResult;
            const authorStatisticsUpdateResult = await memberStatisticsCollectionClient.updateOne({ memberId: authorId }, { $inc: { totalCreationSavedCount: 1 } });
            if (!authorStatisticsUpdateResult.acknowledged) {
                log(`Failed to update total totalCreationLikedCount (of IMemberStatistics, member id: ${authorId}) in [C] memberStatistics`);
            }
            // Step #2.4 update totalSavedCount (of IPostComprehensive) in [C] postComprehensive
            const postComprehensiveUpdateResult = await postComprehensiveCollectionClient.updateOne({ postId }, { $inc: { totalSavedCount: 1 } });
            if (!postComprehensiveUpdateResult.acknowledged) {
                log(`Failed to update totalSavedCount (of IPostComprehensive, post id: ${postId}) in [C] postComprehensive`);
            }
            // Step #2.5 update totalSavedCount (of IChannelStatistics) in [C] channelStatistics
            const { channelId } = postComprehensiveQueryResult;
            const channelStatisticsCollectionClient = atlasDbClient.db('statistics').collection<IChannelStatistics>('channel');
            const channelStatisticsUpdateResult = await channelStatisticsCollectionClient.updateOne({ channelId }, { $inc: { totalSavedCount: 1 } });
            if (!channelStatisticsUpdateResult.acknowledged) {
                log(`Failed to update totalSavedCount (of IChannelStatistics, channel id: ${channelId}) in [C] channelStatistics`);
            }
            // Step #2.6 (cond.) update totalSavedCount (of ITopicComprehensive) in [C] topicComprehensive
            const { topicIdsArr } = postComprehensiveQueryResult;
            if (Array.isArray(topicIdsArr) && topicIdsArr.length !== 0) {
                const topicComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<ITopicComprehensive>('topic');
                for await (const topicId of topicIdsArr) {
                    const topicComprehensiveUpdateResult = await topicComprehensiveCollectionClient.updateOne({ topicId }, { $inc: { totalSavedCount: 1 } });
                    if (!topicComprehensiveUpdateResult.acknowledged) {
                        log(`Failed to update totalSavedCount (of ITopicComprehensive, topic id: ${topicId}) in [C] topicComprehensive`);
                    }
                }
            }
            //// Handle notice.save (cond.) ////
            if (memberId !== authorId) {
                // Step #2.3 (cond.) look up record (of IMemberMemberMapping) in [RL] BlockingMemberMapping
                const blockingMemberMappingTableClient = AzureTableClient('BlockingMemberMapping');
                const blockingMemberMappingQuery = blockingMemberMappingTableClient.listEntities({ queryOptions: { filter: `PartitionKey eq '${authorId}' and RowKey eq '${memberId}'` } });
                //// [!] attemp to reterieve entity makes the probability of causing RestError ////
                const blockingMemberMappingQueryResult = await blockingMemberMappingQuery.next();
                if (!blockingMemberMappingQueryResult.value) {
                    //// [!] member saved post has not been blocked by post author ////
                    // Step #2.4 upsert record (of INoticeInfo.Save) in [PRL] Notice
                    const noticeTableClient = AzureTableClient('Notice');
                    await noticeTableClient.upsertEntity<INoticeInfo>({
                        partitionKey: authorId, // notified member id, in this case, member having been followed by
                        rowKey: createNoticeId('save', memberId, postId), // combined id
                        Category: 'save',
                        InitiateId: memberId,
                        Nickname: getNicknameFromToken(token)
                    }, 'Replace');
                    // Step #5 update save (of INotificationStatistics, of the post author) in [C] notificationStatistics
                    const notificationStatisticsCollectionClient = atlasDbClient.db('statistics').collection<INotificationStatistics>('notification');
                    const notificationStatisticsUpdateResult = await notificationStatisticsCollectionClient.updateOne({ memberId: authorId }, { $inc: { save: 1 } });
                    if (!notificationStatisticsUpdateResult.acknowledged) {
                        log(`Failed to update save (of INotificationStatistics, member id: ${authorId}) in [C] notificationStatistics`);
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
            msg = 'Attempt to communicate with azure table storage.';
        } else if (e instanceof MongoError) {
            msg = 'Attempt to communicate with atlas mongodb.';
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