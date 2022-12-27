import type { NextApiRequest, NextApiResponse } from 'next';
import { RestError } from '@azure/data-tables';

import { getToken } from 'next-auth/jwt';

import AzureTableClient from '../../../../modules/AzureTableClient';
import AtlasDatabaseClient from '../../../../modules/AtlasDatabaseClient';

import { INoticeInfo, INotificationStatistics, IMemberStatistics, ICommentComprehensive, IChannelStatistics, ITopicComprehensive, IPostComprehensive, } from '../../../../lib/interfaces';
import { PostInfo } from '../../../../lib/types';
import { verifyId, response405, response500 } from '../../../../lib/utils';

export default async function PostInfoIndex(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;
    if (!['GET', 'PUT', 'DELETE'].includes(method ?? '')) {
        response405(req, res);
        return;
    }
    const { postId } = req.query;
    //// Verify post id ////
    if (!('string' === typeof postId && verifyId(postId, 10))) {
        res.status(400).send('Invalid post id');
        return;
    }
    //// Declare DB client ////
    const atlasDbClient = AtlasDatabaseClient();
    try {
        //// Look up post status (IPostComprehensive) in [C] postComprehensive
        const postComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IPostComprehensive>('post');
        const postComprehensiveQueryResult = await postComprehensiveCollectionClient.findOne({ postId });
        if (null === postComprehensiveQueryResult) {
            res.status(404).send('Post not found');
            return;
        }
        const { status: postStatus } = postComprehensiveQueryResult;
        if (0 > postStatus) {
            res.status(404).send('Post has been deleted');
            return;
        }
        //// Post status is good ////
        const token = await getToken({ req });
        if ('GET' === method) {
            // Step #1 look post info (IPostComprehensvie) in [C] postComprehensive
            res.status(200).send('resource without identity')
            // Step #2 (cond.) upsert record (of IHistoryMapping) in [RL] HistoryMapping 
            if (token && token?.sub) {
                //// [!] with identity
            }
            // Step #3 update total creation hit count (of IMemberStatistics) in [C] memberStatistics
            // Step #4 update total hit count (of IMemberStatistics) in [C] postComprehensive 
            // Step #5 update total hit count (of IMemberStatistics) in [C] channelStatistics 
            // Step #6 (cond.) update total hit count (of IMemberStatistics) in [C] topicStatistics 
            res.send('ok')
            return;
        }
        //// Verify identity ////
        if (!(token && token?.sub)) {
            res.status(400).send('Invalid identity');
            return;
        }
        if ('PUT' === method) {
            // 
            // Step #1 update document (of IPostComprehensive) in [C] postComprehensive
            // Step #2 update total comment edit count (of IMemberStatistics) in [C] memberStatistics
            //// Handle cue ////
            // Step #3 (cond.) upsert record (of INoticeInfo.Cued) in [PRL] Notice
            // Step #4 (cond.) update cued count (INotificationStatistics) (of cued member) in [C] notificationStatistics
        }
        if ('DELETE' === method) {
            // Step #1 update post status (of IPostComprehensive) [C] postComprehensive
            // Step #2 update total creation delete count (of IMemberStatistics) (of post author) in [C] memberStatistics
            // Step #3 update total post delete count (of IChannelStatistics) in [C] channelStatistics
            // Step #4 (cond.) update total post delete count (of ITopicComprehensive) [C] topicComprehensive
            // Step #5 (cond.) update mapping status (of ITopicPostMapping) [C] topicPostMapping
            const postComprehensiveDeleteResult = await postComprehensiveCollectionClient.updateOne({ postId }, { $set: { status: -1 } });
            if (null === postComprehensiveDeleteResult) {
                res.status(404).send('Post not found');
                return;
            }
        }
    } catch (e) {

    }




    try {
        const { id } = req.query;
        // Step #1 verify post id






















        if ('string' !== typeof id) {
            res.status(400).send('Improper post id');
            return;
        }
        const info: PostInfo = {
            id,
            memberId: '1',
            timeStamp: '2022-11-22T23:22:13.9762448Z',
            title: '在Mojito上发的WebMasterの第一篇（测试）帖子',
            content: '问下大家，在 function 里定义的 type 和在 function 外定义有区别嘛？ Typescript 这里的 function 是 function component ，是在写前端时遇到的疑惑，感谢！我能想到的就只有作用域的区别了。',
            contentParagraphsArray: [
                '问下大家，在 function 里定义的 type 和在 function 外定义有区别嘛？',
                'Typescript 这里的 function 是 function component ',
                '在写前端时遇到的疑惑，感谢！我能想到的就只有作用域的区别了。',
            ],
            imageUrlArr: [

                'https://images.unsplash.com/photo-1553095066-5014bc7b7f2d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1171&q=80',
                'https://images.pexels.com/photos/259915/pexels-photo-259915.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
                // 'https://i.imgur.com/NeY9Bah.jpeg'
            ],
            channelId: 'work',
            topicList: [
                {
                    id: '1vakw6fe998',
                    channelId: 'work',
                    name: 'Typescript',
                },
                {
                    id: 'iefx61n10y',
                    channelId: 'work',
                    name: '测试',
                },
                {
                    id: '757wp7wg36',
                    channelId: 'work',
                    name: '前端',
                },
            ],
            viewedTimes: 99,
            likedTimes: 3,
            dislikedTimes: 1,
            savedTimes: 2,
            commentNumber: 5
        }
        res.send(info);
    } catch (e) {
        response500(res, `Was trying . ${e}`);
        return;
    }
}