import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import { RestError } from '@azure/storage-blob';
import { MongoError } from 'mongodb';

import { logWithDate, response405, response500, verifyId } from '../../../../../lib/utils';
import { IMemberComprehensive } from '../../../../../lib/interfaces/member';
import { INicknameRegistry } from '../../../../../lib/interfaces/registry';

import AtlasDatabaseClient from '../../../../../modules/AtlasDatabaseClient';
import AzureTableClient from '../../../../../modules/AzureTableClient';

/** UpdateNickname v0.1.2
 * 
 * Last update: 15/02/2023
 * 
 * This interface ONLY accepts PUT requests
 * 
 * Info required for POST requests
 * 
 * - token: JWT
 * - file: image file (form)
*/


export default async function UpdateNickname(req: NextApiRequest, res: NextApiResponse) {
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
            throw new Error(`Member attempt to upload avatar image but have no document (of IMemberComprehensive, member id: ${memberId}) in [C] memberComprehensive`);
        }

        const { status: memberStatus } = memberComprehensiveQueryResult;
        if (0 > memberStatus) {
            res.status(403).send('Method not allowed due to member suspended or deactivated');
            await atlasDbClient.close();
            return;
        }

        //// Verify alternative name ////
        const { alternativeName } = req.body;
        if (!('string' === typeof alternativeName && 13 > alternativeName.length)) {
            // TODO: Place nickname examination method here
            console.log(alternativeName);

            res.status(409).send('Alternative name exceeds length limit or has been occupied');
            return;
        }

        //// Create Base64 string of alternative name ////
        const nameB64 = Buffer.from(alternativeName).toString('base64');

        //// Look up record (of INicknameRegistry) in [RL] Registry ////
        const registryTableClient = AzureTableClient('Registry');
        const nicknameRegistryQuery = registryTableClient.listEntities({ queryOptions: { filter: `PartitionKey eq 'nickname' and RowKey eq '${nameB64}' and IsActive eq true` } });
        const nicknameRegistryQueryResult = await nicknameRegistryQuery.next();
        if (!!nicknameRegistryQueryResult.value) {
            res.status(422).send('Alternative name exceeds length limit or has been occupied');
            return;
        }

        //// Upsert record (of INicknameRegistry) in [RL] Registry ////
        await registryTableClient.upsertEntity<INicknameRegistry>({
            partitionKey: 'nickname',
            rowKey: nameB64,
            MemberId: memberId,
            Nickname: alternativeName,
            IsActive: true
        }, 'Replace')

        //// Update properties (of IMemberComprehensive) in [C] memberComprehensive ////
        const memberComprehensiveUpdateResult = await memberComprehensiveCollectionClient.updateOne({ memberId }, {
            $set: {
                nickname: alternativeName,
                lastNicknameUpdatedTimeBySecond: Math.floor(new Date().getTime() / 1000)
            }
        })

        if (!memberComprehensiveUpdateResult.acknowledged) {
            logWithDate(`Failed to update total nickname, lastNicknameUpdatedTimeBySecond (of IMemberComprehensive, member id: ${memberId}) in [C] memberComprehensive`);
            res.status(500).send(`Attempt to update nickname`);
            return;
        }

        res.status(200).send('Nickname updated');
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