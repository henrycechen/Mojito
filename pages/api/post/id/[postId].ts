import type { NextApiRequest, NextApiResponse } from 'next';
import { RestError } from '@azure/data-tables';
import { MongoError } from 'mongodb';
import { getToken } from 'next-auth/jwt';

import AzureTableClient from '../../../../modules/AzureTableClient';
import AtlasDatabaseClient from '../../../../modules/AtlasDatabaseClient';

import { IMemberPostMapping } from '../../../../lib/interfaces/mapping';
import { response405, response500, logWithDate, } from '../../../../lib/utils/general';
import { verifyId } from '../../../../lib/utils/verify';
import { IPostComprehensive } from '../../../../lib/interfaces/post';
import { getRestrictedFromPostComprehensive } from '../../../../lib/utils/for/post';
import { IMemberComprehensive, IMemberStatistics } from '../../../../lib/interfaces/member';
import { IChannelStatistics } from '../../../../lib/interfaces/channel';
import { ITopicComprehensive } from '../../../../lib/interfaces/topic';
import { getTimeBySecond } from '../../../../lib/utils/create';

const fname = GetRestrictedPostComprehensiveById.name;

/** GetRestrictedPostComprehensiveById v0.1.1
 * 
 * Last update: 24/02/2023
 * 
 * This interface ONLY accepts GET method  ( PUT/DELETE moved to /api/creation )
 * 
 * Info required for GET method
 * - token: JWT (optional)
 */

export default async function GetRestrictedPostComprehensiveById(req: NextApiRequest, res: NextApiResponse) {

    res.send({
        "postId": "P4CD624HHS",
        "memberId": "M1234XXXX",
        "createdTimeBySecond": 1678679403,
        "title": "MX5-RE-RE",
        "imageFullnamesArr": [
            // "P4CD624HHS_DLBVJIQ1T.jpeg",
            // "P4CD624HHS_6NR6EKKW11.jpeg",
            // "P4CD624HHS_226CDUSEQK.jpeg",
            // "P4CD624HHS_1BEEE1FJR8.jpeg",
            // "P4CD624HHS_342QM85WET.jpeg",
            // "P4CD624HHS_VG9OMAVRL.jpeg"
        ],
        "paragraphsArr": [
            "I am selling with regret (in fact I don't have one)\n",
            "I am selling with regret (in fact I don't have one)\n",
            "I am selling with regret (in fact I don't have one)\n",
            "@县长马邦德",
        ],
        "cuedMemberInfoArr": [
            {
                memberId: 'M1234ABCD',
                nickname: '县长马邦德',
                briefIntro: 'xxx',
                createdTimeBySecond: 0
            }
        ],
        "channelId": "automobile",
        "topicInfoArr": [
            {
                topicId: '5ZGo5p2w5Lym',
                content: '周杰伦',
                // channelId: 'chat',
                // totalHitCount: 1024,
                // totalPostCount: 126
            },
            {
                topicId: '6K+05aW95LiN5ZOt',
                content: '说好不哭',
                // channelId: 'chat',
                // totalHitCount: 624,
                // totalPostCount: 75
            },
        ],
        "pinnedCommentId": null,
        "status": 200,
        "allowEditing": true,
        "allowCommenting": true,
        "totalHitCount": 0,
        "totalLikedCount": 0,
        "totalDislikedCount": 0,
        "totalCommentCount": 0,
        "totalSavedCount": 0,
        "editedTimeBySecond": null

    });
    return;


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

        const { memberId: authorId } = postComprehensiveQueryResult;

        let viewerId = '';
        let viewerIsMemberButNotAuthor = false;

        //// Update browsing history mapping ////
        const token = await getToken({ req });
        if (token && token?.sub) {

            viewerId = token.sub;

            //// Look up member status (od IMemberComprehensive) in [C] memberComprehensive ////
            const memberComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IMemberComprehensive>('member');
            const memberComprehensiveQueryResult = await memberComprehensiveCollectionClient.findOne({ memberId: viewerId }, { projection: { _id: 0, status: 1 } });
            if (null === memberComprehensiveQueryResult) {
                throw new Error(`Member attempt to upsert entity (of browsing history, of IMemberPostMapping) but have no document (of IMemberComprehensive, member id: ${viewerId}) in [C] memberComprehensive`);
            }

            //// Verify member status ////
            const { status: memberStatus } = memberComprehensiveQueryResult;
            if (0 < memberStatus) {
                const { title } = postComprehensiveQueryResult;
                const historyMappingTableClient = AzureTableClient('HistoryMapping');
                await historyMappingTableClient.upsertEntity<IMemberPostMapping>({
                    partitionKey: viewerId,
                    rowKey: postId,
                    Nickname: '',
                    Title: title,
                    CreatedTimeBySecond: getTimeBySecond(),
                    HasImages: false,
                    IsActive: true
                }, 'Merge');
                viewerIsMemberButNotAuthor = authorId !== viewerId;
            }
        }

        //// Update statistics ////

        // Update totalCreationHitCount (of IMemberStatistics) in [C] memberStatistics ////
        if (authorId !== viewerId) { // [!] No counting author's hit 
            const memberStatisticsCollectionClient = atlasDbClient.db('statistics').collection<IMemberStatistics>('member');
            const memberStatisticsUpdateResult = await memberStatisticsCollectionClient.updateOne({ memberId: authorId }, {
                $inc: {
                    totalCreationHitCount: 1
                }
            });
            if (!memberStatisticsUpdateResult.acknowledged) {
                logWithDate(`Failed to update totalCreationHitCount (of IMemberStatistics, member id: ${authorId}) in [C] memberStatistics`, fname);
            }
        }

        //// Update totalHitCount (of IPostComprehensive) in [C] postComprehensive ////
        let hitCountUpdate = viewerIsMemberButNotAuthor ? { totalHitCount: 1, totalMemberHitCount: 1 } : { totalHitCount: 1 };
        const postComprehensiveUpdateResult = await postComprehensiveCollectionClient.updateOne({ postId }, {
            $inc: { ...hitCountUpdate }
        });
        if (!postComprehensiveUpdateResult.acknowledged) {
            logWithDate(`Failed to update totalHitCount/totalMemberHitCount (of IPostComprehensive, post id: ${postId}) in [C] postComprehensive`, fname);
        }

        //// Update totalHitCount (of IChannelStatistics) in [C] channelStatistics ////
        const { channelId } = postComprehensiveQueryResult;
        const channelStatisticsCollectionClient = atlasDbClient.db('statistics').collection<IChannelStatistics>('channel');
        const channelStatisticsUpdateResult = await channelStatisticsCollectionClient.updateOne({ channelId }, {
            $inc: {
                totalHitCount: 1
            }
        });
        if (!channelStatisticsUpdateResult.acknowledged) {
            logWithDate(`Failed to totalHitCount (of IChannelStatistics, channel id: ${channelId}) in [C] channelStatistics`, fname);
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
                    logWithDate(`Failed to update totalHitCount (of ITopicStatistics, topic id:${t.topicId}, post id: ${postId}) in [C] topicStatistics`, fname);
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