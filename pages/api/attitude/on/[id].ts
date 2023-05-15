import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import { RestError } from '@azure/data-tables';
import { MongoError } from 'mongodb';

import AzureTableClient from '../../../../modules/AzureTableClient';
import AtlasDatabaseClient from "../../../../modules/AtlasDatabaseClient";

import { getContentBrief, logWithDate, response405, response500 } from '../../../../lib/utils/general';
import { verifyId } from '../../../../lib/utils/verify';
import { IMemberComprehensive, IMemberStatistics } from '../../../../lib/interfaces/member';
import { IAttitudeComprehensive } from '../../../../lib/interfaces/attitude';
import { createAttitudeComprehensive, getMappingFromAttitudeComprehensive, provideAttitudeComprehensiveUpdate } from '../../../../lib/utils/for/attitude';
import { ICommentComprehensive } from '../../../../lib/interfaces/comment';
import { IPostComprehensive } from '../../../../lib/interfaces/post';
import { IChannelStatistics } from '../../../../lib/interfaces/channel';
import { ITopicComprehensive } from '../../../../lib/interfaces/topic';
import { INoticeInfo, INotificationStatistics } from '../../../../lib/interfaces/notification';
import { createNoticeId, getTimeBySecond } from '../../../../lib/utils/create';
import { getNicknameFromToken } from '../../../../lib/utils/for/member';

const fnn = `${GetOrPostAttitudeOnPostOrCommentById.name} (API)`;

/** 
 * This interface accepts GET and POST requests
 * 
 * Info required for GET method
 * -     recaptchaResponse: string (query string)
 * -     token: JWT
 * -     id: string (query, post id)
 * 
 * Info required for POST requests
 * -     recaptchaResponse: string (query string)
 * -     token: JWT
 * -     id: string (query, post or comment id)
 * -     attitude: number (body)
 * 
 * Concern about performance: 26/02/2023 (update: 09/05/2023: program updated)
 * 
 * [!] Deprecated & updated. There're 4 big 'if' blocks to fulfill the do/undo requests.
 * Always abstract the 4 blocks into a smaller 'if/else' block.
 * But there're only 2 (in 6) situations that will go through 2 'if' blocks.
 * Other 4 situations will only go through 1 'if' block, which is not affecting the performance much,
 * Hence the current solution.
 * 
 * Last update:
 * - 26/02/2023 v0.1.1
 * - 09/05/2023 v0.1.2
 */

