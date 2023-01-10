import type { NextApiRequest, NextApiResponse } from 'next';
import { RestError } from '@azure/data-tables';
import { MongoError } from 'mongodb';

import { getToken } from 'next-auth/jwt';

import AzureTableClient from '../../../../../modules/AzureTableClient';
import AtlasDatabaseClient from '../../../../../modules/AtlasDatabaseClient';

import { INoticeInfo, IMemberPostMapping, INotificationStatistics, IMemberStatistics, IChannelStatistics, ITopicComprehensive, ITopicPostMapping, IPostComprehensive, IEditedPostComprehensive, IMemberComprehensive } from '../../../../../lib/interfaces';
import { getRandomIdStrL, getNicknameFromToken, getTopicBase64StringsArrayFromRequestBody, getRestrictedFromPostComprehensive, getImageUrlsArrayFromRequestBody, getParagraphsArrayFromRequestBody, verifyId, response405, response500, log, providePostComprehensiveUpdate, getCuedMemberInfoArrayFromRequestBody, provideEditedPostInfo, provideTopicComprehensive, createNoticeId } from '../../../../../lib/utils';

const domain = process.env.NEXT_PUBLIC_APP_DOMAIN;

/** This interface accepts GET, PUT and DELETE method
 * 
 * Post info required for GET method
 * - token: JWT
 * - title: string
 * - channelId: string
 * - topicsArr: string[] (body, optional)
 */

