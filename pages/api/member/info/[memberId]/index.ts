import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import { RestError } from '@azure/data-tables';
import { MongoError } from 'mongodb';

import AzureTableClient from '../../../../../modules/AzureTableClient';
import AtlasDatabaseClient from "../../../../../modules/AtlasDatabaseClient";


import { response405, response500, logWithDate } from '../../../../../lib/utils/general';
import { IMemberInfo, IRestrictedMemberComprehensive } from '../../../../../lib/interfaces/member';


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

            nickname: '店小二WebMaster',
            briefIntro: `專業的臺灣書評媒體
            \n提供原生報導，文化觀察，人物採訪與國內外重大出版消息
            \nLife is an openbook.  
            \n打開來讀，有人陪你`,
            gender: -1,
            birthdayBySecond: 840344435,

            status: 200,
            allowPosting: true,
            allowCommenting: true,
            allowKeepingBrowsingHistory: true,
            allowVisitingFollowedMembers: true,
            allowVisitingSavedPosts: true,
            hidePostsAndCommentsOfBlockedMember: false,
        };

        res.send(info);


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