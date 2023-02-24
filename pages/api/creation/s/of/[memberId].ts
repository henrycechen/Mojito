import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt'
import { RestError } from '@azure/data-tables';
import { MongoError } from 'mongodb';

import AzureTableClient from '../../../../../modules/AzureTableClient';
import AtlasDatabaseClient from "../../../../../modules/AtlasDatabaseClient";


import { response405, response500, logWithDate, } from '../../../../../lib/utils/general';
import { IConcisePostComprehensive } from '../../../../../lib/interfaces/post';

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
            postId: 'P12345ABCD1',
            memberId: 'M1234ABCD',
            nickname: 'WebMaster',
            createdTimeBySecond: 1674203401,
            title: '世界上只有一个周杰伦',
            coverImageFullname: '',
            imageFullnameArr: [],
            imageUrlsArr: ['https://media.uweekly.sg/wp-content/uploads/2022/12/20221217-cs-rotator.jpg'],
            totalHitCount: 1024,
            totalLikedCount: 24,
        },
        {
            postId: 'P12345ABCD2',
            memberId: 'M1234ABCD',
            nickname: 'WebMaster',
            createdTimeBySecond: 1674203508,
            title: '第一次看到头文字D的海报',
            coverImageFullname: '',
            imageFullnameArr: [],
            imageUrlsArr: ['https://upload.wikimedia.org/wikipedia/zh/f/f7/Initial_D_poster.jpg?20170330200904'],
            totalHitCount: 299,
            totalLikedCount: 2,
        },
        {
            postId: 'P12345ABCD0',
            memberId: 'M1234ABCD',
            nickname: 'WebMaster',
            createdTimeBySecond: 1674203260,
            title: '最喜欢的专辑是十一月的萧邦',
            coverImageFullname: '',
            imageFullnameArr: [],
            imageUrlsArr: ['https://upload.wikimedia.org/wikipedia/zh/9/93/Jay_chopin_cover270.jpg'],
            totalHitCount: 23,
            totalLikedCount: 0
        },
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