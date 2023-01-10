import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt'
import { RestError } from '@azure/data-tables';
import { MongoError } from 'mongodb';

import AzureTableClient from '../../../../../modules/AzureTableClient';
import AtlasDatabaseClient from "../../../../../modules/AtlasDatabaseClient";

import { INoticeInfo, INotificationStatistics, IMemberStatistics, IAttitudeComprehensive, IChannelStatistics, ITopicComprehensive, IPostComprehensive, IMemberComprehensive, ICommentComprehensive } from '../../../../../lib/interfaces';
import { getNicknameFromToken, getMappingFromAttitudeComprehensive, verifyId, response405, response500, log, provideAttitudeComprehensiveUpdate, createAttitudeComprehensive, createNoticeId, getContentBrief } from '../../../../../lib/utils';
const recaptchaServerSecret = process.env.INVISIABLE_RECAPTCHA_SECRET_KEY ?? '';

// This interface accepts GET and POST requests
//
// Info required for GET method
// - recaptchaResponse: string (query string)
// - token: JWT
// - id: string (query, post id)

// Info required for POST requests
// - recaptchaResponse: string (query string)
// - token: JWT
// - id: string (query, post or comment id)
// - attitude: number (body, POST only)

export default async function AttitudeOnPostOrCommentById(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;
    if (!['GET', 'POST'].includes(method ?? '')) {
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
    const { isValid, category, id } = verifyId(req.query?.id);
    //// Verify id ////
    if (!isValid) {
        res.status(400).send('Invalid post or comment id');
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
            throw new Error(`Member was trying getting attitude mapping or expressing attitude on a post but have no document (of IMemberComprehensive, member id: ${memberId}) in [C] memberComprehensive`);
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
            // Step #1.1 declare post id
            let postId = id;
            // Step #1.2 declare notified member id
            let notifiedMemberId = '';
            // Step #2 verify status
            const commentComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<ICommentComprehensive>('comment');
            if (['comment', 'subcomment'].includes(category)) {
                // Step #2.3 (cond.) look up document (of ICommentComprehensive) in [C] commentComprehensive
                const commentComprehensiveQueryResult = await commentComprehensiveCollectionClient.findOne({ commentId: id });
                if (null === commentComprehensiveQueryResult) {
                    res.status(404).send('Comment not found');
                    await atlasDbClient.close();
                    return;
                }
                // Step #2.4 (cond.) verify comment status (of ICommentComprehensive)
                const { status: commentStatus } = commentComprehensiveQueryResult;
                if (0 > commentStatus) {
                    res.status(403).send('Method not allowed due to comment deleted');
                    await atlasDbClient.close();
                    return;
                }
                // Step #2.5 (cond.) assign post id
                postId = commentComprehensiveQueryResult.postId;
                // Step #2.6 (cond.) asign notified member id (with comment author id)
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
            // Step #2.7 (cond.) asign notified member id (with post author id)
            if ('post' === category) {
                notifiedMemberId = postComprehensiveQueryResult.memberId;
            }
            //// Status all good ////
            // const { memberId: memberId_post } = postComprehensiveQueryResult;
            // Step #3.1 look up document (of IAttitudeComprehensive) in [C] attitudeComprehensive
            const attitudeComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IAttitudeComprehensive>('attitude');
            const attitudeComprehensiveQueryResult = await attitudeComprehensiveCollectionClient.findOne({ memberId, postId });
            if (null === attitudeComprehensiveQueryResult) {
                // Case [Express attitude]
                // Step #3.2 insert a new document (of IAttitudeComprehensive) in [C] attitudeComprehensive
                const attitudeComprehensiveInsertResult = await attitudeComprehensiveCollectionClient.insertOne(createAttitudeComprehensive(memberId, postId, id, attitude));
                if (!attitudeComprehensiveInsertResult.acknowledged) {
                    throw new Error(`Failed to insert document (of IAttitudeComprehensive, target id: ${id}, member id: ${memberId}, post id: ${postId}) in [C] attitudeComprehensive`);
                }
                res.status(200).send('Express attitude success');
            } else {
                // Case [Change attitude]
                const attitude_prev = attitudeComprehensiveQueryResult.attitude;
                if ('number' === typeof attitude_prev && attitude_prev !== attitude) {
                    // Step #3.2 update attitude (of IAttitudeComprehensive) in [C] attitudeComprehensive
                    const attitudeComprehensiveUpdateResult = await attitudeComprehensiveCollectionClient.updateOne({ memberId, postId }, { $set: provideAttitudeComprehensiveUpdate(id, attitude) });
                    if (!attitudeComprehensiveUpdateResult.acknowledged) {
                        throw new Error(`Failed to update attitude (of IAttitudeComprehensive, member id: ${memberId}, post id: ${postId}) in [C] attitudeComprehensive`);
                    }
                    res.status(200).send('Change attitude success');
                    //// Update statistics ////
                    //// Case [Undo like]
                    if (1 === attitude_prev) {
                        // Step #1 Update totalUndoLikedCount (of IMemberStatistics) in [C] memberStatistics
                        const memberStatisticsCollectionClient = atlasDbClient.db('statistics').collection<IMemberStatistics>('member');
                        const memberStatisticsUpdateResult = await memberStatisticsCollectionClient.updateOne({ memberId }, {
                            $inc: {
                                totalUndoLikedCount: 1
                            }
                        });
                        if (!memberStatisticsUpdateResult.acknowledged) {
                            log(`Failed to update totalUndoLikedCount (of IMemberStatistics, member id: ${memberId}) in [C] memberStatistics`);
                        }
                        if (['comment', 'subcomment'].includes(category)) {
                            // [comment] Step #2 totalCommentUndoLikedCount (of IMemberStatistics) in [C] memberStatistics (of the comment author, a.k.a., notified member)
                            const commentAuthorStatisticsUpdateResult = await memberStatisticsCollectionClient.updateOne({ memberId: notifiedMemberId }, { $inc: { totalCommentUndoLikedCount: 1 } });
                            if (!commentAuthorStatisticsUpdateResult.acknowledged) {
                                log(`Failed to update totalCommentUndoLikedCount (of IMemberStatistics, member id: ${notifiedMemberId}) in [C] memberStatistics`);
                            }
                            // [comment] Step #3 totalUndoLikedCount (of ICommentComprehensive) in [C] commentComprehensive
                            const commentComprehensiveUpdateResult = await commentComprehensiveCollectionClient.updateOne({ commentId: id }, { $inc: { totalUndoLikedCount: 1 } });
                            if (!commentComprehensiveUpdateResult.acknowledged) {
                                log(`Failed to update totalUndoLikedCount (of ICommetComprehensive, comment id: ${id}) in [C] commentComprehensive`);
                            }
                        }
                        if ('post' === category) {
                            // [post] Step #2 totalCreationUndoLikedCount (of IMemberStatistics) in [C] memberStatistics (of the post author, a.k.a., notified member)
                            const postAuthorStatisticsUpdateResult = await memberStatisticsCollectionClient.updateOne({ memberId: notifiedMemberId }, { $inc: { totalCreationUndoLikedCount: 1 } });
                            if (!postAuthorStatisticsUpdateResult.acknowledged) {
                                log(`Failed to update totalCreationUndoLikedCount (of IMemberStatistics, member id: ${notifiedMemberId}) in [C] memberStatistics`);
                            }
                            // [post] Step #3 totalUndoLikedCount (of IPostComprehensive) in [C] postComprehensive
                            const postComprehensiveUpdateResult = await postComprehensiveCollectionClient.updateOne({ postId }, { $inc: { totalUndoLikedCount: 1 } });
                            if (!postComprehensiveUpdateResult.acknowledged) {
                                log(`Failed to update totalUndoLikedCount (of IPostComprehensive, post id: ${postId}) in [C] postComprehensive`);
                            }
                            // [post] Step #4 totalUndoLikedCount (of IChannelStatistics) in [C] channelStatistics
                            const { channelId } = postComprehensiveQueryResult;
                            const channelStatisticsCollectionClient = atlasDbClient.db('statistics').collection<IChannelStatistics>('channel');
                            const channelStatisticsUpdateResult = await channelStatisticsCollectionClient.updateOne({ channelId }, { $inc: { totalUndoLikedCount: 1 } });
                            if (!channelStatisticsUpdateResult.acknowledged) {
                                log(`Failed to update totalUndoLikedCount (of IChannelStatistics, channel id: ${channelId}) in [C] channelStatistics`);
                            }
                            // [post] Step #5 (cond.) totalUndoLikedCount (of ITopicComprehensive) in [C] topicComprehensive 
                            const { topicIdsArr } = postComprehensiveQueryResult;
                            if (Array.isArray(topicIdsArr) && topicIdsArr.length !== 0) {
                                const topicComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<ITopicComprehensive>('topic');
                                for await (const topicId of topicIdsArr) {
                                    const topicComprehensiveUpdateResult = await topicComprehensiveCollectionClient.updateOne({ topicId }, { $inc: { totalUndoLikedCount: 1 } });
                                    if (!topicComprehensiveUpdateResult.acknowledged) {
                                        log(`Failed to update totalUndoLikedCount (of ITopicComprehensive, topic id: ${topicId}) in [C] topicComprehensive`);
                                    }
                                }
                            }
                        }
                    }
                    //// Case [Undo dislike]
                    if (-1 === attitude_prev) {
                        // Step #1 totalUndoDislikedCount (of IMemberStatistics) in [C] memberStatistics
                        const memberStatisticsCollectionClient = atlasDbClient.db('statistics').collection<IMemberStatistics>('member');
                        const memberStatisticsUpdateResult = await memberStatisticsCollectionClient.updateOne({ memberId }, { $inc: { totalUndoDislikedCount: 1 } });
                        if (!memberStatisticsUpdateResult.acknowledged) {
                            log(`Failed to update total totalUndoDislikedCount (of IMemberStatistics, member id: ${memberId}) in [C] memberStatistics`);
                        }
                        if (['comment', 'subcomment'].includes(category)) {
                            // [post] Step #2 totalCommentUndoDislikedCount (of IMemberStatistics) in [C] memberStatistics (of the comment author, a.k.a., notified member)
                            const commentAuthorStatisticsUpdateResult = await memberStatisticsCollectionClient.updateOne({ memberId: notifiedMemberId }, { $inc: { totalCommentUndoDislikedCount: 1 } });
                            if (!commentAuthorStatisticsUpdateResult.acknowledged) {
                                log(`Failed to update totalCommentUndoDislikedCount (of IMemberStatistics, member id: ${notifiedMemberId}) in [C] memberStatistics`);
                            }
                            // [post] Step #3 update totalUndoDislikedCount (of ICommentComprehensive) in [C] commentComprehensive
                            const commentComprehensiveUpdateResult = await commentComprehensiveCollectionClient.updateOne({ commentId: id }, { $inc: { totalUndoDislikedCount: 1 } });
                            if (!commentComprehensiveUpdateResult.acknowledged) {
                                log(`Failed to update totalUndoDislikedCount (of ICommetComprehensive, comment id: ${id}) in [C] commentComprehensive`);
                            }
                        }
                        if ('post' === category) {
                            // [post] Step #2 totalCreationUndoDislikedCount (of IMemberStatistics) in [C] memberStatistics (of the post author, a.k.a., notified member)
                            const postAuthorStatisticsUpdateResult = await memberStatisticsCollectionClient.updateOne({ memberId: notifiedMemberId }, { $inc: { totalCreationUndoDislikedCount: 1 } });
                            if (!postAuthorStatisticsUpdateResult.acknowledged) {
                                log(`Failed to update totalCreationUndoDislikedCount (of IMemberStatistics, member id: ${notifiedMemberId}) in [C] memberStatistics`);
                            }
                            // [post] Step #3 update totalUndoDislikedCount (of IPostComprehensive) in [C] postComprehensive
                            const commentComprehensiveUpdateResult = await postComprehensiveCollectionClient.updateOne({ postId }, { $inc: { totalUndoDislikedCount: 1 } });
                            if (!commentComprehensiveUpdateResult.acknowledged) {
                                log(`Failed to update totalUndoDislikedCount (of IPostComprehensive, post id: ${postId}) in [C] postComprehensive`);
                            }
                        }
                    }
                }
            }
            //// Update statistics ////
            // Case [Like]
            if (1 === attitude) {
                // Step #1 update totalLikedCount (of IMemberStatistics) in [C] memberStatistics
                const memberStatisticsCollectionClient = atlasDbClient.db('statistics').collection<IMemberStatistics>('member');
                const memberStatisticsUpdateResult = await memberStatisticsCollectionClient.updateOne({ memberId }, {
                    $inc: {
                        totalLikedCount: 1
                    }
                });
                if (!memberStatisticsUpdateResult.acknowledged) {
                    log(`Failed to update total totalLikedCount (of IMemberStatistics, member id: ${memberId}) in [C] memberStatistics`);
                }
                if (['comment', 'subcomment'].includes(category)) {
                    // [comment] Step #2 update totalCommentLikedCount (of IMemberStatistics) in [C] memberStatistics (of the comment author, a.k.a, notified member)
                    const commentAuthorStatisticsUpdateResult = await memberStatisticsCollectionClient.updateOne({ memberId: notifiedMemberId }, { $inc: { totalCommentLikedCount: 1 } });
                    if (!commentAuthorStatisticsUpdateResult.acknowledged) {
                        log(`Failed to update total totalCommentLikedCount (of IMemberStatistics, member id: ${notifiedMemberId}) in [C] memberStatistics`);
                    }
                    // [comment] Step #3 update totalLikedCount (of ICommetComprehensive) in [C] commentComprehensive
                    const commentComprehensiveUpdateResult = await commentComprehensiveCollectionClient.updateOne({ commentId: id }, { $inc: { totalLikedCount: 1 } });
                    if (!commentComprehensiveUpdateResult.acknowledged) {
                        log(`Failed to update totalLikedCount (of ICommetComprehensive in [C] commentComprehensive`);
                    }
                }
                if ('post' === category) {
                    // [post] Step #2 update totalCreationLikedCount (of IMemberStatistics) in [C] memberStatistics (of the post author, a.k.a, notified member)
                    const commentAuthorStatisticsUpdateResult = await memberStatisticsCollectionClient.updateOne({ memberId: notifiedMemberId }, { $inc: { totalCreationLikedCount: 1 } });
                    if (!commentAuthorStatisticsUpdateResult.acknowledged) {
                        log(`Failed to update total totalCreationLikedCount (of IMemberStatistics, member id: ${notifiedMemberId}) in [C] memberStatistics`);
                    }
                    // [post] Step #3 update totalLikedCount (of IPostComprehensive) in [C] postComprehensive
                    const postComprehensiveUpdateResult = await postComprehensiveCollectionClient.updateOne({ postId }, { $inc: { totalLikedCount: 1 } });
                    if (!postComprehensiveUpdateResult.acknowledged) {
                        log(`Failed to update totalLikedCount (of IPostComprehensive, post id: ${postId}) in [C] postComprehensive`);
                    }
                    // [post] Step #4 update totalLikedCount (of IChannelStatistics) in [C] channelStatistics
                    const { channelId } = postComprehensiveQueryResult;
                    const channelStatisticsCollectionClient = atlasDbClient.db('statistics').collection<IChannelStatistics>('channel');
                    const channelStatisticsUpdateResult = await channelStatisticsCollectionClient.updateOne({ channelId }, { $inc: { totalLikedCount: 1 } });
                    if (!channelStatisticsUpdateResult.acknowledged) {
                        log(`Failed to update totalLikedCount (of IChannelStatistics, channel id: ${channelId}) in [C] channelStatistics`);
                    }
                    // [post] Step #5 (cond.) totalLikedCount (of ITopicComprehensive) in [C] topicComprehensive
                    const { topicIdsArr } = postComprehensiveQueryResult;
                    if (Array.isArray(topicIdsArr) && topicIdsArr.length !== 0) {
                        const topicComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<ITopicComprehensive>('topic');
                        for await (const topicId of topicIdsArr) {
                            const topicComprehensiveUpdateResult = await topicComprehensiveCollectionClient.updateOne({ topicId }, { $inc: { totalLikedCount: 1 } });
                            if (!topicComprehensiveUpdateResult.acknowledged) {
                                log(`Failed to update totalLikedCount (of ITopicComprehensive, topic id: ${topicId}) in [C] topicComprehensive`);
                            }
                        }
                    }
                }
                // Handle notice.like ////
                const { title } = memberComprehensiveQueryResult;
                let content: string | undefined;
                if (['comment', 'subcomment'].includes(category)) {
                    const commentComprehensiveQueryResult = await commentComprehensiveCollectionClient.findOne({ commentId: id });
                    content = commentComprehensiveQueryResult?.content;
                }
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
                        PostId: postId,
                        PostTitle: title,
                        CommentId: 'post' === category ? undefined : id,
                        CommentBrief: getContentBrief(content)
                    }, 'Replace');
                    // Step #5 update like (of INotificationStatistics, of post or comment author) in [C] notificationStatistics
                    const notificationStatisticsCollectionClient = atlasDbClient.db('statistics').collection<INotificationStatistics>('notification');
                    const notificationStatisticsUpdateResult = await notificationStatisticsCollectionClient.updateOne({ memberId: notifiedMemberId }, { $inc: { like: 1 } });
                    if (!notificationStatisticsUpdateResult.acknowledged) {
                        log(`Failed to update like (of INotificationStatistics, member id: ${notifiedMemberId}) in [C] notificationStatistics`);
                    }
                }
            }
            // Case [Disike]
            if (-1 === attitude) {
                // Step #1 update totalDislikedCount (of IMemberStatistics) in [C] memberStatistics
                const memberStatisticsCollectionClient = atlasDbClient.db('statistics').collection<IMemberStatistics>('member');
                const memberStatisticsUpdateResult = await memberStatisticsCollectionClient.updateOne({ memberId }, { $inc: { totalDislikedCount: 1 } });
                if (!memberStatisticsUpdateResult.acknowledged) {
                    log(`Failed to update totalDislikedCount (of IMemberStatistics, member id: ${memberId}) in [C] memberStatistics`);
                }
                if (['comment', 'subcomment'].includes(category)) {
                    // [comment] Step #2 update totalCommentDislikedCount (of IMemberStatistics) [C] memberStatistics (of the comment author, a.k.a, notified member)
                    const commentAuthorStatisticsUpdateResult = await memberStatisticsCollectionClient.updateOne({ memberId: notifiedMemberId }, { $inc: { totalCommentDislikedCount: 1 } });
                    if (!commentAuthorStatisticsUpdateResult.acknowledged) {
                        log(`Failed to update totalCommentDislikedCount (of IMemberStatistics, member id: ${notifiedMemberId}) in [C] memberStatistics`);
                    }
                    // [comment] Step #3 update totalDislikedCount in (of ICommet/ISubcommentComprehensive) in [C] comment/subcommentComprehensive
                    const commentComprehensiveUpdateResult = await commentComprehensiveCollectionClient.updateOne({ commentId: id }, { $inc: { totalDislikedCount: 1 } });
                    if (!commentComprehensiveUpdateResult.acknowledged) {
                        log(`Failed to update totalDislikedCount (of ICommetComprehensive, comment id: ${id}) in [C] commentComprehensive`);
                    }
                }
                if ('post' === category) {
                    // [post] Step #2 update totalCreationDislikedCount (of IMemberStatistics) [C] memberStatistics (of the comment author, a.k.a, notified member)
                    const postAuthorStatisticsUpdateResult = await memberStatisticsCollectionClient.updateOne({ memberId: notifiedMemberId }, { $inc: { totalCreationDislikedCount: 1 } });
                    if (!postAuthorStatisticsUpdateResult.acknowledged) {
                        log(`Failed to update totalCreationDislikedCount (of IMemberStatistics, member id: ${notifiedMemberId}) in [C] memberStatistics`);
                    }
                    // [post] Step #3 update totalDislikedCount in (of IPostComprehensive) in [C] postComprehensive
                    const commentComprehensiveUpdateResult = await postComprehensiveCollectionClient.updateOne({ postId }, { $inc: { totalDislikedCount: 1 } });
                    if (!commentComprehensiveUpdateResult.acknowledged) {
                        log(`Failed to update totalDislikedCount (of IPostComprehensive, post id: ${postId}) in [C] postComprehensive`);
                    }
                }
            }
            await atlasDbClient.close();
            return;
        }
    } catch (e: any) {
        let msg;
        if (e instanceof RestError) {
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