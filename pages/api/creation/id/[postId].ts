import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt'
import { RestError } from '@azure/data-tables';
import { MongoError } from 'mongodb';

import AzureTableClient from '../../../../modules/AzureTableClient';
import AtlasDatabaseClient from "../../../../modules/AtlasDatabaseClient";

import { verifyId } from '../../../../lib/utils/verify';
import { response405, response500, logWithDate } from '../../../../lib/utils/general';
import { IMemberComprehensive, IMemberStatistics } from '../../../../lib/interfaces/member';
import { IPostComprehensive } from '../../../../lib/interfaces/post';
import { IMemberPostMapping } from '../../../../lib/interfaces/mapping';
import { IChannelStatistics } from '../../../../lib/interfaces/channel';
import { ITopicComprehensive } from '../../../../lib/interfaces/topic';

const fname = UpdateOrDeleteCreationById.name

/** UpdateOrDeleteCreationById v0.1.1 FIXME: test mode
 * 
 * Last update: 24/02/2023
 * 
 * This interface accepts PUT and DELETE requests
 * 
 * Info required for DELETE requests
 * token: JWT
 * postId: string (query)
*/

export default async function UpdateOrDeleteCreationById(req: NextApiRequest, res: NextApiResponse) {

    const { method } = req;
    if (!['PUT', 'DELETE'].includes(method ?? '')) {
        response405(req, res);
        return;
    }

    //// Verify identity ////
    const token = await getToken({ req });
    if (!(token && token?.sub)) {
        res.status(400).send('Invalid identity');
        return;
    }

    // Verify post id
    const { isValid, category, id: postId } = verifyId(req.query?.postId);
    if (!(isValid && 'post' === category)) {
        res.status(400).send('Invalid post id');
        return;
    }

    //// Declare DB client ////
    const atlasDbClient = AtlasDatabaseClient();
    try {
        const { sub: memberId } = token;
        //// Verify member status ////
        const memberComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IMemberComprehensive>('member');
        const memberComprehensiveQueryResult = await memberComprehensiveCollectionClient.findOne({ memberId }, { projection: { _id: 0, status: 1, allowPosting: 1 } });
        if (null === memberComprehensiveQueryResult) {
            throw new Error(`Member attempt to delete creation but have no document (of IMemberComprehensive, member id: ${memberId}) in [C] memberComprehensive`);
        }
        const { status: memberStatus, allowPosting } = memberComprehensiveQueryResult;
        if (0 > memberStatus) {
            res.status(403).send('Method not allowed due to member suspended or deactivated');
            await atlasDbClient.close();
            return;
        }




        //// Verify post status ////
        const postComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IPostComprehensive>('post');
        const postComprehensiveQueryResult = await postComprehensiveCollectionClient.findOne({ postId }, { projection: { _id: 0, status: 1, } });
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


        //// Verify permission (basic) ////
        const { memberId: authorId } = postComprehensiveQueryResult;
        if (memberId !== authorId) {
            res.status(403).send('Identity lack permissions');
            return;
        }



















        // Step #1.1 update record (of IMemberPostMapping) in [RL] CreationsMapping
        const noticeTableClient = AzureTableClient('CreationsMapping');
        await noticeTableClient.upsertEntity<IMemberPostMapping>({
            partitionKey: memberId,
            rowKey: postId,
            Nickname: '',
            CreatedTimeBySecond: Math.floor(new Date().getTime() / 1000),
            IsActive: false
        }, 'Merge');

        
        // Step #1.2 update status (of IPostComprehensive) in [C] postComprehensive
        const postComprehensiveUpdateResult = await postComprehensiveCollectionClient.updateOne({ postId }, { $set: { status: -1 } });
        if (!postComprehensiveUpdateResult.acknowledged) {
            throw new Error(`Failed to update status (-1, of IPostComprehensive, post id: ${postId}) in [C] postComprehensive`);
        }
        res.status(200).send('Delete browsing history success');
        // Step #2.1 update totalCreationDeleteCount (of IMemberStatistics) in [C] memberStatistics
        const memberStatisticsCollectionClient = atlasDbClient.db('statistics').collection<IMemberStatistics>('member');
        const memberStatisticsUpdateResult = await memberStatisticsCollectionClient.updateOne({ memberId }, { $inc: { totalCreationDeleteCount: 1 } });
        if (!memberStatisticsUpdateResult.acknowledged) {
            logWithDate(`Document (IPostComprehensive, post id: ${postId}) updated (deleted, status -1) in [C] postComprehensive successfully but failed to update totalCreationDeleteCount (of IMemberStatistics, member id: ${memberId}) in [C] memberStatistics`, fname);
        }
        // Step #2.2 update totalPostDeleteCount (of IChannelStatistics) in [C] channelStatistics
        const { channelId } = postComprehensiveQueryResult;
        const channelStatisticsCollectionClient = atlasDbClient.db('statistics').collection<IChannelStatistics>('channel');
        const channelStatisticsUpdateResult = await channelStatisticsCollectionClient.updateOne({ channelId }, { $inc: { totalPostDeleteCount: 1 } });
        if (!channelStatisticsUpdateResult.acknowledged) {
            logWithDate(`Document (IPostComprehensive, post id: ${postId}) updated (deleted, status -1) in [C] postComprehensive successfully but failed to update totalPostDeleteCount (of IChannelStatistics, channel id: ${channelId}) in [C] channelStatistics`, fname);
        }
        // Step #2.3 (cond.) update totalPostDeleteCount (of ITopicComprehensive) in [C] topicComprehensive
        const { topicIdsArr } = postComprehensiveQueryResult;
        if (Array.isArray(topicIdsArr) && topicIdsArr.length !== 0) {
            const topicComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<ITopicComprehensive>('topic');
            for await (const topicId of topicIdsArr) {
                const topicComprehensiveUpdateResult = await topicComprehensiveCollectionClient.updateOne({ topicId }, { $inc: { totalPostDeleteCount: 1 } });
                if (!topicComprehensiveUpdateResult.acknowledged) {
                    logWithDate(`Document (IPostComprehensive, post id: ${postId}) updated (deleted, status -1) in [C] postComprehensive successfully but failed to update totalPostDeleteCount (of ITopicComprehensive, topic id: ${topicId}) in [C] topicComprehensive`, fname);
                }
            }
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
                logWithDate(`Document (IPostComprehensive, post id: ${postId}) updated in [C] postComprehensive successfully but failed to update totalCreationEditCount (of IMemberStatistics, member id: ${authorId}) in [C] memberStatistics`, fname);
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
                                logWithDate(`Document (IPostComprehensive, post id: ${postId}) inserted in [C] postComprehensive successfully but failed to update totalPostCount (of ITopicComprehensive, topic id: ${topicId}) in [C] topicComprehensive`, fname);
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
                            logWithDate(`Document (ITopicPostMapping, post id: ${postId}) inserted in [C] postComprehensive successfully but failed to insert document (of ITopicPostMapping, topic id: ${topicId}) in [C] topicPostMapping`, fname);
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
                    const _blockingMemberMappingQuery = blockingMemberMappingTableClient.listEntities<IMemberMemberMapping>({ queryOptions: { filter: `PartitionKey eq '${memberId_cued}' and RowKey eq '${authorId}'` } });
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
                            PostTitle: title,
                        }, 'Replace');
                        // Step #7.4 update cue (INotificationStatistics) (of cued member) in [C] notificationStatistics
                        const notificationStatisticsUpdateResult = await notificationStatisticsCollectionClient.updateOne({ memberId: memberId_cued }, {
                            $inc: {
                                cue: 1
                            }
                        });
                        if (!notificationStatisticsUpdateResult.acknowledged) {
                            logWithDate(`Document (IPostComprehensive, post id: ${postId}) updated in [C] postComprehensive successfully but failed to update cue (of INotificationStatistics, member id: ${memberId_cued}) in [C] notificationStatistics`, fname);
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
                logWithDate(`Document (IPostComprehensive, post id: ${postId}) updated (deleted, status -1) in [C] postComprehensive successfully but failed to update totalCreationDeleteCount (of IMemberStatistics, member id: ${authorId}) in [C] memberStatistics`, fname);
            }
            // Step #2.2 update totalPostDeleteCount (of IChannelStatistics) in [C] channelStatistics
            const { channelId } = postComprehensiveQueryResult;
            const channelStatisticsCollectionClient = atlasDbClient.db('statistics').collection<IChannelStatistics>('channel');
            const channelStatisticsUpdateResult = await channelStatisticsCollectionClient.updateOne({ channelId }, { $inc: { totalPostDeleteCount: 1 } });
            if (!channelStatisticsUpdateResult.acknowledged) {
                logWithDate(`Document (IPostComprehensive, post id: ${postId}) updated (deleted, status -1) in [C] postComprehensive successfully but failed to update totalPostDeleteCount (of IChannelStatistics, channel id: ${channelId}) in [C] channelStatistics`, fname);
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
                        logWithDate(`Document (IPostComprehensive, post id: ${postId}) updated (deleted, status -1) in [C] postComprehensive successfully but failed to update totalPostDeleteCount (of ITopicComprehensive, topic id: ${topicId}) in [C] topicComprehensive`, fname);
                    }
                    // Step #4.2 update status (of ITopicPostMapping) in [C] topicPostMapping
                    const topicPostMappingInsertResult = await topicPostMappingCollectionClient.updateOne({ topicId, postId }, { $set: { status: -1 } });
                    if (!topicPostMappingInsertResult.acknowledged) {
                        logWithDate(`Document (ITopicPostMapping, post id: ${postId}) updated (deleted, status -1) in [C] postComprehensive successfully but failed to update document (of ITopicPostMapping, topic id: ${topicId}, status -1) in [C] topicPostMapping`, fname);
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




