import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt'
import { RestError } from '@azure/data-tables';
import { MongoError } from 'mongodb';

import AzureTableClient from '../../../../../../modules/AzureTableClient';
import AtlasDatabaseClient from "../../../../../../modules/AtlasDatabaseClient";

import { IMemberPostMapping, } from '../../../../../../lib/interfaces/mapping';
import { IMemberComprehensive, } from '../../../../../../lib/interfaces/member';
import { logWithDate, response405, response500 } from '../../../../../../lib/utils/general';
import { verifyId } from '../../../../../../lib/utils/verify';

const fname = DeleteBrowsingHistoryById.name;

/** DeleteBrowsingHistoryById v0.1.1
 * 
 * Last update: 21/02/2023
 * 
 * This interface ONLY accepts DELETE requests
 * 
 * Info required for DELETE requests
 * - token: JWT
 * - postId: string (query)
*/

export default async function DeleteBrowsingHistoryById(req: NextApiRequest, res: NextApiResponse) {

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

    // Verify post id
    const { isValid, category, id: postId } = verifyId(req.query?.postId);
    if (!(isValid && 'post' === category)) {
        res.status(400).send('Invalid post id');
        return;
    }

    //// Declare DB client ////
    const atlasDbClient = AtlasDatabaseClient();
    try {
        await atlasDbClient.connect();

        //// Verify member status ////
        const memberComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IMemberComprehensive>('member');
        const memberComprehensiveQueryResult = await memberComprehensiveCollectionClient.findOne({ memberId }, { projection: { _id: 0, status: 1 } });
        if (null === memberComprehensiveQueryResult) {
            throw new Error(`Member attempt to delete browsing history record but have no document (of IMemberComprehensive, member id: ${memberId}) in [C] memberComprehensive`);
        }
        const { status: memberStatus } = memberComprehensiveQueryResult;
        if (0 > memberStatus) {
            res.status(403).send('Method not allowed due to member suspended or deactivated');
            await atlasDbClient.close();
            return;
        }
        await atlasDbClient.close();

        //// Update (delete) record (of IMemberPostMapping) in [RL] HistoryMapping ////
        const noticeTableClient = AzureTableClient('HistoryMapping');
        await noticeTableClient.updateEntity({
            partitionKey: memberId,
            rowKey: postId,
            IsActive: false
        }, 'Merge');
        res.status(200).send('Delete browsing history success');
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