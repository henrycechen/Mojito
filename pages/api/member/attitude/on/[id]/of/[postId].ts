import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt'
import { RestError } from '@azure/data-tables';
import { MongoError } from 'mongodb';

import AzureTableClient from '../../../../../../../modules/AzureTableClient';
import AtlasDatabaseClient from "../../../../../../../modules/AtlasDatabaseClient";

import { INoticeInfo, INotificationStatistics, IMemberStatistics, IAttitudeComprehensive, ICommentComprehensive, IChannelStatistics, ITopicComprehensive, ITopicPostMapping, IPostComprehensive } from '../../../../../../../lib/interfaces';

import { MemberInfo } from '../../../../../../../lib/types';
import { getRandomIdStr, getRandomIdStrL, getNicknameFromToken, getContentBrief, getMappingFromAttitudeComprehensive, getRestrictedFromCommentComprehensive, getTopicBase64StringsArrayFromRequestBody, getImageUrlsArrayFromRequestBody, getParagraphsArrayFromRequestBody, verifyId, response405, response500, log } from '../../../../../../../lib/utils';

// This interface only accepts POST requests
//
// Info required:
// - token: JWT
// - id: string (comment / subcomment id)
// - postId: string (query, POST only)
// - attitude: number (body, POST only)

export default async function AttitudeOnComment(req: NextApiRequest, res: NextApiResponse) {
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
    const { isValid, category, id: commentId } = verifyId(req.query?.id);
    //// Verify comment / subcomment id ////
    if (!isValid) {
        res.status(400).send('Invalid comment or subcomment id');
        return;
    }
    const { isValid: isValidPostId, id: postId } = verifyId(req.query?.id);
    //// Verify post id ////
    if (!isValidPostId) {
        res.status(400).send('Invalid post id');
        return;
    }
    //// Verify attitude ////
    const { attitude } = req.body;
    if (!('number' === typeof attitude && [-1, 0, 1].includes(attitude))) {
        res.status(400).send('Improper or null attitude value');
        return;
    }
    //// Declare DB client ////
    const atlasDbClient = AtlasDatabaseClient();
    try {
        atlasDbClient.connect();
        // Step #1.1 prepare member id
        const { sub: memberId } = token;
        // Step #1.2 look up document (of IMemberComprehensive) in [C] memberComprehensive
        const memberComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IMemberStatistics>('member');
        const memberComprehensiveQueryResult = await memberComprehensiveCollectionClient.findOne({ memberId });
        if (null === memberComprehensiveQueryResult) {
            throw new Error(`Member was trying expressing attitude but have no document (of IMemberComprehensive, member id: ${memberId}) in [C] memberComprehensive`);
        }
        // Step #1.3 verify member status (of IMemberComprehensive)
        const { status: memberStatus } = memberComprehensiveQueryResult;
        if (0 > memberStatus) {
            res.status(403).send('Method not allowed due to member suspended');
            await atlasDbClient.close();
            return;
        }
        // Step #2.1 look up document (of IPostComprehensive) in [C] postComprehensive
        const postComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IPostComprehensive>('post');
        const postComprehensiveQueryResult = await postComprehensiveCollectionClient.findOne({ postId });
        if (null === memberComprehensiveQueryResult) {
            res.status(404).send('Post not found');
            await atlasDbClient.close();
            return;
        }
        // Step #2.2 verify post status (of IPostComprehensive)
        const { status: postStatus } = memberComprehensiveQueryResult;
        if (0 > postStatus) {
            res.status(403).send('Method not allowed due to post deleted');
            await atlasDbClient.close();
            return;
        }
        // Step #3.1 look up document (of IPostComprehensive) in [C] postComprehensive
        const commentComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection(category);
        const commentComprehensiveQueryResult = await commentComprehensiveCollectionClient.findOne({ commentId: commentId });
        if (null === commentComprehensiveQueryResult) {
            res.status(404).send('Comment not found');
            await atlasDbClient.close();
            return;
        }
        // Step #3.2 verify comment status (of IPostComprehensive)
        const { status: commentStatus } = commentComprehensiveQueryResult;
        if (0 > commentStatus) {
            res.status(403).send('Method not allowed due to comment deleted');
            await atlasDbClient.close();
            return;
        }
        //// Status all good, prepare member id (of comment author) ////
        const { memberId: memberId_comment } = commentComprehensiveQueryResult;
        // Step #4 look up document (of IAttitudeComprehensive) in [C] attitudeComprehensive
        const attitudeComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IAttitudeComprehensive>('attitude');
        const attitudeComprehensiveQueryResult = await attitudeComprehensiveCollectionClient.findOne({ memberId, postId });
        if (null !== attitudeComprehensiveQueryResult) {
            // Case [Change attitude]
            const attitude_prev = attitudeComprehensiveQueryResult.commentAttitudeMapping[commentId];
            if ('number' === typeof attitude_prev && attitude_prev !== attitude) {
                // Step #4 update attitude (of IAttitudeComprehensive) in [C] attitudeComprehensive
                const attitudeComprehensiveUpdateResult = await attitudeComprehensiveCollectionClient.updateOne({ memberId, postId }, {
                    $set: {
                        [`commentAttitudeMapping.${commentId}`]: attitude
                    }
                });
                if (!attitudeComprehensiveUpdateResult.acknowledged) {
                    throw new Error(`Failed to update attitude (of IAttitudeComprehensive, member id: ${memberId}, post id: ${postId}, comment id: ${commentId}) in [C] attitudeComprehensive`);
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
                    // Step #2 totalCommentUndoLikedCount (of IMemberStatistics) in [C] memberStatistics (of the comment author)
                    const commentAuthorStatisticsUpdateResult = await memberStatisticsCollectionClient.updateOne({ memberId: memberId_comment }, {
                        $inc: {
                            totalCommentUndoLikedCount: 1
                        }
                    });
                    if (!commentAuthorStatisticsUpdateResult.acknowledged) {
                        log(`Failed to update totalCommentUndoLikedCount (of IMemberStatistics, member id: ${memberId_comment}) in [C] memberStatistics`);
                    }
                    // Step #3 totalUndoLikedCount (of IComment/ISubcommentComprehensive) in [C] comment/subcommentComprehensive
                    const commentComprehensiveUpdateResult = await commentComprehensiveCollectionClient.updateOne({ postId }, {
                        $inc: {
                            totalUndoLikedCount: 1
                        }
                    });
                    if (!commentComprehensiveUpdateResult.acknowledged) {
                        log(`Failed to update totalUndoLikedCount (of ${'comment' === category ? 'ICommetComprehensive' : 'ISubcommentComprehensive'}, comment id: ${commentId}) in [C] ${'comment' === category ? 'commentComprehensive' : 'subcommentComprehensive'}`);
                    }
                }
                //// Case [Undo dislike]
                if (-1 === attitude_prev) {
                    // Step #1 totalUndoDislikedCount (of IMemberStatistics) in [C] memberStatistics
                    const memberStatisticsCollectionClient = atlasDbClient.db('statistics').collection<IMemberStatistics>('member');
                    const memberStatisticsUpdateResult = await memberStatisticsCollectionClient.updateOne({ memberId }, {
                        $inc: {
                            totalUndoDislikedCount: 1
                        }
                    });
                    if (!memberStatisticsUpdateResult.acknowledged) {
                        log(`Failed to update total totalUndoDislikedCount (of IMemberStatistics, member id: ${memberId}) in [C] memberStatistics`);
                    }
                    // Step #2 totalCommentUndoDislikedCount (of IMemberStatistics) in [C] memberStatistics (of the comment author)
                    const commentAuthorStatisticsUpdateResult = await memberStatisticsCollectionClient.updateOne({ memberId: memberId_comment }, {
                        $inc: {
                            totalCommentUndoDislikedCount: 1
                        }
                    });
                    if (!commentAuthorStatisticsUpdateResult.acknowledged) {
                        log(`Failed to update totalCommentUndoDislikedCount (of IMemberStatistics, member id: ${memberId_comment}) in [C] memberStatistics`);
                    }
                    // Step #3 update totalUndoDislikedCount (of IComment/ISubcommentComprehensive) in [C] comment/subcommentComprehensive
                    const commentComprehensiveUpdateResult = await commentComprehensiveCollectionClient.updateOne({ postId }, {
                        $inc: {
                            totalUndoDislikedCount: 1
                        }
                    });
                    if (!commentComprehensiveUpdateResult.acknowledged) {
                        log(`Failed to update totalUndoDislikedCount (of ${'comment' === category ? 'ICommetComprehensive' : 'ISubcommentComprehensive'}, comment id: ${commentId}) in [C] ${'comment' === category ? 'commentComprehensive' : 'subcommentComprehensive'}`);
                    }
                }
            }
        } else {
            // Case [Express attitude]
            // Step #4 insert a new document (of IAttitudeComprehensive) in [C] attitudeComprehensive
            const attitudeComprehensiveInsertResult = await attitudeComprehensiveCollectionClient.insertOne({
                memberId,
                postId,
                attitude: 0,
                commentAttitudeMapping: { [commentId]: attitude }
            });
            if (!attitudeComprehensiveInsertResult.acknowledged) {
                throw new Error(`Failed to insert document (of IAttitudeComprehensive, member id: ${memberId}, post id: ${postId}, comment id: ${commentId}) in [C] attitudeComprehensive`);
            }
            res.status(200).send('Express attitude success');
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
            // Step #2 update totalCommentLikedCount (of IMemberStatistics) in [C] memberStatistics (of the comment author)
            const commentAuthorStatisticsUpdateResult = await memberStatisticsCollectionClient.updateOne({ memberId: memberId_comment }, {
                $inc: {
                    totalCommentLikedCount: 1
                }
            });
            if (!commentAuthorStatisticsUpdateResult.acknowledged) {
                log(`Failed to update total totalCommentLikedCount (of IMemberStatistics, member id: ${memberId_comment}) in [C] memberStatistics`);
            }
            // Step #3 update totalLikedCount (of ICommet/ISubcommentComprehensive) in [C] comment/subcommentComprehensive
            const commentComprehensiveUpdateResult = await commentComprehensiveCollectionClient.updateOne({ postId }, {
                $inc: {
                    totalLikedCount: 1
                }
            });
            if (!commentComprehensiveUpdateResult.acknowledged) {
                log(`Failed to update totalLikedCount (of ${'comment' === category ? 'ICommetComprehensive' : 'ISubcommentComprehensive'}, comment id: ${commentId}) in [C] ${'comment' === category ? 'commentComprehensive' : 'subcommentComprehensive'}`);
            }
            //// (Cond.) Handle notify.like ////
            const { title } = memberComprehensiveQueryResult;
            const { content } = commentComprehensiveQueryResult;
            const blockingMemberMappingTableClient = AzureTableClient('BlockingMemberMapping');
            const blockingMemberMappingQuery = blockingMemberMappingTableClient.listEntities({ queryOptions: { filter: `PartitionKey eq '${memberId_comment}' and RowKey eq '${memberId}'` } });
            //// [!] attemp to reterieve entity makes the probability of causing RestError ////
            const blockingMemberMappingQueryResult = await blockingMemberMappingQuery.next();
            if (!blockingMemberMappingQueryResult.value) {
                //// [!] member who has expressed attitude has not been blocked by comment author ////
                // Step #4 upsert record (of INoticeInfo.Liked) in [PRL] Notice
                const noticeTableClient = AzureTableClient('Notice');
                await noticeTableClient.upsertEntity<INoticeInfo>({
                    partitionKey: memberId_comment, // notified member id, in this case, comment author
                    rowKey: commentId, // entity id, in this case, comment id
                    Category: 'Liked',
                    InitiateId: memberId,
                    Nickname: getNicknameFromToken(token),
                    PostId: postId,
                    PostTitle: title,
                    CommentId: commentId,
                    CommentBrief: getContentBrief(content)
                }, 'Merge');
                // Step #5 update likedCount (of INotificationStatistics, of comment author) in [C] notificationStatistics
                const notificationStatisticsCollectionClient = atlasDbClient.db('statistics').collection<INotificationStatistics>('notification');
                const notificationStatisticsUpdateResult = await notificationStatisticsCollectionClient.updateOne({ memberId: memberId_comment }, {
                    $inc: {
                        likedCount: 1
                    }
                });
                if (!notificationStatisticsUpdateResult.acknowledged) {
                    log(`Failed to update likedCount (of INotificationStatistics, member id: ${memberId_comment}) in [C] notificationStatistics`);
                }
            }
        }
        // Case [Disike]
        if (-1 === attitude) {
            // Step #1 update totalDislikedCount (of IMemberStatistics) in [C] memberStatistics
            const memberStatisticsCollectionClient = atlasDbClient.db('statistics').collection<IMemberStatistics>('member');
            const memberStatisticsUpdateResult = await memberStatisticsCollectionClient.updateOne({ memberId }, {
                $inc: {
                    totalDislikedCount: 1
                }
            });
            if (!memberStatisticsUpdateResult.acknowledged) {
                log(`Failed to update totalDislikedCount (of IMemberStatistics, member id: ${memberId}) in [C] memberStatistics`);
            }
            // Step #2 update totalCommentDislikedCount (of IMemberStatistics) [C] memberStatistics  (of the comment author)
            const commentAuthorStatisticsUpdateResult = await memberStatisticsCollectionClient.updateOne({ memberId: memberId_comment }, {
                $inc: {
                    totalCommentDislikedCount: 1
                }
            });
            if (!commentAuthorStatisticsUpdateResult.acknowledged) {
                log(`Failed to update totalCommentDislikedCount (of IMemberStatistics, member id: ${memberId_comment}) in [C] memberStatistics`);
            }
            // Step #3 update totalDislikedCount in (of ICommet/ISubcommentComprehensive) in [C] comment/subcommentComprehensive
            const commentComprehensiveUpdateResult = await commentComprehensiveCollectionClient.updateOne({ postId }, {
                $inc: {
                    totalDislikedCount: 1
                }
            });
            if (!commentComprehensiveUpdateResult.acknowledged) {
                log(`Failed to update totalDislikedCount (of ${'comment' === category ? 'ICommetComprehensive' : 'ISubcommentComprehensive'}, comment id: ${commentId}) in [C] ${'comment' === category ? 'commentComprehensive' : 'subcommentComprehensive'}`);
            }
        }
        await atlasDbClient.close();
        return;
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