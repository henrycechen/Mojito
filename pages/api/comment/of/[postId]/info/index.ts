import type { NextApiRequest, NextApiResponse } from 'next';
import { RestError } from '@azure/data-tables';
import { MongoError } from 'mongodb';
import { getToken } from 'next-auth/jwt';

import AzureTableClient from '../../../../../../modules/AzureTableClient';
import AtlasDatabaseClient from '../../../../../../modules/AtlasDatabaseClient';

import { INoticeInfo, INotificationStatistics, IMemberStatistics, ICommentComprehensive, IChannelStatistics, ITopicComprehensive, IPostComprehensive, } from '../../../../../../lib/interfaces';
import { getRandomIdStrL, getNicknameFromToken, getContentBrief, verifyId, response405, response500, log, } from '../../../../../../lib/utils';

// This interface only accepts POST (create comment) method
// Use 'api/comment/of/[postId]/info/[commentId]' to GET comment info
//
// Info required:
// token: JWT
// content: string
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
    const { isValid, id: postId } = verifyId(req.query?.id);
    if (!isValid) {
        res.status(400).send('Invalid post id');
        return;
    }
    //// Verify comment content ////
    const { content } = req.body;
    if (!('string' === content && '' !== content)) {
        res.status(400).send('Improper or blank comment content');
        return;
    }
    //// Declare DB client ////
    const atlasDbClient = AtlasDatabaseClient();
    try {
        await atlasDbClient.connect();

        //// Check member status ////

        // Step #1.1 prepare member id (of comment author)
        const { sub: memberId } = token;
        // Step #1.2 look up member status (IMemberComprehensive) in [C] memberComprehensive
        const memberComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IMemberStatistics>('member');
        const memberComprehensiveQueryResult = await memberComprehensiveCollectionClient.findOne<IMemberStatistics>({ memberId });
        if (null === memberComprehensiveQueryResult) {
            throw new Error(`Member was tring creating comment but have no document (of IMemberComprehensive, member id: ${memberId}) in [C] memberComprehensive`);
        }
        const { status: memberStatus, allowCommenting } = memberComprehensiveQueryResult;
        if (!(0 < memberStatus && allowCommenting)) {
            res.status(403).send('Creating comments is not allowed for this member');
            await atlasDbClient.close();
            return;
        }

        //// Check post status ////

        // Step #2 look up post id (IPostComprehensive) in [C] postComprehensive
        const postComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IPostComprehensive>('post');
        const postComprehensiveQueryResult = await postComprehensiveCollectionClient.findOne<IPostComprehensive>({ postId });
        if (null === postComprehensiveQueryResult) {
            res.status(404).send('post not found');
            await atlasDbClient.close();
            return;
        }
        const { status: postStatus } = postComprehensiveQueryResult;
        if (0 > postStatus) {
            res.status(403).send('Commenting is not allowed for this post');
            await atlasDbClient.close();
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
            edited: [],
            status: 200,
            totalLikedCount: 0,
            totalUndoLikedCount: 0,
            totalDislikedCount: 0,
            totalUndoDislikedCount: 0,
            totalSubcommentCount: 0,
            totalSubcommentDeleteCount: 0,
            totalEditCount: 0
        });
        if (!commentComprehensiveInsertResult.acknowledged) {
            throw new Error(`Failed to insert document (of ICommentComprehensive, member id: ${memberId}) in [C] postComprehensive`);
        }
        res.status(200).send(commentId);

        //// Update statistics ////

        // Step #3.1 update total comment count (of IMemberStatistics) in [C] memberStatistics
        const memberStatisticsCollectionClient = atlasDbClient.db('statistics').collection<IMemberStatistics>('member');
        const memberStatisticsUpdateResult = await memberStatisticsCollectionClient.updateOne({ memberId }, {
            $inc: {
                totalCommentCount: 1
            }
        });
        if (!memberStatisticsUpdateResult.acknowledged) {
            log(`Document (ICommentComprehensive, comment id: ${commentId}) inserted in [C] commentComprehensive successfully but failed to update totalCommentCount (of IMemberStatistics, member id: ${memberId}) in [C] memberStatistics`);
        }
        // Step #3.2 update total comment count (of IPostComprehensive) in [C] postComprehensive
        const postComprehensiveUpdateResult = await postComprehensiveCollectionClient.updateOne({ postId }, {
            $inc: {
                totalCommentCount: 1
            }
        });
        if (!postComprehensiveUpdateResult.acknowledged) {
            log(`Document (ICommentComprehensive, comment id: ${commentId}) was inserted in [C] commentComprehensive successfully but failed to update totalCommentCount (of IPostComprehensive, post id: ${postId}, member id: ${memberId}) in [C] postComprehensive`);
        }
        // Step #3.3 update total comment count (of IChannelStatistics) in [C] channelStatistics
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
        // Step #3.4 (cond.) update total comment count (of ITopicComprehensive) in [C] topicComprehensive
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
            // Step #4.2 upsert record (INoticeInfo.Replied) in [PRL] Notice
            const noticeTableClient = AzureTableClient('Notice');
            await noticeTableClient.upsertEntity<INoticeInfo>({
                partitionKey: memberId_post,
                rowKey: commentId,
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
                log(`Document (ICommentComprehensive, comment id: ${commentId}) inserted in [C] commentComprehensive successfully but failed to update replied count (of INotificationStatistics, member id: ${memberId_post}) in [C] notificationStatistics`);
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
                    // Step #5.3 upsert record (of INoticeInfo.Cued) in [PRL] Notice
                    const noticeTableClient = AzureTableClient('Notice');
                    noticeTableClient.upsertEntity<INoticeInfo>({
                        partitionKey: memberId_cued,
                        rowKey: commentId, // entity id
                        Category: 'Cued',
                        InitiateId: memberId,
                        Nickname: getNicknameFromToken(token),
                        PostId: postId,
                        PostTitle: title,
                        CommentId: commentId,
                        CommentBrief: getContentBrief(content)
                    }, 'Replace');
                    // Step #5.4 update cued count (INotificationStatistics) (of cued member) in [C] notificationStatistics
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