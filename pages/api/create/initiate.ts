import type { NextApiRequest, NextApiResponse } from 'next';
import { RestError } from '@azure/data-tables';
import { MongoError } from 'mongodb';
import { getToken } from 'next-auth/jwt';

import AzureTableClient from '../../../modules/AzureTableClient';
import AtlasDatabaseClient from '../../../modules/AtlasDatabaseClient';

import { IMemberComprehensive, IMemberStatistics } from '../../../lib/interfaces/member';
import { IMemberMemberMapping, ITopicPostMapping } from '../../../lib/interfaces/mapping';
import { IPostComprehensive } from '../../../lib/interfaces/post';
import { IChannelStatistics } from '../../../lib/interfaces/channel';
import { ITopicComprehensive } from '../../../lib/interfaces/topic';
import { INotificationComprehensive, INotificationStatistics } from '../../../lib/interfaces/notification';

import { createId, createNoticeId, getTimeBySecond } from '../../../lib/utils/create';
import { logWithDate, response405, response500 } from '../../../lib/utils/general';
import { getTopicInfoArrayFromRequestBody, createTopicComprehensive } from '../../../lib/utils/for/topic';
import { getCuedMemberInfoArrayFromRequestBody, getParagraphsArrayFromRequestBody } from '../../../lib/utils/for/post';

const fnn = `${InitiatePost.name} (API)`;

/**
 * This interface ONLY accepts POST method
 * 
 * Post info required
 * -     token: JWT
 * -     title: string (body)
 * -     paragraphsArr: string[] (body)
 * -     cuedMemberInfoArr: IConciseMemberInfo[] (body)
 * -     channelId: string (body)
 * -     topicIdsArr: string[] (body)
 * -     hasImages: boolean (body)
 * 
 * Last update: 3/3/2023 v0.1.1
 * Last update: 31/05/2023 v0.1.2 Depreacted CreationsMapping
 */

