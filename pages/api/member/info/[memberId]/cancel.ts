import type { NextApiRequest, NextApiResponse } from 'next';
import { MongoError } from 'mongodb';
import { getToken } from 'next-auth/jwt';

import AtlasDatabaseClient from "../../../../../modules/AtlasDatabaseClient";

import { IMemberComprehensive } from '../../../../../lib/interfaces/member';
import { response405, response500, logWithDate } from '../../../../../lib/utils/general';
import { verifyId } from '../../../../../lib/utils/verify';

const fnn = `${CancelMembership.name} (API)`;

/**
 * This interface ONLY accepts DELETE requests
 * 
 * Info required for DELETE requests
 * -     token: JWT
 * 
 * Last update:
 * - 19/02/2023 v0.1.1
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
        res.status(401).send('Unauthorized');
        return;
    }

    //// Verify member id ////
    const { isValid, category, id: memberId } = verifyId(req.query?.memberId);
    if (!(isValid && 'member' === category)) {
        res.status(400).send('Invalid member id');
        return;
    }
    
    //// Match the member id in token and the one in request ////
    const { sub: tokenId } = token;
    if (tokenId !== memberId) {
        res.status(400).send('Requested member id and identity not matched');
        return;
    }

    //// Declare DB client ////
    const atlasDbClient = AtlasDatabaseClient();
    try {
        await atlasDbClient.connect();

        //// Verify member status ////
        const memberComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IMemberComprehensive>('member');
        const memberComprehensiveQueryResult = await memberComprehensiveCollectionClient.findOne<IMemberComprehensive>({ memberId });
        if (null === memberComprehensiveQueryResult) {
            throw new Error(`Member attempt to cancel membership but have no document (of IMemberComprehensive, member id: ${memberId}) in [C] memberComprehensive`);
        }

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

        //// Response 200 ////
        res.status(200).send('Cancel success');

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