export default async function GetOrPostAttitudeOnPostOrCommentById(req: NextApiRequest, res: NextApiResponse) {
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

            let mode: 'initiate' | 'revoke' | 'reverse' = 'initiate';
            let postId = id;
            let postTitle = '';
            let authorId = '';
            let commentBrief = '';

            const commentComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<ICommentComprehensive>('comment');

            // #1 verify entity id
            if (['comment', 'subcomment'].includes(category)) {
                // #1.1 (cond.) look up document (of ICommentComprehensive) in [C] commentComprehensive
                const commentComprehensiveQueryResult = await commentComprehensiveCollectionClient.findOne({ commentId: id }, {
                    projection: {
                        _id: 0,
                        status: 1,
                        postId: 1,
                        content: 1,
                    }
                });
                if (null === commentComprehensiveQueryResult) {
                    res.status(404).send('Comment not found');
                    await atlasDbClient.close();
                    return;
                }
                // #1.2 (cond.) verify comment status (of ICommentComprehensive)
                const { status: commentStatus } = commentComprehensiveQueryResult;
                if (0 > commentStatus) {
                    res.status(403).send('Method not allowed due to comment deleted');
                    await atlasDbClient.close();
                    return;
                }
                // #1.3 (cond.) assign post id
                postId = commentComprehensiveQueryResult.postId;
                // #1.4 (cond.) asign (comment) author id
                authorId = commentComprehensiveQueryResult.memberId;
                // #1.5 (cond.) prepare comment content brief
                commentBrief = getContentBrief(commentComprehensiveQueryResult.content);
            }

            // #2 verify post status
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
            // Post status good
            if ('post' === category) {
                postTitle = postComprehensiveQueryResult.title;
                // #2.1 (cond.) asign (post) author id
                authorId = postComprehensiveQueryResult.memberId;
            }

            let prevAttitude: number = 0;

            // #3 look up document (of IAttitudeComprehesive) in [C] attitudeComprehesive
            const attitudeComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IAttitudeComprehensive>('attitude');
            const attitudeComprehensiveQueryResult = await attitudeComprehensiveCollectionClient.findOne({ memberId, postId });
            if (null === attitudeComprehensiveQueryResult) {
                // Document not found, initiate attitude
                // #3A insert a new document (of IAttitudeComprehensive) in [C] attitudeComprehensive
                const attitudeComprehensiveInsertResult = await attitudeComprehensiveCollectionClient.insertOne(createAttitudeComprehensive(memberId, postId, id, attitude));
                if (!attitudeComprehensiveInsertResult.acknowledged) {
                    throw new Error(`Failed to insert document (of IAttitudeComprehensive, entity id: ${id}, member id: ${memberId}, post id: ${postId}) in [C] attitudeComprehensive`);
                }
            } else {
                // Document found, attitude on post
                if ('post' === category) {
                    prevAttitude = attitudeComprehensiveQueryResult.attitude ?? 0;
                }
                // Attitude on comment
                else {
                    prevAttitude = attitudeComprehensiveQueryResult.commentAttitudeMapping[id] ?? 0;
                }

                let attitudeUpdate: number = 0;

                // Revoke e.g., -1 => 0 (-1 === -1)
                if (prevAttitude === attitude) {
                    mode = 'revoke';
                }
                // Reverse e.g., 1 => -1 (0 > 1 * -1)
                else if (0 > prevAttitude * attitude) {
                    mode = 'reverse';
                    attitudeUpdate = -prevAttitude;
                }
                // Initiate e.g., 0 => 1
                else {
                    mode = 'initiate';
                    attitudeUpdate = attitude;
                }

                // #3B update attitude (of IAttitudeComprehensive) in [C] attitudeComprehensive
                const attitudeComprehensiveUpdateResult = await attitudeComprehensiveCollectionClient.updateOne({ memberId, postId }, { $set: provideAttitudeComprehensiveUpdate(id, attitudeUpdate) });
                if (!attitudeComprehensiveUpdateResult.acknowledged) {
                    throw new Error(`Failed to update attitude (of IAttitudeComprehensive, member id: ${memberId}, post id: ${postId}) in [C] attitudeComprehensive`);
                }
            }

            //// Response 200 ////
            res.status(200).send('Express attitude success');

            //// Update statistics ////

            type TStatisticsUpdate = {
                totalLikedCount?: number;
                totalUndoLikedCount?: number;
                totalDislikedCount?: number;
                totalUndoDislikedCount?: number;
            };

            type TAuthorStatisticsUpdate = {
                totalCreationLikedCount?: number;
                totalCreationUndoLikedCount?: number;
                totalCreationDislikedCount?: number;
                totalCreationUndoDislikedCount?: number;
                totalCommentLikedCount?: number;
                totalCommentUndoLikedCount?: number;
                totalCommentDislikedCount?: number;
                totalCommentUndoDislikedCount?: number;
            };

            let memberStatisticsUpdate: TStatisticsUpdate = {};
            let authorStatisticsUpdate: TAuthorStatisticsUpdate = {};
            let entityStatisticsUpdate: TStatisticsUpdate = {};
            let channelStatisticsUpdate: TStatisticsUpdate = {};
            let topicStatisticsUpdate: TStatisticsUpdate = {};

            if ('initiate' === mode) {

                if (attitude > 0) {
                    memberStatisticsUpdate['totalLikedCount'] = 1;
                    entityStatisticsUpdate['totalLikedCount'] = 1;
                } else {
                    memberStatisticsUpdate['totalDislikedCount'] = 1;
                    entityStatisticsUpdate['totalDislikedCount'] = 1;
                }

                if ('post' === category) {
                    if (attitude > 0) {
                        authorStatisticsUpdate['totalCreationLikedCount'] = 1;
                        channelStatisticsUpdate['totalLikedCount'] = 1;
                        topicStatisticsUpdate['totalLikedCount'] = 1;
                    } else {
                        authorStatisticsUpdate['totalCreationDislikedCount'] = 1;
                        channelStatisticsUpdate['totalDislikedCount'] = 1;
                        topicStatisticsUpdate['totalDislikedCount'] = 1;
                    }
                } else {
                    if (attitude > 0) {
                        authorStatisticsUpdate['totalCommentLikedCount'] = 1;
                    } else {
                        authorStatisticsUpdate['totalCommentDislikedCount'] = 1;
                    }
                }
            }

            if ('revoke' === mode) {

                if (attitude > 0) {
                    memberStatisticsUpdate['totalUndoLikedCount'] = 1;
                    entityStatisticsUpdate['totalUndoLikedCount'] = 1;
                } else {
                    memberStatisticsUpdate['totalUndoDislikedCount'] = 1;
                    entityStatisticsUpdate['totalUndoDislikedCount'] = 1;
                }

                if ('post' === category) {
                    if (attitude > 0) {
                        authorStatisticsUpdate['totalCreationUndoLikedCount'] = 1;
                        channelStatisticsUpdate['totalUndoLikedCount'] = 1;
                        topicStatisticsUpdate['totalUndoLikedCount'] = 1;
                    } else {
                        authorStatisticsUpdate['totalCreationUndoDislikedCount'] = 1;
                        channelStatisticsUpdate['totalUndoDislikedCount'] = 1;
                        topicStatisticsUpdate['totalUndoDislikedCount'] = 1;
                    }
                } else {
                    if (attitude > 0) {
                        authorStatisticsUpdate['totalCommentUndoLikedCount'] = 1;
                    } else {
                        authorStatisticsUpdate['totalCommentUndoDislikedCount'] = 1;
                    }
                }
            }

            if ('reverse' === mode) {

                if (attitude > 0) {
                    memberStatisticsUpdate['totalUndoDislikedCount'] = 1;
                    memberStatisticsUpdate['totalLikedCount'] = 1;
                    entityStatisticsUpdate['totalUndoDislikedCount'] = 1;
                    entityStatisticsUpdate['totalLikedCount'] = 1;
                } else {
                    memberStatisticsUpdate['totalUndoLikedCount'] = 1;
                    memberStatisticsUpdate['totalDislikedCount'] = 1;
                    entityStatisticsUpdate['totalUndoLikedCount'] = 1;
                    entityStatisticsUpdate['totalDislikedCount'] = 1;
                }

                if ('post' === category) {
                    if (attitude > 0) {
                        authorStatisticsUpdate['totalCreationUndoDislikedCount'] = 1;
                        authorStatisticsUpdate['totalCreationLikedCount'] = 1;
                        channelStatisticsUpdate['totalUndoDislikedCount'] = 1;
                        channelStatisticsUpdate['totalLikedCount'] = 1;
                        topicStatisticsUpdate['totalUndoDislikedCount'] = 1;
                        topicStatisticsUpdate['totalLikedCount'] = 1;
                    } else {
                        authorStatisticsUpdate['totalCreationUndoLikedCount'] = 1;
                        authorStatisticsUpdate['totalCreationDislikedCount'] = 1;
                        channelStatisticsUpdate['totalUndoLikedCount'] = 1;
                        channelStatisticsUpdate['totalDislikedCount'] = 1;
                        topicStatisticsUpdate['totalUndoLikedCount'] = 1;
                        topicStatisticsUpdate['totalDislikedCount'] = 1;
                    }
                } else {
                    if (attitude > 0) {
                        authorStatisticsUpdate['totalCommentUndoDislikedCount'] = 1;
                        authorStatisticsUpdate['totalCommentLikedCount'] = 1;
                    } else {
                        authorStatisticsUpdate['totalCommentUndoLikedCount'] = 1;
                        authorStatisticsUpdate['totalCommentDislikedCount'] = 1;
                    }
                }
            }

            // Update IMemberStatistics in [C] memberStatistics
            const memberStatisticsCollectionClient = atlasDbClient.db('statistics').collection<IMemberStatistics>('member');
            const memberStatisticsUpdateResult = await memberStatisticsCollectionClient.updateOne({ memberId }, { $inc: memberStatisticsUpdate });
            if (!memberStatisticsUpdateResult.acknowledged) {
                logWithDate(`Failed to update ${Object.keys(memberStatisticsUpdate).toString()} (of IMemberStatistics, member id: ${memberId}) in [C] memberStatistics`, fnn);
            }

            // Handle post related updates
            if ('post' === category) {
                // Update IMemberStatistics in [C] memberStatistics
                const postAuthorStatisticsUpdateResult = await memberStatisticsCollectionClient.updateOne({ memberId: authorId }, { $inc: authorStatisticsUpdate });
                if (!postAuthorStatisticsUpdateResult.acknowledged) {
                    logWithDate(`Failed to update ${Object.keys(authorStatisticsUpdate).toString()} (of IMemberStatistics, member id: ${authorId}) in [C] memberStatistics`, fnn);
                }

                // Update totalUndoLikedCount (of IPostComprehensive) in [C] postComprehensive
                const postComprehensiveUpdateResult = await postComprehensiveCollectionClient.updateOne({ postId }, { $inc: entityStatisticsUpdate });
                if (!postComprehensiveUpdateResult.acknowledged) {
                    logWithDate(`Failed to update ${Object.keys(entityStatisticsUpdate).toString()} (of IPostComprehensive, post id: ${postId}) in [C] postComprehensive`, fnn);
                }

                // Update totalUndoLikedCount (of IChannelStatistics) in [C] channelStatistics
                const { channelId } = postComprehensiveQueryResult;
                const channelStatisticsCollectionClient = atlasDbClient.db('statistics').collection<IChannelStatistics>('channel');
                const channelStatisticsUpdateResult = await channelStatisticsCollectionClient.updateOne({ channelId }, { $inc: channelStatisticsUpdate });
                if (!channelStatisticsUpdateResult.acknowledged) {
                    logWithDate(`Failed to update ${Object.keys(channelStatisticsUpdate).toString()} (of IChannelStatistics, channel id: ${channelId}) in [C] channelStatistics`, fnn);
                }

                // (Cond.) Update totalUndoLikedCount (of ITopicComprehensive) in [C] topicComprehensive 
                const { topicInfoArr } = postComprehensiveQueryResult;
                if (Array.isArray(topicInfoArr) && topicInfoArr.length !== 0) {
                    const topicComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<ITopicComprehensive>('topic');
                    for await (const topicId of topicInfoArr) {
                        const topicComprehensiveUpdateResult = await topicComprehensiveCollectionClient.updateOne({ topicId }, { $inc: topicStatisticsUpdate });
                        if (!topicComprehensiveUpdateResult.acknowledged) {
                            logWithDate(`Failed to update ${Object.keys(topicStatisticsUpdate).toString()} (of ITopicComprehensive, topic id: ${topicId}) in [C] topicComprehensive`, fnn);
                        }
                    }
                }
            }

            // Handle comment related updates
            else {
                // Update IMemberStatistics in [C] memberStatistics
                const commentAuthorStatisticsUpdateResult = await memberStatisticsCollectionClient.updateOne({ memberId: authorId }, { $inc: authorStatisticsUpdate });
                if (!commentAuthorStatisticsUpdateResult.acknowledged) {
                    logWithDate(`Failed to update ${Object.keys(authorStatisticsUpdate).toString()} (of IMemberStatistics, member id: ${authorId}) in [C] memberStatistics`, fnn);
                }

                // Update ICommentComprehensive in [C] commentComprehensive
                const commentComprehensiveUpdateResult = await commentComprehensiveCollectionClient.updateOne({ commentId: id }, { $inc: entityStatisticsUpdate });
                if (!commentComprehensiveUpdateResult.acknowledged) {
                    logWithDate(`Failed to update ${Object.keys(entityStatisticsUpdate).toString()}t (of ICommetComprehensive, comment id: ${id}) in [C] commentComprehensive`, fnn);
                }
            }

            // Handle notice ////
            if ('initiate' === mode && attitude > 0 && memberId !== authorId) {
                const blockingMemberMappingTableClient = AzureTableClient('BlockingMemberMapping');
                const blockingMemberMappingQuery = blockingMemberMappingTableClient.listEntities({ queryOptions: { filter: `PartitionKey eq '${authorId}' and RowKey eq '${memberId}'` } });
                //// [!] attemp to reterieve entity makes the probability of causing RestError ////
                const blockingMemberMappingQueryResult = await blockingMemberMappingQuery.next();
                if (!blockingMemberMappingQueryResult.value) {
                    //// [!] member who has expressed attitude has not been blocked by comment author ////
                    // Upsert record (of INoticeInfo.Liked) in [PRL] Notice
                    const noticeTableClient = AzureTableClient('Notice');
                    await noticeTableClient.upsertEntity<INoticeInfo>({
                        partitionKey: authorId, // notified member id, in this case, comment author
                        rowKey: createNoticeId('like', memberId, postId, id), // combined id
                        Category: 'like',
                        InitiateId: memberId,
                        Nickname: getNicknameFromToken(token),
                        PostTitle: postTitle,
                        CommentBrief: commentBrief,
                        CreatedTimeBySecond: getTimeBySecond(),
                    }, 'Replace');
                    // Update like (of INotificationStatistics, of post or comment author) in [C] notificationStatistics
                    const notificationStatisticsCollectionClient = atlasDbClient.db('statistics').collection<INotificationStatistics>('notification');
                    const notificationStatisticsUpdateResult = await notificationStatisticsCollectionClient.updateOne({ memberId: authorId }, { $inc: { like: 1 } });
                    if (!notificationStatisticsUpdateResult.acknowledged) {
                        logWithDate(`Failed to update like (of INotificationStatistics, member id: ${authorId}) in [C] notificationStatistics`, fnn);
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
        logWithDate(msg, fnn, e);
        await atlasDbClient.close();
        return;
    }
}