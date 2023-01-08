import type { NextApiRequest, NextApiResponse } from 'next';
import { MongoError } from 'mongodb';
import { getToken } from 'next-auth/jwt'

import AtlasDatabaseClient from "../../../../modules/AtlasDatabaseClient";

import { INoticeInfo, INotificationStatistics, IMemberStatistics, IAttitudeComprehensive, ICommentComprehensive, IChannelStatistics, ITopicComprehensive, ITopicPostMapping, IPostComprehensive, IMemberComprehensive } from '../../../../lib/interfaces';

import { response405, response500, log } from '../../../../lib/utils';


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
    const { sub: memberId } = token;
    const atlasDbClient = AtlasDatabaseClient();
    try {
        await atlasDbClient.connect();
        const memberComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IMemberComprehensive>('member');
        const memberComprehensiveQueryResult = await memberComprehensiveCollectionClient.findOne({ memberId });
        if (null === memberComprehensiveQueryResult) {
            throw new Error(`Member was trying expressing attitude but have no document (of IMemberComprehensive, member id: ${memberId}) in [C] memberComprehensive`);
        }
        // Step #1.3 verify member status (of IMemberComprehensive)
        const { status: memberStatus } = memberComprehensiveQueryResult;
        if (0 > memberStatus) {
            res.status(403).send('Method not allowed due to member suspended');
            await atlasDbClient.close();
            return;
        }
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


    await atlasDbClient.close();
    res.send('attitude on comment, ok');
}