import type { NextApiRequest, NextApiResponse } from 'next';
import { RestError } from '@azure/data-tables';
import { getToken } from 'next-auth/jwt';
import { MongoError } from 'mongodb';

import AzureTableClient from '../../../modules/AzureTableClient';
import AtlasDatabaseClient from '../../../modules/AtlasDatabaseClient';

import { IMemberComprehensive, IMemberStatistics } from '../../../lib/interfaces/member';
import { IMemberMemberMapping, IMemberPostMapping } from '../../../lib/interfaces/mapping';
import { IPostComprehensive } from '../../../lib/interfaces/post';
import { IChannelStatistics } from '../../../lib/interfaces/channel';
import { ITopicComprehensive } from '../../../lib/interfaces/topic';
import { INotificationComprehensive, INotificationStatistics } from '../../../lib/interfaces/notification';

import { createNoticeId, getTimeBySecond } from '../../../lib/utils/create';
import { logWithDate, response405, response500 } from '../../../lib/utils/general';
import { verifyId } from '../../../lib/utils/verify';

const fnn = `${SaveOrUndoSavePostById.name} (API)`;

/**
 * This interface accepts GET and POST method
 * 
 * Info required for POST request
 * -     token: JWT
 * -     postId: string (query, member id)
 * 
 * Last update: 
 * - 24/02/2023 v0.1.1
 * - 08/05/2023 v0.1.2
 * - 31/05/2023 v0.1.3
 */

