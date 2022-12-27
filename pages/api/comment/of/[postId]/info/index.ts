import type { NextApiRequest, NextApiResponse } from 'next';
import { RestError } from '@azure/data-tables';
import { MongoError } from 'mongodb';
import { getToken } from 'next-auth/jwt';

import AzureTableClient from '../../../../../../modules/AzureTableClient';
import AtlasDatabaseClient from '../../../../../../modules/AtlasDatabaseClient';

import { INoticeInfo, INotificationStatistics, IMemberStatistics, ICommentComprehensive, IChannelStatistics, ITopicComprehensive, IPostComprehensive, } from '../../../../../../lib/interfaces';
import { MemberInfo } from '../../../../../../lib/types';
import { getRandomIdStrL, getNicknameFromToken, getContentBrief, verifyId, response405, response500, log, } from '../../../../../../lib/utils';

// This interface only accepts POST (create comment) method
// Use 'api/comment/of/[postId]/info/[commentId]' to GET comment info
//
// Info required:
// content: string;
// cuedMemberIdsArr: string[] | undefined;
//
export default async function CreateComment(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;
    if ('POST' !== method) {
        response405(req, res);
        return;
    }
    //// Verify identity ////
    const token = await getToken({ req });
    if (!(token && token?.sub)) {
        // called by member him/herself
        res.status(400).send('Invalid identity');
        return;
    }
    //// Verify post id ////
    const { postId } = req.query;
    if (!('string' === typeof postId && verifyId(postId, 10))) {
        res.status(400).send('Invalid post id');
        return;
    }
    //// Verify comment content ////
    const { content } = req.body;
    if (!('string' === content && '' !== content)) {
        res.status(400).send('Improper comment content');
        return;
    }
    //// Declare DB client ////
    const atlasDbClient = AtlasDatabaseClient();
    try {
        atlasDbClient.connect();

        //// Check member status ////


        // Step #1.1 prepare member id (of comment author)
        const { sub: memberId } = token;
        // Step #1.2 look up member status (IMemberComprehensive) in [C] memberComprehensive
        const memberComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IMemberStatistics>('member');
        const memberComprehensiveQueryResult = await memberComprehensiveCollectionClient.findOne<IMemberStatistics>({ memberId });
        if (null === memberComprehensiveQueryResult) {
            res.status(500).send('Member not found');
            log(`Member was tring creating comment (member id: ${memberId}) but have no document (of IMemberComprehensive) in [C] memberComprehensive`);
            return;
        }
        const { status: memberStatus, allowCommenting } = memberComprehensiveQueryResult;
        if (!(0 < memberStatus && allowCommenting)) {
            res.status(403).send('Creating comments is not allowed for this member');
            return;
        }

        //// Check post status ////


        // Step #2 look up post id (IPostComprehensive) in [C] postComprehensive
        const postComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IPostComprehensive>('post');
        const postComprehensiveQueryResult = await postComprehensiveCollectionClient.findOne<IPostComprehensive>({ postId });
        if (null === postComprehensiveQueryResult) {
            res.status(404).send('post not found');
            return;
        }
        const { status: postStatus } = postComprehensiveQueryResult;
        if (0 > postStatus) {
            res.status(403).send('Commenting is not allowed for this post');
            return;
        }

        //// Create comment ////

        // Step #3.1 create a new comment id
        const commentId = getRandomIdStrL(true);
        // Step #3.2 insert document (of ICommentComprehensive) in [C] commentComprehensive
        const commentComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<ICommentComprehensive>('comment');
        const commentComprehensiveInsertResult = await commentComprehensiveCollectionClient.insertOne({
            postId,
            commentId,
            memberId,
            createdTime: new Date().getTime(),
            content, // required
            edited: null,
            status: 200,
            totalLikedCount: 0,
            totalDislikedCount: 0,
            totalSubcommentCount: 0
        });
        if (!commentComprehensiveInsertResult.acknowledged) {
            log(`Failed to insert document (of ICommentComprehensive, member id: ${memberId}) in [C] postComprehensive`);
            res.status(500).send('Failed to create comment');
            return;
        } else {
            res.status(200).send(commentId);
        }

        //// Update statistics ////

        // Step #3.1 update total comment count (IMemberStatistics) in [C] memberStatistics
        const memberStatisticsCollectionClient = atlasDbClient.db('statistics').collection<IMemberStatistics>('member');
        const memberStatisticsUpdateResult = await memberStatisticsCollectionClient.updateOne({ memberId }, {
            $inc: {
                totalCommentCount: 1
            }
        });
        if (!memberStatisticsUpdateResult.acknowledged) {
            log(`Document (ICommentComprehensive, comment id: ${commentId}) inserted in [C] commentComprehensive successfully but failed to update totalCommentCount (of IMemberStatistics, member id: ${memberId}) in [C] memberStatistics`);
        }
        // Step #3.2 update total comment count (IPostComprehensive) in [C] postComprehensive
        const postComprehensiveUpdateResult = await postComprehensiveCollectionClient.updateOne({ postId }, {
            $inc: {
                totalCommentCount: 1
            }
        });
        if (!postComprehensiveUpdateResult.acknowledged) {
            log(`Document (ICommentComprehensive, comment id: ${commentId}) was inserted in [C] commentComprehensive successfully but failed to update totalCommentCount (of IPostComprehensive, post id: ${postId}, member id: ${memberId}) in [C] postComprehensive`);
        }
        // Step #3.3 update total comment count (IChannelStatistics) in [C] channelStatistics
        const { channelId } = postComprehensiveQueryResult;
        const channelStatisticsCollectionClient = atlasDbClient.db('statistics').collection<IChannelStatistics>('channel');
        const channelStatisticsUpdateResult = await channelStatisticsCollectionClient.updateOne({ channelId }, {
            $inc: {
                totalCommentCount: 1
            }
        });
        if (!channelStatisticsUpdateResult.acknowledged) {
            log(`Document (ICommentComprehensive, comment id: ${commentId}) inserted in [C] commentComprehensive successfully but failed to update totalCommentCount (of IChannelStatistics, channel id: ${channelId}) in [C] channelStatistics`);
        }
        // Step #3.4 (cond.) update total comment count (ITopicComprehensive) in [C] topicComprehensive
        const { topicIdsArr } = postComprehensiveQueryResult;
        if (Array.isArray(topicIdsArr) && topicIdsArr.length !== 0) {
            const topicComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<ITopicComprehensive>('topic');
            for await (const topicId of topicIdsArr) {
                const topicComprehensiveUpdateResult = await topicComprehensiveCollectionClient.updateOne({ postId }, {
                    $inc: {
                        totalCommentCount: 1
                    }
                });
                if (!topicComprehensiveUpdateResult.acknowledged) {
                    log(`Document (ICommentComprehensive, comment id: ${commentId}) inserted in [C] commentComprehensive successfully but failed to update totalCommentCount (of ITopicComprehensive, topic id: ${topicId}) in [C] topicComprehensive`);
                }
            }
        }

        //// Handle reply ////

        const { title } = postComprehensiveQueryResult;
        // Step #4.1 look up member id (IMemberMapping) in [RL] BlockingMemberMapping
        const { memberId: memberId_post } = postComprehensiveQueryResult;
        const blockingMemberMappingTableClient = AzureTableClient('BlockingMemberMapping');
        const blockingMemberMappingQuery = blockingMemberMappingTableClient.listEntities({ queryOptions: { filter: `PartitionKey eq '${memberId_post}' and RowKey eq '${memberId}'` } });
        //// [!] attemp to reterieve entity makes the probability of causing RestError ////
        const blockingMemberMappingQueryResult = await blockingMemberMappingQuery.next();
        if (!blockingMemberMappingQueryResult.value) {
            //// [!] comment author has not been blocked by post author ////
            const noticeId = getRandomIdStrL(true);
            // Step #4.2 upsert record (INoticeInfo.Replied) in [PRL] Notice
            const noticeTableClient = AzureTableClient('Notice');
            await noticeTableClient.upsertEntity<INoticeInfo>({
                partitionKey: memberId_post,
                rowKey: noticeId,
                Category: 'Replied',
                InitiateId: memberId,
                Nickname: getNicknameFromToken(token),
                PostId: postId,
                PostTitle: title,
                CommentId: commentId,
                CommentBrief: getContentBrief(content)
            }, 'Replace');
            // Step #4.3 update document (INotificationStatistics) (of post author) in [C] notificationStatistics
            const notificationStatisticsCollectionClient = atlasDbClient.db('statistics').collection<INotificationStatistics>('notification');
            const notificationStatisticsUpdateResult = await notificationStatisticsCollectionClient.updateOne({ memberId: memberId_post }, {
                $inc: {
                    repliedCount: 1
                }
            });
            if (!notificationStatisticsUpdateResult.acknowledged) {
                log(`Document (ICommentComprehensive, comment id: ${commentId}) inserted in [C] commentComprehensive successfully but failed to update repliedCount (of INotificationStatistics, member id: ${memberId_post}) in [C] notificationStatistics`);
            }
        }

        //// Handle cue ////

        // Step #5.1 verify cued member ids array
        const { cuedMemberIdsArr } = req.body;
        if (Array.isArray(cuedMemberIdsArr) && cuedMemberIdsArr.length !== 0) {
            const notificationStatisticsCollectionClient = atlasDbClient.db('statistics').collection<INotificationStatistics>('notification');
            // Step #5.2 maximum 9 members are allowed to cued at one time (in one comment)
            const cuedMemberIdsArrSliced = cuedMemberIdsArr.slice(0, 9);
            for await (const memberId_cued of cuedMemberIdsArrSliced) {
                const _blockingMemberMappingQuery = blockingMemberMappingTableClient.listEntities({ queryOptions: { filter: `PartitionKey eq '${memberId_cued}' and RowKey eq '${memberId}'` } });
                //// [!] attemp to reterieve entity makes the probability of causing RestError ////
                const _blockingMemberMappingQueryResult = await _blockingMemberMappingQuery.next();
                if (!_blockingMemberMappingQueryResult.value) {
                    //// [!] comment author has not been blocked by cued member ////
                    const noticeId = getRandomIdStrL(true);
                    // Step #5.2 upsert record (of INoticeInfo.Cued) in [PRL] Notice
                    const noticeTableClient = AzureTableClient('Notice');
                    noticeTableClient.upsertEntity<INoticeInfo>({
                        partitionKey: memberId_cued,
                        rowKey: noticeId,
                        Category: 'Cued',
                        InitiateId: memberId,
                        Nickname: getNicknameFromToken(token),
                        PostId: postId,
                        PostTitle: title,
                        CommentId: commentId,
                        CommentBrief: getContentBrief(content)
                    }, 'Replace');
                    // Step #5.3 update cued count (INotificationStatistics) (of cued member) in [C] notificationStatistics
                    const notificationStatisticsUpdateResult = await notificationStatisticsCollectionClient.updateOne({ memberId: memberId_cued }, {
                        $inc: {
                            cuedCount: 1
                        }
                    });
                    if (!notificationStatisticsUpdateResult.acknowledged) {
                        log(`Document (ICommentComprehensive, comment id: ${commentId}) inserted in [C] commentComprehensive successfully but failed to update cuedCount (of INotificationStatistics, member id: ${memberId_cued}) in [C] notificationStatistics`);
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