import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt'
import { RestError } from '@azure/data-tables';
import { MongoError } from 'mongodb';

import AzureTableClient from '../../../../modules/AzureTableClient';
import AtlasDatabaseClient from "../../../../modules/AtlasDatabaseClient";

import { verifyId } from '../../../../lib/utils/verify';
import { response405, response500, logWithDate } from '../../../../lib/utils/general';
import { IMemberComprehensive, IMemberStatistics } from '../../../../lib/interfaces/member';
import { IPostComprehensive } from '../../../../lib/interfaces/post';
import { IMemberPostMapping } from '../../../../lib/interfaces/mapping';
import { IChannelStatistics } from '../../../../lib/interfaces/channel';
import { ITopicComprehensive } from '../../../../lib/interfaces/topic';

const fname = DeleteCreationById.name

/** DeleteCreationById v0.1.1
 * 
 * Last update: 21/02/2023
 * 
 * This interface ONLY accepts DELETE requests
 * 
 * Info required for DELETE requests
 * token: JWT
 * postId: string (query)
*/

export default async function DeleteCreationById(req: NextApiRequest, res: NextApiResponse) {

    const { method } = req;
    if ('DELETE' !== method) {
        response405(req, res);
        return;
    }
    //// Verify identity ////
    const token = await getToken({ req });
    if (!(token && token?.sub)) {
        res.status(400).send('Invalid identity');
        return;
    }
    // Verify post id
    const { isValid, category, id: postId } = verifyId(req.query?.postId);
    if (!(isValid && 'post' === category)) {
        res.status(400).send('Invalid post id');
        return;
    }
    //// Declare DB client ////
    const atlasDbClient = AtlasDatabaseClient();
    try {
        const { sub: memberId } = token;
        //// Verify member status ////
        const memberComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IMemberComprehensive>('member');
        const memberComprehensiveQueryResult = await memberComprehensiveCollectionClient.findOne({ memberId });
        if (null === memberComprehensiveQueryResult) {
            throw new Error(`Member attempt to delete creation but have no document (of IMemberComprehensive, member id: ${memberId}) in [C] memberComprehensive`);
        }
        const { status: memberStatus } = memberComprehensiveQueryResult;
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
        const { status: postStatus } = postComprehensiveQueryResult;
        if (0 > postStatus) {
            res.status(403).send('Method not allowed due to post deleted');
            await atlasDbClient.close();
            return;
        }
        //// Verify permission ////
        const { memberId: authorId } = postComprehensiveQueryResult;
        if (memberId !== authorId) {
            res.status(403).send('Identity lack permissions');
            return;
        }
        // Step #1.1 update record (of IMemberPostMapping) in [RL] CreationsMapping
        const noticeTableClient = AzureTableClient('CreationsMapping');
        await noticeTableClient.upsertEntity<IMemberPostMapping>({
            partitionKey: memberId,
            rowKey: postId,
            Nickname: '',
            CreatedTimeBySecond: Math.floor(new Date().getTime() / 1000),
            IsActive: false
        }, 'Merge');
        // Step #1.2 update status (of IPostComprehensive) in [C] postComprehensive
        const postComprehensiveUpdateResult = await postComprehensiveCollectionClient.updateOne({ postId }, { $set: { status: -1 } });
        if (!postComprehensiveUpdateResult.acknowledged) {
            throw new Error(`Failed to update status (-1, of IPostComprehensive, post id: ${postId}) in [C] postComprehensive`);
        }
        res.status(200).send('Delete browsing history success');
        // Step #2.1 update totalCreationDeleteCount (of IMemberStatistics) in [C] memberStatistics
        const memberStatisticsCollectionClient = atlasDbClient.db('statistics').collection<IMemberStatistics>('member');
        const memberStatisticsUpdateResult = await memberStatisticsCollectionClient.updateOne({ memberId }, { $inc: { totalCreationDeleteCount: 1 } });
        if (!memberStatisticsUpdateResult.acknowledged) {
            logWithDate(`Document (IPostComprehensive, post id: ${postId}) updated (deleted, status -1) in [C] postComprehensive successfully but failed to update totalCreationDeleteCount (of IMemberStatistics, member id: ${memberId}) in [C] memberStatistics`, fname);
        }
        // Step #2.2 update totalPostDeleteCount (of IChannelStatistics) in [C] channelStatistics
        const { channelId } = postComprehensiveQueryResult;
        const channelStatisticsCollectionClient = atlasDbClient.db('statistics').collection<IChannelStatistics>('channel');
        const channelStatisticsUpdateResult = await channelStatisticsCollectionClient.updateOne({ channelId }, { $inc: { totalPostDeleteCount: 1 } });
        if (!channelStatisticsUpdateResult.acknowledged) {
            logWithDate(`Document (IPostComprehensive, post id: ${postId}) updated (deleted, status -1) in [C] postComprehensive successfully but failed to update totalPostDeleteCount (of IChannelStatistics, channel id: ${channelId}) in [C] channelStatistics`, fname);
        }
        // Step #2.3 (cond.) update totalPostDeleteCount (of ITopicComprehensive) in [C] topicComprehensive
        const { topicIdsArr } = postComprehensiveQueryResult;
        if (Array.isArray(topicIdsArr) && topicIdsArr.length !== 0) {
            const topicComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<ITopicComprehensive>('topic');
            for await (const topicId of topicIdsArr) {
                const topicComprehensiveUpdateResult = await topicComprehensiveCollectionClient.updateOne({ topicId }, { $inc: { totalPostDeleteCount: 1 } });
                if (!topicComprehensiveUpdateResult.acknowledged) {
                    logWithDate(`Document (IPostComprehensive, post id: ${postId}) updated (deleted, status -1) in [C] postComprehensive successfully but failed to update totalPostDeleteCount (of ITopicComprehensive, topic id: ${topicId}) in [C] topicComprehensive`, fname);
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
        logWithDate(msg, fname, e);
        await atlasDbClient.close();
        return;
    }
}