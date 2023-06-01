import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import { MongoError } from 'mongodb';

import AtlasDatabaseClient from '../../../../modules/AtlasDatabaseClient';

import { IMemberComprehensive } from '../../../../lib/interfaces/member';
import { INotificationComprehensive } from '../../../../lib/interfaces/notification';

import { logWithDate, response405, response500 } from '../../../../lib/utils/general';
import { verifyId } from '../../../../lib/utils/verify';

const fnn = `${DeleteNoticeById.name} (API)`;

/**
 * This interface ONLY accepts DELETE requests
 * 
 * Info required for DELETE requests
 * -     token: JWT
 * -     category: string (query, notice category)
 * 
 * Last update:
 * - 13/05/2023 v0.1.1
 * - 31/05/2023 v0.1.2
*/

export default async function DeleteNoticeById(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;
    if ('DELETE' !== method) {
        response405(req, res);
        return;
    }

    //// Verify identity ////
    const token = await getToken({ req });
    if (!(token && token?.sub)) {
        res.status(401).send('Unauthorized');
        return;
    }

    //// Verify notice id ////
    const { isValid, category, id: noticeId } = verifyId(req.body?.noticeId);
    if (!(isValid && 'notice' === category)) {
        res.status(400).send('Invalid notice id');
        return;
    }

    //// Declare DB client ////
    const atlasDbClient = AtlasDatabaseClient();
    try {
        const { sub: memberId } = token;

        //// Verify member status ////
        const memberComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IMemberComprehensive>('member');
        const memberComprehensiveQueryResult = await memberComprehensiveCollectionClient.findOne({ memberId });
        if (null === memberComprehensiveQueryResult) {
            throw new Error(`Member attempt to delete a notice record but have no document (of IMemberComprehensive, member id: ${memberId}) in [C] memberComprehensive`);
        }

        const { status: memberStatus } = memberComprehensiveQueryResult;
        if (0 > memberStatus) {
            res.status(403).send('Method not allowed due to member suspended or deactivated');
            await atlasDbClient.close();
            return;
        }

        const notificationComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<INotificationComprehensive>('notification');
        const notificationComprehensiveUpdateResult = await notificationComprehensiveCollectionClient.updateOne({ noticeId }, { $set: { status: 0 } });

        if (!notificationComprehensiveUpdateResult.acknowledged) {
            res.status(500).send('Delete notification failed');
        } else {
            //// Response ////
            res.status(200).send('Delete notification success');
        }

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