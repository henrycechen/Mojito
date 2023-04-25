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
            emailAddress: 'henrycechen@gmail.com',

            nickname: '店小二WebMaster',
            // briefIntro: `專業的臺灣書評媒體
            // \n提供原生報導，文化觀察，人物採訪與國內外重大出版消息
            // \nLife is an openbook.  
            // \n打開來讀，有人陪你,換日線。台灣高雄人。二十歲後流浪到台北工作七年後回高雄定居至今。\n從事接案工作十餘年。大多數時間從事的事都跟書和出版社有關。`,
            
            
            briefIntro: `在現代社會中，人們對於工作的要求越來越高，追求高薪、穩定、有前途的職業成為了很多人的目標。但是，我們也應該注重工作所帶來的樂趣和成就感。如果一個人一直在做他不喜歡的工作，將會感到空虛和無聊，這對於健康和心理狀態都是不好的。因此，找到一份自己喜愛的工作是非常重要的。此外，通過工作可以學習新技能和知識，這有助於個人成長和發展。總之，工作不僅是賺錢和謀生的手段，更是實現自我價值和追求夢想的途徑。`,
            
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