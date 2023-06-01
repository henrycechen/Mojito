import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import { RestError } from '@azure/data-tables';
import { MongoError } from 'mongodb';

import AzureTableClient from '../../../../modules/AzureTableClient';
import AtlasDatabaseClient from '../../../../modules/AtlasDatabaseClient';

import { IMemberComprehensive, IMemberStatistics } from '../../../../lib/interfaces/member';
import { IMemberMemberMapping, ITopicPostMapping } from '../../../../lib/interfaces/mapping';
import { IPostComprehensive } from '../../../../lib/interfaces/post';
import { IChannelStatistics } from '../../../../lib/interfaces/channel';
import { ITopicComprehensive } from '../../../../lib/interfaces/topic';
import { INotificationComprehensive, INotificationStatistics } from '../../../../lib/interfaces/notification';

import { verifyId } from '../../../../lib/utils/verify';
import { response405, response500, logWithDate } from '../../../../lib/utils/general';
import { getTopicInfoArrayFromRequestBody, createTopicComprehensive } from '../../../../lib/utils/for/topic';
import { getCuedMemberInfoArrayFromRequestBody, getParagraphsArrayFromRequestBody, provideEditedPostInfo, providePostComprehensiveUpdate } from '../../../../lib/utils/for/post';
import { createNoticeId, getTimeBySecond } from '../../../../lib/utils/create';

const fnn = `${UpdateOrDeleteCreationById.name} (API)`;

