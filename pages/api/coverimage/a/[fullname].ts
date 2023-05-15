import type { NextApiRequest, NextApiResponse } from 'next';
import { response405, response500 } from '../../../../lib/utils/general';
import { verifyId } from '../../../../lib/utils/verify';
import AzureBlobClient from '../../../../modules/AzureBlobClient';

import fs from 'fs';
import path from 'path';

const fnn = `${GetAvatarImageByFullame.name} (API)`;

/**
 * This interface ONLY accepts GET requests
 * 
 * Info required for GET requests
 * -     fullname: string (query)
 * 
 * Last update:
 * - 15/02/2023 v0.1.3
 */

export default async function GetAvatarImageByFullame(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;
    if ('GET' !== method) {
        response405(req, res);
        return;
    }

    const { fullname } = req.query;
    if ('string' !== typeof fullname) {
        res.status(400).send('Invalid cover image fullname');
        return;
    }

    const { isValid, category, id } = verifyId(fullname.split('.')[0]);
    if (!(isValid && 'post' === category)) {
        res.status(400).send('Invalid post id');
        return;
    }

    const contianerClient = AzureBlobClient('cover');
    try {
        const imageBlobClient = contianerClient.getBlobClient(fullname);
        if (await imageBlobClient.exists()) {
            res.setHeader('Content-Type', `image/png`);
            res.setHeader('Content-Disposition', 'inline');
            res.send(await imageBlobClient.downloadToBuffer());
        } else {
            const filePath = path.join(process.cwd(), 'public', 'image-not-found.png'); // v0.1.3 
            const file = await fs.readFileSync(filePath);
            res.setHeader('Content-Type', 'image/jpeg');
            res.send(file);
        }
    } catch (e) {
        response500(res, `${fnn}: Attempt to retrieve blob (avatar image, full name: ${fullname}) from Azure blob storage. ${e}`);
        return;
    }
}
