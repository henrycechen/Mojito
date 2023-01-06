import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt'
import { RestError } from '@azure/data-tables';
import { MongoError } from 'mongodb';

import AzureTableClient from '../../../../../../modules/AzureTableClient';
import AtlasDatabaseClient from "../../../../../../modules/AtlasDatabaseClient";

import { INoticeInfo, INotificationStatistics, IMemberStatistics, IAttitudeComprehensive, IChannelStatistics, ITopicComprehensive, IPostComprehensive } from '../../../../../../lib/interfaces';
import { getNicknameFromToken, getMappingFromAttitudeComprehensive, verifyId, response405, response500, log } from '../../../../../../lib/utils';

// This interface accepts GET and POST requests
//
// Info required:
// - token: JWT
// - id: string (post id)
// - attitude: number (body, POST only)

export default async function AttitudeOnPost(req: NextApiRequest, res: NextApiResponse) {
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
    const { isValid, category, id: postId } = verifyId(req.query?.id);
    //// Verify post id ////
    if (!isValid) {
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
        const { sub: memberId } = token;
        const memberComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IMemberStatistics>('member');
        const memberComprehensiveQueryResult = await memberComprehensiveCollectionClient.findOne({ memberId });
        if (null === memberComprehensiveQueryResult) {
            throw new Error(`Member was trying get attitude mapping or expressing attitude on a post but have no document (of IMemberComprehensive, member id: ${memberId}) in [C] memberComprehensive`);
        }
        const { status: memberStatus } = memberComprehensiveQueryResult;
        if (0 > memberStatus) {
            res.status(403).send('Method not allowed due to member suspended');
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
            const attitudeComprehensiveQueryResult = await attitudeComprehensiveCollectionClient.findOne({ memberId, postId });
            res.status(200).send(getMappingFromAttitudeComprehensive(attitudeComprehensiveQueryResult));
            await atlasDbClient.close();
            return;
        }
        //// POST | express attitude ////
        // Step #1.1 look up document (of IPostComprehensive) in [C] postComprehensive
        const postComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IPostComprehensive>('post');
        const postComprehensiveQueryResult = await postComprehensiveCollectionClient.findOne({ postId });
        if (null === postComprehensiveQueryResult) {
            res.status(404).send('Post not found');
            await atlasDbClient.close();
            return;
        }
        // Step #1.2 verify post status (of IPostComprehensive)
        const { status: postStatus } = postComprehensiveQueryResult;
        if (0 > postStatus) {
            res.status(403).send('Method not allowed due to post deleted');
            await atlasDbClient.close();
            return;
        }
        //// Status good, prepare member id (of post author) ////
        const { memberId: memberId_post } = postComprehensiveQueryResult;
        // Step #2 look up document (of IAttitudeComprehensive) in [C] attitudeComprehensive
        const attitudeComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IAttitudeComprehensive>('attitude');
        const attitudeComprehensiveQueryResult = await attitudeComprehensiveCollectionClient.findOne({ memberId, postId });
        if (null !== attitudeComprehensiveQueryResult) {
            // Case [Change attitude]
            const attitude_prev = attitudeComprehensiveQueryResult.attitude;
            if ('number' === typeof attitude_prev && attitude_prev !== attitude) {
                // Step #3 update attitude (of IAttitudeComprehensive) in [C] attitudeComprehensive
                const attitudeComprehensiveUpdateResult = await attitudeComprehensiveCollectionClient.updateOne({ memberId, postId }, { $set: { attitude } });
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
                    // Step #2 totalCreationUndoLikedCount (of IMemberStatistics) in [C] memberStatistics (of the post author)
                    const postAuthorStatisticsUpdateResult = await memberStatisticsCollectionClient.updateOne({ memberId: memberId_post }, {
                        $inc: {
                            totalCreationUndoLikedCount: 1
                        }
                    });
                    if (!postAuthorStatisticsUpdateResult.acknowledged) {
                        log(`Failed to update totalCreationUndoLikedCount (of IMemberStatistics, member id: ${memberId_post}) in [C] memberStatistics`);
                    }
                    // Step #3 totalUndoLikedCount (of IPostComprehensive) in [C] postComprehensive
                    const postComprehensiveUpdateResult = await postComprehensiveCollectionClient.updateOne({ postId }, {
                        $inc: {
                            totalUndoLikedCount: 1
                        }
                    });
                    if (!postComprehensiveUpdateResult.acknowledged) {
                        log(`Failed to update totalUndoLikedCount (of IPostComprehensive, post id: ${postId}) in [C] postComprehensive`);
                    }
                    // Step #4 totalUndoLikedCount (of IChannelStatistics) in [C] channelStatistics
                    const { channelId } = postComprehensiveQueryResult;
                    const channelStatisticsCollectionClient = atlasDbClient.db('statistics').collection<IChannelStatistics>('channel');
                    const channelStatisticsUpdateResult = await channelStatisticsCollectionClient.updateOne({ channelId }, {
                        $inc: {
                            totalUndoLikedCount: 1
                        }
                    });
                    if (!channelStatisticsUpdateResult.acknowledged) {
                        log(`Failed to update totalUndoLikedCount (of IChannelStatistics, channel id: ${channelId}) in [C] channelStatistics`);
                    }
                    // Step #5 (cond.) totalUndoLikedCount (of ITopicComprehensive) in [C] topicComprehensive
                    const { topicIdsArr } = postComprehensiveQueryResult;
                    if (Array.isArray(topicIdsArr) && topicIdsArr.length !== 0) {
                        const topicComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<ITopicComprehensive>('topic');
                        for await (const topicId of topicIdsArr) {
                            const topicComprehensiveUpdateResult = await topicComprehensiveCollectionClient.updateOne({ topicId }, {
                                $inc: {
                                    totalUndoLikedCount: 1
                                }
                            });
                            if (!topicComprehensiveUpdateResult.acknowledged) {
                                log(`Failed to update totalUndoLikedCount (of ITopicComprehensive, topic id: ${topicId}) in [C] topicComprehensive`);
                            }
                        }
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
                    // Step #2 totalCreationUndoDislikedCount (of IMemberStatistics) in [C] memberStatistics (of the post author)
                    const postAuthorStatisticsUpdateResult = await memberStatisticsCollectionClient.updateOne({ memberId: memberId_post }, {
                        $inc: {
                            totalCreationUndoDislikedCount: 1
                        }
                    });
                    if (!postAuthorStatisticsUpdateResult.acknowledged) {
                        log(`Failed to update totalCreationUndoDislikedCount (of IMemberStatistics, member id: ${memberId_post}) in [C] memberStatistics`);
                    }
                    // Step #3 update totalUndoDislikedCount (of IComment/ISubcommentComprehensive) in [C] comment/subcommentComprehensive
                    const commentComprehensiveUpdateResult = await postComprehensiveCollectionClient.updateOne({ postId }, {
                        $inc: {
                            totalUndoDislikedCount: 1
                        }
                    });
                    if (!commentComprehensiveUpdateResult.acknowledged) {
                        log(`Failed to update totalUndoDislikedCount (of IPostComprehensive) in [C] postComprehensive`);
                    }
                }
            }
        } else {
            // Case [Express attitude]
            // Step #3 insert a new document (of IAttitudeComprehensive) in [C] attitudeComprehensive
            const attitudeComprehensiveInsertResult = await attitudeComprehensiveCollectionClient.insertOne({
                memberId,
                postId,
                attitude: 0,
                commentAttitudeMapping: {}
            });
            if (!attitudeComprehensiveInsertResult.acknowledged) {
                throw new Error(`Failed to insert document (of IAttitudeComprehensive, member id: ${memberId}, post id: ${postId}) in [C] attitudeComprehensive`);
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
            // Step #2 update totalCreationLikedCount (of IMemberStatistics) in [C] memberStatistics (of the post author)
            const commentAuthorStatisticsUpdateResult = await memberStatisticsCollectionClient.updateOne({ memberId: memberId_post }, {
                $inc: {
                    totalCreationLikedCount: 1
                }
            });
            if (!commentAuthorStatisticsUpdateResult.acknowledged) {
                log(`Failed to update total totalCreationLikedCount (of IMemberStatistics, member id: ${memberId_post}) in [C] memberStatistics`);
            }
            // Step #3 update totalLikedCount (of IPostComprehensive) in [C] postComprehensive
            const commentComprehensiveUpdateResult = await postComprehensiveCollectionClient.updateOne({ postId }, {
                $inc: {
                    totalLikedCount: 1
                }
            });
            if (!commentComprehensiveUpdateResult.acknowledged) {
                log(`Failed to update totalLikedCount (of IPostComprehensive, post id: ${postId}) in [C] postComprehensive`);
            }
            // Step #4 update totalLikedCount (of IChannelStatistics) in [C] channelStatistics
            const { channelId } = postComprehensiveQueryResult;
            const channelStatisticsCollectionClient = atlasDbClient.db('statistics').collection<IChannelStatistics>('channel');
            const channelStatisticsUpdateResult = await channelStatisticsCollectionClient.updateOne({ channelId }, {
                $inc: {
                    totalLikedCount: 1
                }
            });
            if (!channelStatisticsUpdateResult.acknowledged) {
                log(`Failed to update totalLikedCount (of IChannelStatistics, channel id: ${channelId}) in [C] channelStatistics`);
            }
            // Step #5 (cond.) totalLikedCount (of ITopicComprehensive) in [C] topicComprehensive
            const { topicIdsArr } = postComprehensiveQueryResult;
            if (Array.isArray(topicIdsArr) && topicIdsArr.length !== 0) {
                const topicComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<ITopicComprehensive>('topic');
                for await (const topicId of topicIdsArr) {
                    const topicComprehensiveUpdateResult = await topicComprehensiveCollectionClient.updateOne({ topicId }, {
                        $inc: {
                            totalLikedCount: 1
                        }
                    });
                    if (!topicComprehensiveUpdateResult.acknowledged) {
                        log(`Failed to update totalLikedCount (of ITopicComprehensive, topic id: ${topicId}) in [C] topicComprehensive`);
                    }
                }
            }
            //// (Cond.) Handle notify.like ////
            const { title } = postComprehensiveQueryResult;
            const blockingMemberMappingTableClient = AzureTableClient('BlockingMemberMapping');
            const blockingMemberMappingQuery = blockingMemberMappingTableClient.listEntities({ queryOptions: { filter: `PartitionKey eq '${memberId_post}' and RowKey eq '${memberId}'` } });
            //// [!] attemp to reterieve entity makes the probability of causing RestError ////
            const blockingMemberMappingQueryResult = await blockingMemberMappingQuery.next();
            if (!blockingMemberMappingQueryResult.value) {
                //// [!] member who has expressed attitude has not been blocked by comment author ////
                // Upsert record (of INoticeInfo.Liked) in [PRL] Notice
                const noticeTableClient = AzureTableClient('Notice');
                await noticeTableClient.upsertEntity<INoticeInfo>({
                    partitionKey: memberId_post, // notified member id, in this case, post author
                    rowKey: postId, // entity id, in this case, post id
                    Category: 'Liked',
                    InitiateId: memberId,
                    Nickname: getNicknameFromToken(token),
                    PostId: postId,
                    PostTitle: title
                }, 'Merge');
                // Update likedCount (of INotificationStatistics, of comment author) in [C] notificationStatistics
                const notificationStatisticsCollectionClient = atlasDbClient.db('statistics').collection<INotificationStatistics>('notification');
                const notificationStatisticsUpdateResult = await notificationStatisticsCollectionClient.updateOne({ memberId: memberId_post }, {
                    $inc: {
                        likedCount: 1
                    }
                });
                if (!notificationStatisticsUpdateResult.acknowledged) {
                    log(`Failed to update likedCount (of INotificationStatistics, member id: ${memberId_post}) in [C] notificationStatistics`);
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
            // Step #2 update totalCreationDislikedCount  (of IMemberStatistics) [C] memberStatistics  (of the comment author)
            const postAuthorStatisticsUpdateResult = await memberStatisticsCollectionClient.updateOne({ memberId: memberId_post }, {
                $inc: {
                    totalCreationDislikedCount: 1
                }
            });
            if (!postAuthorStatisticsUpdateResult.acknowledged) {
                log(`Failed to update totalCreationDislikedCount (of IMemberStatistics, member id: ${memberId_post}) in [C] memberStatistics`);
            }
            // Step #3 update totalDislikedCount in (of ICommet/ISubcommentComprehensive) in [C] comment/subcommentComprehensive
            const commentComprehensiveUpdateResult = await postComprehensiveCollectionClient.updateOne({ postId }, {
                $inc: {
                    totalDislikedCount: 1
                }
            });
            if (!commentComprehensiveUpdateResult.acknowledged) {
                log(`Failed to update totalDislikedCount (of IPostComprehensive, post id: ${postId}) in [C] postComprehensive`);
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