export default async function InitiatePost(req: NextApiRequest, res: NextApiResponse) {
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

    //// Verify post title ////
    const { title } = req.body;
    if (!('string' === typeof title && '' !== title)) {
        res.status(400).send('Improper or blank post title');
        return;
    }

    ////Verify channel id ////
    const { channelId } = req.body;
    if (!('string' === typeof channelId && '' !== channelId)) {
        res.status(400).send('Improper channel id');
        return;
    }

    //// Declare DB client ////
    const atlasDbClient = AtlasDatabaseClient();
    try {

        //// Verify channel id ////
        const channelInfoTableClient = AzureTableClient('ChannelInfo');
        const channelInfoQuery = channelInfoTableClient.listEntities({ queryOptions: { filter: `PartitionKey eq 'Info' and RowKey eq '${channelId}' and IsActive eq true` } });
        // [!] attemp to reterieve entity makes the probability of causing RestError
        let channelInfoQueryResult = await channelInfoQuery.next();
        if (channelInfoQueryResult.done) {
            res.status(400).send('Channel id not found');
            return;
        }
        await atlasDbClient.connect();

        //// Check member status ////
        const { sub: memberId } = token;
        const memberComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IMemberComprehensive>('member');
        const memberComprehensiveQueryResult = await memberComprehensiveCollectionClient.findOne<IMemberComprehensive>({ memberId }, { projection: { _id: 0, status: 1, allowPosting: 1, nickname: 1 } });
        if (null === memberComprehensiveQueryResult) {
            throw new Error(`Member attempt to creating post but have no document (of IMemberComprehensive, member id: ${memberId}) in [C] memberComprehensive`);
        }
        const { status: memberStatus, allowPosting, nickname } = memberComprehensiveQueryResult;
        if (!(0 < memberStatus && allowPosting)) {
            res.status(403).send('Method not allowed due to member suspended or deactivated');
            await atlasDbClient.close();
            return;
        }

        //// Verify if comes with images ////
        const hasImages = !!(req.body?.hasImages);

        //// Create post ////
        // #1 create a new post id, get current time (by second)
        const postId = createId('post');
        const now = getTimeBySecond();
        // #2 explicitly get topic info array and cued member info array
        const topicInfoArr = getTopicInfoArrayFromRequestBody(req.body);
        const cuedMemberInfoArr = getCuedMemberInfoArrayFromRequestBody(req.body);
        // #3 insert a new document (of IPostComprehensive) in [C] postComprehensive
        const postComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IPostComprehensive>('post');
        const postComprehensiveInsertResult = await postComprehensiveCollectionClient.insertOne({
            // info
            postId,
            memberId,
            nickname,
            createdTimeBySecond: now,
            title,
            imageFullnamesArr: [], // [!] not required on initiate
            paragraphsArr: getParagraphsArrayFromRequestBody(req.body),
            cuedMemberInfoArr: cuedMemberInfoArr,
            channelId,
            topicInfoArr: topicInfoArr,
            pinnedCommentId: null,
            // management
            status: hasImages ? 1 : 200, // [!] 1: initiated post, 200: published post
            allowEditing: true,
            allowCommenting: true,
            // statistics
            totalHitCount: 0,
            totalMemberHitCount: 0,
            totalLikedCount: 0,
            totalUndoLikedCount: 0,
            totalDislikedCount: 0,
            totalUndoDislikedCount: 0,
            totalCommentCount: 0,
            totalCommentDeleteCount: 0,
            totalSavedCount: 0,
            totalUndoSavedCount: 0,
            totalEditCount: 0,
            totalAffairCount: 0,
            // edit record
            edited: []
        });
        if (!postComprehensiveInsertResult.acknowledged) {
            throw new Error(`Failed to insert document (of IPostComprehensive, member id: ${memberId}) in [C] postComprehensive`);
        }

        //// Response 200 ////
        res.status(200).send(postId);

        //// Update statistics ////
        // #1 update totalCreationsCount (IMemberStatistics) in [C] memberStatistics
        const memberStatisticsCollectionClient = atlasDbClient.db('statistics').collection<IMemberStatistics>('member');
        const memberStatisticsUpdateResult = await memberStatisticsCollectionClient.updateOne({ memberId }, { $inc: { totalCreationsCount: 1 } });
        if (!memberStatisticsUpdateResult.acknowledged) {
            logWithDate(`Document (IPostComprehensive, post id: ${postId}) inserted in [C] postComprehensive successfully but failed to update totalCreationsCount (of IMemberStatistics, member id: ${memberId}) in [C] memberStatistics`, fnn);
        }
        // #2 update totalPostCount (IChannelStatistics) in [C] channelStatistics
        const channelStatisticsCollectionClient = atlasDbClient.db('statistics').collection<IChannelStatistics>('channel');
        const channelStatisticsUpdateResult = await channelStatisticsCollectionClient.updateOne({ channelId }, { $inc: { totalPostCount: 1 } });
        if (!channelStatisticsUpdateResult.acknowledged) {
            logWithDate(`Document (IPostComprehensive, post id: ${postId}) inserted in [C] postComprehensive successfully but failed to update totalPostCount (of IChannelStatistics, channel id: ${channelId}) in [C] channelStatistics`, fnn);
        }
        // #3 (cond.) update totalPostCount or insert a new document (ITopicComprehensive) in [C] topicComprehensive
        if (topicInfoArr.length !== 0) {
            const topicComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<ITopicComprehensive>('topic');
            const topicPostMappingCollectionClient = atlasDbClient.db('mapping').collection<ITopicPostMapping>('topic-post');
            for await (const t of topicInfoArr) {
                const topicComprehensiveQueryResult = await topicComprehensiveCollectionClient.findOneAndUpdate({ topicId: t.topicId }, { $inc: { totalPostCount: 1 } });
                if (!topicComprehensiveQueryResult?.value) {
                    // [!] topic not found
                    const topicComprehensiveUpdateResult = await topicComprehensiveCollectionClient.updateOne({ topicId: t }, { $set: createTopicComprehensive(t.topicId, t.content, channelId) }, { upsert: true });
                    if (!topicComprehensiveUpdateResult.acknowledged) {
                        logWithDate(`Document (IPostComprehensive, post id: ${postId}) inserted in [C] postComprehensive successfully but failed to upsert a new topic (of ITopicComprehensive, topic id: ${t}) in [C] topicComprehensive`, fnn);
                    }
                }
                // Update mapping
                const topicPostMappingInsertResult = await topicPostMappingCollectionClient.insertOne({
                    topicId: t.topicId,
                    postId,
                    title,
                    channelId,
                    memberId,
                    nickname,
                    createdTimeBySecond: now,
                    status: 200
                });
                if (!topicPostMappingInsertResult.acknowledged) {
                    logWithDate(`Document (ITopicPostMapping, post id: ${postId}) inserted in [C] postComprehensive successfully but failed to insert document (of ITopicPostMapping, topic id: ${t}) in [C] topicPostMapping`, fnn);
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
                    // #3 upsert document (of notificationComprehensive) in [C] notificationComprehensive
                    const notificationComprehensiveUpdateResult = await notificationComprehensiveCollectionClient.updateOne({ noticeId: createNoticeId('cue', memberId, postId) }, {
                        noticeId: createNoticeId('cue', memberId, postId),
                        category: 'cue',
                        memberId: cuedId,
                        initiateId: memberId,
                        nickname: memberComprehensiveQueryResult.nickname,
                        postTitle: title,
                        commentBrief: '',
                        createdTimeBySecond: getTimeBySecond()
                    }, { upsert: true });
                    if (!notificationComprehensiveUpdateResult.acknowledged) {
                        logWithDate(`Failed to upsert document (of INotificationComprehensive, member id: ${cuedId}) in [C] notificationComprehensive`, fnn);
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