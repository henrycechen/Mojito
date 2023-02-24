import type { NextApiRequest, NextApiResponse } from 'next';
import { RestError } from '@azure/data-tables';
import { MongoError } from 'mongodb';
import { getToken } from 'next-auth/jwt';

import AzureTableClient from '../../../modules/AzureTableClient';
import AtlasDatabaseClient from '../../../modules/AtlasDatabaseClient';
import { logWithDate, response405, response500 } from '../../../lib/utils/general';
import { createId, createNoticeId, getRandomIdStr } from '../../../lib/utils/create';
import { IMemberComprehensive, IMemberStatistics } from '../../../lib/interfaces/member';
import { getTopicBase64StringsArrayFromRequestBody, provideTopicComprehensive } from '../../../lib/utils/for/topic';
import { getCuedMemberInfoArrayFromRequestBody, getImageUrlsArrayFromRequestBody, getParagraphsArrayFromRequestBody } from '../../../lib/utils/for/post';
import { IPostComprehensive } from '../../../lib/interfaces/post';
import { IChannelStatistics } from '../../../lib/interfaces/channel';
import { ITopicComprehensive, ITopicPostMapping } from '../../../lib/interfaces/topic';
import { INoticeInfo, INotificationStatistics } from '../../../lib/interfaces/notification';
import { getNicknameFromToken } from '../../../lib/utils/for/member';

const domain = process.env.NEXT_PUBLIC_APP_DOMAIN;
const fname = CreatePost.name;

/** CreatePost v0.1.1 FIXME:
 * 
 * Last update: 
 * 
 * This interface ONLY accepts POST method
 * 
 * Post info required
 * - token: JWT
 * - title
 * - channelId
 */

