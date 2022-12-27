import type { NextApiRequest, NextApiResponse } from 'next';
import { RestError } from '@azure/data-tables';
import { MongoError } from 'mongodb';
import { getToken } from 'next-auth/jwt';

import AzureTableClient from '../../../../modules/AzureTableClient';
import AtlasDatabaseClient from '../../../../modules/AtlasDatabaseClient';

import { INoticeInfo, INotificationStatistics, IMemberStatistics, IChannelStatistics, ITopicComprehensive, IPostComprehensive, ITopicPostMapping } from '../../../../lib/interfaces';
import { ChannelInfo } from '../../../../lib/types';
import { getRandomIdStr, getRandomIdStrL, getNicknameFromToken, getImageUrlsArrayFromRequestBody, getParagraphsArrayFromRequestBody, verifyUrl, response405, response500, log, getTopicBase64StringsArrayFromRequestBody } from '../../../../lib/utils';

const domain = process.env.NEXT_PUBLIC_APP_DOMAIN;

// This interface only accepts post (create post) method
// Use 'api/post/info/[postId]' to GET comment info
//
// Post info required:
// - title
// - channelId
//
export default async function CreatePost(req: NextApiRequest, res: NextApiResponse) {
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
        res.status(400).send('Improper post title');
        return;
    }
    ////Verify channel id ////
    const { channelId } = req.body;
    if (!('string' === typeof channelId && '' !== channelId)) {
        res.status(400).send('Improper channel id');
        return;
    }
    let channelDict: any;
    try {
        channelDict = await fetch(`${domain}/api/channel/dictionary`).then(resp => resp.json()).catch(e => { throw e });
    } catch (e) {
        let msg = `Was trying retrieving channel dictionary.`;
        response500(res, msg);
        log(msg, e);
        return;
    }
    if (!Object.hasOwn(channelDict, channelId)) {
        res.status(400).send('Channel id not found');
        return;
    }
    //// Declare DB client ////
    const atlasDbClient = AtlasDatabaseClient();
    try {
        atlasDbClient.connect();

        //// Check member status ////

        // Step #1.1 prepare member id (of post author)
        const { sub: memberId } = token;
        // Step #1.2 look up member status (IMemberComprehensive) in [C] memberComprehensive
        const memberComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IMemberStatistics>('member');
        const memberComprehensiveQueryResult = await memberComprehensiveCollectionClient.findOne<IMemberStatistics>({ memberId });
        if (null === memberComprehensiveQueryResult) {
            res.status(500).send('Member not found');
            log(`Member was tring creating comment (member id: ${memberId}) but have no document (of IMemberComprehensive) in [C] memberComprehensive`);
            return;
        }
        const { status: memberStatus, allowCommenting } = memberComprehensiveQueryResult;
        if (!(0 < memberStatus && allowCommenting)) {
            res.status(403).send('Creating posts is not allowed for this member');
            return;
        }

        //// Create post ////

        // Step #2.1 create a new post id
        const postId = getRandomIdStr(true);
        // Step #2.2 explicitly get topic id from request body (topic content strings)
        const topicIdsArr = getTopicBase64StringsArrayFromRequestBody(req.body);
        // Step #2.3 insert document (of IPostComprehensive) in [C] postComprehensive
        const postComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IPostComprehensive>('post');
        const postComprehensiveInsertResult = await postComprehensiveCollectionClient.insertOne({
            postId,
            memberId,
            createdTime: new Date().getTime(),
            title, // required
            imageUrlsArr: getImageUrlsArrayFromRequestBody(req.body),
            paragraphsArr: getParagraphsArrayFromRequestBody(req.body),
            channelId, // required
            topicIdsArr,
            pinnedCommentId: null,
            edited: null,
            status: 200,
            totalHitCount: 0,
            totalLikedCount: 0,
            totalDislikedCount: 0,
            totalCommentCount: 0,
            totalSavedCount: 0
        });
        if (!postComprehensiveInsertResult.acknowledged) {
            log(`Failed to insert document (of IPostComprehensive, member id: ${memberId}) in [C] postComprehensive`);
            res.status(500).send('Failed to create post');
            return;
        } else {
            res.status(200).send(postId);
        }

        //// Update statistics ////

        // Step #3.1 update total creation count (IMemberStatistics) in [C] memberStatistics
        const memberStatisticsCollectionClient = atlasDbClient.db('statistics').collection<IMemberStatistics>('member');
        const memberStatisticsUpdateResult = await memberStatisticsCollectionClient.updateOne({ memberId }, {
            $inc: {
                totalCreationCount: 1
            }
        });
        if (!memberStatisticsUpdateResult.acknowledged) {
            log(`Document (IPostComprehensive, post id: ${postId}) inserted in [C] postComprehensive successfully but failed to update totalCreationCount (of IMemberStatistics, member id: ${memberId}) in [C] memberStatistics`);
        }
        // Step #3.2 update total post count (IChannelStatistics) in [C] channelStatistics
        const channelStatisticsCollectionClient = atlasDbClient.db('statistics').collection<IChannelStatistics>('channel');
        const channelStatisticsUpdateResult = await channelStatisticsCollectionClient.updateOne({ channelId }, {
            $inc: {
                totalPostCount: 1
            }
        });
        if (!channelStatisticsUpdateResult.acknowledged) {
            log(`Document (IPostComprehensive, post id: ${postId}) inserted in [C] postComprehensive successfully but failed to update totalPostCount (of IChannelStatistics, channel id: ${channelId}) in [C] channelStatistics`);
        }
        // Step #3.3 (cond.) update total post count (ITopicComprehensive) in [C] topicComprehensive
        if (Array.isArray(topicIdsArr) && topicIdsArr.length !== 0) {
            const topicComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<ITopicComprehensive>('topic');
            const topicPostMappingCollectionClient = atlasDbClient.db('mapping').collection<ITopicPostMapping>('topic-post');
            for await (const topicId of topicIdsArr) {
                // Step #3.3.1 update topic statistics or insert document (of ITopicComprehensive) in [C] topicComprehensive
                const topicComprehensiveUpdateResult = await topicComprehensiveCollectionClient.updateOne({ topicId }, {
                    //// [!] create new topic comprehensive document if no found ////
                    $set: {
                        topicId, // base64 string from topic content string
                        channelId,
                        createdTime: new Date().getTime(), // create time of this document (topic est.)
                        status: 200,
                        totalPostCount: 1, // this post
                        totalHitCount: 1,
                        totalCommentCount: 0,
                        totalSavedCount: 0,
                        totalSearchCount: 0
                    },
                    //// [!] update document if found ////
                    $inc: {
                        totalPostCount: 1
                    }
                }, { upsert: true });
                if (!topicComprehensiveUpdateResult.acknowledged) {
                    log(`Document (IPostComprehensive, post id: ${postId}) inserted in [C] postComprehensive successfully but failed to update totalPostCount (of ITopicComprehensive, topic id: ${topicId}) in [C] topicComprehensive`);
                }
                // Step #3.3.2 insert document (of ITopicPostMapping) in [C] topicPostMapping
                const topicPostMappingInsertResult = await topicPostMappingCollectionClient.insertOne({
                    topicId,
                    postId,
                    channelId,
                    createdTime: new Date().getTime(),
                    status: 200
                });
                if (!topicPostMappingInsertResult.acknowledged) {
                    log(`Document (ITopicPostMapping, post id: ${postId}) inserted in [C] postComprehensive successfully but failed to insert document (of ITopicPostMapping, topic id: ${topicId}) in [C] topicPostMapping`);
                }
            }
        }

        //// (Cond.) Handle cue ////

        // Step #4.1 verify cued member ids array
        const { cuedMemberIdsArr } = req.body;
        if (Array.isArray(cuedMemberIdsArr) && cuedMemberIdsArr.length !== 0) {
            const notificationStatisticsCollectionClient = atlasDbClient.db('statistics').collection<INotificationStatistics>('notification');
            // Step #4.2 maximum 9 members are allowed to cued at one time (in one comment)
            const cuedMemberIdsArrSliced = cuedMemberIdsArr.slice(0, 9);
            for await (const memberId_cued of cuedMemberIdsArrSliced) {
                const blockingMemberMappingTableClient = AzureTableClient('BlockingMemberMapping');
                const _blockingMemberMappingQuery = blockingMemberMappingTableClient.listEntities({ queryOptions: { filter: `PartitionKey eq '${memberId_cued}' and RowKey eq '${memberId}'` } });
                //// [!] attemp to reterieve entity makes the probability of causing RestError ////
                const _blockingMemberMappingQueryResult = await _blockingMemberMappingQuery.next();
                if (!_blockingMemberMappingQueryResult.value) {
                    //// [!] comment author has not been blocked by cued member ////
                    const noticeId = getRandomIdStrL(true);
                    // Step #4.2 upsert record (INoticeInfo.Cued) in [PRL] Notice
                    const noticeTableClient = AzureTableClient('Notice');
                    noticeTableClient.upsertEntity<INoticeInfo>({
                        partitionKey: memberId_cued,
                        rowKey: noticeId,
                        Category: 'Cued',
                        InitiateId: memberId,
                        Nickname: getNicknameFromToken(token),
                        PostId: postId,
                        PostTitle: title,
                    }, 'Replace');
                    // Step #4.3 update document (INotificationStatistics) (of cued member) in [C] notificationStatistics
                    const notificationStatisticsUpdateResult = await notificationStatisticsCollectionClient.updateOne({ memberId: memberId_cued }, {
                        $inc: {
                            cuedCount: 1
                        }
                    });
                    if (!notificationStatisticsUpdateResult.acknowledged) {
                        log(`Document (IPostComprehensive, post id: ${postId}) inserted in [C] postComprehensive successfully but failed to update cuedCount (of INotificationStatistics, member id: ${memberId_cued}) in [C] notificationStatistics`);
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