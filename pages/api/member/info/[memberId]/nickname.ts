import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import { RestError } from '@azure/storage-blob';
import { MongoError } from 'mongodb';

import AtlasDatabaseClient from '../../../../../modules/AtlasDatabaseClient';
import AzureTableClient from '../../../../../modules/AzureTableClient';

import { IMemberComprehensive } from '../../../../../lib/interfaces/member';
import { INicknameRegistry } from '../../../../../lib/interfaces/registry';
import { response405, response500, logWithDate } from '../../../../../lib/utils/general';
import { verifyId } from '../../../../../lib/utils/verify';

const fname = UpdateNickname.name;

/** UpdateNickname v0.1.1
 * 
 * Last update: 16/02/2023
 * 
 * This interface ONLY accepts PUT requests
 * 
 * Info required for PUT requests
 * - token: JWT
 * - alternativeName: string (body, length < 13)
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
    const { sub: tokenId } = token;

    //// Verify member id ////
    const { isValid, category, id: memberId } = verifyId(req.query?.memberId);

    if (!(isValid && 'member' === category)) {
        res.status(400).send('Invalid member id');
        return;
    }

    //// Match the member id in token and the one in request ////
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
        const memberComprehensiveQueryResult = await memberComprehensiveCollectionClient.findOne({ memberId }, { projection: { _id: 0, status: 1 } });;
        if (null === memberComprehensiveQueryResult) {
            throw new Error(`Member attempt to update nickname but have no document (of IMemberComprehensive, member id: ${memberId}) in [C] memberComprehensive`);
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
            // TODO: place nickname examination method here
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
            logWithDate(`Failed to update nickname, lastNicknameUpdatedTimeBySecond (of IMemberComprehensive, member id: ${memberId}) in [C] memberComprehensive`, fname);
            res.status(500).send(`Attempt to update nickname`);
            return;
        }

        res.status(200).send('Nickname updated');
        await atlasDbClient.close();
        return;
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