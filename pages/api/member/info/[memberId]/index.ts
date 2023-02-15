import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt'
import { RestError } from '@azure/data-tables';
import { MongoError } from 'mongodb';

import AzureTableClient from '../../../../../modules/AzureTableClient';
import AtlasDatabaseClient from "../../../../../modules/AtlasDatabaseClient";


import { IMemberMemberMapping, INoticeInfo, IMemberPostMapping, IMemberComprehensive, IConciseMemberInfo, IMemberStatistics, ILoginJournal, INotificationStatistics, IAttitudeComprehensive, IAttitideMapping, ICommentComprehensive, IEditedCommentComprehensive, IRestrictedCommentComprehensive, IChannelStatistics, ITopicComprehensive, ITopicPostMapping, IPostComprehensive, IEditedPostComprehensive, IRestrictedPostComprehensive } from '../../../../../lib/interfaces';
import { TMemberInfo } from '../../../../../lib/types';
import { verifyId, response405, response500, logWithDate } from '../../../../../lib/utils';


// TODO: unfinished


/** This interface accepts GET and POST requests
 * 
 * Info required for POST requests
 * 
 * recaptchaResponse: string (query string)
 * token: JWT
 * id: string (query, member id)
*/

export default async function MemberInfoById(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;
    if (!['GET', 'POST'].includes(method ?? '')) {
        response405(req, res);
        return;
    }

    // GET | info
    // PUT | update info


    try {
      
        const info: TMemberInfo = {
            memberId: 'M1234XXXX',
            nickname: 'WebMaster',
            avatarImageFullName: 'M1234XXXX.png'
        }
        
        res.send(info);
        // avatarImageUrl: 'https://p3-pc-sign.douyinpic.com/image-cut-tos-priv/3e1f26ab6652e8bab2146d9685309421~tplv-dy-resize-origshort-autoq-75:330.jpeg?x-expires=1988985600&x-signature=QXW59uArpZ4MLuzLDFUUD8X80Kg%3D&from=3213915784&s=PackSourceEnum_AWEME_DETAIL&se=false&sc=cover&biz_tag=pcweb_cover&l=202301140039005D37849F840BB8293C1A'

        
    } catch (e: any) {
        let msg;
        if (e instanceof RestError) {
            msg = 'Attempt to communicate with azure table storage.';
        } else if (e instanceof MongoError) {
            msg = 'Attempt to communicate with atlas mongodb.';
        } else {
            msg = `Uncategorized. ${e?.msg}`;
        }
        if (!res.headersSent) {
            response500(res, msg);
        }
        logWithDate(msg, e);
        // await atlasDbClient.close();
        return;
    }
}