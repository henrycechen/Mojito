import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import { RestError } from '@azure/data-tables';
import { MongoError } from 'mongodb';

import AzureTableClient from '../../../../../modules/AzureTableClient';
import AtlasDatabaseClient from "../../../../../modules/AtlasDatabaseClient";


import { response405, response500, logWithDate, } from '../../../../../lib/utils/general';
import { IConcisePostComprehensive } from '../../../../../lib/interfaces/post';
import { createId } from '../../../../../lib/utils/create';

const fname = GetCreationsByMemberId.name;

/** GetCreationsByMemberId v0.1.1 FIXME: test mode
 * 
 * Last update:
 * 
 * This interface ONLY accepts GET requests
 * 
 * Info requestre for GET requests
 * 
 */
export default async function GetCreationsByMemberId(req: NextApiRequest, res: NextApiResponse) {

    const { method } = req;
    if ('GET' !== method) {
        response405(req, res);
        return;
    }

    const arr: IConcisePostComprehensive[] = [
        {
            postId: createId('post'),
            memberId: 'M1234ABCD',
            nickname: 'WebMaster',

            createdTimeBySecond: 1674203401,
            title: '世界上只有一个周杰伦',
            channelId: 'music',
            hasImages: false,

            totalCommentCount: 1234,
            totalHitCount: 1024,
            totalLikedCount: 24,
        },
        {
            postId: createId('post'),
            memberId: 'M1234ABCD',
            nickname: 'WebMaster',

            createdTimeBySecond: 1674203508,
            title: '第一次看到头文字D的海报',
            channelId: 'music',
            hasImages: false,

            totalCommentCount: 1234,
            totalHitCount: 299,
            totalLikedCount: 2,
        },
        {
            postId: createId('post'),
            memberId: 'M1234ABCD',
            nickname: 'WebMaster',

            createdTimeBySecond: 1674203260,
            title: '最喜欢的专辑是十一月的萧邦',
            channelId: 'music',
            hasImages: false,

            totalCommentCount: 1234,
            totalHitCount: 23,
            totalLikedCount: 0
        },




        {
            postId: createId('post'),
            memberId: 'M5678WXYZ',
            nickname: 'WebMaster',

            createdTimeBySecond: 1674302500,
            title: '10 Tips for Better Code Reviews',
            channelId: 'chat',
            hasImages: false,

            totalCommentCount: 567,
            totalHitCount: 789,
            totalLikedCount: 15,
        },
        {
            postId: createId('post'),
            memberId: 'M5678WXYZ',
            nickname: 'WebMaster',

            createdTimeBySecond: 1674324500,
            title: 'React vs Angular: Which One to Choose for Your Next Project?',
            channelId: 'chat',
            hasImages: false,

            totalCommentCount: 346,
            totalHitCount: 123,
            totalLikedCount: 8,
        },
        {
            postId: createId('post'),
            memberId: 'M5678WXYZ',
            nickname: 'WebMaster',

            createdTimeBySecond: 1674353500,
            title: 'How to Optimize Your Website for SEO',
            channelId: 'chat',
            hasImages: false,

            totalCommentCount: 789,
            totalHitCount: 567,
            totalLikedCount: 22,
        },
        {
            postId: createId('post'),
            memberId: 'M5678WXYZ',
            nickname: 'WebMaster',

            createdTimeBySecond: 1674362500,
            title: 'Why You Should Learn Go Programming Language',
            channelId: 'chat',
            hasImages: false,

            totalCommentCount: 234,
            totalHitCount: 456,
            totalLikedCount: 12,
        }

    ];
    res.send(arr);
    return;

    //// Declare DB client ////
    const atlasDbClient = AtlasDatabaseClient();
    try {
        await atlasDbClient.connect();
        await atlasDbClient.close();
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