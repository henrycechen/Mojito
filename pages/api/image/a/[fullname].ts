import type { NextApiRequest, NextApiResponse } from 'next';
import { RestError } from '@azure/storage-blob';

import AzureBlobClient from '../../../../modules/AzureBlobClient';

import { logWithDate, response405, response500 } from '../../../../lib/utils/general';

const fnn = `${GetImageByFullname.name} (API)`;

/**
 * This interface ONLY accepts GET requests
 * 
 * Info required for GET requests
 * -     fullname: string (query)
 * 
 * Last update:
 * - 24/02/2023 v0.1.1
 */

export default async function GetImageByFullname(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;
    if ('GET' !== method) {
        response405(req, res);
        return;
    }

    const { fullname } = req.query;
    const contianerClient = AzureBlobClient('image');
    if ('string' !== typeof fullname || '' === fullname) {
        res.status(404).send('Image not found');
        return;
    }
    try {
        const imageBlobClient = contianerClient.getBlobClient(fullname);
        if (await imageBlobClient.exists()) {
            res.setHeader('Content-Type', `image/${fullname.split('.').pop()}`);
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
        response500(res, `Attempt to retrieve blob (image, full name: ${fullname}) from Azure blob storage. ${e}`);
        logWithDate(msg, fnn, e);
        return;
    }
}
