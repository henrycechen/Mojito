import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import { RestError } from '@azure/storage-blob';
import { MongoError } from 'mongodb';

import { logWithDate, response405, response500, verifyId } from '../../../../../lib/utils';
import { IMemberComprehensive } from '../../../../../lib/interfaces/member';
import { INicknameRegistry } from '../../../../../lib/interfaces/registry';

import AtlasDatabaseClient from '../../../../../modules/AtlasDatabaseClient';
import AzureTableClient from '../../../../../modules/AzureTableClient';

/** UpdateGender v0.1.1
 * 
 * Last update: 16/02/2023
 * 
 * This interface ONLY accepts PUT requests
 * 
 * Info required for PUT requests
 * 
 * - token: JWT
 * - gender: number (body, -1 | 0 | 1)
*/


export default async function UpdateGender(req: NextApiRequest, res: NextApiResponse) {

    const { method } = req;
    if ('PUT' !== method) {
        response405(req, res);
        return;
    }

    //// Verify identity ////
    const token = await getToken({ req });
    if (!(token && token?.sub)) {
        res.status(401).send('Unauthorized');
        return;
    }
    const { sub: memberId_ref } = token;

    //// Verify member id ////
    const { isValid, category, id: memberId } = verifyId(req.query?.memberId);

    if (!(isValid && 'member' === category)) {
        res.status(400).send('Invalid member id');
        return;
    }

    //// Match identity id and request member id ////
    if (memberId_ref !== memberId) {
        res.status(400).send('Requested member id and identity not matched');
        return;
    }

    //// Declare DB client ////
    const atlasDbClient = AtlasDatabaseClient();
    try {
        await atlasDbClient.connect();

        //// Verify member status ////
        const memberComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IMemberComprehensive>('member');
        const memberComprehensiveQueryResult = await memberComprehensiveCollectionClient.findOne({ memberId });
        if (null === memberComprehensiveQueryResult) {
            throw new Error(`Member attempt to update (PUT) gender but have no document (of IMemberComprehensive, member id: ${memberId}) in [C] memberComprehensive`);
        }

        const { status: memberStatus } = memberComprehensiveQueryResult;
        if (0 > memberStatus) {
            res.status(403).send('Method not allowed due to member suspended or deactivated');
            await atlasDbClient.close();
            return;
        }

        //// Verify gender ////
        const { gender } = req.body;
        if (!('number' === typeof gender && [-1, 0, 1].includes(gender))) {
            // TODO: Place nickname examination method here
            res.status(400).send('Invalid gender code');
            return;
        }

        //// Update properties (of IMemberComprehensive) in [C] memberComprehensive ////
        const memberComprehensiveUpdateResult = await memberComprehensiveCollectionClient.updateOne({ memberId }, {
            $set: {
                gender,
                lastGenderUpdatedTimeBySecond: Math.floor(new Date().getTime() / 1000)
            }
        })

        if (!memberComprehensiveUpdateResult.acknowledged) {
            logWithDate(`Failed to update gender, lastGenderUpdatedTimeBySecond (of IMemberComprehensive, member id: ${memberId}) in [C] memberComprehensive`);
            res.status(500).send(`Attempt to update gender`);
            return;
        }

        res.status(200).send('Gender updated');
        await atlasDbClient.close();
    } catch (e: any) {
        let msg;
        if (e instanceof RestError) {
            msg = 'Attempt to communicate with azure table storage.';
        } else if (e instanceof MongoError) {
            msg = 'Attempt to communicate with atlas mongodb.';
        } else {
            msg = `Uncategorized. ${e?.msg}`;
        }
        if (!res.headersSent) {
            response500(res, msg);
        }
        logWithDate(msg, e);
        await atlasDbClient.close();
        return;
    }
}