/** 
 * This interface accepts PUT and DELETE requests
 * 
 * Info required for PUT requrests
 * -     token: JWT
 * -     postId: string (query)
 * 
 * Info required for DELETE requests
 * -     token: JWT
 * -     postId: string (query)
 * 
 * Last update: 
 * - 24/02/2023 v0.1.1
 * - 08/05/2023 v0.1.2 Fix issue communicating with atlas db
 * - 31/05/2023 v0.1.3 Depreacted CreationsMapping
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
    const { sub: memberId } = token;

    //// Verify post id ////
    const { isValid, category, id: postId } = verifyId(req.query?.postId);
    if (!(isValid && 'post' === category)) {
        res.status(400).send('Invalid post id');
        return;
    }

    //// Declare DB client ////
    const atlasDbClient = AtlasDatabaseClient();
    try {
        await atlasDbClient.connect();

        //// Verify member status ////
        const memberComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IMemberComprehensive>('member');
        const memberComprehensiveQueryResult = await memberComprehensiveCollectionClient.findOne({ memberId }, { projection: { _id: 0, status: 1, allowPosting: 1, nickname: 1 } });
        if (null === memberComprehensiveQueryResult) {
            throw new Error(`Member attempt to delete creation but have no document (of IMemberComprehensive, member id: ${memberId}) in [C] memberComprehensive`);
        }
        const { status: memberStatus, nickname } = memberComprehensiveQueryResult;
        if (0 > memberStatus) {
            res.status(403).send('Method not allowed due to member suspended or deactivated');
            await atlasDbClient.close();
            return;
        }

        //// Verify post status ////
        const postComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IPostComprehensive>('post');
        const postComprehensiveQueryResult = await postComprehensiveCollectionClient.findOne({ postId }, {
            projection: {
                _id: 0,
                memberId: 1,
                title: 1,
                imageFullnamesArr: 1,
                paragraphsArr: 1,
                cuedMemberInfoArr: 1,
                channelId: 1,
                topicInfoArr: 1,
                status: 1,
                allowEditing: 1
            }
        });
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

        //// DELETE | delete a creation ////
        if ('DELETE' === method) {

            const { channelId, topicInfoArr } = postComprehensiveQueryResult;

            //// Update post status (of IPostComprehensive) [C] postComprehensive ////
            const postComprehensiveUpdateResult = await postComprehensiveCollectionClient.updateOne({ postId }, { $set: { status: -1 } });
            if (!postComprehensiveUpdateResult.acknowledged) {
                throw new Error(`Failed to update status (-1, delete, of IPostComprehensive, post id: ${postId}) in [C] postComprehensive`);
            }

            //// Response 200 for DELETE requests ////
            res.status(200).send('Delete post success');

            //// Update statistics ////
            //// Update totalCreationDeleteCount (of IMemberStatistics) (of post author) in [C] memberStatistics ////
            const memberStatisticsCollectionClient = atlasDbClient.db('statistics').collection<IMemberStatistics>('member');
            const memberStatisticsUpdateResult = await memberStatisticsCollectionClient.updateOne({ memberId: authorId }, { $inc: { totalCreationDeleteCount: 1 } });
            if (!memberStatisticsUpdateResult.acknowledged) {
                logWithDate(`Document (IPostComprehensive, post id: ${postId}) updated (deleted, status -1) in [C] postComprehensive successfully but failed to update totalCreationDeleteCount (of IMemberStatistics, member id: ${authorId}) in [C] memberStatistics`, fnn);
            }

            //// Update totalPostDeleteCount (of IChannelStatistics) in [C] channelStatistics ////
            const channelStatisticsCollectionClient = atlasDbClient.db('statistics').collection<IChannelStatistics>('channel');
            const channelStatisticsUpdateResult = await channelStatisticsCollectionClient.updateOne({ channelId }, { $inc: { totalPostDeleteCount: 1 } });
            if (!channelStatisticsUpdateResult.acknowledged) {
                logWithDate(`Document (IPostComprehensive, post id: ${postId}) updated (deleted, status -1) in [C] postComprehensive successfully but failed to update totalPostDeleteCount (of IChannelStatistics, channel id: ${channelId}) in [C] channelStatistics`, fnn);
            }

            //// (Cond.) Update totalPostDeleteCount (of ITopicComprehensive) [C] topicComprehensive ////
            if (Array.isArray(topicInfoArr) && topicInfoArr.length !== 0) {
                const topicComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<ITopicComprehensive>('topic');
                const topicPostMappingCollectionClient = atlasDbClient.db('mapping').collection<ITopicPostMapping>('topic-post');
                for await (const t of topicInfoArr) {

                    //// Update totalPostDeleteCount (of ITopicComprehensive) in [C] topicComprehensive ////
                    const topicComprehensiveUpdateResult = await topicComprehensiveCollectionClient.updateOne({ topicId: t.topicId }, { $inc: { totalPostDeleteCount: 1 } });
                    if (!topicComprehensiveUpdateResult.acknowledged) {
                        logWithDate(`Document (IPostComprehensive, post id: ${postId}) updated (deleted, status -1) in [C] postComprehensive successfully but failed to update totalPostDeleteCount (of ITopicComprehensive, topic id: ${t.topicId}) in [C] topicComprehensive`, fnn);
                    }

                    //// Update status (of ITopicPostMapping) in [C] topicPostMapping ////
                    const topicPostMappingInsertResult = await topicPostMappingCollectionClient.updateOne({ topicId: t.topicId, postId }, { $set: { status: -1 } });
                    if (!topicPostMappingInsertResult.acknowledged) {
                        logWithDate(`Document (IPostComprehensive, post id: ${postId}) updated (deleted, status -1) in [C] postComprehensive successfully but failed to update document (of ITopicPostMapping, topic id: ${t.topicId}, status -1) in [C] topicPostMapping`, fnn);
                    }
                }
            }

            await atlasDbClient.close();
            return;
        }

        //// PUT | edit a creation ////
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

        //// Verify if comes with images ////
        const hasImages = !!(req.body?.hasImages);

        //// Update post ////
        // #1 get current time (by second)
        const now = getTimeBySecond();
        // #2 explicitly get topic id array and cued member info array
        const topicInfoArr = getTopicInfoArrayFromRequestBody(req.body);
        const cuedMemberInfoArr = getCuedMemberInfoArrayFromRequestBody(req.body);
        // #3 update document (of IPostComprehensive) in [C] postComprehensive
        const postComprehensiveUpdateResult = await postComprehensiveCollectionClient.updateOne({ postId }, {
            $set:
                providePostComprehensiveUpdate(
                    nickname,
                    title,
                    hasImages,
                    getParagraphsArrayFromRequestBody(req.body),
                    cuedMemberInfoArr,
                    channelId,
                    topicInfoArr,
                ),
            $inc: {
                totalEditCount: 1
            },
            $push: {
                edited: provideEditedPostInfo(postComprehensiveQueryResult, now)
            }
        });
        if (!postComprehensiveUpdateResult.acknowledged) {
            throw new Error(`Failed to update postInfo, totalEditCount and editedPostInfo (of IPostComprehensive, post id: ${postId}) in [C] postComprehensive`);
        }

        //// Response 200 for PUT requests ////
        res.status(200).send(postId);

        //// Update statistics ////
        // #1 update totalCreationEditCount (of IMemberStatistics) in [C] memberStatistics
        const memberStatisticsCollectionClient = atlasDbClient.db('statistics').collection<IMemberStatistics>('member');
        const memberStatisticsUpdateResult = await memberStatisticsCollectionClient.updateOne({ memberId: authorId }, { $inc: { totalCreationEditCount: 1 } });
        if (!memberStatisticsUpdateResult.acknowledged) {
            logWithDate(`Document (IPostComprehensive, post id: ${postId}) updated in [C] postComprehensive successfully but failed to update totalCreationEditCount (of IMemberStatistics, member id: ${authorId}) in [C] memberStatistics`, fnn);
        }

        // #2 (cond.) update totalPostCount (ITopicComprehensive) in [C] topicComprehensive
        if (topicInfoArr.length !== 0) {
            const topicPostMappingCollectionClient = atlasDbClient.db('mapping').collection<ITopicPostMapping>('topic-post');
            const topicComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<ITopicComprehensive>('topic');

            // #2.1 prepare topic ids array
            const topicIdsArr = topicInfoArr.map(t => t.topicId);
            const topicIdsArr_dismissed = [];

            // #2.2 delete invalid mapping (ITopicPostMapping) in [C] topicPostMapping
            const mappingQuery = topicPostMappingCollectionClient.find({ postId });
            while (await mappingQuery.hasNext()) {
                let mappingQureyResult = await mappingQuery.next();
                if (null !== mappingQureyResult && Object.keys(mappingQureyResult).length !== 0) {
                    const { topicId } = mappingQureyResult;
                    if (!topicIdsArr.includes(topicId)) {
                        // Set mapping status to -1 (of ITopicPostMapping)
                        topicPostMappingCollectionClient.updateOne({ topicId, postId }, { $set: { status: -1 } });
                        // Accumulate post delete count (+1)
                        topicComprehensiveCollectionClient.updateOne({ topicId }, { $inc: { totalPostDeleteCount: 1 } });
                    } else {
                        // And collect topic ids that have connections with this post (topic-post mapping)
                        topicIdsArr_dismissed.push(topicId);
                    }
                }
            }

            // #2.3 accumulate totalPostCount or create new mapping (ITopicPostMapping) for the newly-added topics
            for await (const t of topicInfoArr) {
                if (!topicIdsArr_dismissed.includes(t.topicId)) {
                    const topicComprehensiveQueryResult = await topicComprehensiveCollectionClient.findOneAndUpdate({ topicId: t }, { $inc: { totalPostCount: 1 } });
                    if (!topicComprehensiveQueryResult?.value) {
                        // [!] topic not found, create new topic
                        const topicComprehensiveUpsertResult = await topicComprehensiveCollectionClient.updateOne({ topicId: t }, { $set: createTopicComprehensive(t.topicId, t.content, channelId) }, { upsert: true });
                        if (!topicComprehensiveUpsertResult.acknowledged) {
                            logWithDate(`Document (IPostComprehensive, post id: ${postId}) updated in [C] postComprehensive successfully but failed to upsert a new topic (document of ITopicComprehensive, topic id: ${t}) in [C] topicComprehensive`, fnn);
                        }
                    }
                    // Update mapping
                    const topicPostMappingInsertResult = await topicPostMappingCollectionClient.updateOne({ topicId: t }, {
                        $set: {
                            createdTimeBySecond: getTimeBySecond(),
                        },
                        $setOnInsert: {
                            topicId: t.topicId,
                            postId,
                            title,
                            channelId,
                            memberId,
                            nickname,
                            createdTimeBySecond: getTimeBySecond(),
                            status: 200
                        }
                    }, { upsert: true }
                    );
                    if (!topicPostMappingInsertResult.acknowledged) {
                        logWithDate(`Document (ITopicPostMapping, post id: ${postId}) inserted in [C] postComprehensive successfully but failed to insert document (of ITopicPostMapping, topic id: ${t}) in [C] topicPostMapping`, fnn);
                    }
                }
            }
        }

        //// (Cond.) Handle notice.cue ////
        if (!hasImages && cuedMemberInfoArr.length !== 0) {
            const blockingMemberMappingTableClient = AzureTableClient('BlockingMemberMapping');
            const notificationComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<INotificationComprehensive>('notification');
            const notificationStatisticsCollectionClient = atlasDbClient.db('statistics').collection<INotificationStatistics>('notification');

            // #1 maximum 12 members are allowed to cued at one time (in one comment)
            const cuedMemberIdsArrSliced = cuedMemberInfoArr.slice(0, 12);

            for await (const cuedMemberInfo of cuedMemberIdsArrSliced) {
                const { memberId: cuedId } = cuedMemberInfo;

                let isBlocked = false;
                // #2 look up record (of IMemberMemberMapping) in [RL] BlockingMemberMapping
                const blockingMemberMappingQuery = blockingMemberMappingTableClient.listEntities<IMemberMemberMapping>({ queryOptions: { filter: `PartitionKey eq '${cuedId}' and RowKey eq '${memberId}'` } });
                // [!] attemp to reterieve entity makes the probability of causing RestError
                const blockingMemberMappingQueryResult = await blockingMemberMappingQuery.next();
                if (blockingMemberMappingQueryResult.value) {
                    const { IsActive: isActive } = blockingMemberMappingQueryResult.value;
                    isBlocked = isActive;
                }
                if (!isBlocked) {
                    // #3 Upsert document (of notificationComprehensive) in [C] notificationComprehensive
                    const notificationComprehensiveUpdateResult = await notificationComprehensiveCollectionClient.updateOne({ noticeId: createNoticeId('cue', memberId, postId) }, {
                        noticeId: createNoticeId('cue', memberId, postId),
                        category: 'cue',
                        memberId: authorId,
                        initiateId: memberId,
                        nickname: memberComprehensiveQueryResult.nickname,
                        postTitle: title,
                        commentBrief: '',
                        createdTimeBySecond: getTimeBySecond()
                    }, { upsert: true });
                    if (!notificationComprehensiveUpdateResult.acknowledged) {
                        logWithDate(`Failed to upsert document (of INotificationComprehensive, member id: ${authorId}) in [C] notificationComprehensive`, fnn);
                    }

                    // #4 update cue (of INotificationStatistics) (of cued member) in [C] notificationStatistics
                    const notificationStatisticsUpdateResult = await notificationStatisticsCollectionClient.updateOne({ memberId: cuedId }, { $inc: { cue: 1 } });
                    if (!notificationStatisticsUpdateResult.acknowledged) {
                        logWithDate(`Document (IPostComprehensive, post id: ${postId}) inserted in [C] postComprehensive successfully but failed to update cue (of INotificationStatistics, member id: ${cuedId}) in [C] notificationStatistics`, fnn);
                    }
                }
            }
        }

        await atlasDbClient.close();
        return;
    } catch (e: any) {
        let msg;
        if (e instanceof RestError) {
            msg = `Attempt to communicate with azure table storage.`;
        } else if (e instanceof MongoError) {
            msg = `Attempt to communicate with atlas mongodb.`;
        } else {
            msg = `Uncategorized. ${e}`;
        }
        if (!res.headersSent) {
            response500(res, msg);
        }
        logWithDate(msg, fnn, e);
        await atlasDbClient.close();
        return;
    }
}