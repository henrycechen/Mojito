import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import { RestError } from '@azure/storage-blob';
import { MongoError } from 'mongodb';

import busboy from 'busboy';
import Jimp from 'jimp';

import AzureBlobClient from '../../../../../modules/AzureBlobClient';

import { logWithDate, response405, response500, verifyId } from '../../../../../lib/utils';
import AtlasDatabaseClient from '../../../../../modules/AtlasDatabaseClient';
import { IMemberComprehensive } from '../../../../../lib/interfaces';
import AzureTableClient from '../../../../../modules/AzureTableClient';

export const config = {
    api: {
        bodyParser: false
    }
}

/** AvatarImageUpload v0.1.2
 * 
 * Last update: 15/02/2023
 * 
 * This interface accepts GET and PUT requests
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
        //// Update nickname ////


        const noticeTableClient = AzureTableClient('Registry');
        await noticeTableClient.updateEntity<IMemberPostMapping>({ partitionKey: memberId, rowKey: postId, IsActive: false }, 'Merge');





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