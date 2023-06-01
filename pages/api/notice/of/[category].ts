import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import { MongoError } from 'mongodb';

import AtlasDatabaseClient from '../../../../modules/AtlasDatabaseClient';

import { logWithDate, response405, response500 } from '../../../../lib/utils/general';
import { IMemberComprehensive } from '../../../../lib/interfaces/member';
import { INotificationComprehensive } from '../../../../lib/interfaces/notification';

const fnn = `${GetNoticeByCategory.name} (API)`;

/**
 * This interface ONLY accepts GET requests
 * 
 * Info required for GET requests
 * -     token: JWT
 * -     category: string (query, notice category)
 * 
 * Info will be returned
 * -     arr: INotificationComprehensive[]
 * 
 * Last update:
 * - 13/05/2023 v0.1.1
 * - 31/05/2023 v0.1.2
*/

export default async function GetNoticeByCategory(req: NextApiRequest, res: NextApiResponse) {

    const { method } = req;
    if ('GET' !== method) {
        response405(req, res);
        return;
    }

    //// Verify identity ////
    const token = await getToken({ req });
    if (!(token && token?.sub)) {
        res.status(400).send('Invalid identity');
        return;
    }

    //// Verify notice category ////
    const { category } = req.query;
    if (!('string' === typeof category && ['cue', 'reply', 'like', 'pin', 'save', 'follow'].includes(category))) {
        res.status(400).send('Invalid notice category');
        return;
    }

    //// Declare DB client ////
    const atlasDbClient = AtlasDatabaseClient();
    try {
        await atlasDbClient.connect();

        //// Verify member status ////
        const { sub: memberId } = token;
        const memberComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IMemberComprehensive>('member');
        const memberComprehensiveQueryResult = await memberComprehensiveCollectionClient.findOne({ memberId });
        if (null === memberComprehensiveQueryResult) {
            throw new Error(`Member attempt to GET record (of INoticeInfo) but have no document (of IMemberComprehensive, member id: ${memberId}) in [C] memberComprehensive`);
        }

        const { status: memberStatus } = memberComprehensiveQueryResult;
        if (0 > memberStatus) {
            res.status(403).send('Method not allowed due to member suspended or deactivated');
            await atlasDbClient.close();
            return;
        }

        const conditions: any = [{ status: { $gt: 0 } }, { memberId: { $eq: memberId } }, { category: { $eq: category } }];
        const pipeline = [
            { $match: { $and: conditions } },
            { $limit: 30 },
            { $sort: { createdTimeBySecond: 1 } },
            {
                $project: {
                    _id: 0,
                    noticeId: 1,
                    category: 1,
                    memberId: 1,
                    initiateId: 1,
                    nickname: 1,
                    postTitle: 1,
                    commentBrief: 1,
                    createdTimeBySecond: 1
                }
            }
        ];
        const notificationComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<INotificationComprehensive>('notification');
        const query = notificationComprehensiveCollectionClient.aggregate(pipeline);

        //// Response 200 ////
        res.status(200).send(await query.toArray());

        await atlasDbClient.close();
        return;
    } catch (e: any) {
        let msg;
        if (e instanceof MongoError) {
            msg = `Attempt to communicate with atlas mongodb.`;
        } else {
            msg = `Uncategorized. ${e?.msg}`;
        }
        if (!res.headersSent) {
            response500(res, msg);
        }
        logWithDate(msg, fnn, e);
        await atlasDbClient.close();
        return;
    }
}