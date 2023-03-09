import type { NextApiRequest, NextApiResponse } from 'next';
import AzureBlobClient from '../../../../modules/AzureBlobClient';

import { response405, response500 } from '../../../../lib/utils/general';

/** GetImageByFullname v0.1.1 FIXME: test mode
 * 
 * Last update: 24/02/2023
 * 
 * This interface ONLY accepts GET requests
 * 
 * Info required for GET requests
 * - fullname: string (query)
 */

const fname = GetImageByFullname.name;

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
    } catch (e) {
        response500(res, `Attempt to retrieve blob (image). ${e}`);
        return;
    }

}
