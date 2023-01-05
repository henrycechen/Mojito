import type { NextApiRequest, NextApiResponse } from 'next';
import { MongoError } from 'mongodb';
import { getToken } from 'next-auth/jwt'

import AzureTableClient from '../../../../../modules/AzureTableClient';
import AtlasDatabaseClient from "../../../../../modules/AtlasDatabaseClient";

import { INoticeInfo, INotificationStatistics, IMemberStatistics, IAttitudeComprehensive, ICommentComprehensive, IChannelStatistics, ITopicComprehensive, ITopicPostMapping, IPostComprehensive } from '../../../../../lib/interfaces';

import { MemberInfo } from '../../../../../lib/types';
import { getRandomIdStr, getRandomIdStrL, getNicknameFromToken, getMappingFromAttitudeComprehensive, getRestrictedFromCommentComprehensive, getTopicBase64StringsArrayFromRequestBody, getImageUrlsArrayFromRequestBody, getParagraphsArrayFromRequestBody, verifyId, response405, response500, log } from '../../../../../lib/utils';


export default async function AttitudeOnPost(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;
    if (!['GET', 'POST'].includes(method ?? '')) {
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
    const { isValid, category, id } = verifyId(req.query?.id);
    if (!isValid) {
        res.status(400).send('Invalid post, comment or subcomment id');
        return;
    }








    //// Verify post id and comment id ////
    if (!('string' === typeof postId && verifyId(postId, 16))) {
        res.status(400).send('Invalid post id');
        return;
    }
    //// Declare DB client ////
    const atlasDbClient = AtlasDatabaseClient();
    try {
        atlasDbClient.connect();
        // Look up post status (of IPostComprehensive) in [C] postComprehensive
        const postComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IPostComprehensive>('post');
        const postComprehensiveQueryResult = await postComprehensiveCollectionClient.findOne({ postId });
        if (null === postComprehensiveQueryResult) {
            res.status(404).send('Post not found');
            await atlasDbClient.close();
            return;
        }
        const { sub: memberId } = token;

        //// GET | attitude mapping ////
        if ('GET' === method) {
            const attitudeComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IAttitudeComprehensive>('attitude');
            const attitudeComprehensiveQueryResult = await attitudeComprehensiveCollectionClient.findOne({ memberId, postId });
            res.status(200).send(getMappingFromAttitudeComprehensive(attitudeComprehensiveQueryResult));
            await atlasDbClient.close();
            return;
        }
        const { attitude } = req.body;
        if (!('number' === typeof attitude && [-1, 0, 1].includes(attitude))) {
            res.status(400).send('Improper or null attitude value');
            await atlasDbClient.close();
            return;
        }
        //// Verify post status ////
        const { status: postStatus } = postComprehensiveQueryResult;
        if (0 > postStatus) {
            res.status(405).send('Method not allowed due to post deleted');
            await atlasDbClient.close();
            return;
        }

        //// POST | attitude value ////
        if ('POST' === method) {
            // look up document (of IAttitudeComprehensive) in [C] attitudeComprehensive
            const attitudeComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IAttitudeComprehensive>('attitude');
            const attitudeComprehensiveQueryResult = await attitudeComprehensiveCollectionClient.findOne({ memberId, postId });
            // Case A document not found
            if (null === attitudeComprehensiveQueryResult) {
                const attitudeComprehensiveInsertResult = await attitudeComprehensiveCollectionClient.insertOne({
                    memberId,
                    postId,
                    attitude,
                    commentAttitudeMapping: {},
                    subcommentAttitudeMapping: {}
                });
                if (!attitudeComprehensiveInsertResult.acknowledged) {
                    throw new Error(`Failed to insert document (of IAttitudeComprehensive, member id: ${memberId}, post id: ${postId}) in [C] attitudeComprehensive`);
                }
                res.status(200).send('Express attitude success');

                //// Update statistics ////

                const { memberId: memberId_post } = postComprehensiveQueryResult;
                // Case A with negative (+) attitude
                if (-1 === attitude) {
                    // Step #A+1 Update total creation disliked count in [C] memberStatistics
                    const memberStatisticsCollectionClient = atlasDbClient.db('statistics').collection<IMemberStatistics>('member');
                    const memberStatisticsUpdateResult = await memberStatisticsCollectionClient.updateOne({ memberId_post }, {
                        $inc: {
                            totalCreationDislikedCount: 1
                        }
                    });
                    if (!memberStatisticsUpdateResult.acknowledged) {
                        log(`Failed to update totalCreationDislikedCount (of IMemberStatistics, member id: ${memberId_post}) in [C] memberStatistics`);
                    }
                    // Step #A+2 Update total disliked count in [C] postComprehensive
                    const postComprehensiveUpdateResult = await postComprehensiveCollectionClient.updateOne({ postId }, {
                        $inc: {
                            totalDislikedCount: 1
                        }
                    });
                    if (!postComprehensiveUpdateResult.acknowledged) {
                        log(`Failed to update totalDislikedCount (of IPostComprehensive, post id: ${postId}) in [C] postComprehensive`);
                    }
                }
                // Case A positive (-) attitude
                if (1 === attitude) {
                    // Step #A-1 Update total creation liked count in [C] memberStatistics
                    const memberStatisticsCollectionClient = atlasDbClient.db('statistics').collection<IMemberStatistics>('member');
                    const memberStatisticsUpdateResult = await memberStatisticsCollectionClient.updateOne({ memberId_post }, {
                        $inc: {
                            totalCreationLikedCount: 1
                        }
                    });
                    if (!memberStatisticsUpdateResult.acknowledged) {
                        log(`Failed to update total creationLikedCount (of IMemberStatistics, member id: ${memberId_post}) in [C] memberStatistics`);
                    }
                    // Step #A-2 Update total liked count in [C] postComprehensive
                    const postComprehensiveUpdateResult = await postComprehensiveCollectionClient.updateOne({ postId }, {
                        $inc: {
                            totalLlikedCount: 1
                        }
                    });
                    if (!postComprehensiveUpdateResult.acknowledged) {
                        log(`Failed to update totalLikedCount (of IPostComprehensive, post id: ${postId}) in [C] postComprehensive`);
                    }
                    // Step #A-3 Update total liked count in [C] channelStatistics
                    const { channelId } = postComprehensiveQueryResult;
                    const channelStatisticsCollectionClient = atlasDbClient.db('statistics').collection<IChannelStatistics>('channel');
                    const channelStatisticsUpdateResult = await channelStatisticsCollectionClient.updateOne({ channelId }, {
                        $inc: {
                            totalLlikedCount: 1
                        }
                    });
                    if (!channelStatisticsUpdateResult.acknowledged) {
                        log(`Failed to update totalLikedCount (of IChannelStatistics, channel id: ${channelId}) in [C] channelStatistics`);
                    }
                    // Step #A-4 (cond.) update total liked count in [C] topicComprehensive
                    const { topicIdsArr } = postComprehensiveQueryResult;
                    if (Array.isArray(topicIdsArr) && topicIdsArr.length !== 0) {
                        const topicComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<ITopicComprehensive>('topic');
                        for await (const topicId of topicIdsArr) {
                            const topicComprehensiveUpdateResult = await topicComprehensiveCollectionClient.updateOne({ topicId }, {
                                $inc: {
                                    totalLlikedCount: 1
                                }
                            }, { upsert: true });
                            if (!topicComprehensiveUpdateResult.acknowledged) {
                                log(`Failed to update totalLlikedCount (of ITopicComprehensive, topic id: ${topicId}) in [C] topicComprehensive`);
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
                        //// [!] comment author has not been blocked by post author ////
                        // Step #A-5 upsert record (INoticeInfo.Liked) in [PRL] Notice
                        const noticeTableClient = AzureTableClient('Notice');
                        await noticeTableClient.upsertEntity<INoticeInfo>({
                            partitionKey: memberId_post,
                            rowKey: postId, // entity id
                            Category: 'Liked',
                            InitiateId: memberId,
                            Nickname: getNicknameFromToken(token),
                            PostId: postId,
                            PostTitle: title
                            // CommentId: commentId,
                            // CommentBrief: getContentBrief(content)
                        }, 'Merge');
                        // Step #A-6 update likedCount (of INotificationStatistics, of post author) in [C] notificationStatistics
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
                await atlasDbClient.close();
                return;
            }

            // Step #B1 document is found (of IAttitudeComprehensive)

            {
                const { editTime } = attitudeComprehensiveQueryResult;




                const { attitude: attitude_prev } = attitudeComprehensiveQueryResult;
                const attitudeComprehensiveUpdateResult = await attitudeComprehensiveCollectionClient.updateOne({ memberId, postId }, { attitude });
                if (!attitudeComprehensiveUpdateResult.acknowledged) {
                    throw new Error(`Failed to update attitude (of IAttitudeComprehensive, member id: ${memberId}, post id: ${postId}) in [C] attitudeComprehensive`);
                }
            }


            res.status(200).send('');
            await atlasDbClient.close();
            return;
        }
    } catch (e: any) {

    }

    await atlasDbClient.close();

    res.send('attitude on comment, ok');
}