export default async function PostInfoById(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;
    if (!['GET', 'PUT', 'DELETE'].includes(method ?? '')) {
        response405(req, res);
        return;
    }
    const { isValid, id: postId } = verifyId(req.query?.postId);
    //// Verify post id ////
    if (!isValid) {
        res.status(400).send('Invalid post id');
        return;
    }
    //// Declare DB client ////
    const atlasDbClient = AtlasDatabaseClient();
    try {
        await atlasDbClient.connect();
        // Look up post status (IPostComprehensive) in [C] postComprehensive
        const postComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IPostComprehensive>('post');
        const postComprehensiveQueryResult = await postComprehensiveCollectionClient.findOne({ postId });
        if (null === postComprehensiveQueryResult) {
            res.status(404).send('Post not found');
            await atlasDbClient.close();
            return;
        }
        const token = await getToken({ req });
        const { memberId: authorId } = postComprehensiveQueryResult;
        //// GET | post info ////
        if ('GET' === method) {
            res.status(200).send(getRestrictedFromPostComprehensive(postComprehensiveQueryResult));
            //// Update mapping ////
            // Step #1 (cond.) upsert record (of IHistoryMapping, of the post viewer) in [RL] HistoryMapping 
            if (token && token?.sub) {
                //// [!] request post info with identity ///
                // Step #1.1 get viewer id
                const { sub: viewerId } = token;
                // Step #1.2 look up member status (od IMemberComprehensive) in [C] memberComprehensive
                const memberComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IMemberComprehensive>('member');
                const memberComprehensiveQueryResult = await memberComprehensiveCollectionClient.findOne({ memberId: viewerId });
                if (null === memberComprehensiveQueryResult) {
                    throw new Error(`Member was trying creating document (of IMemberPostMapping, browsing history, by viewing a post) but have no document (of IMemberComprehensive, member id: ${viewerId}) in [C] memberComprehensive`);
                }
                // Step #1.3 verify member status
                const { status: memberStatus } = memberComprehensiveQueryResult;
                if (0 < memberStatus) {
                    const historyMappingTableClient = AzureTableClient('HistoryMapping');
                    await historyMappingTableClient.upsertEntity<IMemberPostMapping>({ partitionKey: viewerId, rowKey: postId, IsActive: true }, 'Replace');
                }
            }
            //// Update statistics ////
            // Step #2 update totalCreationHitCount (of IMemberStatistics) in [C] memberStatistics
            const memberStatisticsCollectionClient = atlasDbClient.db('statistics').collection<IMemberStatistics>('member');
            const memberStatisticsUpdateResult = await memberStatisticsCollectionClient.updateOne({ memberId: authorId }, {
                $inc: {
                    totalCreationHitCount: 1
                }
            });
            if (!memberStatisticsUpdateResult.acknowledged) {
                log(`Failed to update totalCreationHitCount (of IMemberStatistics, member id: ${authorId}) in [C] memberStatistics`);
            }
            // Step #3 update totalHitCount (of IPostComprehensive) in [C] postComprehensive
            const postComprehensiveUpdateResult = await postComprehensiveCollectionClient.updateOne({ postId }, {
                $inc: {
                    totalHitCount: 1
                }
            });
            if (!postComprehensiveUpdateResult.acknowledged) {
                log(`Failed to update totalHitCount (of IPostComprehensive, post id: ${postId}) in [C] postComprehensive`);
            }
            // Step #4 update totalHitCount (of IChannelStatistics) in [C] channelStatistics
            const { channelId } = postComprehensiveQueryResult;
            const channelStatisticsCollectionClient = atlasDbClient.db('statistics').collection<IChannelStatistics>('channel');
            const channelStatisticsUpdateResult = await channelStatisticsCollectionClient.updateOne({ channelId }, {
                $inc: {
                    totalHitCount: 1
                }
            });
            if (!channelStatisticsUpdateResult.acknowledged) {
                log(`Failed to totalHitCount (of IChannelStatistics, channel id: ${channelId}) in [C] channelStatistics`);
            }
            // Step #5 (cond.) update totalHitCount (of ITopicComprehensive) in [C] topicComprehensive
            const { topicIdsArr } = postComprehensiveQueryResult;
            if (Array.isArray(topicIdsArr) && topicIdsArr.length !== 0) {
                const topicComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<ITopicComprehensive>('topic');
                for await (const topicId of topicIdsArr) {
                    const topicComprehensiveUpdateResult = await topicComprehensiveCollectionClient.updateOne({ topicId }, {
                        $inc: {
                            totalHitCount: 1
                        }
                    });
                    if (!topicComprehensiveUpdateResult.acknowledged) {
                        log(`Failed to update totalHitCount (of ITopicStatistics, topic id:${topicId}, post id: ${postId}) in [C] topicStatistics`);
                    }
                }
            }
            await atlasDbClient.close();
            return;
        }
        //// Verify identity ////
        if (!(token && token?.sub)) {
            res.status(400).send('Invalid identity');
            return;
        }
        //// Verify permission ////
        const { sub: memberId } = token;
        if (authorId !== memberId) {
            res.status(403).send('Identity lack permissions');
            return;
        }
        //// Verify member status ////
        const memberComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IMemberComprehensive>('member');
        const memberComprehensiveQueryResult = await memberComprehensiveCollectionClient.findOne({ memberId: authorId });
        if (null === memberComprehensiveQueryResult) {
            throw new Error(`Member was trying editing or deleting document (of IPostComprehensive) but have no document (of IMemberComprehensive, member id: ${authorId}) in [C] memberComprehensive`);
        }
        const { status: memberStatus, allowPosting } = memberComprehensiveQueryResult;
        if (!(0 < memberStatus && allowPosting)) {
            res.status(403).send('Method not allowed due to member suspended or deactivated');
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
        //// PUT | edit post ////
        if ('PUT' === method) {
            // Step #1.1 verify title
            const { title } = req.body;
            if (!('string' === typeof title && '' !== title)) {
                res.status(400).send('Improper or blank post title');
                return;
            }
            // Step #1.2 verify channel id
            const { channelId } = req.body;
            if (!('string' === typeof channelId && '' !== channelId)) {
                res.status(400).send('Improper channel id');
                await atlasDbClient.close();
                return;
            }
            const channelInfoTableClient = AzureTableClient('ChannelInfo');
            const channelInfoQuery = channelInfoTableClient.listEntities({ queryOptions: { filter: `PartitionKey eq 'Info' and RowKey eq '${channelId}' and IsActive eq true` } });
            // [!] attemp to reterieve entity makes the probability of causing RestError
            let channelInfoQueryResult = await channelInfoQuery.next();
            if (!channelInfoQueryResult.value) {
                res.status(400).send('Channel id not found');
                await atlasDbClient.close();
                return;
            }
            // Step #2 explicitly get topic id array and cued member info array
            const topicIdsArr = getTopicBase64StringsArrayFromRequestBody(req.body);
            const cuedMemberInfoArr = getCuedMemberInfoArrayFromRequestBody(req.body);
            // Step #3 update document (of IPostComprehensive) in [C] postComprehensive
            const postComprehensiveUpdateResult = await postComprehensiveCollectionClient.updateOne({ postId }, {
                $set: providePostComprehensiveUpdate(
                    title,
                    getImageUrlsArrayFromRequestBody(req.body),
                    getParagraphsArrayFromRequestBody(req.body),
                    cuedMemberInfoArr,
                    channelId,
                    topicIdsArr
                ),
                $inc: {
                    totalEditCount: 1
                },
                $push: {
                    edited: provideEditedPostInfo(postComprehensiveQueryResult)
                }
            });
            if (!postComprehensiveUpdateResult.acknowledged) {
                throw new Error(`Failed to update postInfo, totalEditCount and editedPostInfo (of IPostComprehensive, post id: ${postId}) in [C] postComprehensive`);
            }
            res.status(200).send('Edit post success');
            //// Update statistics ////
            // Step #4 update totalCreationEditCount (of IMemberStatistics) in [C] memberStatistics
            const memberStatisticsCollectionClient = atlasDbClient.db('statistics').collection<IMemberStatistics>('member');
            const memberStatisticsUpdateResult = await memberStatisticsCollectionClient.updateOne({ memberId: authorId }, {
                $inc: {
                    totalCreationEditCount: 1
                }
            });
            if (!memberStatisticsUpdateResult.acknowledged) {
                log(`Document (IPostComprehensive, post id: ${postId}) updated in [C] postComprehensive successfully but failed to update totalCreationEditCount (of IMemberStatistics, member id: ${authorId}) in [C] memberStatistics`);
            }
            // Step #5 (cond.) update totalPostCount (ITopicComprehensive) in [C] topicComprehensive
            if (topicIdsArr.length !== 0) {
                const _topicIdsArr = [];
                // Step #5.1 delete outdated mapping (ITopicPostMapping) in [C] topicPostMapping and collect topic ids that have mapping (with this post)
                const topicPostMappingCollectionClient = atlasDbClient.db('mapping').collection<ITopicPostMapping>('topic-post');
                const topicComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<ITopicComprehensive>('topic');
                const mappingQuery = topicPostMappingCollectionClient.find({ postId });
                let mappingQureyResult = await mappingQuery.next();
                while (null !== mappingQureyResult) {
                    const { topicId } = mappingQureyResult;
                    if (!topicIdsArr.includes(topicId)) {
                        // set mapping status to -1 (of ITopicPostMapping)
                        topicPostMappingCollectionClient.updateOne({ topicId, postId }, { $set: { status: -1 } });
                        // accumulate post delete count
                        topicComprehensiveCollectionClient.updateOne({ topicId }, { $inc: { totalPostDeleteCount: 1 } })
                    } else {
                        // collect the topic id that possesses mapping (with this post)
                        _topicIdsArr.push(topicId);
                    }
                }
                // Step #5.2 accumulate totalPostCount or create new mapping (ITopicPostMapping) for the topics that have no mapping (with this post) in [C] topicComprehensive
                for await (const topicId of topicIdsArr) {
                    if (!_topicIdsArr.includes(topicId)) {
                        // case document (of topicComprehensive) [found]
                        const topicComprehensiveQueryResult = await topicComprehensiveCollectionClient.findOneAndUpdate({ topicId }, { $inc: { totalPostCount: 1 } });
                        if (!topicComprehensiveQueryResult.ok) {
                            // case document (of topicComprehensive) [not found]
                            const topicComprehensiveUpdateResult = await topicComprehensiveCollectionClient.updateOne({ topicId }, { $set: provideTopicComprehensive(topicId, channelId) }, { upsert: true });
                            if (!topicComprehensiveUpdateResult.acknowledged) {
                                log(`Document (IPostComprehensive, post id: ${postId}) inserted in [C] postComprehensive successfully but failed to update totalPostCount (of ITopicComprehensive, topic id: ${topicId}) in [C] topicComprehensive`);
                            }
                        }
                        // Step (cond.) #5.3 insert a new document (of ITopicPostMapping) in [C] topicPostMapping
                        const topicPostMappingInsertResult = await topicPostMappingCollectionClient.updateOne({ topicId }, {
                            topicId,
                            postId,
                            channelId,
                            createdTime: new Date().getTime(),
                            status: 200
                        }, { upsert: true });
                        if (!topicPostMappingInsertResult.acknowledged) {
                            log(`Document (ITopicPostMapping, post id: ${postId}) inserted in [C] postComprehensive successfully but failed to insert document (of ITopicPostMapping, topic id: ${topicId}) in [C] topicPostMapping`);
                        }
                    }
                }
            }
            //// Handle notice.cue (cond.) ////
            // Step #6.1 verify cued member ids array
            if (cuedMemberInfoArr.length !== 0) {
                const blockingMemberMappingTableClient = AzureTableClient('BlockingMemberMapping');
                const notificationStatisticsCollectionClient = atlasDbClient.db('statistics').collection<INotificationStatistics>('notification');
                // Step #6.2 maximum 9 members are allowed to cued at one time (in one comment)
                const cuedMemberIdsArrSliced = cuedMemberInfoArr.slice(0, 9);
                for await (const cuedMemberInfo of cuedMemberIdsArrSliced) {
                    const { memberId: memberId_cued } = cuedMemberInfo;
                    // Step #6.3 look up record (of IMemberMemberMapping) in [RL] BlockingMemberMapping
                    const _blockingMemberMappingQuery = blockingMemberMappingTableClient.listEntities({ queryOptions: { filter: `PartitionKey eq '${memberId_cued}' and RowKey eq '${authorId}'` } });
                    //// [!] attemp to reterieve entity makes the probability of causing RestError ////
                    const _blockingMemberMappingQueryResult = await _blockingMemberMappingQuery.next();
                    if (!_blockingMemberMappingQueryResult.value) {
                        //// [!] comment author has not been blocked by cued member ////
                        // Step #6.4 upsert record (of INoticeInfo.Cued) in [PRL] Notice
                        const noticeTableClient = AzureTableClient('Notice');
                        noticeTableClient.upsertEntity<INoticeInfo>({
                            partitionKey: memberId_cued,
                            rowKey: createNoticeId('cue', authorId, postId), // combined id
                            Category: 'cue',
                            InitiateId: authorId,
                            Nickname: getNicknameFromToken(token),
                            PostId: postId,
                            PostTitle: title,
                        }, 'Replace');
                        // Step #7.4 update cue (INotificationStatistics) (of cued member) in [C] notificationStatistics
                        const notificationStatisticsUpdateResult = await notificationStatisticsCollectionClient.updateOne({ memberId: memberId_cued }, {
                            $inc: {
                                cue: 1
                            }
                        });
                        if (!notificationStatisticsUpdateResult.acknowledged) {
                            log(`Document (IPostComprehensive, post id: ${postId}) updated in [C] postComprehensive successfully but failed to update cue (of INotificationStatistics, member id: ${memberId_cued}) in [C] notificationStatistics`);
                        }
                    }
                }
            }
            await atlasDbClient.close();
            return;
        }
        //// DELETE | delete post ////
        if ('DELETE' === method) {
            // Step #1 update post status (of IPostComprehensive) [C] postComprehensive
            const postComprehensiveUpdateResult = await postComprehensiveCollectionClient.updateOne({ postId }, { $set: { status: -1 } });
            if (!postComprehensiveUpdateResult.acknowledged) {
                throw new Error(`Failed to update status (-1, of IPostComprehensive, post id: ${postId}) in [C] postComprehensive`);
            }
            res.status(200).send('Delete post success');
            //// Update statistics ////
            // Step #2.1 update totalCreationDeleteCount (of IMemberStatistics) (of post author) in [C] memberStatistics
            const memberStatisticsCollectionClient = atlasDbClient.db('statistics').collection<IMemberStatistics>('member');
            const memberStatisticsUpdateResult = await memberStatisticsCollectionClient.updateOne({ memberId: authorId }, { $inc: { totalCreationDeleteCount: 1 } });
            if (!memberStatisticsUpdateResult.acknowledged) {
                log(`Document (IPostComprehensive, post id: ${postId}) updated (deleted, status -1) in [C] postComprehensive successfully but failed to update totalCreationDeleteCount (of IMemberStatistics, member id: ${authorId}) in [C] memberStatistics`);
            }
            // Step #2.2 update totalPostDeleteCount (of IChannelStatistics) in [C] channelStatistics
            const { channelId } = postComprehensiveQueryResult;
            const channelStatisticsCollectionClient = atlasDbClient.db('statistics').collection<IChannelStatistics>('channel');
            const channelStatisticsUpdateResult = await channelStatisticsCollectionClient.updateOne({ channelId }, { $inc: { totalPostDeleteCount: 1 } });
            if (!channelStatisticsUpdateResult.acknowledged) {
                log(`Document (IPostComprehensive, post id: ${postId}) updated (deleted, status -1) in [C] postComprehensive successfully but failed to update totalPostDeleteCount (of IChannelStatistics, channel id: ${channelId}) in [C] channelStatistics`);
            }
            // Step #2.3 (cond.) update totalPostDeleteCount (of ITopicComprehensive) [C] topicComprehensive
            const { topicIdsArr } = postComprehensiveQueryResult;
            if (Array.isArray(topicIdsArr) && topicIdsArr.length !== 0) {
                const topicComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<ITopicComprehensive>('topic');
                const topicPostMappingCollectionClient = atlasDbClient.db('mapping').collection<ITopicPostMapping>('topic-post');
                for await (const topicId of topicIdsArr) {
                    // Step #4.1 update totalPostDeleteCount (of ITopicComprehensive) in [C] topicComprehensive
                    const topicComprehensiveUpdateResult = await topicComprehensiveCollectionClient.updateOne({ topicId }, { $inc: { totalPostDeleteCount: 1 } });
                    if (!topicComprehensiveUpdateResult.acknowledged) {
                        log(`Document (IPostComprehensive, post id: ${postId}) updated (deleted, status -1) in [C] postComprehensive successfully but failed to update totalPostDeleteCount (of ITopicComprehensive, topic id: ${topicId}) in [C] topicComprehensive`);
                    }
                    // Step #4.2 update status (of ITopicPostMapping) in [C] topicPostMapping
                    const topicPostMappingInsertResult = await topicPostMappingCollectionClient.updateOne({ topicId, postId }, { $set: { status: -1 } });
                    if (!topicPostMappingInsertResult.acknowledged) {
                        log(`Document (ITopicPostMapping, post id: ${postId}) updated (deleted, status -1) in [C] postComprehensive successfully but failed to update document (of ITopicPostMapping, topic id: ${topicId}, status -1) in [C] topicPostMapping`);
                    }
                }
            }
            await atlasDbClient.close();
            return;
        }
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