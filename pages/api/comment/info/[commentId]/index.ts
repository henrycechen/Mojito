import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt'
import { RestError } from '@azure/data-tables';
import { MongoError } from 'mongodb';

import AzureTableClient from '../../../../../modules/AzureTableClient';
import AtlasDatabaseClient from "../../../../../modules/AtlasDatabaseClient";

import { INoticeInfo, IMemberPostMapping, INotificationStatistics, IMemberComprehensive, IRestrictedMemberInfo, IMemberStatistics, ILoginJournal, IAttitudeComprehensive, IAttitideMapping, ICommentComprehensive, IEditedCommentComprehensive, IRestrictedCommentComprehensive, IChannelStatistics, ITopicComprehensive, ITopicPostMapping, IPostComprehensive, IEditedPostComprehensive, IRestrictedPostComprehensive } from '../../../../../lib/interfaces';
import { createId, createNoticeId, getRandomIdStr, getRandomIdStrL, getRandomHexStr, timeStampToString, getNicknameFromToken, getContentBrief, createCommentComprehensive, provideCommentComprehensiveUpdate, getRestrictedFromCommentComprehensive, getTopicBase64StringsArrayFromRequestBody, getImageUrlsArrayFromRequestBody, getParagraphsArrayFromRequestBody, getRestrictedFromPostComprehensive, verifyEmailAddress, verifyPassword, verifyId, verifyUrl, verifyRecaptchaResponse, verifyEnvironmentVariable, response405, response500, log } from '../../../../../lib/utils';
const recaptchaServerSecret = process.env.INVISIABLE_RECAPTCHA_SECRET_KEY ?? '';


// This interface accepts GET, PUT, DELETE requests
//
// Info required for GET method
// - id: string (comment id)
//
// Info will be required for GET method
// - commentComprehensive: ICommentComprehensive
//
// Info required for PUT method
// - recaptchaResponse: string (query string)
// - token: JWT
// - id(parentId): string (query)
// - content: string (body)
// - cuedMemberInfoArr: IRestrictedMemberInfo[] (body, optional)
//
// Info required for DELETE method

// - token: JWT
// - id(parentId): string 


