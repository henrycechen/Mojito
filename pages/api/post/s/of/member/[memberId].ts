import type { NextApiRequest, NextApiResponse } from 'next';
import { RestError } from '@azure/data-tables';
import { MongoError } from 'mongodb';

import AtlasDatabaseClient from "../../../../../../modules/AtlasDatabaseClient";
import { logWithDate, response405, response500 } from '../../../../../../lib/utils/general';
import { verifyId } from '../../../../../../lib/utils/verify';
import { IPostComprehensive } from '../../../../../../lib/interfaces/post';
import { getConciseFromPostComprehensive, getRestrictedFromPostComprehensive } from '../../../../../../lib/utils/for/post';

const fnn = `${GetPostsByMemberId.name} (API)`;

/** 
 * This interface ONLY accepts GET requests
 * 
 * Info required for GET requests
 * -     memberId: string (query)
 * -     channelId: string (query string, optional)
 * -     quantity: number (query string, optional, maximum 20)
 * -     positionId: string (query string, the last post id of the last request, optional)
 * 
 * Last update: 
 * - 21/02/2023 v0.1.1
 * - 09/05/2023 v0.1.2
*/

export default async function GetPostsByMemberId(req: NextApiRequest, res: NextApiResponse) {

    const { method } = req;
    if ('GET' !== method) {
        response405(req, res);
        return;
    }

    // Verify author id
    const { memberId, channelId } = req.query;
    const { isValid, category, id: authorId } = verifyId(memberId);
    if (!(isValid && 'member' === category)) {
        res.status(400).send('Invalid member id');
        return;
    }

    // check channelId

    //// Declare DB client ////
    const atlasDbClient = AtlasDatabaseClient();
    try {

        const arr = [];
        const postComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IPostComprehensive>('post');
        const postComprehensiveQuery = postComprehensiveCollectionClient.find({ memberId, status: { $gte: 200 } });

        while (await postComprehensiveQuery.hasNext()) {
            let postComprehensiveQueryResult = await postComprehensiveQuery.next();
            if (null !== postComprehensiveQueryResult && Object.keys(postComprehensiveQueryResult).length !== 0) {
                arr.push(getConciseFromPostComprehensive(postComprehensiveQueryResult));
            }
        }

        res.status(200).send(arr);
        await atlasDbClient.close();
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
        logWithDate(msg, fnn, e);
        await atlasDbClient.close();
        return;
    }
}