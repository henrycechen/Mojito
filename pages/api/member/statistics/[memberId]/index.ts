import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt'
import { RestError } from '@azure/data-tables';
import { MongoError } from 'mongodb';

import AzureTableClient from '../../../../../modules/AzureTableClient';
import AtlasDatabaseClient from "../../../../../modules/AtlasDatabaseClient";



import { IConciseMemberStatistics } from '../../../../../lib/interfaces/member';
import { response405, response500, logWithDate } from '../../../../../lib/utils/general';

const fname = GetMemberStatisticsById.name;

/** GetMemberStatisticsById v0.1.1 FIXME: test mode
 * 
 * Last update:
 * 
 * 
 * This interface ONLY accepts GET requests
 * 
 * Info required for GET requests
 * - memberId: string (query, member id)
*/

export default async function GetMemberStatisticsById(req: NextApiRequest, res: NextApiResponse) {


    res.send({
        totalCreationCount: 4,
        totalFollowedByCount: 18,
        totalCreationSavedCount: 127,
        totalCreationLikedCount: 335,
    });
    return;




    const { method } = req;
    if ('GET' !== method) {
        response405(req, res);
        return;
    }

    // GET | statistics


    try {

        const statistics: IConciseMemberStatistics = {
            memberId: 'M1234ABCD',
            totalCreationCount: 23,
            totalCreationLikedCount: 101,
            totalFollowedByCount: 16
        }

        res.send(statistics);
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
        // await atlasDbClient.close();
        return;
    }
}