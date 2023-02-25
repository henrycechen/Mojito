import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt'
import { RestError } from '@azure/data-tables';
import { MongoError } from 'mongodb';

import AzureTableClient from '../../../../../modules/AzureTableClient';
import AtlasDatabaseClient from "../../../../../modules/AtlasDatabaseClient";

import { getContentBrief, logWithDate, response405, response500 } from '../../../../../lib/utils/general';
import { verifyId } from '../../../../../lib/utils/verify';
import { IMemberComprehensive, IMemberStatistics } from '../../../../../lib/interfaces/member';
import { IAttitudeComprehensive } from '../../../../../lib/interfaces/attitude';
import { createAttitudeComprehensive, getMappingFromAttitudeComprehensive, provideAttitudeComprehensiveUpdate } from '../../../../../lib/utils/for/attitude';
import { ICommentComprehensive } from '../../../../../lib/interfaces/comment';
import { IPostComprehensive } from '../../../../../lib/interfaces/post';
import { IChannelStatistics } from '../../../../../lib/interfaces/channel';
import { ITopicComprehensive } from '../../../../../lib/interfaces/topic';
import { INoticeInfo, INotificationStatistics } from '../../../../../lib/interfaces/notification';
import { createNoticeId } from '../../../../../lib/utils/create';
import { getNicknameFromToken } from '../../../../../lib/utils/for/member';

const fname = GetOrPostAttitudeOnPostOrCommentById.name;

/** GetOrPostAttitudeOnPostOrCommentById v0.1.1 FIXME: test mode
 * 
 * Last update: 26/02/2023
 * 
 * This interface accepts GET and POST requests
 * 
 * Info required for GET method
 * - recaptchaResponse: string (query string)
 * - token: JWT
 * - id: string (query, post id)
 * 
 * Info required for POST requests
 * - recaptchaResponse: string (query string)
 * - token: JWT
 * - id: string (query, post or comment id)
 * - attitude: number (body)
 * 
 * 
 * Concern about performance: 26/02/2023
 * - There're 4 big 'if' blocks to fulfill the do/undo requests
 * - Always want to abstract the 4 blocks into a smaller 'if/else' block
 * - But there're only 2 (in 6) situations that will go through 2 'if' blocks
 * - Other 4 situations will only go through 1 'if' block, which is not affecting the performance much
 * - Hence the current solution
 */

