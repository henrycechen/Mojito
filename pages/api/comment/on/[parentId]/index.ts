import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import { RestError } from '@azure/data-tables';
import { MongoError } from 'mongodb';

import AzureTableClient from '../../../../../modules/AzureTableClient';
import AtlasDatabaseClient from '../../../../../modules/AtlasDatabaseClient';

import { IMemberComprehensive, IMemberStatistics } from '../../../../../lib/interfaces/member';
import { IPostComprehensive } from '../../../../../lib/interfaces/post';
import { ICommentComprehensive } from '../../../../../lib/interfaces/comment';
import { IChannelStatistics } from '../../../../../lib/interfaces/channel';
import { ITopicComprehensive } from '../../../../../lib/interfaces/topic';
import { INotificationComprehensive, INotificationStatistics } from '../../../../../lib/interfaces/notification';

import { verifyId } from '../../../../../lib/utils/verify';
import { response405, response500, logWithDate, getContentBrief } from '../../../../../lib/utils/general';
import { createId, createNoticeId, getTimeBySecond } from '../../../../../lib/utils/create';
import { createCommentComprehensive } from '../../../../../lib/utils/for/comment';

const fnn = `${CreateCommentOnParentById.name} (API)`;

/**
 * This interface accepts POST requests
 * 
 * Info required for POST requests
 * -     token: JWT (cookie)
 * -     parentId: string (query)
 * -     postId: string (body)
 * -     content: string (body)
 * -     cuedMemberInfoArr: IConciseMemberInfo[] (body, optional)
 * 
 * Last update: 21/02/2023 v0.1.1
 * Last update: 08/05/2023 v0.1.2
 * Last update: 31/05/2023 v0.1.3
 */

