import type { NextApiRequest, NextApiResponse } from 'next';
import { MongoError } from 'mongodb';

import AtlasDatabaseClient from '../../../../modules/AtlasDatabaseClient';

import { IMemberStatistics } from '../../../../lib/interfaces/member';
import { IPostComprehensive } from '../../../../lib/interfaces/post';
import { IChannelStatistics } from '../../../../lib/interfaces/channel';
import { ITopicComprehensive } from '../../../../lib/interfaces/topic';

import { response405, response500, logWithDate, } from '../../../../lib/utils/general';
import { verifyId } from '../../../../lib/utils/verify';
import { getRestrictedFromPostComprehensive } from '../../../../lib/utils/for/post';

const fnn = `${GetRestrictedPostComprehensiveById.name} (API)`;

/**
 * This interface ONLY accepts GET method ( PUT/DELETE moved to /api/creation )
 * 
 * Info required for GET method
 * -     token: JWT (optional)
 * 
 * Last update:
 * - 04/02/2023 v0.1.1
 * - 31/05/2023 v0.1.1
 */

export default async function GetRestrictedPostComprehensiveById(req: NextApiRequest, res: NextApiResponse) {

    const { method } = req;
    if ('GET' !== method) {
        response405(req, res);
        return;
    }

    //// Verify post id ////
    const { isValid, id: postId } = verifyId(req.query?.postId);
    if (!isValid) {
        res.status(400).send('Invalid post id');
        return;
    }

    //// Declare DB client ////
    const atlasDbClient = AtlasDatabaseClient();
    try {
        await atlasDbClient.connect();

        //// Look up post status ////
        const postComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IPostComprehensive>('post');
        const postComprehensiveQueryResult = await postComprehensiveCollectionClient.findOne({ postId });
        if (null === postComprehensiveQueryResult) {
            res.status(404).send('Post not found');
            await atlasDbClient.close();
            return;
        }

        //// Verify post status ////
        const { status: postStatus } = postComprehensiveQueryResult;
        if (0 > postStatus) {
            res.status(404).send('Method not allowed due to post deleted');
            await atlasDbClient.close();
            return;
        }

        //// Response 200 ////
        res.status(200).send(getRestrictedFromPostComprehensive(postComprehensiveQueryResult));

        //// Update statistics ////
        const { memberId, channelId } = postComprehensiveQueryResult;

        // Update totalCreationHitCount (of IMemberStatistics) in [C] memberStatistics ////
        const memberStatisticsCollectionClient = atlasDbClient.db('statistics').collection<IMemberStatistics>('member');
        const memberStatisticsUpdateResult = await memberStatisticsCollectionClient.updateOne({ memberId }, {
            $inc: {
                totalCreationHitCount: 1
            }
        });
        if (!memberStatisticsUpdateResult.acknowledged) {
            logWithDate(`Failed to update totalCreationHitCount (of IMemberStatistics, member id: ${memberId}) in [C] memberStatistics`, fnn);
        }


        //// Update totalHitCount (of IPostComprehensive) in [C] postComprehensive ////
        const postComprehensiveUpdateResult = await postComprehensiveCollectionClient.updateOne({ postId }, {
            $inc: {
                totalHitCount: 1
            }
        });
        if (!postComprehensiveUpdateResult.acknowledged) {
            logWithDate(`Failed to update totalHitCount/totalMemberHitCount (of IPostComprehensive, post id: ${postId}) in [C] postComprehensive`, fnn);
        }

        //// Update totalHitCount (of IChannelStatistics) in [C] channelStatistics ////
        const channelStatisticsCollectionClient = atlasDbClient.db('statistics').collection<IChannelStatistics>('channel');
        const channelStatisticsUpdateResult = await channelStatisticsCollectionClient.updateOne({ channelId }, {
            $inc: {
                totalHitCount: 1
            }
        });
        if (!channelStatisticsUpdateResult.acknowledged) {
            logWithDate(`Failed to totalHitCount (of IChannelStatistics, channel id: ${channelId}) in [C] channelStatistics`, fnn);
        }

        //// (Cond.) Update totalHitCount (of ITopicComprehensive) in [C] topicComprehensive ////
        const { topicInfoArr } = postComprehensiveQueryResult;
        if (Array.isArray(topicInfoArr) && topicInfoArr.length !== 0) {
            const topicComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<ITopicComprehensive>('topic');
            for await (const t of topicInfoArr) {
                const topicComprehensiveUpdateResult = await topicComprehensiveCollectionClient.updateOne({ topicId: t.topicId }, {
                    $inc: {
                        totalHitCount: 1
                    }
                });
                if (!topicComprehensiveUpdateResult.acknowledged) {
                    logWithDate(`Failed to update totalHitCount (of ITopicStatistics, topic id:${t.topicId}, post id: ${postId}) in [C] topicStatistics`, fnn);
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