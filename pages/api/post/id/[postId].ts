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

const fname = GetRestrictedPostComprehensiveById.name;

/** GetRestrictedPostComprehensiveById v0.1.1 FIXME: test mode
 * 
 * Last update: 24/02/2023
 * 
 * This interface ONLY accepts GET method  ( PUT/DELETE moved to /api/creation )
 * 
 * Info required for GET method
 * - token: JWT (optional)
 */

const ifo = {
    postId: 'P1234ABCDX',
    memberId: 'M1234XXXX',
    createdTimeBySecond: 1673389239,
    title: '《周杰倫的床邊故事》',
    // imageUrlsArr: [
    //     'https://img3.chinadaily.com.cn/images/202008/24/5f431dc9a310a85979164989.jpeg',
    //     'https://upload.wikimedia.org/wikipedia/zh/b/b2/JayChouBedtimeStories-2016_Cover.jpg'
    // ],
    imageFullnamesArr: [
        '1234.jpg',
        '2345.jpg',
    ],
    paragraphsArr: [
        `《周杰倫的床邊故事》(英語：Jay Chou's Bedtime Stories)是臺灣男歌手周杰倫的第14張錄音室專輯，2016年6月8日开始预购，6月24日正式發行[2][3]。`,
        `本專輯為周杰倫與妻子昆凌結婚生子後發行的首張專輯，為周杰倫個人第14張專輯[4]。新專輯以床邊故事命名，專輯設計打造成有聲書概念，訴說10個與眾不同、充滿想像的音樂故事[5][6][7]。專輯中與張惠妹首度合唱，是繼《依然范特西》專輯中的《千里之外》與費玉清的合作後，再次跨公司與線上歌手合唱，並且收錄於專輯中[8][9]`,
        `這是@WebMaster從維基百科搬過來的...@县长马邦德是@WebMaster的老闆`
    ],
    cuedMemberInfoArr: [
        { memberId: 'M1234XXXX', nickname: 'WebMaster' },
        { memberId: 'M1234ABCD', nickname: '县长马邦德' },
    ],
    channelId: 'hobby',
    topicIdsArr: [
        '5ZGo5p2w5Lym', // 周杰伦
        '6Z+z5LmQ' // 音乐
    ],
    pinnedCommentId: '',
    status: 201,
    editedTimeBySecond: 1673479039454,

    totalHitCount: 1480,
    totalLikedCount: 24,
    totalDislikedCount: 1,
    totalCommentCount: 5,
    totalSavedCount: 12,
}

export default async function GetRestrictedPostComprehensiveById(req: NextApiRequest, res: NextApiResponse) {

    res.send(ifo)
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

        // Look up post status (IPostComprehensive) in [C] postComprehensive
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
                    CreatedTimeBySecond: Math.floor(new Date().getTime() / 1000),
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
        const { topicIdsArr } = postComprehensiveQueryResult;
        if (Array.isArray(topicIdsArr) && topicIdsArr.length !== 0) {
            const topicComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<ITopicComprehensive>('topic');
            for await (const topicId of topicIdsArr) {
                const topicComprehensiveUpdateResult = await topicComprehensiveCollectionClient.updateOne({ topicId }, {
                    $inc: {
                        totalHitCount: 1
                    }
                });
                if (!topicComprehensiveUpdateResult.acknowledged) {
                    logWithDate(`Failed to update totalHitCount (of ITopicStatistics, topic id:${topicId}, post id: ${postId}) in [C] topicStatistics`, fname);
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