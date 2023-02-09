import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt'
import { RestError } from '@azure/data-tables';
import { MongoError } from 'mongodb';

import AtlasDatabaseClient from "../../../../../modules/AtlasDatabaseClient";

import { IMemberMemberMapping, INoticeInfo, INotificationStatistics, IMemberComprehensive, IMemberStatistics } from '../../../../../lib/interfaces';
import { createNoticeId, getNicknameFromToken, verifyId, response405, response500, log, } from '../../../../../lib/utils';
const recaptchaServerSecret = process.env.INVISIABLE_RECAPTCHA_SECRET_KEY ?? '';

//////// Find out who am I following ////////

/** This interface accepts GET and POST requests
 * 
 * Info required for GET requests
 * 
 * recaptchaResponse: string (query string)
 * memberId: string
 * 
*/

export default async function GetFollowedByMembersById(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;

    res.send([
        {
            memberId: 'M1234ABCD',
            nickname: '县长马邦德',
            avatarImageUrl: 'https://p3-pc-sign.douyinpic.com/image-cut-tos-priv/3e1f26ab6652e8bab2146d9685309421~tplv-dy-resize-origshort-autoq-75:330.jpeg?x-expires=1988985600&x-signature=QXW59uArpZ4MLuzLDFUUD8X80Kg%3D&from=3213915784&s=PackSourceEnum_AWEME_DETAIL&se=false&sc=cover&biz_tag=pcweb_cover&l=202301140039005D37849F840BB8293C1A',
            briefIntro: '我來鵝城只辦三件事，公平！公平！還是他媽的公平！',
            createdTime: 1675645871314,
        }
    ])
}