export default async function GetOrPostAttitudeOnPostOrCommentById(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;
    if (!['GET', 'POST'].includes(method ?? '')) {
        response405(req, res);
        return;
    }

    // FIXME:FIXME:FIXME:FIXME:FIXME:FIXME:FIXME:
    if ('GET' === method) {
        res.send({
            attitude: 1,
            commentAttitudeMapping: {
                C12345ABCDE: -1,
                D12345ABCDF: 1
            },
        })

    }
    if ('POST' === method) {
        res.send('ok')
    }
    return;

    //// Verify identity ////
    const token = await getToken({ req });
    if (!(token && token?.sub)) {
        res.status(400).send('Invalid identity');
        return;
    }
    const { sub: memberId } = token;

    //// Verify id ////
    const { isValid, category, id } = verifyId(req.query?.id);
    if (!isValid) {
        res.status(400).send('Invalid post or comment id');
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
            throw new Error(`Member attempt to GET attitude mapping or expressing attitude on a post but have no document (of IMemberComprehensive, member id: ${memberId}) in [C] memberComprehensive`);
        }
        const { status: memberStatus, allowCommenting } = memberComprehensiveQueryResult;
        if (!(0 < memberStatus && allowCommenting)) {
            res.status(403).send('Method not allowed due to member suspended or deactivated');
            await atlasDbClient.close();
            return;
        }

        //// GET | attitude mapping ////
        if ('GET' === method) {
            if ('post' !== category) {
                res.status(400).send('Invalid post id');
                return;
            }
            await atlasDbClient.connect();
            const attitudeComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IAttitudeComprehensive>('attitude');
            const attitudeComprehensiveQueryResult = await attitudeComprehensiveCollectionClient.findOne({ memberId, postId: id });

            //// Response 200 ////
            res.status(200).send(getMappingFromAttitudeComprehensive(attitudeComprehensiveQueryResult));
            await atlasDbClient.close();
            return;
        }

        //// Verify attitude ////
        const { attitude } = req.body;
        if (!('number' === typeof attitude && [-1, 0, 1].includes(attitude))) {
            res.status(400).send('Improper or null attitude value');
            return;
        }

        //// POST | express attitude ////
        if ('POST' === method) {

            let postId = id;
            let postTitle = '';
            let notifiedMemberId = '';
            let commentBrief = '';

            const commentComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<ICommentComprehensive>('comment');

            // Step #1 verify entity id
            if (['comment', 'subcomment'].includes(category)) {
                // Step #1.1 (cond.) look up document (of ICommentComprehensive) in [C] commentComprehensive
                const commentComprehensiveQueryResult = await commentComprehensiveCollectionClient.findOne({ commentId: id });
                if (null === commentComprehensiveQueryResult) {
                    res.status(404).send('Comment not found');
                    await atlasDbClient.close();
                    return;
                }
                // Step #1.2 (cond.) verify comment status (of ICommentComprehensive)
                const { status: commentStatus } = commentComprehensiveQueryResult;
                if (0 > commentStatus) {
                    res.status(403).send('Method not allowed due to comment deleted');
                    await atlasDbClient.close();
                    return;
                }
                // Step #1.3 (cond.) assign post id
                postId = commentComprehensiveQueryResult.postId;
                // Step #1.4 (cond.) asign notified member id (comment author id)
                notifiedMemberId = commentComprehensiveQueryResult.memberId;
                // Step #1.5 (cond.) prepare comment content brief
                commentBrief = getContentBrief(commentComprehensiveQueryResult.content);
            }

            // Step #2 verify post status
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
            //// Post status good, re-assign notified member if entity is post
            if ('post' === category) {
                postTitle = postComprehensiveQueryResult.title;
                notifiedMemberId = postComprehensiveQueryResult.memberId;
            }

            let prevAttitude = 0;

            // Step #3 insert/update attitude
            const attitudeComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IAttitudeComprehensive>('attitude');
            const attitudeComprehensiveQueryResult = await attitudeComprehensiveCollectionClient.findOne({ memberId, postId });
            if (null === attitudeComprehensiveQueryResult) {
                // Case [Do like/dislike]
                // Step #3A insert a new document (of IAttitudeComprehensive) in [C] attitudeComprehensive
                const attitudeComprehensiveInsertResult = await attitudeComprehensiveCollectionClient.insertOne(createAttitudeComprehensive(memberId, postId, id, attitude));
                if (!attitudeComprehensiveInsertResult.acknowledged) {
                    throw new Error(`Failed to insert document (of IAttitudeComprehensive, entity id: ${id}, member id: ${memberId}, post id: ${postId}) in [C] attitudeComprehensive`);
                }
            } else {
                prevAttitude = attitudeComprehensiveQueryResult.attitude;
                if ('number' === typeof prevAttitude && attitude !== prevAttitude) {
                    // Case [Undo like/dislike]
                    // Step #3B update attitude (of IAttitudeComprehensive) in [C] attitudeComprehensive
                    const attitudeComprehensiveUpdateResult = await attitudeComprehensiveCollectionClient.updateOne({ memberId, postId }, { $set: provideAttitudeComprehensiveUpdate(id, attitude) });
                    if (!attitudeComprehensiveUpdateResult.acknowledged) {
                        throw new Error(`Failed to update attitude (of IAttitudeComprehensive, member id: ${memberId}, post id: ${postId}) in [C] attitudeComprehensive`);
                    }
                }
            }

            //// Response 200 ////
            res.status(200).send('Express attitude success');

            //// Update statistics ////

            //// Case [Undo like] ////
            if (attitude !== prevAttitude && 1 === prevAttitude) {
                // Update totalUndoLikedCount (of IMemberStatistics) in [C] memberStatistics
                const memberStatisticsCollectionClient = atlasDbClient.db('statistics').collection<IMemberStatistics>('member');
                const memberStatisticsUpdateResult = await memberStatisticsCollectionClient.updateOne({ memberId }, { $inc: { totalUndoLikedCount: 1 } });
                if (!memberStatisticsUpdateResult.acknowledged) {
                    logWithDate(`Failed to update totalUndoLikedCount (of IMemberStatistics, member id: ${memberId}) in [C] memberStatistics`, fname);
                }
                if (['comment', 'subcomment'].includes(category)) {
                    // Update totalCommentUndoLikedCount (of IMemberStatistics) in [C] memberStatistics (of the comment author, a.k.a., notified member)
                    const commentAuthorStatisticsUpdateResult = await memberStatisticsCollectionClient.updateOne({ memberId: notifiedMemberId }, { $inc: { totalCommentUndoLikedCount: 1 } });
                    if (!commentAuthorStatisticsUpdateResult.acknowledged) {
                        logWithDate(`Failed to update totalCommentUndoLikedCount (of IMemberStatistics, member id: ${notifiedMemberId}) in [C] memberStatistics`, fname);
                    }
                    // Update totalUndoLikedCount (of ICommentComprehensive) in [C] commentComprehensive
                    const commentComprehensiveUpdateResult = await commentComprehensiveCollectionClient.updateOne({ commentId: id }, { $inc: { totalUndoLikedCount: 1 } });
                    if (!commentComprehensiveUpdateResult.acknowledged) {
                        logWithDate(`Failed to update totalUndoLikedCount (of ICommetComprehensive, comment id: ${id}) in [C] commentComprehensive`, fname);
                    }
                }
                if ('post' === category) {
                    // Update totalCreationUndoLikedCount (of IMemberStatistics) in [C] memberStatistics (of the post author, a.k.a., notified member)
                    const postAuthorStatisticsUpdateResult = await memberStatisticsCollectionClient.updateOne({ memberId: notifiedMemberId }, { $inc: { totalCreationUndoLikedCount: 1 } });
                    if (!postAuthorStatisticsUpdateResult.acknowledged) {
                        logWithDate(`Failed to update totalCreationUndoLikedCount (of IMemberStatistics, member id: ${notifiedMemberId}) in [C] memberStatistics`, fname);
                    }
                    // Update totalUndoLikedCount (of IPostComprehensive) in [C] postComprehensive
                    const postComprehensiveUpdateResult = await postComprehensiveCollectionClient.updateOne({ postId }, { $inc: { totalUndoLikedCount: 1 } });
                    if (!postComprehensiveUpdateResult.acknowledged) {
                        logWithDate(`Failed to update totalUndoLikedCount (of IPostComprehensive, post id: ${postId}) in [C] postComprehensive`, fname);
                    }
                    // Update totalUndoLikedCount (of IChannelStatistics) in [C] channelStatistics
                    const { channelId } = postComprehensiveQueryResult;
                    const channelStatisticsCollectionClient = atlasDbClient.db('statistics').collection<IChannelStatistics>('channel');
                    const channelStatisticsUpdateResult = await channelStatisticsCollectionClient.updateOne({ channelId }, { $inc: { totalUndoLikedCount: 1 } });
                    if (!channelStatisticsUpdateResult.acknowledged) {
                        logWithDate(`Failed to update totalUndoLikedCount (of IChannelStatistics, channel id: ${channelId}) in [C] channelStatistics`, fname);
                    }
                    // (Cond.) Update totalUndoLikedCount (of ITopicComprehensive) in [C] topicComprehensive 
                    const { topicIdsArr } = postComprehensiveQueryResult;
                    if (Array.isArray(topicIdsArr) && topicIdsArr.length !== 0) {
                        const topicComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<ITopicComprehensive>('topic');
                        for await (const topicId of topicIdsArr) {
                            const topicComprehensiveUpdateResult = await topicComprehensiveCollectionClient.updateOne({ topicId }, { $inc: { totalUndoLikedCount: 1 } });
                            if (!topicComprehensiveUpdateResult.acknowledged) {
                                logWithDate(`Failed to update totalUndoLikedCount (of ITopicComprehensive, topic id: ${topicId}) in [C] topicComprehensive`, fname);
                            }
                        }
                    }
                }
            }


            //// Case [Undo dislike]
            if (attitude !== prevAttitude && -1 === prevAttitude) {
                // Update totalUndoDislikedCount (of IMemberStatistics) in [C] memberStatistics
                const memberStatisticsCollectionClient = atlasDbClient.db('statistics').collection<IMemberStatistics>('member');
                const memberStatisticsUpdateResult = await memberStatisticsCollectionClient.updateOne({ memberId }, { $inc: { totalUndoDislikedCount: 1 } });
                if (!memberStatisticsUpdateResult.acknowledged) {
                    logWithDate(`Failed to update total totalUndoDislikedCount (of IMemberStatistics, member id: ${memberId}) in [C] memberStatistics`, fname);
                }
                if (['comment', 'subcomment'].includes(category)) {
                    // Update totalCommentUndoDislikedCount (of IMemberStatistics) in [C] memberStatistics (of the comment author, a.k.a., notified member)
                    const commentAuthorStatisticsUpdateResult = await memberStatisticsCollectionClient.updateOne({ memberId: notifiedMemberId }, { $inc: { totalCommentUndoDislikedCount: 1 } });
                    if (!commentAuthorStatisticsUpdateResult.acknowledged) {
                        logWithDate(`Failed to update totalCommentUndoDislikedCount (of IMemberStatistics, member id: ${notifiedMemberId}) in [C] memberStatistics`, fname);
                    }
                    // Update totalUndoDislikedCount (of ICommentComprehensive) in [C] commentComprehensive
                    const commentComprehensiveUpdateResult = await commentComprehensiveCollectionClient.updateOne({ commentId: id }, { $inc: { totalUndoDislikedCount: 1 } });
                    if (!commentComprehensiveUpdateResult.acknowledged) {
                        logWithDate(`Failed to update totalUndoDislikedCount (of ICommetComprehensive, comment id: ${id}) in [C] commentComprehensive`, fname);
                    }
                }
                if ('post' === category) {
                    // Update totalCreationUndoDislikedCount (of IMemberStatistics) in [C] memberStatistics (of the post author, a.k.a., notified member)
                    const postAuthorStatisticsUpdateResult = await memberStatisticsCollectionClient.updateOne({ memberId: notifiedMemberId }, { $inc: { totalCreationUndoDislikedCount: 1 } });
                    if (!postAuthorStatisticsUpdateResult.acknowledged) {
                        logWithDate(`Failed to update totalCreationUndoDislikedCount (of IMemberStatistics, member id: ${notifiedMemberId}) in [C] memberStatistics`, fname);
                    }
                    // Update update totalUndoDislikedCount (of IPostComprehensive) in [C] postComprehensive
                    const commentComprehensiveUpdateResult = await postComprehensiveCollectionClient.updateOne({ postId }, { $inc: { totalUndoDislikedCount: 1 } });
                    if (!commentComprehensiveUpdateResult.acknowledged) {
                        logWithDate(`Failed to update totalUndoDislikedCount (of IPostComprehensive, post id: ${postId}) in [C] postComprehensive`, fname);
                    }
                }
            }

            // Case [Do like]
            if (attitude !== prevAttitude && 1 === attitude) {
                // Update totalLikedCount (of IMemberStatistics) in [C] memberStatistics
                const memberStatisticsCollectionClient = atlasDbClient.db('statistics').collection<IMemberStatistics>('member');
                const memberStatisticsUpdateResult = await memberStatisticsCollectionClient.updateOne({ memberId }, { $inc: { totalLikedCount: 1 } });
                if (!memberStatisticsUpdateResult.acknowledged) {
                    logWithDate(`Failed to update total totalLikedCount (of IMemberStatistics, member id: ${memberId}) in [C] memberStatistics`, fname);
                }
                if (['comment', 'subcomment'].includes(category)) {
                    // Update totalCommentLikedCount (of IMemberStatistics) in [C] memberStatistics (of the comment author, a.k.a, notified member)
                    const commentAuthorStatisticsUpdateResult = await memberStatisticsCollectionClient.updateOne({ memberId: notifiedMemberId }, { $inc: { totalCommentLikedCount: 1 } });
                    if (!commentAuthorStatisticsUpdateResult.acknowledged) {
                        logWithDate(`Failed to update total totalCommentLikedCount (of IMemberStatistics, member id: ${notifiedMemberId}) in [C] memberStatistics`, fname);
                    }
                    // Update totalLikedCount (of ICommetComprehensive) in [C] commentComprehensive
                    const commentComprehensiveUpdateResult = await commentComprehensiveCollectionClient.updateOne({ commentId: id }, { $inc: { totalLikedCount: 1 } });
                    if (!commentComprehensiveUpdateResult.acknowledged) {
                        logWithDate(`Failed to update totalLikedCount (of ICommetComprehensive in [C] commentComprehensive`, fname);
                    }
                }
                if ('post' === category) {
                    // Update totalCreationLikedCount (of IMemberStatistics) in [C] memberStatistics (of the post author, a.k.a, notified member)
                    const commentAuthorStatisticsUpdateResult = await memberStatisticsCollectionClient.updateOne({ memberId: notifiedMemberId }, { $inc: { totalCreationLikedCount: 1 } });
                    if (!commentAuthorStatisticsUpdateResult.acknowledged) {
                        logWithDate(`Failed to update total totalCreationLikedCount (of IMemberStatistics, member id: ${notifiedMemberId}) in [C] memberStatistics`, fname);
                    }
                    // Update totalLikedCount (of IPostComprehensive) in [C] postComprehensive
                    const postComprehensiveUpdateResult = await postComprehensiveCollectionClient.updateOne({ postId }, { $inc: { totalLikedCount: 1 } });
                    if (!postComprehensiveUpdateResult.acknowledged) {
                        logWithDate(`Failed to update totalLikedCount (of IPostComprehensive, post id: ${postId}) in [C] postComprehensive`, fname);
                    }
                    // Update totalLikedCount (of IChannelStatistics) in [C] channelStatistics
                    const { channelId } = postComprehensiveQueryResult;
                    const channelStatisticsCollectionClient = atlasDbClient.db('statistics').collection<IChannelStatistics>('channel');
                    const channelStatisticsUpdateResult = await channelStatisticsCollectionClient.updateOne({ channelId }, { $inc: { totalLikedCount: 1 } });
                    if (!channelStatisticsUpdateResult.acknowledged) {
                        logWithDate(`Failed to update totalLikedCount (of IChannelStatistics, channel id: ${channelId}) in [C] channelStatistics`, fname);
                    }
                    // (Cond.) Update totalLikedCount (of ITopicComprehensive) in [C] topicComprehensive
                    const { topicIdsArr } = postComprehensiveQueryResult;
                    if (Array.isArray(topicIdsArr) && topicIdsArr.length !== 0) {
                        const topicComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<ITopicComprehensive>('topic');
                        for await (const topicId of topicIdsArr) {
                            const topicComprehensiveUpdateResult = await topicComprehensiveCollectionClient.updateOne({ topicId }, { $inc: { totalLikedCount: 1 } });
                            if (!topicComprehensiveUpdateResult.acknowledged) {
                                logWithDate(`Failed to update totalLikedCount (of ITopicComprehensive, topic id: ${topicId}) in [C] topicComprehensive`, fname);
                            }
                        }
                    }
                }
                if (memberId !== notifiedMemberId) {
                    // Handle notice.like ////
                    const blockingMemberMappingTableClient = AzureTableClient('BlockingMemberMapping');
                    const blockingMemberMappingQuery = blockingMemberMappingTableClient.listEntities({ queryOptions: { filter: `PartitionKey eq '${notifiedMemberId}' and RowKey eq '${memberId}'` } });
                    //// [!] attemp to reterieve entity makes the probability of causing RestError ////
                    const blockingMemberMappingQueryResult = await blockingMemberMappingQuery.next();
                    if (!blockingMemberMappingQueryResult.value) {
                        //// [!] member who has expressed attitude has not been blocked by comment author ////
                        // Step #4 upsert record (of INoticeInfo.Liked) in [PRL] Notice
                        const noticeTableClient = AzureTableClient('Notice');
                        await noticeTableClient.upsertEntity<INoticeInfo>({
                            partitionKey: notifiedMemberId, // notified member id, in this case, comment author
                            rowKey: createNoticeId('like', memberId, postId, id), // combined id
                            Category: 'like',
                            InitiateId: memberId,
                            Nickname: getNicknameFromToken(token),
                            PostTitle: postTitle,
                            CommentBrief: commentBrief,
                            CreatedTimeBySecond: Math.floor(new Date().getTime() / 1000),
                            IsActive: true
                        }, 'Replace');
                        // Step #5 update like (of INotificationStatistics, of post or comment author) in [C] notificationStatistics
                        const notificationStatisticsCollectionClient = atlasDbClient.db('statistics').collection<INotificationStatistics>('notification');
                        const notificationStatisticsUpdateResult = await notificationStatisticsCollectionClient.updateOne({ memberId: notifiedMemberId }, { $inc: { like: 1 } });
                        if (!notificationStatisticsUpdateResult.acknowledged) {
                            logWithDate(`Failed to update like (of INotificationStatistics, member id: ${notifiedMemberId}) in [C] notificationStatistics`, fname);
                        }
                    }
                }
            }

            // Case [Do disike]
            if (attitude !== prevAttitude && -1 === attitude) {
                // Step #1 update totalDislikedCount (of IMemberStatistics) in [C] memberStatistics
                const memberStatisticsCollectionClient = atlasDbClient.db('statistics').collection<IMemberStatistics>('member');
                const memberStatisticsUpdateResult = await memberStatisticsCollectionClient.updateOne({ memberId }, { $inc: { totalDislikedCount: 1 } });
                if (!memberStatisticsUpdateResult.acknowledged) {
                    logWithDate(`Failed to update totalDislikedCount (of IMemberStatistics, member id: ${memberId}) in [C] memberStatistics`, fname);
                }
                if (['comment', 'subcomment'].includes(category)) {
                    // [comment] Step #1 update totalCommentDislikedCount (of IMemberStatistics) [C] memberStatistics (of the comment author, a.k.a, notified member)
                    const commentAuthorStatisticsUpdateResult = await memberStatisticsCollectionClient.updateOne({ memberId: notifiedMemberId }, { $inc: { totalCommentDislikedCount: 1 } });
                    if (!commentAuthorStatisticsUpdateResult.acknowledged) {
                        logWithDate(`Failed to update totalCommentDislikedCount (of IMemberStatistics, member id: ${notifiedMemberId}) in [C] memberStatistics`, fname);
                    }
                    // [comment] Step #3 update totalDislikedCount in (of ICommet/ISubcommentComprehensive) in [C] comment/subcommentComprehensive
                    const commentComprehensiveUpdateResult = await commentComprehensiveCollectionClient.updateOne({ commentId: id }, { $inc: { totalDislikedCount: 1 } });
                    if (!commentComprehensiveUpdateResult.acknowledged) {
                        logWithDate(`Failed to update totalDislikedCount (of ICommetComprehensive, comment id: ${id}) in [C] commentComprehensive`, fname);
                    }
                }
                if ('post' === category) {
                    // [post] Step #1 update totalCreationDislikedCount (of IMemberStatistics) [C] memberStatistics (of the comment author, a.k.a, notified member)
                    const postAuthorStatisticsUpdateResult = await memberStatisticsCollectionClient.updateOne({ memberId: notifiedMemberId }, { $inc: { totalCreationDislikedCount: 1 } });
                    if (!postAuthorStatisticsUpdateResult.acknowledged) {
                        logWithDate(`Failed to update totalCreationDislikedCount (of IMemberStatistics, member id: ${notifiedMemberId}) in [C] memberStatistics`, fname);
                    }
                    // [post] Step #3 update totalDislikedCount in (of IPostComprehensive) in [C] postComprehensive
                    const commentComprehensiveUpdateResult = await postComprehensiveCollectionClient.updateOne({ postId }, { $inc: { totalDislikedCount: 1 } });
                    if (!commentComprehensiveUpdateResult.acknowledged) {
                        logWithDate(`Failed to update totalDislikedCount (of IPostComprehensive, post id: ${postId}) in [C] postComprehensive`, fname);
                    }
                }
            }
            await atlasDbClient.close();
            return;
        }
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