export default async function CommentIndexByCommentId(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;
    if (!['GET', 'PUT', 'DELETE'].includes(method ?? '')) {
        response405(req, res);
        return;
    }
    const { isValid, category, id: commentId } = verifyId(req.query?.commentId);
    if (!isValid) {
        res.status(400).send('Invalid comment id');
        return;
    }
    //// Declare DB client ////
    const atlasDbClient = AtlasDatabaseClient();
    try {
        //// GET | comment info ////
        if ('GET' === method) {
            if (!['comment', 'subcomment'].includes(category)) {
                res.status(400).send('Invalid comment id');
                return;
            }
            await atlasDbClient.connect();
            const commentComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<ICommentComprehensive>('comment');
            const commentComprehensiveQueryResult = await commentComprehensiveCollectionClient.findOne({ commentId });
            if (null === commentComprehensiveQueryResult) {
                res.status(404).send('Comment not found');
                await atlasDbClient.close();
                return;
            }
            res.status(200).send(getRestrictedFromCommentComprehensive(commentComprehensiveQueryResult));
            await atlasDbClient.close();
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
        //// Verify identity ////
        const token = await getToken({ req });
        if (!(token && token?.sub)) {
            res.status(400).send('Invalid identity');
            return;
        }
        const { sub: memberId } = token;
        await atlasDbClient.connect();
        //// Verify member status ////
        const memberComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IMemberComprehensive>('member');
        const memberComprehensiveQueryResult = await memberComprehensiveCollectionClient.findOne({ memberId });
        if (null === memberComprehensiveQueryResult) {
            throw new Error(`Member was trying creating comment but have no document (of IMemberComprehensive, member id: ${memberId}) in [C] memberComprehensive`);
        }
        const { status: memberStatus } = memberComprehensiveQueryResult;
        if (0 > memberStatus) {
            res.status(403).send('Method not allowed due to member suspended');
            await atlasDbClient.close();
            return;
        }
        //// PUT | edit comment ////
        if ('PUT' === method) {
            // Step #1 verify parent id category
            if (!['post', 'comment'].includes(category)) {
                res.status(400).send('Invalid parent id category');
                return;
            }
            // Step #2 verify content
            const { content } = req.body;
            if (!('string' === content && '' !== content)) {
                res.status(400).send('Improper or blank content');
                return;
            }
            // Step #3.1 look up document (of ICommentComprehensive) in [C] commentComprehensive
            const commentComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<ICommentComprehensive>('comment');
            const commentComprehensiveQueryResult = await commentComprehensiveCollectionClient.findOne({ commentId });
            if (null === commentComprehensiveQueryResult) {
                res.status(404).send('Comment not found');
                await atlasDbClient.close();
                return;
            }
            // Step #3.2 verify comment status (of ICommentComprehensive)
            const { status: commentStatus, postId } = commentComprehensiveQueryResult;
            if (0 > commentStatus) {
                res.status(403).send('Method not allowed due to comment deleted');
                await atlasDbClient.close();
                return;
            }
            // Step #3.3 look up document (of IPostComprehensive) in [C] postComprehensive
            const postComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IPostComprehensive>('post');
            const postComprehensiveQueryResult = await postComprehensiveCollectionClient.findOne({ postId });
            if (null === postComprehensiveQueryResult) {
                res.status(404).send('Post not found');
                await atlasDbClient.close();
                return;
            }
            // Step #3.4 verify post status (of IPostComprehensive)
            const { status: postStatus } = postComprehensiveQueryResult;
            if (0 > postStatus) {
                res.status(403).send('Method not allowed due to post deleted');
                await atlasDbClient.close();
                return;
            }
            //// Status all good ////
            // Step #4 update document (of ICommentComprehensive) in [C] commentComprehensive
            const commentComprehensiveInsertResult = await commentComprehensiveCollectionClient.updateOne({ commentId }, { $set: provideCommentComprehensiveUpdate(content, req.body?.cuedMemberInfoArr) });
            if (!commentComprehensiveInsertResult.acknowledged) {
                throw new Error(`Failed to update document (of ICommentComprehensive, comment id: ${commentId}, post id: ${postId}) in [C] commentComprehensive`);
            }
            res.status(200).send(commentId);
            //// Update statistics ////
            // Step #5 update totalCommentEditCount (of IMemberStatistics) in [C] memberStatistics
            const memberStatisticsCollectionClient = atlasDbClient.db('statistics').collection<IMemberStatistics>('member');
            const memberStatisticsUpdateResult = await memberStatisticsCollectionClient.updateOne({ memberId }, {
                $inc: {
                    totalCommentEditCount: 1
                }
            });
            if (!memberStatisticsUpdateResult.acknowledged) {
                log(`Document (ICommentComprehensive, comment id: ${commentId}) was updated in [C] commentComprehensive successfully but failed to update totalCommentEditCount (of IMemberStatistics, member id: ${memberId}) in [C] memberStatistics`);
            }
            //// Handle cue ////
            // Step #5.1 verify cued member ids array
            const { cuedMemberInfoArr } = req.body;
            if (Array.isArray(cuedMemberInfoArr) && cuedMemberInfoArr.length !== 0) {
                const blockingMemberMappingTableClient = AzureTableClient('BlockingMemberMapping');
                const notificationStatisticsCollectionClient = atlasDbClient.db('statistics').collection<INotificationStatistics>('notification');
                const { title } = postComprehensiveQueryResult;
                // Step #5.2 maximum 9 members are allowed to cued at one time (in one comment)
                const cuedMemberInfoArrSliced = cuedMemberInfoArr.slice(0, 9);
                for await (const cuedMemberInfo of cuedMemberInfoArrSliced) {
                    const { memberId: memberId_cued } = cuedMemberInfo;
                    const _blockingMemberMappingQuery = blockingMemberMappingTableClient.listEntities({ queryOptions: { filter: `PartitionKey eq '${memberId_cued}' and RowKey eq '${memberId}'` } });
                    //// [!] attemp to reterieve entity makes the probability of causing RestError ////
                    const _blockingMemberMappingQueryResult = await _blockingMemberMappingQuery.next();
                    if (!_blockingMemberMappingQueryResult.value) {
                        //// [!] comment author has not been blocked by cued member ////
                        // Step #5.3 upsert record (of INoticeInfo.Cued) in [PRL] Notice
                        const noticeTableClient = AzureTableClient('Notice');
                        noticeTableClient.upsertEntity<INoticeInfo>({
                            partitionKey: memberId_cued,
                            rowKey: createNoticeId('cue', memberId, postId, commentId), // combined id string
                            Category: 'cue',
                            InitiateId: memberId,
                            Nickname: getNicknameFromToken(token),
                            PostTitle: title,
                            CommentBrief: getContentBrief(content)
                        }, 'Replace');
                        // Step #5.4 update cued count (INotificationStatistics) (of cued member) in [C] notificationStatistics
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
        }
        //// DELETE | delete comment ////
        if ('DELETE' === method) {
            if (!['comment', 'subcomment'].includes(category)) {
                res.status(400).send('Invalid comment id');
                return;
            }
            // Step #1.1 look up document (of ICommentComprehensive) in [C] commentComprehensive
            const commentComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<ICommentComprehensive>(category);
            const commentComprehensiveQueryResult = await commentComprehensiveCollectionClient.findOne({ commentId });
            if (null === commentComprehensiveQueryResult) {
                res.status(404).send('Comment not found');
                await atlasDbClient.close();
                return;
            }
            // Step #1.2 verify comment status (of IPostComprehensive)
            const { status: commentStatus } = commentComprehensiveQueryResult;
            if (0 > commentStatus) {
                res.status(403).send('Method not allowed due to comment deleted');
                await atlasDbClient.close();
                return;
            }
            // Step #2 update status (of ICommentComprehensive) in [C] commentComprehensive
            const commentComprehensiveDeleteResult = await commentComprehensiveCollectionClient.updateOne({ commentId }, { $set: { status: -1 } });
            if (!commentComprehensiveDeleteResult.acknowledged) {
                throw new Error(`Failed to update status (-1, of ICommentComprehensive, comment id: ${commentId}) in [C] commentComprehensive`);
            }
            res.status(200).send('Comment delete success');
            //// Update statistics ////
            // Step #3.1 update totalCommentDeleteCount (of IMemberStatistics) in [C] memberStatistics
            const memberStatisticsCollectionClient = atlasDbClient.db('statistics').collection<ICommentComprehensive>('member');
            const memberStatisticsUpdateResult = await memberStatisticsCollectionClient.updateOne({ memberId }, { $inc: { totalCommentDeleteCount: 1 } });
            if (!memberStatisticsUpdateResult.acknowledged) {
                log(`Document (ICommentComprehensive, comment id: ${commentId}) updated (deleted, status -1) in [C] commentComprehensive successfully but failed to update totalCommentDeleteCount (of IMemberStatistics, member id: ${memberId}) in [C] memberStatistics`);
            }
            // Step #3.2 (cond.) update totalSubcommentDeleteCount in [C] commentComprehensive (parent comment)
            if ('C' === commentId.slice(0, 1)) {
                const { parentId } = commentComprehensiveQueryResult;
                const commentComprehensiveUpdateResult = await commentComprehensiveCollectionClient.updateOne({ commentId: parentId }, { $inc: { totalSubcommentDeleteCount: 1 } });
                if (!commentComprehensiveUpdateResult.acknowledged) {
                    log(`Document (ICommentComprehensive, comment id: ${commentId}) updated (deleted, status -1) in [C] commentComprehensive successfully but failed to update totalSubcommentDeleteCount (of ICommentComprehensive, comment id: ${parentId}) in [C] commentComprehensive`);
                }
            }
            // Step #3.3 update totalCommentDeleteCount (of IPostComprehensive) in [C] postComprehensive
            const { postId } = commentComprehensiveQueryResult;
            const postComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IPostComprehensive>('post');
            const postComprehensiveUpdateResult = await postComprehensiveCollectionClient.findOneAndUpdate({ postId }, { $inc: { totalCommentDeleteCount: 1 } });
            if (!postComprehensiveUpdateResult.ok) {
                log(`Document (ICommentComprehensive, comment id: ${commentId}) updated (deleted, status -1) in [C] commentComprehensive successfully but failed to update totalCommentDeleteCount (of IPostComprehensive, post id: ${postId}) in [C] postComprehensive`);
            }
            // Step #3.4 update totalCommentDeleteCount (of IChannelStatistics) in [C] channelStatistics
            const channelId = postComprehensiveUpdateResult.value?.channelId;
            const channelStatisticsCollectionClient = atlasDbClient.db('statistics').collection<IChannelStatistics>('channel');
            const channelStatisticsUpdateResult = await channelStatisticsCollectionClient.updateOne({ channelId }, { $inc: { totalCommentDeleteCount: 1 } });
            if (!channelStatisticsUpdateResult.acknowledged) {
                log(`Document (ICommentComprehensive, comment id: ${commentId}) updated (deleted, status -1) in [C] commentComprehensive successfully but failed to update totalCommentDeleteCount (of IChannelStatistics, channel id: ${channelId}) in [C] channelStatistics`);
            }
            // Step #3.55 (cond.) update totalCommentDeleteCount (of ITopicComprehensive) [C] topicComprehensive
            const topicIdsArr = postComprehensiveUpdateResult.value?.topicIdsArr;
            if (Array.isArray(topicIdsArr) && topicIdsArr.length !== 0) {
                const topicComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<ITopicComprehensive>('topic');
                for await (const topicId of topicIdsArr) {
                    // Step #5.1 update topic statistics or insert a new document (of ITopicComprehensive) in [C] topicComprehensive
                    const topicComprehensiveUpdateResult = await topicComprehensiveCollectionClient.updateOne({ topicId }, { $inc: { totalCommentDeleteCount: 1 } });
                    if (!topicComprehensiveUpdateResult.acknowledged) {
                        log(`Document (ICommentComprehensive, comment id: ${commentId}) updated (deleted, status -1) in [C] commentComprehensive successfully but failed to update totalCommentDeleteCount (of ITopicComprehensive, topic id: ${topicId}) in [C] topicComprehensive`);
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