export default async function SaveOrUndoSavePostById(req: NextApiRequest, res: NextApiResponse) {

    const { method } = req;
    if (!['GET', 'POST'].includes(method ?? '')) {
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
        const memberComprehensiveQueryResult = await memberComprehensiveCollectionClient.findOne({ memberId });
        if (null === memberComprehensiveQueryResult) {
            throw new Error(`Member attempt to saving or undo saving a post but have no document (of IMemberComprehensive, member id: ${memberId}) in [C] memberComprehensive`);
        }
        const { nickname: memberName, status: memberStatus } = memberComprehensiveQueryResult;
        if (0 > memberStatus) {
            res.status(403).send('Method not allowed due to member suspended or deactivated');
            await atlasDbClient.close();
            return;
        }

        //// Verify post status ////
        const postComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IPostComprehensive>('post');
        const postComprehensiveQueryResult = await postComprehensiveCollectionClient.findOne({ postId });
        if (null === postComprehensiveQueryResult) {
            res.status(404).send('Post not found');
            await atlasDbClient.close();
            return;
        }
        const { memberId: authorId, nickname, title, channelId, topicInfoArr, status: postStatus } = postComprehensiveQueryResult;
        if (0 > postStatus) {
            res.status(403).send('Method not allowed due to post deleted');
            await atlasDbClient.close();
            return;
        }

        //// Verify member status ////
        const authorComprehensiveQueryResult = await memberComprehensiveCollectionClient.findOne({ memberId: authorId });
        if (null === authorComprehensiveQueryResult) {
            throw new Error(`Member attempt to saving or undo saving a post but the post author has no document (of IMemberComprehensive, member (author) id: ${memberId}) in [C] memberComprehensive`);
        }
        const { nickname: authorName, status: authorStatus } = authorComprehensiveQueryResult;
        if (0 > authorStatus) {
            res.status(403).send('Method not allowed due to author suspended or deactivated');
            await atlasDbClient.close();
            return;
        }

        let isSaved: boolean;

        // #1.1 look up dcoument (of IMemberPostMapping) in [C] member-post-saved
        const memberPostMappingCollectionClient = atlasDbClient.db('mapping').collection<IMemberPostMapping>('member-post-saved');
        const mappingQueryResult = await memberPostMappingCollectionClient.findOne({ memberId, postId }, {
            projection: {
                _id: 0,
                status: 1
            }
        });

        if (mappingQueryResult && mappingQueryResult.status > 0) {
            // Case [Undo save]
            isSaved = true;
        } else {
            // Case [Save]
            isSaved = false;
        }

        //// GET | verify if saved ////
        if ('GET' === method) {

            //// Response 200 ////
            res.status(200).send(isSaved);
            await atlasDbClient.close();
            return;
        }

        const memberStatisticsCollectionClient = atlasDbClient.db('statistics').collection<IMemberStatistics>('member');

        //// POST | do save or undo save ////
        if (isSaved) {

            // Case [Undo save]
            const updateResult = await memberPostMappingCollectionClient.updateOne({ memberId, postId }, {
                $set: {
                    memberId,
                    postId,
                    title,
                    channelId,
                    authorId,
                    nickname,
                    createdTimeBySecond: getTimeBySecond(),
                    status: 0
                }
            }, { upsert: true });

            if (!updateResult.acknowledged) {
                res.status(500).send('Undo save post failed');
                await atlasDbClient.close();
                return;
            }

            //// Response 200 ////
            res.status(200).send(`Undo save post success`);

            // #2A.2 update totalUndoSavedCount (of IMemberStatistics) in [C] memberStatistics
            const memberStatisticsUpdateResult = await memberStatisticsCollectionClient.updateOne({ memberId }, { $inc: { totalUndoSavedCount: 1 } });
            if (!memberStatisticsUpdateResult.acknowledged) {
                logWithDate(`Failed to update totalUndoSavedCount (of IMemberStatistics, member id: ${memberId}) in [C] memberStatistics`, fnn);
            }

            // #2A.3 update totalCreationUndoSavedCount (of IMemberStatistics) in [C] memberStatistics (post author)
            const authorStatisticsUpdateResult = await memberStatisticsCollectionClient.updateOne({ memberId: authorId }, { $inc: { totalCreationUndoSavedCount: 1 } });
            if (!authorStatisticsUpdateResult.acknowledged) {
                logWithDate(`Failed to update totalCreationUndoSavedCount (of IMemberStatistics, member id: ${authorId}) in [C] memberStatistics`, fnn);
            }

            // #A2.4 update totalUndoSavedCount (of IPostComprehensive) in [C] postComprehensive
            const postComprehensiveUpdateResult = await postComprehensiveCollectionClient.updateOne({ postId }, { $inc: { totalUndoSavedCount: 1 } });
            if (!postComprehensiveUpdateResult.acknowledged) {
                logWithDate(`Failed to update totalUndoSavedCount (of IPostComprehensive, post id: ${postId}) in [C] postComprehensive`, fnn);
            }

            // #2A.5 update totalUndoSavedCount (of IChannelStatistics) in [C] channelStatistics
            const channelStatisticsCollectionClient = atlasDbClient.db('statistics').collection<IChannelStatistics>('channel');
            const channelStatisticsUpdateResult = await channelStatisticsCollectionClient.updateOne({ channelId }, { $inc: { totalUndoSavedCount: 1 } });
            if (!channelStatisticsUpdateResult.acknowledged) {
                logWithDate(`Failed to update totalUndoSavedCount (of IChannelStatistics, channel id: ${channelId}) in [C] channelStatistics`, fnn);
            }

            // #2A.6 (cond.) update totalUndoSavedCount (of ITopicComprehensive) in [C] topicComprehensive
            if (Array.isArray(topicInfoArr) && topicInfoArr.length !== 0) {
                const topicComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<ITopicComprehensive>('topic');
                for await (const topicId of topicInfoArr) {
                    const topicComprehensiveUpdateResult = await topicComprehensiveCollectionClient.updateOne({ topicId }, { $inc: { totalUndoSavedCount: 1 } });
                    if (!topicComprehensiveUpdateResult.acknowledged) {
                        logWithDate(`Failed to update totalUndoSavedCount (of ITopicComprehensive, topic id: ${topicId}) in [C] topicComprehensive`, fnn);
                    }
                }
            }
        } else {

            // Case [Do save]
            const updateResult = await memberPostMappingCollectionClient.updateOne({ memberId, postId }, {
                $set: {
                    memberId,
                    postId,
                    title,
                    channelId,
                    authorId,
                    nickname,
                    createdTimeBySecond: getTimeBySecond(),
                    status: 200
                }
            }, { upsert: true });

            if (!updateResult.acknowledged) {
                res.status(500).send('Save post failed');
                await atlasDbClient.close();
                return;
            }

            //// Response 200 ////
            res.status(200).send(`Save post success`);

            // #2B.2 update totalSavedCount (of IMemberStatistics) in [C] memberStatistics
            const memberStatisticsUpdateResult = await memberStatisticsCollectionClient.updateOne({ memberId }, { $inc: { totalSavedCount: 1 } });
            if (!memberStatisticsUpdateResult.acknowledged) {
                logWithDate(`Failed to update total totalSavedCount (of IMemberStatistics, member id: ${memberId}) in [C] memberStatistics`, fnn);
            }

            // #2B.3 update totalCreationSavedCount (of IMemberStatistics) in [C] memberStatistics (post author)
            const authorStatisticsUpdateResult = await memberStatisticsCollectionClient.updateOne({ memberId: authorId }, { $inc: { totalCreationSavedCount: 1 } });
            if (!authorStatisticsUpdateResult.acknowledged) {
                logWithDate(`Failed to update total totalCreationLikedCount (of IMemberStatistics, member id: ${authorId}) in [C] memberStatistics`, fnn);
            }

            // #2B.4 update totalSavedCount (of IPostComprehensive) in [C] postComprehensive
            const postComprehensiveUpdateResult = await postComprehensiveCollectionClient.updateOne({ postId }, { $inc: { totalSavedCount: 1 } });
            if (!postComprehensiveUpdateResult.acknowledged) {
                logWithDate(`Failed to update totalSavedCount (of IPostComprehensive, post id: ${postId}) in [C] postComprehensive`, fnn);
            }

            // #2B.5 update totalSavedCount (of IChannelStatistics) in [C] channelStatistics
            const channelStatisticsCollectionClient = atlasDbClient.db('statistics').collection<IChannelStatistics>('channel');
            const channelStatisticsUpdateResult = await channelStatisticsCollectionClient.updateOne({ channelId }, { $inc: { totalSavedCount: 1 } });
            if (!channelStatisticsUpdateResult.acknowledged) {
                logWithDate(`Failed to update totalSavedCount (of IChannelStatistics, channel id: ${channelId}) in [C] channelStatistics`, fnn);
            }

            // #2B.6 (cond.) update totalSavedCount (of ITopicComprehensive) in [C] topicComprehensive
            if (Array.isArray(topicInfoArr) && topicInfoArr.length !== 0) {
                const topicComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<ITopicComprehensive>('topic');
                for await (const topicId of topicInfoArr) {
                    const topicComprehensiveUpdateResult = await topicComprehensiveCollectionClient.updateOne({ topicId }, { $inc: { totalSavedCount: 1 } });
                    if (!topicComprehensiveUpdateResult.acknowledged) {
                        logWithDate(`Failed to update totalSavedCount (of ITopicComprehensive, topic id: ${topicId}) in [C] topicComprehensive`, fnn);
                    }
                }
            }

            //// Handle notice.save (cond.) ////
            if (memberId !== authorId) {
                // #2B.7 (cond.) look up record (of IMemberMemberMapping) in [RL] BlockingMemberMapping
                const blockingMemberMappingTableClient = AzureTableClient('BlockingMemberMapping');
                const blockingMemberMappingQuery = blockingMemberMappingTableClient.listEntities<IMemberMemberMapping>({ queryOptions: { filter: `PartitionKey eq '${authorId}' and RowKey eq '${memberId}'` } });
                //// [!] attemp to reterieve entity makes the probability of causing RestError ////
                const blockingMemberMappingQueryResult = await blockingMemberMappingQuery.next();
                if (!blockingMemberMappingQueryResult.value) {
                    //// [!] member saved post has not been blocked by post author ////

                    // #2B.8 upsert document (of notificationComprehensive) in [C] notificationComprehensive
                    const notificationComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<INotificationComprehensive>('notification');
                    const notificationComprehensiveUpdateResult = await notificationComprehensiveCollectionClient.updateOne({ noticeId: createNoticeId('save', memberId, postId) }, {
                        noticeId: createNoticeId('save', memberId, postId),
                        category: 'save',
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

                    // #B2.9 update save (of INotificationStatistics, of the post author) in [C] notificationStatistics
                    const notificationStatisticsCollectionClient = atlasDbClient.db('statistics').collection<INotificationStatistics>('notification');
                    const notificationStatisticsUpdateResult = await notificationStatisticsCollectionClient.updateOne({ memberId: authorId }, { $inc: { save: 1 } });
                    if (!notificationStatisticsUpdateResult.acknowledged) {
                        logWithDate(`Failed to update save (of INotificationStatistics, member id: ${authorId}) in [C] notificationStatistics`, fnn);
                    }
                }
            }
        }

        await atlasDbClient.close();
        return;
    }
    catch (e: any) {
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