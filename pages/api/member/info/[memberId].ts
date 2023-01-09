import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt'
import { RestError } from '@azure/data-tables';
import { MongoError } from 'mongodb';

import AzureTableClient from '../../../../modules/AzureTableClient';
import AtlasDatabaseClient from "../../../../modules/AtlasDatabaseClient";


import { IMemberMemberMapping, INoticeInfo, IMemberPostMapping, IMemberComprehensive, IRestrictedMemberInfo, IMemberStatistics, ILoginJournal, INotificationStatistics, IAttitudeComprehensive, IAttitideMapping, ICommentComprehensive, IEditedCommentComprehensive, IRestrictedCommentComprehensive, IChannelStatistics, ITopicComprehensive, ITopicPostMapping, IPostComprehensive, IEditedPostComprehensive, IRestrictedPostComprehensive } from '../../../../lib/interfaces';
import { MemberInfo } from '../../../../lib/types';
import { verifyId, response405, response500, log } from '../../../../lib/utils';


// TODO: unfinished


/** This interface accepts GET and POST requests
 * 
 * Info required for POST requests
 * 
 * recaptchaResponse: string (query string)
 * token: JWT
 * id: string (query, member id)
*/

export default async function MemberInfo(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;
    if (!['GET', 'POST'].includes(method ?? '')) {
        response405(req, res);
        return;
    }

    // GET | info
    // PUT | update info




    try {
        // [!] Limited resource supply for identiyless requests
        const { id: memberId } = req.query;
        // Step #1 verify post id
        if ('string' !== typeof memberId) {
            res.status(400).send('Improper member id');
            return;
        }
        // Step #2 create member info
        const info: MemberInfo = {
            id: memberId,
            nickname: '县长马邦德',
            postCounts: 13,
            followedByCounts: 4,
            likedCounts: 9,
            // avatarImageUrl: '' // avatar image url is provided by session (jwt)
        }
        // Step #3 verify session (identity)
        const token = await getToken({ req });
        if (token && token.sub) {
            // called by member him/herself
            const { p } = req.query
        }
        res.send(info);
    } catch (e: any) {
        let msg;
        if (e instanceof RestError) {
            msg = 'Was trying communicating with azure table storage.';
        } else if (e instanceof MongoError) {
            msg = 'Was trying communicating with atlas mongodb.';
        } else {
            msg = `Uncategorized. ${e?.msg}`;
        }
        if (!res.headersSent) {
            response500(res, msg);
        }
        log(msg, e);
        // await atlasDbClient.close();
        return;
    }
}