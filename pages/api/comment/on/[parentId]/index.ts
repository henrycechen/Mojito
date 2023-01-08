import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt'
import { RestError } from '@azure/data-tables';
import { MongoError } from 'mongodb';

import AzureTableClient from '../../../../../modules/AzureTableClient';
import AtlasDatabaseClient from "../../../../../modules/AtlasDatabaseClient";

import { INoticeInfo, IMemberPostMapping, INotificationStatistics, IMemberComprehensive,IRestrictedMemberInfo, IMemberStatistics, ILoginJournal, IAttitudeComprehensive, IAttitideMapping, ICommentComprehensive, IEditedCommentComprehensive, IRestrictedCommentComprehensive, IChannelStatistics, ITopicComprehensive, ITopicPostMapping, IPostComprehensive, IEditedPostComprehensive, IRestrictedPostComprehensive } from '../../../../../lib/interfaces';
import { createId, createNoticeId, getRandomIdStr, getRandomIdStrL, getRandomHexStr, timeStampToString, getNicknameFromToken, getContentBrief, createCommentComprehensive, getRestrictedFromCommentComprehensive, getTopicBase64StringsArrayFromRequestBody, getImageUrlsArrayFromRequestBody, getParagraphsArrayFromRequestBody, getRestrictedFromPostComprehensive, verifyEmailAddress, verifyPassword, verifyId, verifyUrl, verifyRecaptchaResponse, verifyEnvironmentVariable, response405, response500, log } from '../../../../../lib/utils';

const recaptchaServerSecret = process.env.INVISIABLE_RECAPTCHA_SECRET_KEY ?? '';


// This interface accepts GET, POST requests
//
// Info required for POST method
// - recaptchaResponse: string (query string)
// - token: JWT (cookie)
// - id(parentId): string (query)
// - content: string (body)
// - cuedMemberInfoArr: IRestrictedMemberInfo[] (body, optional)
//


