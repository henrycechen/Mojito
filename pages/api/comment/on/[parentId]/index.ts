import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt'
import { RestError } from '@azure/data-tables';
import { MongoError } from 'mongodb';

import AzureTableClient from '../../../../../modules/AzureTableClient';
import AtlasDatabaseClient from "../../../../../modules/AtlasDatabaseClient";

import { response405, response500, logWithDate, getContentBrief } from '../../../../../lib/utils/general';
import { createId, createNoticeId } from '../../../../../lib/utils/create';
import { verifyId } from '../../../../../lib/utils/verify';
import { IMemberComprehensive, IMemberStatistics } from '../../../../../lib/interfaces/member';
import { ICommentComprehensive } from '../../../../../lib/interfaces/comment';
import { IPostComprehensive } from '../../../../../lib/interfaces/post';
import { IChannelStatistics } from '../../../../../lib/interfaces/channel';
import { ITopicComprehensive } from '../../../../../lib/interfaces/topic';
import { INoticeInfo, INotificationStatistics } from '../../../../../lib/interfaces/notification';
import { getNicknameFromToken } from '../../../../../lib/utils/for/member';
import { createCommentComprehensive } from '../../../../../lib/utils/for/comment';


const fname = CreateCommentOnParentById.name;

/** CreateCommentOnParentById v0.1.1 FIXME: test mode
 * 
 * Last update: 21/02/2023
 * 
 * This interface accepts POST requests
 * 
 * Info required for POST requests
 * - token: JWT (cookie)
 * - parentId: string (query)
 * - postId: string (body)
 * - content: string (body)
 * - cuedMemberInfoArr: IConciseMemberInfo[] (body, optional)
 * 
 */

