import type { NextApiRequest, NextApiResponse } from 'next';
import { RestError } from '@azure/data-tables';
import { MongoError } from 'mongodb';

import { getToken } from 'next-auth/jwt';

import AzureTableClient from '../../../../modules/AzureTableClient';
import AtlasDatabaseClient from '../../../../modules/AtlasDatabaseClient';

import { INoticeInfo, IMemberPostMapping, INotificationStatistics, IMemberStatistics, IChannelStatistics, ITopicComprehensive, ITopicPostMapping, IPostComprehensive, IEditedPostComprehensive } from '../../../../lib/interfaces';
import { getRandomIdStrL, getNicknameFromToken, getTopicBase64StringsArrayFromRequestBody, getRestrictedFromPostComprehensive, getImageUrlsArrayFromRequestBody, getParagraphsArrayFromRequestBody, verifyId, response405, response500, log } from '../../../../lib/utils';

const domain = process.env.NEXT_PUBLIC_APP_DOMAIN;

export default async function PostInfoById(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;
    if (!['GET', 'PUT', 'DELETE'].includes(method ?? '')) {
        response405(req, res);
        return;
    }
    const { isValid, id: postId } = verifyId(req.query?.id);
    //// Verify post id ////
    if (!isValid) {
        res.status(400).send('Invalid post id');
        return;
    }
    //// Declare DB client ////
    const atlasDbClient = AtlasDatabaseClient();
    try {
        await atlasDbClient.connect();
        // Look up post status (IPostComprehensive) in [C] postComprehensive
        const postComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IPostComprehensive>('post');
        const postComprehensiveQueryResult = await postComprehensiveCollectionClient.findOne({ postId });
        if (null === postComprehensiveQueryResult) {
            res.status(404).send('Post not found');
            await atlasDbClient.close();
            return;
        }

        //// Get necessary info ////
        const token = await getToken({ req });
        const { memberId: memberId_post } = postComprehensiveQueryResult;

        //// GET | post info ////
        if ('GET' === method) {
            res.status(200).send(getRestrictedFromPostComprehensive(postComprehensiveQueryResult));

            // Update mapping //

            // Step #1 (cond.) upsert record (of IHistoryMapping) in [RL] HistoryMapping 
            if (token && token?.sub) {
                //// [!] with identity ///
                const historyMappingTableClient = AzureTableClient('HistoryMapping');
                await historyMappingTableClient.upsertEntity<IMemberPostMapping>({ partitionKey: memberId_post, rowKey: postId, IsActive: true }, 'Replace');
            }

            // Update statistics //

            // Step #2 update total creation hit count (of IMemberStatistics) in [C] memberStatistics
            const memberStatisticsCollectionClient = atlasDbClient.db('statistics').collection<IMemberStatistics>('member');
            const memberStatisticsUpdateResult = await memberStatisticsCollectionClient.updateOne({ memberId_post }, {
                $inc: {
                    totalCreationHitCount: 1
                }
            });
            if (!memberStatisticsUpdateResult.acknowledged) {
                log(`Failed to update totalCreationHitCount (of IMemberStatistics, member id: ${memberId_post}) in [C] memberStatistics`);
            }
            // Step #3 update total hit count (of IPostComprehensive) in [C] postComprehensive
            const postComprehensiveUpdateResult = await postComprehensiveCollectionClient.updateOne({ postId }, {
                $inc: {
                    totalHitCount: 1
                }
            });
            if (!postComprehensiveUpdateResult.acknowledged) {
                log(`Failed to update totalHitCount (of IPostComprehensive, post id: ${postId}) in [C] postComprehensive`);
            }
            // Step #4 update total hit count (of IChannelStatistics) in [C] channelStatistics
            const { channelId } = postComprehensiveQueryResult;
            const channelStatisticsCollectionClient = atlasDbClient.db('statistics').collection<IChannelStatistics>('channel');
            const channelStatisticsUpdateResult = await channelStatisticsCollectionClient.updateOne({ channelId }, {
                $inc: {
                    totalHitCount: 1
                }
            });
            if (!channelStatisticsUpdateResult.acknowledged) {
                log(`Failed to total hit count (of IChannelStatistics, channel id: ${channelId}) in [C] channelStatistics`);
            }
            // Step #5 (cond.) update total hit count (of ITopicComprehensive) in [C] topicComprehensive
            const { topicIdsArr } = postComprehensiveQueryResult;
            if (Array.isArray(topicIdsArr) && topicIdsArr.length !== 0) {
                const topicComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<ITopicComprehensive>('topic');
                for await (const topicId of topicIdsArr) {
                    const topicComprehensiveUpdateResult = await topicComprehensiveCollectionClient.updateOne({ postId }, {
                        $inc: {
                            totalHitCount: 1
                        }
                    });
                    if (!topicComprehensiveUpdateResult.acknowledged) {
                        log(`Failed to update totalHitCount (of ITopicStatistics, topic id:${topicId}, post id: ${postId}) in [C] topicStatistics`);
                    }
                }
            }
            await atlasDbClient.close();
            return;
        }

        //// Verify identity ////
        if (!(token && token?.sub)) {
            res.status(400).send('Invalid identity');
            return;
        }
        if (memberId_post !== token?.sub) {
            res.status(400).send('Invalid identity');
            return;
        }

        //// Verify post status ////
        const { status: postStatus } = postComprehensiveQueryResult;
        if (0 > postStatus) {
            res.status(405).send('Method not allowed due to post deleted');
            await atlasDbClient.close();
            return;
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
            let channelDict: any;
            try {
                channelDict = await fetch(`${domain}/api/channel/dictionary`).then(resp => resp.json()).catch(e => { throw e });
            } catch (e) {
                throw new Error(`Was trying retrieving channel dictionary.`);
            }
            if (!Object.hasOwn(channelDict, channelId)) {
                res.status(400).send('Channel id not found');
                await atlasDbClient.close();
                return;
            }
            // Step #2 explicitly get topic id from request body (topic content strings)
            const topicIdsArr = getTopicBase64StringsArrayFromRequestBody(req.body);
            // Step #3 create edited info
            const editedInfo: IEditedPostComprehensive = {
                editedTime: new Date().getTime(),
                titleBeforeEdited: postComprehensiveQueryResult.title,
                imageUrlsArrBeforeEdited: [...postComprehensiveQueryResult.imageUrlsArr],
                paragraphsArrBeforeEdited: [...postComprehensiveQueryResult.paragraphsArr],
                channelIdBeforeEdited: postComprehensiveQueryResult.channelId,
                topicIdsArrBeforeEdited: [...postComprehensiveQueryResult.topicIdsArr],
                totalLikedCountBeforeEdit: postComprehensiveQueryResult.totalLikedCount,
                totalDislikedCountBeforeEdit: postComprehensiveQueryResult.totalDislikedCount,
            }
            // Step #4 update document (of IPostComprehensive) in [C] postComprehensive
            const postComprehensiveUpdateResult = await postComprehensiveCollectionClient.updateOne({ postId }, {
                $set: {
                    //// info ////
                    title,
                    imageUrlsArr: getImageUrlsArrayFromRequestBody(req.body),
                    paragraphsArr: getParagraphsArrayFromRequestBody(req.body),
                    channelId,
                    topicIdsArr,
                    //// management ////
                    status: 201,
                    //// statistics ////
                    totalLikedCount: 0, // reset liked and disliked count
                    totalDislikedCount: 0
                },
                $inc: {
                    totalEditCount: 1
                },
                $push: {
                    //// edit info ////
                    edited: editedInfo
                }
            });
            if (!postComprehensiveUpdateResult.acknowledged) {
                throw new Error(`Failed to update {...postInfo}, totalEditCount and editedInfo (of IPostComprehensive, post id: ${postId}) in [C] postComprehensive`);
            }
            res.status(200).send('Edit success');

            //// Update statistics ////

            // Step #5 update total comment edit count (of IMemberStatistics) in [C] memberStatistics
            const memberStatisticsCollectionClient = atlasDbClient.db('statistics').collection<IMemberStatistics>('member');
            const memberStatisticsUpdateResult = await memberStatisticsCollectionClient.updateOne({ memberId_post }, {
                $inc: {
                    totalCreationEditCount: 1
                }
            });
            if (!memberStatisticsUpdateResult.acknowledged) {
                log(`Document (IPostComprehensive, post id: ${postId}) updated in [C] postComprehensive successfully but failed to update totalCreationEditCount (of IMemberStatistics, member id: ${memberId_post}) in [C] memberStatistics`);
            }

            // Step #6 (cond.) update total post count (ITopicComprehensive) in [C] topicComprehensive
            if (Array.isArray(topicIdsArr) && topicIdsArr.length !== 0) {
                const _topicIdsArr = [];
                // Step #6.1 delete outdated mapping (ITopicPostMapping) in [C] topicPostMapping and collect topic ids that have mapping (with this post)
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
                // Step #6.2 accumulate total post count or create new mapping (ITopicPostMapping) for the topics that have no mapping (with this post) in [C] topicComprehensive
                for await (const topicId of topicIdsArr) {
                    if (!_topicIdsArr.includes(topicId)) {
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
                            //// [!] update total post count (of ItopicComprehensive) if found ////
                            $inc: {
                                totalPostCount: 1
                            }
                        }, { upsert: true });
                        if (!topicComprehensiveUpdateResult.acknowledged) {
                            log(`Document (IPostComprehensive, post id: ${postId}) inserted in [C] postComprehensive successfully but failed to update totalPostCount (of ITopicComprehensive, topic id: ${topicId}) in [C] topicComprehensive`);
                        }
                        // Step #6.3 insert a new document (of ITopicPostMapping) in [C] topicPostMapping
                        const topicPostMappingInsertResult = await topicPostMappingCollectionClient.updateOne({ topicId, postId }, {
                            topicId,
                            postId,
                            channelId,
                            createdTime: new Date().getTime(),
                            status: 200
                        }, { upsert: true });
                        if (!topicPostMappingInsertResult.acknowledged) {
                            log(`Document (ITopicPostMapping, post id: ${postId}) inserted in [C] postComprehensive successfully but failed to insert document (of ITopicPostMapping, topic id: ${topicId}) in [C] topicPostMapping`);
                        }
                    }
                }
            }

            //// Handle notice.cue (cond.) ////

            // Step #7.1 verify cued member ids array
            const { cuedMemberIdsArr } = req.body;
            if (Array.isArray(cuedMemberIdsArr) && cuedMemberIdsArr.length !== 0) {
                // look up record (of IMemberMemberMapping) in [RL] BlockingMemberMapping
                const blockingMemberMappingTableClient = AzureTableClient('BlockingMemberMapping');
                const notificationStatisticsCollectionClient = atlasDbClient.db('statistics').collection<INotificationStatistics>('notification');
                // Step #7.2 maximum 9 members are allowed to cued at one time (in one comment)
                const cuedMemberIdsArrSliced = cuedMemberIdsArr.slice(0, 9);
                for await (const memberId_cued of cuedMemberIdsArrSliced) {
                    const _blockingMemberMappingQuery = blockingMemberMappingTableClient.listEntities({ queryOptions: { filter: `PartitionKey eq '${memberId_cued}' and RowKey eq '${memberId_post}'` } });
                    //// [!] attemp to reterieve entity makes the probability of causing RestError ////
                    const _blockingMemberMappingQueryResult = await _blockingMemberMappingQuery.next();
                    if (!_blockingMemberMappingQueryResult.value) {
                        //// [!] comment author has not been blocked by cued member ////
                        // Step #7.3 upsert record (of INoticeInfo.Cued) in [PRL] Notice
                        const noticeTableClient = AzureTableClient('Notice');
                        noticeTableClient.upsertEntity<INoticeInfo>({
                            partitionKey: memberId_cued,
                            rowKey: postId, // entity id
                            Category: 'cue',
                            InitiateId: memberId_post,
                            Nickname: getNicknameFromToken(token),
                            PostId: postId,
                            PostTitle: title,
                        }, 'Replace');
                        // Step #7.4 update cue (INotificationStatistics) (of cued member) in [C] notificationStatistics
                        const notificationStatisticsUpdateResult = await notificationStatisticsCollectionClient.updateOne({ memberId: memberId_cued }, {
                            $inc: {
                                cue: 1
                            }
                        });
                        if (!notificationStatisticsUpdateResult.acknowledged) {
                            log(`Document (IPostComprehensive, post id: ${postId}) updated in [C] postComprehensive successfully but failed to update cue (of INotificationStatistics, member id: ${memberId_cued}) in [C] notificationStatistics`);
                        }
                    }
                }
            }
        }

        //// DELETE | delete post ////

        if ('DELETE' === method) {
            // Step #1 update post status (of IPostComprehensive) [C] postComprehensive
            const postComprehensiveUpdateResult = await postComprehensiveCollectionClient.updateOne({ postId }, {
                $set: {
                    status: -1
                }
            });
            if (!postComprehensiveUpdateResult.acknowledged) {
                throw new Error(`Failed to update status (-1, of IPostComprehensive, post id: ${postId}) in [C] postComprehensive`);
            }
            res.status(200).send('Delete success');

            //// Update statistics ////

            // Step #2 update total creation delete count (of IMemberStatistics) (of post author) in [C] memberStatistics
            const memberStatisticsCollectionClient = atlasDbClient.db('statistics').collection<IMemberStatistics>('member');
            const memberStatisticsUpdateResult = await memberStatisticsCollectionClient.updateOne({ memberId_post }, {
                $inc: {
                    totalCreationDeleteCount: 1
                }
            });
            if (!memberStatisticsUpdateResult.acknowledged) {
                log(`Document (IPostComprehensive, post id: ${postId}) updated (deleted, status -1) in [C] postComprehensive successfully but failed to update totalCreationDeleteCount (of IMemberStatistics, member id: ${memberId_post}) in [C] memberStatistics`);
            }
            // Step #3 update total post delete count (of IChannelStatistics) in [C] channelStatistics
            const { channelId } = postComprehensiveQueryResult;
            const channelStatisticsCollectionClient = atlasDbClient.db('statistics').collection<IChannelStatistics>('channel');
            const channelStatisticsUpdateResult = await channelStatisticsCollectionClient.updateOne({ channelId }, {
                $inc: {
                    totalPostDeleteCount: 1
                }
            });
            if (!channelStatisticsUpdateResult.acknowledged) {
                log(`Document (IPostComprehensive, post id: ${postId}) updated (deleted, status -1) in [C] postComprehensive successfully but failed to update totalPostDeleteCount (of IChannelStatistics, channel id: ${channelId}) in [C] channelStatistics`);
            }
            // Step #4 (cond.) update total post delete count (of ITopicComprehensive) [C] topicComprehensive
            const { topicIdsArr } = postComprehensiveQueryResult;
            if (Array.isArray(topicIdsArr) && topicIdsArr.length !== 0) {
                const topicComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<ITopicComprehensive>('topic');
                const topicPostMappingCollectionClient = atlasDbClient.db('mapping').collection<ITopicPostMapping>('topic-post');
                for await (const topicId of topicIdsArr) {
                    // Step #4.1 update topic statistics or insert a new document (of ITopicComprehensive) in [C] topicComprehensive
                    const topicComprehensiveUpdateResult = await topicComprehensiveCollectionClient.updateOne({ topicId }, { $inc: { totalPostDeleteCount: 1 } });
                    if (!topicComprehensiveUpdateResult.acknowledged) {
                        log(`Document (IPostComprehensive, post id: ${postId}) updated (deleted, status -1) in [C] postComprehensive successfully but failed to update totalPostDeleteCount (of ITopicComprehensive, topic id: ${topicId}) in [C] topicComprehensive`);
                    }
                    // Step #4.2 insert a new document (of ITopicPostMapping) in [C] topicPostMapping
                    const topicPostMappingInsertResult = await topicPostMappingCollectionClient.updateOne({ topicId, postId }, { $set: { status: -1 } });
                    if (!topicPostMappingInsertResult.acknowledged) {
                        log(`Document (ITopicPostMapping, post id: ${postId}) updated (deleted, status -1) in [C] postComprehensive successfully but failed to update document (of ITopicPostMapping, topic id: ${topicId}, status -1) in [C] topicPostMapping`);
                    }
                }
            }
            await atlasDbClient.close();
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