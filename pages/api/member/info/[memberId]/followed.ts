import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt'
import { RestError } from '@azure/data-tables';
import { MongoError } from 'mongodb';

import AzureTableClient from '../../../../../modules/AzureTableClient';
import AtlasDatabaseClient from "../../../../../modules/AtlasDatabaseClient";

import { IMemberMemberMapping, INoticeInfo, INotificationStatistics, IMemberComprehensive, IMemberStatistics } from '../../../../../lib/interfaces';
import { createNoticeId, getNicknameFromToken, verifyId, response405, response500, logWithDate, } from '../../../../../lib/utils';
const recaptchaServerSecret = process.env.INVISIABLE_RECAPTCHA_SECRET_KEY ?? '';

/** This interface accepts GET requests
 * 
 * Info required for GET requests
 * - token: JWT
 * 
 * Info will be returned
 * - followingMemberInfoArr: IConciseMemberInfo[]
 * 
 */

export default async function GetMemberInfoById_Following(req: NextApiRequest, res: NextApiResponse) {
    // FIXME: test
    res.send([
        {
            memberId: 'M1234X001',
            nickname: 'JAY'
        },
        {
            memberId: 'M1234X002',
            nickname: '范特西'
        },
        {
            memberId: 'M1234X003',
            nickname: '八度空間'
        },
        {
            memberId: 'M1234X004',
            nickname: '葉惠美'
        },
        {
            memberId: 'M1234X005',
            nickname: '七里香'
        },
        {
            memberId: 'M1234X006',
            nickname: '十一月的蕭邦'
        },
        {
            memberId: 'M1234X007',
            nickname: '范特西依然'
        },
        {
            memberId: 'M1234X008',
            nickname: '我很忙'
        },
        {
            memberId: 'M1234X014',
            nickname: '周杰伦的床边故事的床边故事'
        },
        {
            memberId: 'MXXXXXXXX',
            nickname: 'Mojito會員2B'
        },
    ]);
    return
}