export default async function CreateCommentOnParentById(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;
    if ('POST' !== method) {
        response405(req, res);
        return;
    }

    const pId = req.query?.parentId ?? '';
    if ('P' === pId.slice(0, 1)) {
        res.send(createId('comment'))
    } else {
        res.send(createId('subcomment'))
    }
    return;

    const { isValid, category, id: parentId } = verifyId(req.query?.parentId);
    if (!isValid) {
        res.status(400).send('Invalid parent id');
        return;
    }
    //// Verify identity ////
    const token = await getToken({ req });
    if (!(token && token?.sub)) {
        res.status(400).send('Invalid identity');
        return;
    }
    //// Verify parent id category ////
    if (!['post', 'comment'].includes(category)) {
        res.status(400).send('Invalid parent id category');
        return;
    }
    //// Verify content ////
    const { content } = req.body;
    if (!('string' === content && '' !== content)) {
        res.status(400).send('Improper or blank content');
        return;
    }
    //// Declare DB client ////
    const atlasDbClient = AtlasDatabaseClient();
    try {
        const { sub: memberId } = token;
        await atlasDbClient.connect();
        // Step #1.1 look up document (of IMemberComprehensive) in [C] memberComprehensive
        const memberComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IMemberComprehensive>('member');
        const memberComprehensiveQueryResult = await memberComprehensiveCollectionClient.findOne({ memberId });
        if (null === memberComprehensiveQueryResult) {
            throw new Error(`Member Attempt to creating comment but have no document (of IMemberComprehensive, member id: ${memberId}) in [C] memberComprehensive`);
        }
        // Step #1.2 verify member status (of IMemberComprehensive)
        const { status: memberStatus, allowCommenting } = memberComprehensiveQueryResult;
        if (!(0 < memberStatus && allowCommenting)) {
            res.status(403).send('Method not allowed due to member suspended or deactivated');
            await atlasDbClient.close();
            return;
        }
        // Step #1.3 declare post id
        let postId = parentId;
        // Step #1.4 declare notified member id
        let notifiedMemberId = '';
        // Step #2 verify status
        const commentComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<ICommentComprehensive>('comment');
        if ('comment' === category) {
            // Step #2.3 (cond.) look up document (of IPostComprehensive) in [C] postComprehensive
            const commentComprehensiveQueryResult = await commentComprehensiveCollectionClient.findOne({ commentId: parentId });
            if (null === commentComprehensiveQueryResult) {
                res.status(404).send('Comment not found');
                await atlasDbClient.close();
                return;
            }
            // Step #2.4 (cond.) verify comment status (of IPostComprehensive)
            const { status: commentStatus } = commentComprehensiveQueryResult;
            if (0 > commentStatus) {
                res.status(403).send('Method not allowed due to comment deleted');
                await atlasDbClient.close();
                return;
            }
            // Step #2.5 (cond.) make parent id (of parent comment) the post id
            postId = commentComprehensiveQueryResult.parentId;
            // Step #2.6 (cond.) make member id (of parent comment author) of the notified member id
            notifiedMemberId = commentComprehensiveQueryResult.memberId;
        }
        // Step #2.1 look up document (of IPostComprehensive) in [C] postComprehensive
        const postComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IPostComprehensive>('post');
        const postComprehensiveQueryResult = await postComprehensiveCollectionClient.findOne({ postId });
        if (null === postComprehensiveQueryResult) {
            res.status(404).send('Post not found');
            await atlasDbClient.close();
            return;
        }
        // Step #2.2 verify post status (of IPostComprehensive)
        const { status: postStatus } = postComprehensiveQueryResult;
        if (0 > postStatus) {
            res.status(403).send('Method not allowed due to post deleted');
            await atlasDbClient.close();
            return;
        }
        // Step #2.7 (cond.) make member id (of post author) of the notified member id
        if ('post' === category) {
            notifiedMemberId = postComprehensiveQueryResult.memberId;
        }
        // Step #3.1 create a new comment id
        const commentId = createId('post' === category ? 'comment' : 'subcomment');
        // Step #3.2 insert a new document (of ICommentComprehensive) in [C] commentComprehensive
        const commentComprehensiveInsertResult = await commentComprehensiveCollectionClient.insertOne(createCommentComprehensive(commentId, parentId, postId, memberId, content, req.body?.cuedMemberInfoArr));
        if (!commentComprehensiveInsertResult.acknowledged) {
            throw new Error(`Failed to insert document (of ICommentComprehensive, member id: ${memberId}, parent id: ${parentId}, post id: ${postId}) in [C] commentComprehensive`);
        }
        res.status(200).send(commentId);
        //// Update statistics ////
        // Step #5.1 update totalCommentCount (of IMemberStatistics) in [C] memberStatistics
        const memberStatisticsCollectionClient = atlasDbClient.db('statistics').collection<IMemberStatistics>('member');
        const memberStatisticsUpdateResult = await memberStatisticsCollectionClient.updateOne({ memberId }, {
            $inc: {
                totalCommentCount: 1
            }
        });
        if (!memberStatisticsUpdateResult.acknowledged) {
            logWithDate(`Document (ICommentComprehensive, comment id: ${commentId}) inserted in [C] commentComprehensive successfully but failed to update totalCommentCount (of IMemberStatistics, member id: ${memberId}) in [C] memberStatistics`, fname);
        }
        // Step #5.2 (cond.) totalSubcommentCount (of ICommentComprehensive) in [C] commentComprehensive (parent comment)
        if ('C' === commentId.slice(0, 1)) {
            const commentComprehensiveUpdateResult = await commentComprehensiveCollectionClient.updateOne({ commentId: parentId }, {
                $inc: {
                    totalSubcommentCount: 1
                }
            });
            if (!commentComprehensiveUpdateResult.acknowledged) {
                logWithDate(`Document (ICommentComprehensive, comment id: ${commentId}) was inserted in [C] commentComprehensive successfully but failed to update totalSubcommentCount (of ICommentComprehensive, comment id: ${parentId}) in [C] commentComprehensive`, fname);
            }
        }
        // Step #5.3 update totalCommentCount (of IPostComprehensive) in [C] postComprehensive
        const postComprehensiveUpdateResult = await postComprehensiveCollectionClient.updateOne({ postId }, {
            $inc: {
                totalCommentCount: 1
            }
        });
        if (!postComprehensiveUpdateResult.acknowledged) {
            logWithDate(`Document (ICommentComprehensive, comment id: ${commentId}) was inserted in [C] commentComprehensive successfully but failed to update totalCommentCount (of IPostComprehensive, post id: ${postId}) in [C] postComprehensive`, fname);
        }
        // Step #5.4 update total comment count (of IChannelStatistics) in [C] channelStatistics
        const { channelId } = postComprehensiveQueryResult;
        const channelStatisticsCollectionClient = atlasDbClient.db('statistics').collection<IChannelStatistics>('channel');
        const channelStatisticsUpdateResult = await channelStatisticsCollectionClient.updateOne({ channelId }, {
            $inc: {
                totalCommentCount: 1
            }
        });
        if (!channelStatisticsUpdateResult.acknowledged) {
            logWithDate(`Document (ICommentComprehensive, comment id: ${commentId}) inserted in [C] commentComprehensive successfully but failed to update totalCommentCount (of IChannelStatistics, channel id: ${channelId}) in [C] channelStatistics`, fname);
        }
        // Step #5.5 (cond.) update totalCommentCount (of ITopicComprehensive) in [C] topicComprehensive
        const { topicIdsArr } = postComprehensiveQueryResult;
        if (Array.isArray(topicIdsArr) && topicIdsArr.length !== 0) {
            const topicComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<ITopicComprehensive>('topic');
            for await (const topicId of topicIdsArr) {
                const topicComprehensiveUpdateResult = await topicComprehensiveCollectionClient.updateOne({ topicId }, {
                    $inc: {
                        totalCommentCount: 1
                    }
                });
                if (!topicComprehensiveUpdateResult.acknowledged) {
                    logWithDate(`Document (ICommentComprehensive, comment id: ${commentId}) inserted in [C] commentComprehensive successfully but failed to update totalCommentCount (of ITopicComprehensive, topic id: ${topicId}) in [C] topicComprehensive`, fname);
                }
            }
        }
        if (memberId !== notifiedMemberId) {
            //// Handle reply (cond.) ////
            const { title } = postComprehensiveQueryResult;
            // Step #6.1 look up record (of IMemberMemberMapping) in [RL] BlockingMemberMapping
            const blockingMemberMappingTableClient = AzureTableClient('BlockingMemberMapping');
            const blockingMemberMappingQuery = blockingMemberMappingTableClient.listEntities({ queryOptions: { filter: `PartitionKey eq '${notifiedMemberId}' and RowKey eq '${memberId}'` } });
            //// [!] attemp to reterieve entity makes the probability of causing RestError ////
            const blockingMemberMappingQueryResult = await blockingMemberMappingQuery.next();
            if (!blockingMemberMappingQueryResult.value) {
                //// [!] comment author has not been blocked by post / comment author ////
                // Step #6.2 upsert record (INoticeInfo.Replied) in [PRL] Notice
                const noticeTableClient = AzureTableClient('Notice');
                const a = await noticeTableClient.upsertEntity<INoticeInfo>({
                    partitionKey: notifiedMemberId,
                    rowKey: createNoticeId('reply', memberId, postId, commentId),
                    Category: 'reply',
                    InitiateId: memberId,
                    Nickname: getNicknameFromToken(token),
                    PostTitle: title,
                    CommentBrief: getContentBrief(content)
                }, 'Replace');
             
                // Step #6.3 update reply (INotificationStatistics) (of post author) in [C] notificationStatistics
                const notificationStatisticsCollectionClient = atlasDbClient.db('statistics').collection<INotificationStatistics>('notification');
                const notificationStatisticsUpdateResult = await notificationStatisticsCollectionClient.updateOne({ memberId: notifiedMemberId }, { $inc: { reply: 1 } });
                if (!notificationStatisticsUpdateResult.acknowledged) {
                    logWithDate(`Document (ICommentComprehensive, comment id: ${commentId}) inserted in [C] commentComprehensive successfully but failed to reply (of INotificationStatistics, member id: ${notifiedMemberId}) in [C] notificationStatistics`, fname);
                }
            }
            //// Handle notice.cue (cond.) ////
            // Step #7.1 verify cued member ids array
            const { cuedMemberInfoArr } = req.body;
            if (Array.isArray(cuedMemberInfoArr) && cuedMemberInfoArr.length !== 0) {
                const notificationStatisticsCollectionClient = atlasDbClient.db('statistics').collection<INotificationStatistics>('notification');
                // Step #7.2 maximum 9 members are allowed to cued at one time (in one comment)
                const cuedMemberInfoArrSliced = cuedMemberInfoArr.slice(0, 9);
                for await (const cuedMemberInfo of cuedMemberInfoArrSliced) {
                    const { memberId: memberId_cued } = cuedMemberInfo;
                    // look up record (of IMemberMemberMapping) in [RL] BlockingMemberMapping
                    const _blockingMemberMappingQuery = blockingMemberMappingTableClient.listEntities({ queryOptions: { filter: `PartitionKey eq '${memberId_cued}' and RowKey eq '${memberId}'` } });
                    //// [!] attemp to reterieve entity makes the probability of causing RestError ////
                    const _blockingMemberMappingQueryResult = await _blockingMemberMappingQuery.next();
                    if (!_blockingMemberMappingQueryResult.value) {
                        //// [!] comment author has not been blocked by cued member ////
                        // Step #7.3 upsert record (of INoticeInfo.Cued) in [PRL] Notice
                        const noticeTableClient = AzureTableClient('Notice');
                        noticeTableClient.upsertEntity<INoticeInfo>({
                            partitionKey: memberId_cued,
                            rowKey: createNoticeId('cue', memberId, postId, commentId), // entity id
                            Category: 'cue',
                            InitiateId: memberId,
                            Nickname: getNicknameFromToken(token),
                            PostTitle: title,
                            CommentBrief: getContentBrief(content)
                        }, 'Replace');
                        // Step #7.4 update cued count (INotificationStatistics) (of cued member) in [C] notificationStatistics
                        const notificationStatisticsUpdateResult = await notificationStatisticsCollectionClient.updateOne({ memberId: memberId_cued }, { $inc: { cue: 1 } });
                        if (!notificationStatisticsUpdateResult.acknowledged) {
                            logWithDate(`Document (ICommentComprehensive, comment id: ${commentId}) inserted in [C] commentComprehensive successfully but failed to update cuedCount (of INotificationStatistics, member id: ${memberId_cued}) in [C] notificationStatistics`, fname);
                        }
                    }
                }
            }
        }
        await atlasDbClient.close();
        return;
    } catch (e: any) {
        let msg;
        if (e instanceof SyntaxError) {
            res.status(400).send('Improperly normalized request info');
            return;
        } else if (e instanceof RestError) {
            msg = 'Attempt to communicating with azure table storage.';
        } else if (e instanceof MongoError) {
            msg = 'Attempt to communicating with atlas mongodb.';
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