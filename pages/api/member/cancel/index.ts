import type { NextApiRequest, NextApiResponse } from 'next';
import { MongoError } from 'mongodb';
import { getToken } from 'next-auth/jwt'

import AtlasDatabaseClient from "../../../../modules/AtlasDatabaseClient";

import { INoticeInfo, INotificationStatistics, IMemberStatistics, IAttitudeComprehensive, ICommentComprehensive, IChannelStatistics, ITopicComprehensive, ITopicPostMapping, IPostComprehensive, IMemberComprehensive } from '../../../../lib/interfaces';

import { response405, response500, log } from '../../../../lib/utils';

/** This interface ONLY accepts DELETE requests
 * 
 * Info required for POST requests
 * token: JWT
*/

export default async function CancelMembership(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;
    if ('DELETE' !== method) {
        response405(req, res);
        return;
    }
    //// Verify identity ////
    const token = await getToken({ req });
    if (!(token && token?.sub)) {
        res.status(400).send('Invalid identity');
        return;
    }
    //// Declare DB client ////
    const atlasDbClient = AtlasDatabaseClient();
    try {
        const { sub: memberId } = token;
        await atlasDbClient.connect();
        const memberComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IMemberComprehensive>('member');
        const memberComprehensiveQueryResult = await memberComprehensiveCollectionClient.findOne<IMemberComprehensive>({ memberId });
        if (null === memberComprehensiveQueryResult) {
            throw new Error(`Member was trying cancel membership but have no document (of IMemberComprehensive, member id: ${memberId}) in [C] memberComprehensive`);
        }
        // Step #1 verify member status (of IMemberComprehensive)
        const { status: memberStatus } = memberComprehensiveQueryResult;
        if (0 > memberStatus) {
            res.status(403).send('Method not allowed due to member suspended or deactivated');
            await atlasDbClient.close();
            return;
        }
        const memberComprehensiveUpdateResult = await memberComprehensiveCollectionClient.updateOne({ memberId }, { $set: { status: -1 } });
        if (!memberComprehensiveUpdateResult.acknowledged) {
            res.status(500).send('Cancel insuccess');
        }
        res.status(200).send('Cancel success')
    } catch (e: any) {
        let msg;
        if (e instanceof MongoError) {
            msg = 'Was trying communicating with atlas mongodb.';
        } else {
            msg = `Uncategorized. ${e?.msg}`;
        }
        if (!res.headersSent) {
            response500(res, msg);
        }
        log(msg, e);
        await atlasDbClient.close();
        return;
    }
}