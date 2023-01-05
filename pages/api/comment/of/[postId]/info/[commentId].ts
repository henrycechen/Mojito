import type { NextApiRequest, NextApiResponse } from 'next';
import { MongoError } from 'mongodb';
import { getToken } from 'next-auth/jwt'

import AzureTableClient from '../../../../../../modules/AzureTableClient';
import AtlasDatabaseClient from "../../../../../../modules/AtlasDatabaseClient";

import { INoticeInfo, INotificationStatistics, IMemberStatistics, ICommentComprehensive, IChannelStatistics, ITopicComprehensive, ITopicPostMapping, IPostComprehensive } from '../../../../../../lib/interfaces';

import { MemberInfo } from '../../../../../../lib/types';
import { getRandomIdStr, getRandomIdStrL, getNicknameFromToken, getRestrictedFromCommentComprehensive, getTopicBase64StringsArrayFromRequestBody, getImageUrlsArrayFromRequestBody, getParagraphsArrayFromRequestBody, verifyId, response405, response500, log } from '../../../../../../lib/utils';

export default async function CommentInfo(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;
    if (!['GET', 'PUT', 'DELETE'].includes(method ?? '')) {
        response405(req, res);
        return;
    }
    //// Verify post id ////
    const { id: postId, isValid: isValidPostId } = verifyId(req.query?.postId);
    if (!isValidPostId) {
        res.status(400).send('Invalid post id id');
        return;
    }
    //// Verify comment id ////
    const { id: commentId, isValid: isValidCommentId } = verifyId(req.query?.commentId);
    if (!isValidCommentId) {
        res.status(400).send('Invalid comment id');
        return;
    }
    //// Declare DB client ////
    const atlasDbClient = AtlasDatabaseClient();
    try {
        atlasDbClient.connect();
        //// Look up comment status (of ICommentComprehensive) in [C] commentComprehensive
        const commentComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<ICommentComprehensive>('comment');
        const commentComprehensiveQueryResult = await commentComprehensiveCollectionClient.findOne<ICommentComprehensive>({ postId, commentId });
        if (null === commentComprehensiveQueryResult) {
            res.status(404).send('Comment not found');
            await atlasDbClient.close();
            return;
        }

        //// GET | info ////
        if ('GET' === method) {
            res.status(200).send(getRestrictedFromCommentComprehensive(commentComprehensiveQueryResult));
            await atlasDbClient.close();
            return;
        }

        //// Verify identity ////
        const token = await getToken({ req });
        if (!(token && token?.sub)) {
            // called by member him/herself
            res.status(400).send('Invalid identity');
            await atlasDbClient.close();
            return;
        }
        const { sub: memberId } = token;

        //// Verify comment status ////
        const { status: commentStatus } = commentComprehensiveQueryResult;
        if (0 > commentStatus) {
            res.status(405).send('Method not allowed due to comment deleted');
            await atlasDbClient.close();
        }

        //// Verify post status ////
        const postComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IPostComprehensive>('post');
        const postComprehensiveQueryResult = await postComprehensiveCollectionClient.findOne({ postId });
        if (null === postComprehensiveQueryResult) {
            throw new Error(`Member was trying editing/deleting comment but document (of IPostComprehensive, post id: ${postId}) not found in [C] postComprehensive`);
        }

        const { status: postStatus } = postComprehensiveQueryResult;
        if (0 > postStatus) {
            res.status(405).send('Method not allowed due to post deleted');
            await atlasDbClient.close();
            return;
        }

        //// PUT | edit ////
        if ('PUT' === method) {
            // Step #1 verify content
            const requestInfo = req.body;
            const { content } = JSON.parse(requestInfo);
            //// [!] attemp to parse info JSON string makes the probability of causing SyntaxError ////
            // Step #2 update document (of ICommentComprehensive) in [C] commentComprehensive
            const commentUpdateResult = await commentComprehensiveCollectionClient.updateOne({ postId, commentId }, {
                $set: {
                    content
                },
                $inc: {
                    totalEditCount: 1
                }
            });
            if (!commentUpdateResult.acknowledged) {
                throw new Error(`Failed to update content and totalEditCount (of ICommentComprehensive, comment id: ${commentId}, post id: ${postId}) in [C] commentComprehensive`);
            }
            res.status(200).send('Edit success');

            //// Update statistics ////

            // Step #3 update total comment edit count in [C] memberStatistics
            const memberStatisticsCollectionClient = atlasDbClient.db('statistics').collection<ICommentComprehensive>('member');
            await memberStatisticsCollectionClient.updateOne({ memberId }, {
                $inc: {
                    totalCommentEditCount: 1
                }
            });

            //// (Cond.) Handle notify.cue ////

            // Step #4.1 verify cued member ids array
            const { cuedMemberIdsArr } = req.body;
            if (Array.isArray(cuedMemberIdsArr) && cuedMemberIdsArr.length !== 0) {
                // Step #4.E get post title
                const { title } = postComprehensiveQueryResult;
                const notificationStatisticsCollectionClient = atlasDbClient.db('statistics').collection<INotificationStatistics>('notification');
                // Step #4.2 maximum 9 members are allowed to cued at one time (in one comment)
                const cuedMemberIdsArrSliced = cuedMemberIdsArr.slice(0, 9);
                for await (const memberId_cued of cuedMemberIdsArrSliced) {
                    const blockingMemberMappingTableClient = AzureTableClient('BlockingMemberMapping');
                    const _blockingMemberMappingQuery = blockingMemberMappingTableClient.listEntities({ queryOptions: { filter: `PartitionKey eq '${memberId_cued}' and RowKey eq '${memberId}'` } });
                    //// [!] attemp to reterieve entity makes the probability of causing RestError ////
                    const _blockingMemberMappingQueryResult = await _blockingMemberMappingQuery.next();
                    if (!_blockingMemberMappingQueryResult.value) {
                        //// [!] comment author has not been blocked by cued member ////
                        const noticeId = getRandomIdStrL(true);
                        // Step #4.2 upsert record (INoticeInfo.Cued) in [PRL] Notice
                        const noticeTableClient = AzureTableClient('Notice');
                        noticeTableClient.upsertEntity<INoticeInfo>({
                            partitionKey: memberId_cued,
                            rowKey: noticeId,
                            Category: 'Cued',
                            InitiateId: memberId,
                            Nickname: getNicknameFromToken(token),
                            PostId: postId,
                            PostTitle: title,
                        }, 'Replace');
                        // Step #4.3 update document (INotificationStatistics) (of cued member) in [C] notificationStatistics
                        const notificationStatisticsUpdateResult = await notificationStatisticsCollectionClient.updateOne({ memberId: memberId_cued }, {
                            $inc: {
                                cuedCount: 1
                            }
                        });
                        if (!notificationStatisticsUpdateResult.acknowledged) {
                            log(`Document (IPostComprehensive, post id: ${postId}) inserted in [C] postComprehensive successfully but failed to update cuedCount (of INotificationStatistics, member id: ${memberId_cued}) in [C] notificationStatistics`);
                        }
                    }
                }
            }
            await atlasDbClient.close();
            return;
        }
        //// DELETE | delete comment ////
        if ('DELETE' === method) {
            // Step #1 update comment status (of IComment Comprehensive)
            const commentComprehensiveUpdateResult = await commentComprehensiveCollectionClient.updateOne({ postId, commentId }, {
                $set: {
                    status: -1
                }
            });
            if (!commentComprehensiveUpdateResult.acknowledged) {
                throw new Error(`Failed to update status (-1, of ICommentComprehensive, comment id: ${commentId}) in [C] commentComprehensive`);
            }
            res.status(200).send('Delete success');

            //// Update statistics ////

            // Step #2 update total comment delete count (of IMemberStatistics) in [C] memberStatistics
            const memberStatisticsCollectionClient = atlasDbClient.db('statistics').collection<ICommentComprehensive>('member');
            const memberStatisticsUpdateResult = await memberStatisticsCollectionClient.updateOne({ memberId }, { $inc: { totalCommentDeleteCount: 1 } });
            if (!memberStatisticsUpdateResult.acknowledged) {
                log(`Document (ICommentComprehensive, comment id: ${commentId}) updated (deleted, status -1) in [C] commentComprehensive successfully but failed to update totalCommentDeleteCount (of IMemberStatistics, member id: ${memberId}) in [C] memberStatistics`);
            }
            // Step #3 update total comment delete count (of IPostComprehensive) in [C] postComprehensive
            const postComprehensiveUpdateResult = await postComprehensiveCollectionClient.updateOne({ postId }, { $inc: { totalCommentDeleteCount: 1 } });
            if (!postComprehensiveUpdateResult.acknowledged) {
                log(`Document (ICommentComprehensive, comment id: ${commentId}) updated (deleted, status -1) in [C] commentComprehensive successfully but failed to update totalCommentDeleteCount (of IPostComprehensive, post id: ${postId}) in [C] postComprehensive`);
            }
            // Step #4 update total comment delete count (of IChannelStatistics) in [C] channelStatistics
            const { channelId } = postComprehensiveQueryResult;
            const channelStatisticsCollectionClient = atlasDbClient.db('statistics').collection<IChannelStatistics>('channel');
            const channelStatisticsUpdateResult = await channelStatisticsCollectionClient.updateOne({ channelId }, { $inc: { totalCommentDeleteCount: 1 } });
            if (!channelStatisticsUpdateResult.acknowledged) {
                log(`Document (ICommentComprehensive, comment id: ${commentId}) updated (deleted, status -1) in [C] commentComprehensive successfully but failed to update totalCommentDeleteCount (of IChannelStatistics, channel id: ${channelId}) in [C] channelStatistics`);
            }
            // Step #5 (cond.) update total comment delete count (of ITopicComprehensive) [C] topicComprehensive
            const { topicIdsArr } = postComprehensiveQueryResult;
            if (Array.isArray(topicIdsArr) && topicIdsArr.length !== 0) {
                const topicComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<ITopicComprehensive>('topic');
                for await (const topicId of topicIdsArr) {
                    // Step #5.1 update topic statistics or insert a new document (of ITopicComprehensive) in [C] topicComprehensive
                    const topicComprehensiveUpdateResult = await topicComprehensiveCollectionClient.updateOne({ topicId }, { $inc: { totalCommentDeleteCount: 1 } });
                    if (!topicComprehensiveUpdateResult.acknowledged) {
                        log(`Document (ICommentComprehensive, comment id: ${commentId}) updated (deleted, status -1) in [C] commentComprehensive successfully but failed to update totalCommentDeleteCount (of ITopicComprehensive, topic id: ${topicId}) in [C] topicComprehensive`);
                    }
                }
            }
            await atlasDbClient.close();
        }
        return;
    } catch (e: any) {
        let msg;
        if (e instanceof SyntaxError) {
            res.status(400).send('Improperly normalized request info');
            return;
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