import type { NextApiRequest, NextApiResponse } from 'next';
import { RestError } from '@azure/storage-blob';

import AzureBlobClient from '../../../../modules/AzureBlobClient';

import { logWithDate, response405, response500 } from '../../../../lib/utils/general';

/**
 * This interface ONLY accepts GET requests
 * 
 * No info required for this API
 * 
 * Last update:
 * - 28/04/2023 v0.1.2
 */

const fnn = `${GetAvatarImageByFullName.name} (API)`;

export default async function GetAvatarImageByFullName(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;
    if ('GET' !== method) {
        response405(req, res);
        return;
    }

    const { fullname } = req.query;
    const contianerClient = AzureBlobClient('avatar');
    if (!('string' === typeof fullname && new RegExp(/M[A-Z0-9]{8,9}\.png/).test(fullname))) { // v0.1.2 (Add RegExp)
        res.status(404).send('Avatar image not found');
        return;
    }

    try {
        const imageBlobClient = contianerClient.getBlobClient(fullname);
        if (await imageBlobClient.exists()) {
            res.setHeader('Content-Type', `image/png`);
            res.setHeader('Content-Disposition', 'inline');
            res.send(await imageBlobClient.downloadToBuffer());
        } else {
            res.status(404).send('Image not found');
        }
    } catch (e: any) {
        let msg;
        if (e instanceof RestError) {
            msg = `Attempt to communicate with azure blob storage.`;
        } else {
            msg = `Uncategorized. ${e?.msg}`;
        }
        if (!res.headersSent) {
            response500(res, msg);
        }
        response500(res, `${fnn}: Attempt to retrieve blob (avatar image, full name: ${fullname}) from Azure blob storage. ${e}`);
        logWithDate(msg, fnn, e);
        return;
    }
}
