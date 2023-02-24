import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt'
import { RestError } from '@azure/data-tables';
import { MongoError } from 'mongodb';

import AzureTableClient from '../../../../modules/AzureTableClient';
import AtlasDatabaseClient from "../../../../modules/AtlasDatabaseClient";

import { verifyId } from '../../../../lib/utils/verify';
import { response405, response500, logWithDate } from '../../../../lib/utils/general';
import { IConciseMemberInfo, IMemberComprehensive, IMemberStatistics } from '../../../../lib/interfaces/member';
import { IPostComprehensive } from '../../../../lib/interfaces/post';
import { IMemberMemberMapping, IMemberPostMapping } from '../../../../lib/interfaces/mapping';
import { IChannelStatistics } from '../../../../lib/interfaces/channel';
import { ITopicComprehensive, ITopicPostMapping } from '../../../../lib/interfaces/topic';
import { getTopicBase64StringsArrayFromRequestBody, provideTopicComprehensive } from '../../../../lib/utils/for/topic';
import { getCuedMemberInfoArrayFromRequestBody, getImageFullnamesArrayFromRequestBody, getParagraphsArrayFromRequestBody, provideEditedPostInfo, providePostComprehensiveUpdate } from '../../../../lib/utils/for/post';
import { INoticeInfo, INotificationStatistics } from '../../../../lib/interfaces/notification';
import { createNoticeId } from '../../../../lib/utils/create';
import { getNicknameFromToken } from '../../../../lib/utils/for/member';

const fname = UpdateOrDeleteCreationById.name

/** UpdateOrDeleteCreationById v0.1.1
 * 
 * Last update: 24/02/2023
 * 
 * This interface accepts PUT and DELETE requests
 * 
 * Info required for PUT requrests
 * - token: JWT
 * - postId: string (query)
 * 
 * Info required for DELETE requests
 * - token: JWT
 * - postId: string (query)
 * 
*/