export default async function CreatePost(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;
    if ('POST' !== method) {
        response405(req, res);
        return;
    }

    setTimeout(() => { res.send(createId('post')) }, 1000)
    return;


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
        const channelInfoTableClient = AzureTableClient('ChannelInfo');
        const channelInfoQuery = channelInfoTableClient.listEntities({ queryOptions: { filter: `PartitionKey eq 'Info' and RowKey eq '${channelId}' and IsActive eq true` } });
        // [!] attemp to reterieve entity makes the probability of causing RestError
        let channelInfoQueryResult = await channelInfoQuery.next();
        if (!channelInfoQueryResult.value) {
            res.status(400).send('Channel id not found');
            return;
        }
        await atlasDbClient.connect();
        //// Check member status ////
        // Step #1.1 prepare member id (of post author)
        const { sub: memberId } = token;
        // Step #1.2 look up member status (IMemberComprehensive) in [C] memberComprehensive
        const memberComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IMemberComprehensive>('member');
        const memberComprehensiveQueryResult = await memberComprehensiveCollectionClient.findOne<IMemberComprehensive>({ memberId });
        if (null === memberComprehensiveQueryResult) {
            throw new Error(`Member attempt to creating post but have no document (of IMemberComprehensive, member id: ${memberId}) in [C] memberComprehensive`);
        }
        const { status: memberStatus, allowPosting } = memberComprehensiveQueryResult;
        if (!(0 < memberStatus && allowPosting)) {
            res.status(403).send('Method not allowed due to member suspended or deactivated');
            await atlasDbClient.close();
            return;
        }
        //// Create post ////
        // Step #2.1 create a new post id
        const postId = getRandomIdStr(true);
        // Step #2.2 explicitly get topic id array and cued member info array
        const topicIdsArr = getTopicBase64StringsArrayFromRequestBody(req.body);
        const cuedMemberInfoArr = getCuedMemberInfoArrayFromRequestBody(req.body);
        // Step #2.3 insert a new document (of IPostComprehensive) in [C] postComprehensive
        const postComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IPostComprehensive>('post');
        const postComprehensiveInsertResult = await postComprehensiveCollectionClient.insertOne({
            //// info ////
            postId,
            memberId,
            createdTimeBySecond: Math.floor(new Date().getTime() / 1000),
            title, // required
            imageUrlsArr: getImageUrlsArrayFromRequestBody(req.body),
            paragraphsArr: getParagraphsArrayFromRequestBody(req.body),
            cuedMemberInfoArr: cuedMemberInfoArr,
            channelId, // required
            topicIdsArr,
            pinnedCommentId: null,
            //// management ////
            status: 200,
            //// statistics ////
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
            //// edite record ////
            edited: []
        });
        if (!postComprehensiveInsertResult.acknowledged) {
            throw new Error(`Failed to insert document (of IPostComprehensive, member id: ${memberId}) in [C] postComprehensive`);
        }
        res.status(200).send(postId);
        //// Update statistics ////
        // Step #3.1 update totalCreationCount (IMemberStatistics) in [C] memberStatistics
        const memberStatisticsCollectionClient = atlasDbClient.db('statistics').collection<IMemberStatistics>('member');
        const memberStatisticsUpdateResult = await memberStatisticsCollectionClient.updateOne({ memberId }, { $inc: { totalCreationCount: 1 } });
        if (!memberStatisticsUpdateResult.acknowledged) {
            logWithDate(`Document (IPostComprehensive, post id: ${postId}) inserted in [C] postComprehensive successfully but failed to update totalCreationCount (of IMemberStatistics, member id: ${memberId}) in [C] memberStatistics`, fname);
        }
        // Step #3.2 update totalPostCount (IChannelStatistics) in [C] channelStatistics
        const channelStatisticsCollectionClient = atlasDbClient.db('statistics').collection<IChannelStatistics>('channel');
        const channelStatisticsUpdateResult = await channelStatisticsCollectionClient.updateOne({ channelId }, { $inc: { totalPostCount: 1 } });
        if (!channelStatisticsUpdateResult.acknowledged) {
            logWithDate(`Document (IPostComprehensive, post id: ${postId}) inserted in [C] postComprehensive successfully but failed to update totalPostCount (of IChannelStatistics, channel id: ${channelId}) in [C] channelStatistics`, fname);
        }
        // Step #3.3 (cond.) update totalPostCount or insert a new document (ITopicComprehensive) in [C] topicComprehensive
        if (topicIdsArr.length !== 0) {
            const topicComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<ITopicComprehensive>('topic');
            const topicPostMappingCollectionClient = atlasDbClient.db('mapping').collection<ITopicPostMapping>('topic-post');
            for await (const topicId of topicIdsArr) {
                // case document (of topicComprehensive) [found]
                const topicComprehensiveQueryResult = await topicComprehensiveCollectionClient.findOneAndUpdate({ topicId }, { $inc: { totalPostCount: 1 } });
                if (!topicComprehensiveQueryResult.ok) {
                    // case document (of topicComprehensive) [not found]
                    const topicComprehensiveUpdateResult = await topicComprehensiveCollectionClient.updateOne({ topicId }, { $set: provideTopicComprehensive(topicId, channelId) }, { upsert: true });
                    if (!topicComprehensiveUpdateResult.acknowledged) {
                        logWithDate(`Document (IPostComprehensive, post id: ${postId}) inserted in [C] postComprehensive successfully but failed to update totalPostCount (of ITopicComprehensive, topic id: ${topicId}) in [C] topicComprehensive`, fname);
                    }
                }
                // Step (cond.) #3.4 insert a new document (of ITopicPostMapping) in [C] topicPostMapping
                const topicPostMappingInsertResult = await topicPostMappingCollectionClient.insertOne({
                    topicId,
                    postId,
                    channelId,
                    createdTimeBySecond: Math.floor(new Date().getTime() / 1000),
                    status: 200
                });
                if (!topicPostMappingInsertResult.acknowledged) {
                    logWithDate(`Document (ITopicPostMapping, post id: ${postId}) inserted in [C] postComprehensive successfully but failed to insert document (of ITopicPostMapping, topic id: ${topicId}) in [C] topicPostMapping`, fname);
                }
            }
        }
        //// Handle notice.cue (cond.) ////
        // Step #4.1 verify cued member ids array
        if (cuedMemberInfoArr.length !== 0) {
            const blockingMemberMappingTableClient = AzureTableClient('BlockingMemberMapping');
            const notificationStatisticsCollectionClient = atlasDbClient.db('statistics').collection<INotificationStatistics>('notification');
            // Step #4.2 maximum 9 members are allowed to cued at one time (in one comment)
            const cuedMemberIdsArrSliced = cuedMemberInfoArr.slice(0, 9);
            for await (const cuedMemberInfo of cuedMemberIdsArrSliced) {
                const { memberId: memberId_cued } = cuedMemberInfo;
                // Step #4.3 look up record (of IMemberMemberMapping) in [RL] BlockingMemberMapping
                const _blockingMemberMappingQuery = blockingMemberMappingTableClient.listEntities({ queryOptions: { filter: `PartitionKey eq '${memberId_cued}' and RowKey eq '${memberId}'` } });
                //// [!] attemp to reterieve entity makes the probability of causing RestError ////
                const _blockingMemberMappingQueryResult = await _blockingMemberMappingQuery.next();
                if (!_blockingMemberMappingQueryResult.value) {
                    //// [!] comment author has not been blocked by cued member ////
                    // Step #4.4 upsert record (INoticeInfo.Cued) in [PRL] Notice
                    const noticeTableClient = AzureTableClient('Notice');
                    noticeTableClient.upsertEntity<INoticeInfo>({
                        partitionKey: memberId_cued,
                        rowKey: createNoticeId('cue', memberId, postId), // combined id
                        Category: 'cue',
                        InitiateId: memberId,
                        Nickname: getNicknameFromToken(token),
                        // PostId: postId,
                        PostTitle: title,
                    }, 'Replace');
                    // Step #4.5 update cue (of INotificationStatistics) (of cued member) in [C] notificationStatistics
                    const notificationStatisticsUpdateResult = await notificationStatisticsCollectionClient.updateOne({ memberId: memberId_cued }, {
                        $inc: {
                            cue: 1
                        }
                    });
                    if (!notificationStatisticsUpdateResult.acknowledged) {
                        logWithDate(`Document (IPostComprehensive, post id: ${postId}) inserted in [C] postComprehensive successfully but failed to update cue (of INotificationStatistics, member id: ${memberId_cued}) in [C] notificationStatistics`, fname);
                    }
                }
            }
        }
        await atlasDbClient.close();
        return;
    } catch (e: any) {
        let msg;
        if (e instanceof SyntaxError) {
            res.status(400).send('Improperly normalized request info');
            return;
        } else if (e instanceof RestError) {
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