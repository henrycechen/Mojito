import type { NextApiRequest, NextApiResponse } from 'next';
import { MongoError } from 'mongodb';

import AtlasDatabaseClient from '../../../../modules/AtlasDatabaseClient';

import { logWithDate, response405, response500 } from '../../../../lib/utils/general';
import { IMemberComprehensive } from '../../../../lib/interfaces/member';

const fnn = `${QueryMemberByNicknameBase64Fragment.name} (API)`;

/**
 * This interface ONLY accepts GET requests
 * 
 * Info required for GET requests
 * -     fragment: string (query)
 * 
 * Last update:
 * - 21/02/2023 v0.1.1
*/

export default async function QueryMemberByNicknameBase64Fragment(req: NextApiRequest, res: NextApiResponse) {

    const { method } = req;
    if ('GET' !== method) {
        response405(req, res);
        return;
    }

    const { fragment } = req.query;
    //// Verify notice category ////
    if (!('string' === typeof fragment && new RegExp(/^[-A-Za-z0-9+/]*={0,3}$/).test(fragment))) {
        res.status(400).send('Invalid nickname (fragment) string');
        return;
    }
    //// Declare DB client ////
    const atlasDbClient = AtlasDatabaseClient();
    try {
        const pattern = new RegExp(fragment, 'i');
        const conditions = [{ status: { $gt: 0 } }, { nicknameBase64: { $regex: pattern } }];
        const pipeline = [
            { $match: { $and: conditions } },
            { $limit: 5 },
            { $project: { _id: 0, memberId: 1, nickname: 1 } }
        ];

        const memberComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IMemberComprehensive>('member');
        const memberComprehensiveQuery = memberComprehensiveCollectionClient.aggregate(pipeline);

        //// Response 200 ////
        res.status(200).send(await memberComprehensiveQuery.toArray());

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