import type { NextApiRequest, NextApiResponse } from 'next';
import { RestError } from '@azure/data-tables';
import { MongoError } from 'mongodb';
import { getToken } from 'next-auth/jwt';

import AzureTableClient from '../../../../../modules/AzureTableClient';
import AtlasDatabaseClient from '../../../../../modules/AtlasDatabaseClient';
import { logWithDate, response405, response500 } from '../../../../../lib/utils/general';
import { createId, createNoticeId, getRandomIdStr, getTimeBySecond } from '../../../../../lib/utils/create';
import { IMemberComprehensive, IMemberStatistics } from '../../../../../lib/interfaces/member';
import { getTopicInfoArrayFromRequestBody, createTopicComprehensive } from '../../../../../lib/utils/for/topic';
import { getCuedMemberInfoArrayFromRequestBody, getImageFullnamesArrayFromRequestBody, getParagraphsArrayFromRequestBody } from '../../../../../lib/utils/for/post';
import { IPostComprehensive } from '../../../../../lib/interfaces/post';
import { IChannelStatistics } from '../../../../../lib/interfaces/channel';
import { ITopicComprehensive, ITopicPostMapping } from '../../../../../lib/interfaces/topic';
import { INoticeInfo, INotificationStatistics } from '../../../../../lib/interfaces/notification';
import { getNicknameFromToken } from '../../../../../lib/utils/for/member';

const domain = process.env.NEXT_PUBLIC_APP_DOMAIN;
const fname = UpdateImageFullnamesArray.name;

/** CreatePost v0.1.1 FIXME:
 * 
 * Last update: 
 * 
 * This interface ONLY accepts PUT method
 * 
 * Post info required
 * - token: JWT
 * - title
 * - channelId
 */

export default async function UpdateImageFullnamesArray(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;
    if ('PUT' !== method) {
        response405(req, res);
        return;
    }

    //// Verify identity ////
    const token = await getToken({ req });
    if (!(token && token?.sub)) {
        res.status(400).send('Invalid identity');
        return;
    }

    //// Verify array ////
    const { imageFullnamesArr } = req.body;
    if (!Array.isArray(imageFullnamesArr)) {
        res.status(400).send('Invalid image fullnames array');
        return;
    }


    //// Declare DB client ////
    const atlasDbClient = AtlasDatabaseClient();
    try {
        await atlasDbClient.connect();

        const { sub: memberId } = token;
        // #1.2 look up member status (IMemberComprehensive) in [C] memberComprehensive
        const memberComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IMemberComprehensive>('member');
        const memberComprehensiveQueryResult = await memberComprehensiveCollectionClient.findOne<IMemberComprehensive>({ memberId });
        if (null === memberComprehensiveQueryResult) {
            throw new Error(`Member attempt to creating post but have no document (of IMemberComprehensive, member id: ${memberId}) in [C] memberComprehensive`);
        }
        const { status: memberStatus, allowPosting } = memberComprehensiveQueryResult;
        if (!(0 < memberStatus && allowPosting)) {
            res.status(403).send('Method not allowed due to member suspended or deactivated');
            await atlasDbClient.close();
            return;
        }
        //// Create post ////
        // #2.1 create a new post id
        const postId = getRandomIdStr(true);




        // #2.3 insert a new document (of IPostComprehensive) in [C] postComprehensive
        const postComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IPostComprehensive>('post');
        const postComprehensiveInsertResult = await postComprehensiveCollectionClient.updateOne({ postId }, {

            imageFullnamesArr,
            status: 200

        });
        if (!postComprehensiveInsertResult.acknowledged) {
            throw new Error(`Failed to insert document (of IPostComprehensive, member id: ${memberId}) in [C] postComprehensive`);
        }
        res.status(200).end();


        await atlasDbClient.close();
        return;
    } catch (e: any) {
        let msg;
        if (e instanceof SyntaxError) {
            res.status(400).send('Improperly normalized request info');
            return;
        } else if (e instanceof RestError) {
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