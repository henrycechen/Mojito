import type { NextApiRequest, NextApiResponse } from 'next';
import { RestError } from '@azure/data-tables';
import { getToken } from 'next-auth/jwt';

import AzureTableClient from '../../../../modules/AzureTableClient';
import AtlasDatabaseClient from '../../../../modules/AtlasDatabaseClient';

import { INoticeInfo, INotificationStatistics, IMemberStatistics, IChannelStatistics, ITopicComprehensive, IPostComprehensive } from '../../../../lib/interfaces';
import { ChannelInfo } from '../../../../lib/types';
import { getRandomIdStr, getRandomIdStrL, getNicknameFromToken, getImageUrlsArrayFromRequestBody, getParagraphsArrayFromRequestBody, verifyUrl, response405, response500, log, getTopicIdsArrayFromRequestBody } from '../../../../lib/utils';

// This interface only accepts post (create post) method
// Use 'api/post/info/[postId]' to GET comment info
//
// Info required:
// - title: string;
// - imageUrlsArr: string[];
// - channelId: string;
// cuedMemberIdsArr: string[] | undefined;
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
        // called by member him/herself
        res.status(400).send('Invalid identity');
        return;
    }
    //// Declare DB client ////
    const atlasDbClient = AtlasDatabaseClient();
    try {
        atlasDbClient.connect();
        // Step #2.1 create a new post id
        const postId = getRandomIdStr(true);
        // Step #2.2 prepare member id (of post author)
        const { sub: memberId } = token;
        // Step #2.3 verify title
        const { title, channelId } = req.body;
        const topicIdsArr = getTopicIdsArrayFromRequestBody(req.body);
        // Step #2.4 insert document (IPostComprehensive) in [C] postComprehensive
        const postComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IPostComprehensive>('post');
        const postComprehensiveInsertResult = await postComprehensiveCollectionClient.insertOne({
            postId,
            memberId,
            createdTime: new Date().getTime(),
            title,
            imageUrlsArr: getImageUrlsArrayFromRequestBody(req.body),
            paragraphsArr: getParagraphsArrayFromRequestBody(req.body),
            channelId,
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
            log(`Failed to insert document (IPostComprehensive, member id: ${memberId}) in [C] postComprehensive`);
            res.status(500).send('Post failed to create');
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
            for await (const topicId of topicIdsArr) {
                const topicComprehensiveUpdateResult = await topicComprehensiveCollectionClient.updateOne({ postId }, {
                    $inc: {
                        totalPostCount: 1
                    }
                });
                if (!topicComprehensiveUpdateResult.acknowledged) {
                    log(`Document (IPostComprehensive, post id: ${postId}) inserted in [C] postComprehensive successfully but failed to update totalPostCount (of ITopicComprehensive, topic id: ${topicId}) in [C] topicComprehensive`);
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
        let msg: string;
        if (e instanceof RestError) {
            msg = `Was trying communicating with azure table storage.`;
        }
        else {
            msg = `Uncategorized. ${e?.msg}`;
        }
        response500(res, msg);
        log(msg, e);
        return;
    }
}