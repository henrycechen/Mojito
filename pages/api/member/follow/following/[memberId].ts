import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt'
import { RestError } from '@azure/data-tables';
import { MongoError } from 'mongodb';

import AtlasDatabaseClient from "../../../../../modules/AtlasDatabaseClient";

import { IMemberMemberMapping, INoticeInfo, INotificationStatistics, IMemberComprehensive, IMemberStatistics } from '../../../../../lib/interfaces';
import { createNoticeId, getNicknameFromToken, verifyId, response405, response500, logWithDate, } from '../../../../../lib/utils';
const recaptchaServerSecret = process.env.INVISIABLE_RECAPTCHA_SECRET_KEY ?? '';

//////// Find out who is following me ////////

/** This interface accepts GET and POST requests
 * 
 * Info required for GET requests
 * 
 * recaptchaResponse: string (query string)
 * memberId: string
 * 
*/

export default async function GetFollowingMembersById(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;

    // res.send([]);
    // return;
    res.send([
        {
            memberId: 'M2950ABBX',
            nickname: '550W不是Moss',
            avatarImageUrl: 'https://cdn.icon-icons.com/icons2/1371/PNG/512/robot02_90810.png',
            briefIntro: '刘华强的小Moss',
            createdTime: 1675644625055,
        },
        {
            memberId: 'M3380ACMM',
            nickname: '測試一下名字最長可以有多長雖然可能會被拒絕',
            avatarImageUrl: 'https://store.playstation.com/store/api/chihiro/00_09_000/container/PT/pt/19/EP4067-NPEB01320_00-AVPOPULUSM000897/image?w=320&h=320&bg_color=000000&opacity=100&_version=00_09_000',
            briefIntro: '好厉害',
            createdTime: 1675645871314,
        }
    ]);
}