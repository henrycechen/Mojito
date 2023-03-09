import type { NextApiRequest, NextApiResponse } from 'next';
import { response405, response500 } from '../../../../lib/utils/general';
import { verifyId } from '../../../../lib/utils/verify';
import AzureBlobClient from '../../../../modules/AzureBlobClient';


/** GetAvatarImageByFullame v0.1.2 (FIXME: Test mode)
 *  
 * Last update 15/02/2023
 * 
 * This interface ONLY accepts GET requests
 * 
 * Info required for GET requests
 * - fullname: string (query)
 */

const fname = GetAvatarImageByFullame.name;

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
            res.status(404).send('Image not found');
        }
    } catch (e) {
        response500(res, `${fname}: Attempt to retrieve blob (avatar image, full name: ${fullname}) from Azure blob storage. ${e}`);
        return;
    }
}
