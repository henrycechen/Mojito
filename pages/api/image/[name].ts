import type { NextApiRequest, NextApiResponse } from 'next';
import AzureBlobClient from '../../../modules/AzureBlobClient';

import { response405, response500 } from '../../../lib/utils';

export default async function Image(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;
    if ('GET' !== method) {
        response405(req, res);
        return;
    }
    const { name } = req.query;
    const contianerClient = AzureBlobClient('image');
    if ('string' !== typeof name || '' === name) {
        res.status(404).send('Image not found');
        return;
    }
    try {
        const imageBlobClient = contianerClient.getBlobClient(name);
        if (await imageBlobClient.exists()) {
            res.setHeader('Content-Type', `image/${name.split('.').pop()}`);
            res.setHeader('Content-Disposition', 'inline');
            res.send(await imageBlobClient.downloadToBuffer());
        } else {
            res.status(404).send('Image not found');
        }
    } catch (e) {
        response500(res, `Attempt to retrieve blob (image). ${e}`);
        return;
    }

}