export default async function CreateCommentOnParentById(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;
    if ('POST' !== method) {
        response405(req, res);
        return;
    }

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
    if (!('string' === typeof content && '' !== content)) {
        res.status(400).send('Improper or blank content');
        return;
    }
    //// Declare DB client ////
    const atlasDbClient = AtlasDatabaseClient();
    try {
        const { sub: initiateId } = token;
        await atlasDbClient.connect();
        // #1.1 look up document (of IMemberComprehensive) in [C] memberComprehensive
        const memberComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IMemberComprehensive>('member');
        const memberComprehensiveQueryResult = await memberComprehensiveCollectionClient.findOne({ memberId: initiateId }, {
            projection: {
                _id: 0,
                nickname: 1,
                status: 1,
                allowCommenting: 1,
            }
        });
        if (null === memberComprehensiveQueryResult) {
            throw new Error(`Member Attempt to creating comment but have no document (of IMemberComprehensive, member id: ${initiateId}) in [C] memberComprehensive`);
        }
        // #1.2 verify member status (of IMemberComprehensive)
        const { status: memberStatus, allowCommenting } = memberComprehensiveQueryResult;
        if (!(0 < memberStatus && allowCommenting)) {
            res.status(403).send('Method not allowed due to member suspended or deactivated');
            await atlasDbClient.close();
            return;
        }
        const { nickname } = memberComprehensiveQueryResult;
        // #1.3 declare post id
        let postId = parentId;
        // #1.4 declare notified member id
        let notifiedMemberId = '';
        // #2 verify status
        const commentComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<ICommentComprehensive>('comment');
        if ('comment' === category) {
            // #2.3 (cond.) look up document (of IPostComprehensive) in [C] postComprehensive
            const commentComprehensiveQueryResult = await commentComprehensiveCollectionClient.findOne({ commentId: parentId });
            if (null === commentComprehensiveQueryResult) {
                res.status(404).send('Comment not found');
                await atlasDbClient.close();
                return;
            }
            // #2.4 (cond.) verify comment status (of IPostComprehensive)
            const { status: commentStatus } = commentComprehensiveQueryResult;
            if (0 > commentStatus) {
                res.status(403).send('Method not allowed due to comment deleted');
                await atlasDbClient.close();
                return;
            }
            // #2.5 (cond.) make parent id (of parent comment) the post id
            postId = commentComprehensiveQueryResult.parentId;
            // #2.6 (cond.) make member id (of parent comment author) of the notified member id
            notifiedMemberId = commentComprehensiveQueryResult.memberId;
        }
        // #2.1 look up document (of IPostComprehensive) in [C] postComprehensive
        const postComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IPostComprehensive>('post');
        const postComprehensiveQueryResult = await postComprehensiveCollectionClient.findOne({ postId });
        if (null === postComprehensiveQueryResult) {
            res.status(404).send('Post not found');
            await atlasDbClient.close();
            return;
        }
        // #2.2 verify post status (of IPostComprehensive)
        const { status: postStatus } = postComprehensiveQueryResult;
        if (0 > postStatus) {
            res.status(403).send('Method not allowed due to post deleted');
            await atlasDbClient.close();
            return;
        }
        // #2.7 (cond.) make member id (of post author) of the notified member id
        if ('post' === category) {
            notifiedMemberId = postComprehensiveQueryResult.memberId;
        }
        // #3.1 create a new comment id
        const commentId = createId('post' === category ? 'comment' : 'subcomment');
        // #3.2 insert a new document (of ICommentComprehensive) in [C] commentComprehensive
        const commentComprehensiveInsertResult = await commentComprehensiveCollectionClient.insertOne(createCommentComprehensive(commentId, parentId, postId, initiateId, nickname, content, req.body?.cuedMemberInfoArr));
        if (!commentComprehensiveInsertResult.acknowledged) {
            throw new Error(`Failed to insert document (of ICommentComprehensive, member id: ${initiateId}, parent id: ${parentId}, post id: ${postId}) in [C] commentComprehensive`);
        }

        //// Response 200 ////
        res.status(200).send(commentId);

        //// Update statistics ////
        // #5.1 update totalCommentCount (of IMemberStatistics) in [C] memberStatistics
        const memberStatisticsCollectionClient = atlasDbClient.db('statistics').collection<IMemberStatistics>('member');
        const memberStatisticsUpdateResult = await memberStatisticsCollectionClient.updateOne({ memberId: initiateId }, {
            $inc: {
                totalCommentCount: 1
            }
        });
        if (!memberStatisticsUpdateResult.acknowledged) {
            logWithDate(`Document (ICommentComprehensive, comment id: ${commentId}) inserted in [C] commentComprehensive successfully but failed to update totalCommentCount (of IMemberStatistics, member id: ${initiateId}) in [C] memberStatistics`, fnn);
        }
        // #5.2 (cond.) totalSubcommentCount (of ICommentComprehensive) in [C] commentComprehensive (parent comment)
        if ('C' === parentId.slice(0, 1)) {
            const commentComprehensiveUpdateResult = await commentComprehensiveCollectionClient.updateOne({ commentId: parentId }, {
                $inc: {
                    totalSubcommentCount: 1
                }
            });
            if (!commentComprehensiveUpdateResult.acknowledged) {
                logWithDate(`Document (ICommentComprehensive, comment id: ${commentId}) was inserted in [C] commentComprehensive successfully but failed to update totalSubcommentCount (of ICommentComprehensive, comment id: ${parentId}) in [C] commentComprehensive`, fnn);
            }
        }
        // #5.3 update totalCommentCount (of IPostComprehensive) in [C] postComprehensive
        const postComprehensiveUpdateResult = await postComprehensiveCollectionClient.updateOne({ postId }, {
            $inc: {
                totalCommentCount: 1
            }
        });
        if (!postComprehensiveUpdateResult.acknowledged) {
            logWithDate(`Document (ICommentComprehensive, comment id: ${commentId}) was inserted in [C] commentComprehensive successfully but failed to update totalCommentCount (of IPostComprehensive, post id: ${postId}) in [C] postComprehensive`, fnn);
        }
        // #5.4 update total comment count (of IChannelStatistics) in [C] channelStatistics
        const { channelId } = postComprehensiveQueryResult;
        const channelStatisticsCollectionClient = atlasDbClient.db('statistics').collection<IChannelStatistics>('channel');
        const channelStatisticsUpdateResult = await channelStatisticsCollectionClient.updateOne({ channelId }, {
            $inc: {
                totalCommentCount: 1
            }
        });
        if (!channelStatisticsUpdateResult.acknowledged) {
            logWithDate(`Document (ICommentComprehensive, comment id: ${commentId}) inserted in [C] commentComprehensive successfully but failed to update totalCommentCount (of IChannelStatistics, channel id: ${channelId}) in [C] channelStatistics`, fnn);
        }
        // #5.5 (cond.) update totalCommentCount (of ITopicComprehensive) in [C] topicComprehensive
        const { topicInfoArr } = postComprehensiveQueryResult;
        if (Array.isArray(topicInfoArr) && topicInfoArr.length !== 0) {
            const topicComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<ITopicComprehensive>('topic');
            for await (const topicId of topicInfoArr) {
                const topicComprehensiveUpdateResult = await topicComprehensiveCollectionClient.updateOne({ topicId }, {
                    $inc: {
                        totalCommentCount: 1
                    }
                });
                if (!topicComprehensiveUpdateResult.acknowledged) {
                    logWithDate(`Document (ICommentComprehensive, comment id: ${commentId}) inserted in [C] commentComprehensive successfully but failed to update totalCommentCount (of ITopicComprehensive, topic id: ${topicId}) in [C] topicComprehensive`, fnn);
                }
            }
        }
        if (initiateId !== notifiedMemberId) {
            //// Handle reply (cond.) ////
            const { title } = postComprehensiveQueryResult;
            // #6.1 look up record (of IMemberMemberMapping) in [RL] BlockingMemberMapping
            const blockingMemberMappingTableClient = AzureTableClient('BlockingMemberMapping');
            const blockingMemberMappingQuery = blockingMemberMappingTableClient.listEntities({ queryOptions: { filter: `PartitionKey eq '${notifiedMemberId}' and RowKey eq '${initiateId}'` } });
            //// [!] attemp to reterieve entity makes the probability of causing RestError ////
            const blockingMemberMappingQueryResult = await blockingMemberMappingQuery.next();
            if (!blockingMemberMappingQueryResult.value) {
                //// [!] comment author has not been blocked by post / comment author ////

                // #6.2 upsert document (of notificationComprehensive) in [C] notificationComprehensive
                const notificationComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<INotificationComprehensive>('notification');
                const notificationComprehensiveUpdateResult = await notificationComprehensiveCollectionClient.updateOne({ noticeId: createNoticeId('reply', initiateId, postId, commentId) }, {
                    noticeId: createNoticeId('reply', initiateId, postId, commentId),
                    category: 'reply',
                    memberId: notifiedMemberId,
                    initiateId,
                    nickname: memberComprehensiveQueryResult.nickname,
                    postTitle: title,
                    commentBrief: getContentBrief(content),
                    createdTimeBySecond: getTimeBySecond()
                }, { upsert: true });
                if (!notificationComprehensiveUpdateResult.acknowledged) {
                    logWithDate(`Failed to upsert document (of INotificationComprehensive, member id: ${notifiedMemberId}) in [C] notificationComprehensive`, fnn);
                }

                // #6.3 update reply (INotificationStatistics) (of post author) in [C] notificationStatistics
                const notificationStatisticsCollectionClient = atlasDbClient.db('statistics').collection<INotificationStatistics>('notification');
                const notificationStatisticsUpdateResult = await notificationStatisticsCollectionClient.updateOne({ memberId: notifiedMemberId }, { $inc: { reply: 1 } });
                if (!notificationStatisticsUpdateResult.acknowledged) {
                    logWithDate(`Document (ICommentComprehensive, comment id: ${commentId}) inserted in [C] commentComprehensive successfully but failed to reply (of INotificationStatistics, member id: ${notifiedMemberId}) in [C] notificationStatistics`, fnn);
                }
            }
            //// Handle notice.cue (cond.) ////
            // #7.1 verify cued member ids array
            const { cuedMemberInfoArr } = req.body;
            if (Array.isArray(cuedMemberInfoArr) && cuedMemberInfoArr.length !== 0) {
                const notificationComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<INotificationComprehensive>('notification');
                const notificationStatisticsCollectionClient = atlasDbClient.db('statistics').collection<INotificationStatistics>('notification');
                
                // #7.2 maximum 12 members are allowed to cued at one time (in one comment)
                const cuedMemberInfoArrSliced = cuedMemberInfoArr.slice(0, 12);
                
                for await (const cuedMemberInfo of cuedMemberInfoArrSliced) {
                    const { memberId: memberId_cued } = cuedMemberInfo;
                    
                    // look up record (of IMemberMemberMapping) in [RL] BlockingMemberMapping
                    const _blockingMemberMappingQuery = blockingMemberMappingTableClient.listEntities({ queryOptions: { filter: `PartitionKey eq '${memberId_cued}' and RowKey eq '${initiateId}'` } });
                    //// [!] attemp to reterieve entity makes the probability of causing RestError ////
                    const _blockingMemberMappingQueryResult = await _blockingMemberMappingQuery.next();
                    if (!_blockingMemberMappingQueryResult.value) {
                        //// [!] comment author has not been blocked by cued member ////

                        // #7.3 upsert document (of notificationComprehensive) in [C] notificationComprehensive
                        const notificationComprehensiveUpdateResult = await notificationComprehensiveCollectionClient.updateOne({ noticeId: createNoticeId('cue', initiateId, postId, commentId) }, {
                            noticeId: createNoticeId('cue', initiateId, postId, commentId),
                            category: 'cue',
                            memberId: notifiedMemberId,
                            initiateId,
                            nickname: memberComprehensiveQueryResult.nickname,
                            postTitle: title,
                            commentBrief: getContentBrief(content),
                            createdTimeBySecond: getTimeBySecond()
                        }, { upsert: true });
                        if (!notificationComprehensiveUpdateResult.acknowledged) {
                            logWithDate(`Failed to upsert document (of INotificationComprehensive, member id: ${notifiedMemberId}) in [C] notificationComprehensive`, fnn);
                        }

                        // #7.4 update cued count (INotificationStatistics) (of cued member) in [C] notificationStatistics
                        const notificationStatisticsUpdateResult = await notificationStatisticsCollectionClient.updateOne({ memberId: memberId_cued }, { $inc: { cue: 1 } });
                        if (!notificationStatisticsUpdateResult.acknowledged) {
                            logWithDate(`Document (ICommentComprehensive, comment id: ${commentId}) inserted in [C] commentComprehensive successfully but failed to update cuedCount (of INotificationStatistics, member id: ${memberId_cued}) in [C] notificationStatistics`, fnn);
                        }
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
            msg = 'Attempt to communicating with azure table storage.';
        } else if (e instanceof MongoError) {
            msg = 'Attempt to communicating with atlas mongodb.';
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