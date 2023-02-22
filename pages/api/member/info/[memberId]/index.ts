import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt'
import { RestError } from '@azure/data-tables';
import { MongoError } from 'mongodb';

import AzureTableClient from '../../../../../modules/AzureTableClient';
import AtlasDatabaseClient from "../../../../../modules/AtlasDatabaseClient";


import { response405, response500, logWithDate } from '../../../../../lib/utils/general';
import { IConciseMemberInfo, IRestrictedMemberComprehensive } from '../../../../../lib/interfaces/member';


const fname = GetMemberInfoById.name;


/** GetMemberInfoById v0.1.1
 * 
 * Last update: 21/02/2023
 * 
 * This interface ONLY accepts GET requests
 * 
 * Info required for ONLY requests
 * token: JWT
 * id: string (query, member id)
*/

export default async function GetMemberInfoById(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;
    if (!['GET', 'POST'].includes(method ?? '')) {
        response405(req, res);
        return;
    }

    // GET | info



    //// Declare DB client ////
    const atlasDbClient = AtlasDatabaseClient();
    try {

        const info: IRestrictedMemberComprehensive = {
            memberId: 'M1234XXXX',
            providerId: "MojitoMemberSystem",
            registeredTimeBySecond: 1671484182,
            verifiedTimeBySecond: 1671593378,

            nickname: 'WebMaster',
            briefIntro: '歡迎大家來到我們的社區:)',
            gender: -1,
            birthdayBySecond: 840344435,

            status: 200,
            allowKeepingBrowsingHistory: true,
            allowVisitingSavedPosts: true,
            hidePostsAndCommentsOfBlockedMember: false,
        }

        res.send(info);
        // avatarImageUrl: 'https://p3-pc-sign.douyinpic.com/image-cut-tos-priv/3e1f26ab6652e8bab2146d9685309421~tplv-dy-resize-origshort-autoq-75:330.jpeg?x-expires=1988985600&x-signature=QXW59uArpZ4MLuzLDFUUD8X80Kg%3D&from=3213915784&s=PackSourceEnum_AWEME_DETAIL&se=false&sc=cover&biz_tag=pcweb_cover&l=202301140039005D37849F840BB8293C1A'


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