export default async function UpdateOrDeleteCreationById(req: NextApiRequest, res: NextApiResponse) {

    const { method } = req;
    if (!['PUT', 'DELETE'].includes(method ?? '')) {
        response405(req, res);
        return;
    }

    // res.status(200).send('ok');
    // return;

    //// Verify identity ////
    const token = await getToken({ req });
    if (!(token && token?.sub)) {
        res.status(400).send('Invalid identity');
        return;
    }
    const { sub: memberId } = token;

    // Verify post id ////
    const { isValid, category, id: postId } = verifyId(req.query?.postId);
    if (!(isValid && 'post' === category)) {
        res.status(400).send('Invalid post id');
        return;
    }

    //// Declare DB client ////
    const atlasDbClient = AtlasDatabaseClient();
    try {

        //// Verify member status ////
        const memberComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IMemberComprehensive>('member');
        const memberComprehensiveQueryResult = await memberComprehensiveCollectionClient.findOne({ memberId }, { projection: { _id: 0, status: 1, allowPosting: 1 } });
        if (null === memberComprehensiveQueryResult) {
            throw new Error(`Member attempt to delete creation but have no document (of IMemberComprehensive, member id: ${memberId}) in [C] memberComprehensive`);
        }
        const { status: memberStatus } = memberComprehensiveQueryResult;
        if (0 > memberStatus) {
            res.status(403).send('Method not allowed due to member suspended or deactivated');
            await atlasDbClient.close();
            return;
        }

        //// Verify post status ////
        const postComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IPostComprehensive>('post');
        const postComprehensiveQueryResult = await postComprehensiveCollectionClient.findOne({ postId }, { projection: { _id: 0, status: 1, allowEditing: 1 } });
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

        //// Match the member id in token and author id ////
        const { memberId: authorId } = postComprehensiveQueryResult;
        if (memberId !== authorId) {
            res.status(403).send('Requested author id and identity not matched');
            return;
        }

        //////// DELETE | delete a creation ////////
        if ('DELETE' === method) {

            const { title, channelId, topicIdsArr } = postComprehensiveQueryResult;

            //// Update record (of IMemberPostMapping) in [RL] CreationsMapping
            const mappingTableClient = AzureTableClient('CreationsMapping');
            await mappingTableClient.upsertEntity<IMemberPostMapping>({
                partitionKey: memberId,
                rowKey: postId,
                Nickname: '', // [!] nickname is not supplied in this case
                Title: title,
                CreatedTimeBySecond: Math.floor(new Date().getTime() / 1000),
                IsActive: false
            }, 'Merge');

            //// Update post status (of IPostComprehensive) [C] postComprehensive ////
            const postComprehensiveUpdateResult = await postComprehensiveCollectionClient.updateOne({ postId }, { $set: { status: -1 } });
            if (!postComprehensiveUpdateResult.acknowledged) {
                throw new Error(`Failed to update status (-1: delete, of IPostComprehensive, post id: ${postId}) in [C] postComprehensive`);
            }

            //// Response 200 for DELETE requests ////
            res.status(200).send('Delete post success');

            //// Update statistics ////

            //// Update totalCreationDeleteCount (of IMemberStatistics) (of post author) in [C] memberStatistics ////
            const memberStatisticsCollectionClient = atlasDbClient.db('statistics').collection<IMemberStatistics>('member');
            const memberStatisticsUpdateResult = await memberStatisticsCollectionClient.updateOne({ memberId: authorId }, { $inc: { totalCreationDeleteCount: 1 } });
            if (!memberStatisticsUpdateResult.acknowledged) {
                logWithDate(`Document (IPostComprehensive, post id: ${postId}) updated (deleted, status -1) in [C] postComprehensive successfully but failed to update totalCreationDeleteCount (of IMemberStatistics, member id: ${authorId}) in [C] memberStatistics`, fname);
            }

            //// Update totalPostDeleteCount (of IChannelStatistics) in [C] channelStatistics ////
            const channelStatisticsCollectionClient = atlasDbClient.db('statistics').collection<IChannelStatistics>('channel');
            const channelStatisticsUpdateResult = await channelStatisticsCollectionClient.updateOne({ channelId }, { $inc: { totalPostDeleteCount: 1 } });
            if (!channelStatisticsUpdateResult.acknowledged) {
                logWithDate(`Document (IPostComprehensive, post id: ${postId}) updated (deleted, status -1) in [C] postComprehensive successfully but failed to update totalPostDeleteCount (of IChannelStatistics, channel id: ${channelId}) in [C] channelStatistics`, fname);
            }

            //// (Cond.) Update totalPostDeleteCount (of ITopicComprehensive) [C] topicComprehensive ////
            if (Array.isArray(topicIdsArr) && topicIdsArr.length !== 0) {
                const topicComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<ITopicComprehensive>('topic');
                const topicPostMappingCollectionClient = atlasDbClient.db('mapping').collection<ITopicPostMapping>('topic-post');
                for await (const topicId of topicIdsArr) {

                    //// Update totalPostDeleteCount (of ITopicComprehensive) in [C] topicComprehensive ////
                    const topicComprehensiveUpdateResult = await topicComprehensiveCollectionClient.updateOne({ topicId }, { $inc: { totalPostDeleteCount: 1 } });
                    if (!topicComprehensiveUpdateResult.acknowledged) {
                        logWithDate(`Document (IPostComprehensive, post id: ${postId}) updated (deleted, status -1) in [C] postComprehensive successfully but failed to update totalPostDeleteCount (of ITopicComprehensive, topic id: ${topicId}) in [C] topicComprehensive`, fname);
                    }

                    //// Update status (of ITopicPostMapping) in [C] topicPostMapping ////
                    const topicPostMappingInsertResult = await topicPostMappingCollectionClient.updateOne({ topicId, postId }, { $set: { status: -1 } });
                    if (!topicPostMappingInsertResult.acknowledged) {
                        logWithDate(`Document (IPostComprehensive, post id: ${postId}) updated (deleted, status -1) in [C] postComprehensive successfully but failed to update document (of ITopicPostMapping, topic id: ${topicId}, status -1) in [C] topicPostMapping`, fname);
                    }
                }
            }

            await atlasDbClient.close();
            return;
        }

        //////// PUT | edit a creation ////////
        if ('PUT' === method) {

            const { allowPosting } = memberComprehensiveQueryResult;
            if (!allowPosting) {
                res.status(403).send('Method not allowed due to member suspended or deactivated');
                await atlasDbClient.close();
                return;
            }

            const { allowEditing } = postComprehensiveQueryResult;
            if (!allowEditing) {
                res.status(403).send('Method not allowed due to post suspended or deactivated');
                await atlasDbClient.close();
                return;
            }

            //// Verify edited title ////
            const { title } = req.body;
            if (!('string' === typeof title && '' !== title)) {
                res.status(400).send('Improper or blank post title');
                await atlasDbClient.close();
                return;
            }

            const { channelId } = req.body;
            if (!('string' === typeof channelId && '' !== channelId)) {
                res.status(400).send('Improper channel id');
                await atlasDbClient.close();
                return;
            }

            //// Verify edited channelId ////
            const channelInfoTableClient = AzureTableClient('ChannelInfo');
            const channelInfoQuery = channelInfoTableClient.listEntities({ queryOptions: { filter: `PartitionKey eq 'Info' and RowKey eq '${channelId}' and IsActive eq true` } });
            // [!] attemp to reterieve entity makes the probability of causing RestError
            let channelInfoQueryResult = await channelInfoQuery.next();
            if (!channelInfoQueryResult.value) {
                res.status(400).send('Channel id not found');
                await atlasDbClient.close();
                return;
            }

            //// Explicitly get topic id array and cued member info array ////
            const topicIdsArr = getTopicBase64StringsArrayFromRequestBody(req.body);
            const cuedMemberInfoArr = getCuedMemberInfoArrayFromRequestBody(req.body);

            //// Update document (of IPostComprehensive) in [C] postComprehensive ////
            const postComprehensiveUpdateResult = await postComprehensiveCollectionClient.updateOne({ postId }, {
                $set:
                    providePostComprehensiveUpdate(
                        title,
                        getImageFullnamesArrayFromRequestBody(req.body),
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

            //// Response 200 for PUT requests ////
            res.status(200).send('Edit post success');

            //// Update statistics ////

            //// Update totalCreationEditCount (of IMemberStatistics) in [C] memberStatistics ////
            const memberStatisticsCollectionClient = atlasDbClient.db('statistics').collection<IMemberStatistics>('member');
            const memberStatisticsUpdateResult = await memberStatisticsCollectionClient.updateOne({ memberId: authorId }, {
                $inc: {
                    totalCreationEditCount: 1
                }
            });
            if (!memberStatisticsUpdateResult.acknowledged) {
                logWithDate(`Document (IPostComprehensive, post id: ${postId}) updated in [C] postComprehensive successfully but failed to update totalCreationEditCount (of IMemberStatistics, member id: ${authorId}) in [C] memberStatistics`, fname);
            }

            //// (Cond.) Update totalPostCount (ITopicComprehensive) in [C] topicComprehensive ////

            if (topicIdsArr.length !== 0) {

                const topicPostMappingCollectionClient = atlasDbClient.db('mapping').collection<ITopicPostMapping>('topic-post');
                const topicComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<ITopicComprehensive>('topic');

                const arr = [];

                //// Delete outdated mapping (ITopicPostMapping) in [C] topicPostMapping ////
                //// And collect topic ids that have connections (mapping) with this post ////
                const mappingQuery = topicPostMappingCollectionClient.find({ postId });
                let mappingQureyResult = await mappingQuery.next();
                while (null !== mappingQureyResult) {

                    const { topicId } = mappingQureyResult;
                    if (!topicIdsArr.includes(topicId)) {
                        // Set mapping status to -1 (of ITopicPostMapping)
                        topicPostMappingCollectionClient.updateOne({ topicId, postId }, { $set: { status: -1 } });
                        // Accumulate post delete count (+1)
                        topicComprehensiveCollectionClient.updateOne({ topicId }, { $inc: { totalPostDeleteCount: 1 } })
                    } else {
                        // collect the topic id that has connection (mapping) with this post
                        arr.push(topicId);
                    }
                }

                //// Accumulate totalPostCount or create new mapping (ITopicPostMapping) for the topics ////
                //// That have no mapping (with this post) in [C] topicComprehensive ////
                for await (const topicId of topicIdsArr) {
                    if (!arr.includes(topicId)) {

                        //// Newly added topic ////
                        const topicComprehensiveQueryResult = await topicComprehensiveCollectionClient.findOneAndUpdate({ topicId }, { $inc: { totalPostCount: 1 } });
                        if (!topicComprehensiveQueryResult.ok) {
                            // Topic dose not appear in the database
                            const topicComprehensiveUpsertResult = await topicComprehensiveCollectionClient.updateOne({ topicId }, { $set: provideTopicComprehensive(topicId, channelId) }, { upsert: true });
                            if (!topicComprehensiveUpsertResult.acknowledged) {
                                logWithDate(`Document (IPostComprehensive, post id: ${postId}) inserted in [C] postComprehensive successfully but failed to upsert a new topic (document of ITopicComprehensive, topic id: ${topicId}) in [C] topicComprehensive`, fname);
                            }
                        }

                        //// Upsert a new document (of ITopicPostMapping) in [C] topicPostMapping
                        const topicPostMappingInsertResult = await topicPostMappingCollectionClient.updateOne({ topicId }, {
                            $setOnInsert: {
                                topicId,
                                postId,
                                channelId,
                                createdTimeBySecond: new Date().getTime(),
                                status: 200
                            }
                        }, { upsert: true }
                        );
                        if (!topicPostMappingInsertResult.acknowledged) {
                            logWithDate(`Document (ITopicPostMapping, post id: ${postId}) inserted in [C] postComprehensive successfully but failed to insert document (of ITopicPostMapping, topic id: ${topicId}) in [C] topicPostMapping`, fname);
                        }
                    }
                }
            }

            //// (Cond.) Handle notice.cue ////

            if (cuedMemberInfoArr.length !== 0) {
                const blockingMemberMappingTableClient = AzureTableClient('BlockingMemberMapping');
                const notificationStatisticsCollectionClient = atlasDbClient.db('statistics').collection<INotificationStatistics>('notification');

                let arr: IConciseMemberInfo[] = [...cuedMemberInfoArr];
                //// Maximum 13 members are allowed to cued at one time
                if (13 < cuedMemberInfoArr.length) {
                    arr = arr.slice(0, 13);
                }
                for await (const info of arr) {
                    const { memberId: cuedId } = info;

                    //// Look up record (of IMemberMemberMapping) in [RL] BlockingMemberMapping ////
                    const blockingMemberMappingQuery = blockingMemberMappingTableClient.listEntities<IMemberMemberMapping>({ queryOptions: { filter: `PartitionKey eq '${cuedId}' and RowKey eq '${authorId}'` } });
                    const blockingMemberMappingQueryResult = await blockingMemberMappingQuery.next();
                    if (!blockingMemberMappingQueryResult.done) {
                        const { IsActive: notBlocked } = blockingMemberMappingQueryResult.value;

                        if (!!notBlocked) { // [!] comment author has not been blocked by cued member //

                            //// Upsert record (of INoticeInfo.Cued) in [PRL] Notice ////
                            const noticeTableClient = AzureTableClient('Notice');
                            noticeTableClient.upsertEntity<INoticeInfo>({
                                partitionKey: cuedId,
                                rowKey: createNoticeId('cue', authorId, postId), // combined id
                                Category: 'cue',
                                InitiateId: authorId,
                                Nickname: getNicknameFromToken(token),
                                PostTitle: title,
                                CommentBrief: '', // [!] comment brief is not supplied in this case
                                CreatedTimeBySecond: Math.floor(new Date().getTime() / 1000),
                                IsActive: true
                            }, 'Replace');

                            //// Update statistics.cue (INotificationStatistics) (of cued member) in [C] notificationStatistics ////
                            const notificationStatisticsUpdateResult = await notificationStatisticsCollectionClient.updateOne({ memberId: cuedId }, { $inc: { cue: 1 } });
                            if (!notificationStatisticsUpdateResult.acknowledged) {
                                logWithDate(`Document (IPostComprehensive, post id: ${postId}) updated in [C] postComprehensive successfully but failed to update cue (of INotificationStatistics, member id: ${cuedId}) in [C] notificationStatistics`, fname);
                            }
                        }
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




