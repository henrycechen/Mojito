import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import { RestError } from '@azure/storage-blob';
import { MongoError } from 'mongodb';

import AtlasDatabaseClient from '../../../../../modules/AtlasDatabaseClient';
import AzureTableClient from '../../../../../modules/AzureTableClient';

import { IMemberComprehensive } from '../../../../../lib/interfaces/member';
import { INicknameRegistry } from '../../../../../lib/interfaces/registry';

import { response405, response500, logWithDate } from '../../../../../lib/utils/general';
import { getTimeBySecond } from '../../../../../lib/utils/create';
import { verifyId } from '../../../../../lib/utils/verify';

const fnn = `${UpdateNickname.name} (API)`;

/**
 * This interface ONLY accepts PUT requests
 * 
 * Info required for PUT requests
 * - token: JWT
 * - alternativeName: string (body, length < 15)
 * 
 * Last update:
 * - 29/04/2023 v0.1.1
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
        const { alternativeName: desiredName } = req.body;
        if (!('string' === typeof desiredName && 15 > desiredName.length)) {
            // TODO: place nickname examination method here

            res.status(409).send('Alternative name exceeds length limit or contains illegal content');
            return;
        }

        const alternativeName = desiredName.trim();

        //// Create Base64 string of alternative name ////
        const nameB64 = Buffer.from(alternativeName).toString('base64');

        //// Look up record (of INicknameRegistry, existance check) in [RL] Registry ////
        const registryTableClient = AzureTableClient('Registry');
        const nicknameRegistryQuery = registryTableClient.listEntities({ queryOptions: { filter: `PartitionKey eq 'nickname' and RowKey eq '${nameB64}' and IsActive eq true` } });
        const nicknameRegistryQueryResult = await nicknameRegistryQuery.next();
        if (!!nicknameRegistryQueryResult.value) {
            res.status(422).send('Alternative name has been occupied');
            return;
        }
        
        //// Look up record (of INicknameRegistry, deactivate the previous record if found) in [RL] Registry ////
        const previousNicknameRegistryQuery = registryTableClient.listEntities({ queryOptions: { filter: `PartitionKey eq 'nickname' and MemberId eq '${memberId}' and IsActive eq true` } });
        const previousNicknameRegistryQueryResult = await previousNicknameRegistryQuery.next();
        if (!!previousNicknameRegistryQueryResult.value) {
            // Deactivate the previous nickname
            const { rowKey, MemberId, Nickname } = previousNicknameRegistryQueryResult.value;
            await registryTableClient.updateEntity<INicknameRegistry>({
                partitionKey: 'nickname',
                rowKey,
                MemberId,
                Nickname,
                IsActive: false
            }, 'Merge');
        }

        //// Upsert record (of INicknameRegistry) in [RL] Registry ////
        await registryTableClient.upsertEntity<INicknameRegistry>({
            partitionKey: 'nickname',
            rowKey: nameB64,
            MemberId: memberId,
            Nickname: alternativeName,
            IsActive: true
        }, 'Replace');

        //// Update properties (of IMemberComprehensive) in [C] memberComprehensive ////
        const memberComprehensiveUpdateResult = await memberComprehensiveCollectionClient.updateOne({ memberId }, {
            $set: {
                nickname: alternativeName,
                nicknameBase64: nameB64,
                lastNicknameUpdatedTimeBySecond: getTimeBySecond()
            }
        });

        if (!memberComprehensiveUpdateResult.acknowledged) {
            logWithDate(`Failed to update nickname, lastNicknameUpdatedTimeBySecond (of IMemberComprehensive, member id: ${memberId}) in [C] memberComprehensive`, fnn);
            res.status(500).send(`Attempt to update nickname`);
            return;
        }

        //// Response 200 ////
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
        logWithDate(msg, fnn, e);
        await atlasDbClient.close();
        return;
    }
}