export default async function CommentIndexByParentId(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;
    if ('POST' !== method) {
        response405(req, res);
        return;
    }
    // FIXME: deactived human/bot verification for tests
    //// Verify human/bot ////
    // const { recaptchaResponse } = req.query;
    // const { status, message } = await verifyRecaptchaResponse(recaptchaServerSecret, recaptchaResponse);
    // if (200 !== status) {
    //     if (403 === status) {
    //         res.status(403).send(message);
    //         return;
    //     }
    //     if (500 === status) {
    //         response500(res, message);
    //         return;
    //     }
    // }
    const { isValid, category, id: parentId } = verifyId(req.query?.parentId);
    if (!isValid) {
        res.status(400).send('Invalid parent id');
        return;
    }
    //// Verify identity ////
    const token = await getToken({ req });
    if (!(token && token?.sub)) {
        res.status(400).send('Invalid identity');
        return;
    }
    //// Verify parent id category ////
    if (!['post', 'comment'].includes(category)) {
        res.status(400).send('Invalid parent id category');
        return;
    }
    //// Verify content ////
    const { content } = req.body;
    if (!('string' === content && '' !== content)) {
        res.status(400).send('Improper or blank content');
        return;
    }
    //// Declare DB client ////
    const atlasDbClient = AtlasDatabaseClient();
    try {
        const { sub: initiateId } = token;
        await atlasDbClient.connect();
        // Step #1.1 look up document (of IMemberComprehensive) in [C] memberComprehensive
        const memberComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IMemberComprehensive>('member');
        const memberComprehensiveQueryResult = await memberComprehensiveCollectionClient.findOne({ memberId: initiateId });
        if (null === memberComprehensiveQueryResult) {
            throw new Error(`Member was trying creating comment but have no document (of IMemberComprehensive, member id: ${initiateId}) in [C] memberComprehensive`);
        }
        // Step #1.2 verify member status (of IMemberComprehensive)
        const { status: memberStatus } = memberComprehensiveQueryResult;
        if (0 > memberStatus) {
            res.status(403).send('Method not allowed due to member suspended');
            await atlasDbClient.close();
            return;
        }
        // Step #1.3 declare post id
        let postId = parentId;
        // Step #1.4 declare notified member id
        let notifiedMemberId = '';
        // Step #2 verify status
        const commentComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<ICommentComprehensive>('comment');
        if ('comment' === category) {
            // Step #2.3 (cond.) look up document (of IPostComprehensive) in [C] postComprehensive
            const commentComprehensiveQueryResult = await commentComprehensiveCollectionClient.findOne({ commentId: parentId });
            if (null === commentComprehensiveQueryResult) {
                res.status(404).send('Comment not found');
                await atlasDbClient.close();
                return;
            }
            // Step #2.4 (cond.) verify comment status (of IPostComprehensive)
            const { status: commentStatus } = commentComprehensiveQueryResult;
            if (0 > commentStatus) {
                res.status(403).send('Method not allowed due to comment deleted');
                await atlasDbClient.close();
                return;
            }
            // Step #2.5 (cond.) make parent id (of parent comment) the post id
            postId = commentComprehensiveQueryResult.parentId;
            // Step #2.6 (cond.) make member id (of parent comment author) of the notified member id
            notifiedMemberId = commentComprehensiveQueryResult.memberId;
        }
        // Step #2.1 look up document (of IPostComprehensive) in [C] postComprehensive
        const postComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IPostComprehensive>('post');
        const postComprehensiveQueryResult = await postComprehensiveCollectionClient.findOne({ postId });
        if (null === postComprehensiveQueryResult) {
            res.status(404).send('Post not found');
            await atlasDbClient.close();
            return;
        }
        // Step #2.2 verify post status (of IPostComprehensive)
        const { status: postStatus } = postComprehensiveQueryResult;
        if (0 > postStatus) {
            res.status(403).send('Method not allowed due to post deleted');
            await atlasDbClient.close();
            return;
        }
        // Step #2.7 (cond.) make member id (of post author) of the notified member id
        if ('post' === category) {
            notifiedMemberId = postComprehensiveQueryResult.memberId;
        }
        // Step #3.1 create a new comment id
        const commentId = createId('post' === category ? 'comment' : 'subcomment');
        // Step #3.2 insert a new document (of ICommentComprehensive) in [C] commentComprehensive
        const commentComprehensiveInsertResult = await commentComprehensiveCollectionClient.insertOne(createCommentComprehensive(commentId, parentId, postId, initiateId, content, req.body?.cuedMemberInfoArr));
        if (!commentComprehensiveInsertResult.acknowledged) {
            throw new Error(`Failed to insert document (of ICommentComprehensive, member id: ${initiateId}, parent id: ${parentId}, post id: ${postId}) in [C] commentComprehensive`);
        }
        res.status(200).send(commentId);
        //// Update statistics ////
        // Step #5.1 update totalCommentCount (of IMemberStatistics) in [C] memberStatistics
        const memberStatisticsCollectionClient = atlasDbClient.db('statistics').collection<IMemberStatistics>('member');
        const memberStatisticsUpdateResult = await memberStatisticsCollectionClient.updateOne({ initiateId }, {
            $inc: {
                totalCommentCount: 1
            }
        });
        if (!memberStatisticsUpdateResult.acknowledged) {
            log(`Document (ICommentComprehensive, comment id: ${commentId}) inserted in [C] commentComprehensive successfully but failed to update totalCommentCount (of IMemberStatistics, member id: ${initiateId}) in [C] memberStatistics`);
        }
        // Step #5.2 (cond.) totalSubcommentCount (of ICommentComprehensive) in [C] commentComprehensive (parent comment)
        if ('C' === commentId.slice(0, 1)) {
            const commentComprehensiveUpdateResult = await commentComprehensiveCollectionClient.updateOne({ commentId: parentId }, {
                $inc: {
                    totalSubcommentCount: 1
                }
            });
            if (!commentComprehensiveUpdateResult.acknowledged) {
                log(`Document (ICommentComprehensive, comment id: ${commentId}) was inserted in [C] commentComprehensive successfully but failed to update totalSubcommentCount (of ICommentComprehensive, comment id: ${parentId}) in [C] commentComprehensive`);
            }
        }
        // Step #5.3 update totalCommentCount (of IPostComprehensive) in [C] postComprehensive
        const postComprehensiveUpdateResult = await postComprehensiveCollectionClient.updateOne({ postId }, {
            $inc: {
                totalCommentCount: 1
            }
        });
        if (!postComprehensiveUpdateResult.acknowledged) {
            log(`Document (ICommentComprehensive, comment id: ${commentId}) was inserted in [C] commentComprehensive successfully but failed to update totalCommentCount (of IPostComprehensive, post id: ${postId}) in [C] postComprehensive`);
        }
        // Step #5.4 update total comment count (of IChannelStatistics) in [C] channelStatistics
        const { channelId } = postComprehensiveQueryResult;
        const channelStatisticsCollectionClient = atlasDbClient.db('statistics').collection<IChannelStatistics>('channel');
        const channelStatisticsUpdateResult = await channelStatisticsCollectionClient.updateOne({ channelId }, {
            $inc: {
                totalCommentCount: 1
            }
        });
        if (!channelStatisticsUpdateResult.acknowledged) {
            log(`Document (ICommentComprehensive, comment id: ${commentId}) inserted in [C] commentComprehensive successfully but failed to update totalCommentCount (of IChannelStatistics, channel id: ${channelId}) in [C] channelStatistics`);
        }
        // Step #5.5 (cond.) update totalCommentCount (of ITopicComprehensive) in [C] topicComprehensive
        const { topicIdsArr } = postComprehensiveQueryResult;
        if (Array.isArray(topicIdsArr) && topicIdsArr.length !== 0) {
            const topicComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<ITopicComprehensive>('topic');
            for await (const topicId of topicIdsArr) {
                const topicComprehensiveUpdateResult = await topicComprehensiveCollectionClient.updateOne({ postId }, {
                    $inc: {
                        totalCommentCount: 1
                    }
                });
                if (!topicComprehensiveUpdateResult.acknowledged) {
                    log(`Document (ICommentComprehensive, comment id: ${commentId}) inserted in [C] commentComprehensive successfully but failed to update totalCommentCount (of ITopicComprehensive, topic id: ${topicId}) in [C] topicComprehensive`);
                }
            }
        }
        //// Handle reply ////
        const { title } = postComprehensiveQueryResult;
        // Step #6.1 look up member id (IMemberMapping) in [RL] BlockingMemberMapping
        const blockingMemberMappingTableClient = AzureTableClient('BlockingMemberMapping');
        const blockingMemberMappingQuery = blockingMemberMappingTableClient.listEntities({ queryOptions: { filter: `PartitionKey eq '${notifiedMemberId}' and RowKey eq '${initiateId}'` } });
        //// [!] attemp to reterieve entity makes the probability of causing RestError ////
        const blockingMemberMappingQueryResult = await blockingMemberMappingQuery.next();
        if (!blockingMemberMappingQueryResult.value) {
            //// [!] comment author has not been blocked by post / comment author ////
            // Step #6.2 upsert record (INoticeInfo.Replied) in [PRL] Notice
            const noticeTableClient = AzureTableClient('Notice');
            //// FIXME: TEST-3G29WQD ////
            const a = await noticeTableClient.upsertEntity<INoticeInfo>({
                partitionKey: notifiedMemberId,
                rowKey: createNoticeId('reply', initiateId, postId, commentId),
                Category: 'reply',
                InitiateId: initiateId,
                Nickname: getNicknameFromToken(token),
                PostTitle: title,
                CommentBrief: getContentBrief(content)
            }, 'Replace');
            console.log(`TEST-3G29WQD: path='/api/comment/on/[id]/index.ts/' result: ` + a.version);
            //// FIXME: TEST-3G29WQD ////
            // Step #6.3 update repliedCount (INotificationStatistics) (of post author) in [C] notificationStatistics
            const notificationStatisticsCollectionClient = atlasDbClient.db('statistics').collection<INotificationStatistics>('notification');
            const notificationStatisticsUpdateResult = await notificationStatisticsCollectionClient.updateOne({ memberId: notifiedMemberId }, {
                $inc: {
                    repliedCount: 1
                }
            });
            if (!notificationStatisticsUpdateResult.acknowledged) {
                log(`Document (ICommentComprehensive, comment id: ${commentId}) inserted in [C] commentComprehensive successfully but failed to repliedCount (of INotificationStatistics, member id: ${notifiedMemberId}) in [C] notificationStatistics`);
            }
        }
        //// Handle cue ////
        // Step #7.1 verify cued member ids array
        const { cuedMemberInfoArr } = req.body;
        if (Array.isArray(cuedMemberInfoArr) && cuedMemberInfoArr.length !== 0) {
            const notificationStatisticsCollectionClient = atlasDbClient.db('statistics').collection<INotificationStatistics>('notification');
            // Step #7.2 maximum 9 members are allowed to cued at one time (in one comment)
            const cuedMemberInfoArrSliced = cuedMemberInfoArr.slice(0, 9);
            for await (const cuedMemberInfo of cuedMemberInfoArrSliced) {
                const { memberId: memberId_cued } = cuedMemberInfo;
                const _blockingMemberMappingQuery = blockingMemberMappingTableClient.listEntities({ queryOptions: { filter: `PartitionKey eq '${memberId_cued}' and RowKey eq '${initiateId}'` } });
                //// [!] attemp to reterieve entity makes the probability of causing RestError ////
                const _blockingMemberMappingQueryResult = await _blockingMemberMappingQuery.next();
                if (!_blockingMemberMappingQueryResult.value) {
                    //// [!] comment author has not been blocked by cued member ////
                    // Step #7.3 upsert record (of INoticeInfo.Cued) in [PRL] Notice
                    const noticeTableClient = AzureTableClient('Notice');
                    noticeTableClient.upsertEntity<INoticeInfo>({
                        partitionKey: memberId_cued,
                        rowKey: createNoticeId('cue', initiateId, postId, commentId), // entity id
                        Category: 'cue',
                        InitiateId: initiateId,
                        Nickname: getNicknameFromToken(token),
                        PostTitle: title,
                        CommentBrief: getContentBrief(content)
                    }, 'Replace');
                    // Step #7.4 update cued count (INotificationStatistics) (of cued member) in [C] notificationStatistics
                    const notificationStatisticsUpdateResult = await notificationStatisticsCollectionClient.updateOne({ memberId: memberId_cued }, {
                        $inc: {
                            cuedCount: 1
                        }
                    });
                    if (!notificationStatisticsUpdateResult.acknowledged) {
                        log(`Document (ICommentComprehensive, comment id: ${commentId}) inserted in [C] commentComprehensive successfully but failed to update cuedCount (of INotificationStatistics, member id: ${memberId_cued}) in [C] notificationStatistics`);
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