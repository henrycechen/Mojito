import type { NextApiRequest, NextApiResponse } from 'next';
import { response405 } from '../../../../lib/utils/general';
import AzureBlobClient from '../../../../modules/AzureBlobClient';


/** GetAvatarImageByFullName v0.1.2 (FIXME: Test mode)
 *  
 * Last update 15/02/2023
 * 
 * This interface ONLY accepts GET requests
 * 
 * No info required for this API
 */
const fname = GetAvatarImageByFullName.name;

export default async function GetAvatarImageByFullName(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;
    if ('GET' !== method) {
        response405(req, res);
        return;
    }

    // FIXME: test
    const resp = await fetch(`https://parkers-images.bauersecure.com/wp-images/14418/cut-out/930x620/mazda-mx5-review-cutout-01.jpg`)
    // res.setHeader('Content-Type', `image/png`);
    res.setHeader('Content-Type', `image/jpg`);
    res.setHeader('Content-Disposition', 'inline');
    res.send(Buffer.from(await resp.arrayBuffer()))
    return;

    // const { fullname } = req.query;
    // const contianerClient = AzureBlobClient('avatar');
    // if (!('string' === typeof fullname && new RegExp(/M[A-Z0-9]{8,9}\.png/).test(fullname))) { // v0.1.2 (Add RegExp)
    //     res.status(404).send('Avatar image not found');
    //     return;
    // }
    // try {
    //     const imageBlobClient = contianerClient.getBlobClient(fullname);
    //     if (await imageBlobClient.exists()) {
    //         res.setHeader('Content-Type', `image/png`);
    //         res.setHeader('Content-Disposition', 'inline');
    //         res.send(await imageBlobClient.downloadToBuffer());
    //     } else {
    //         res.status(404).send('Image not found');
    //     }
    // } catch (e) {
    //     response500(res, `${fname}: Attempt to retrieve blob (avatar image, full name: ${fullname}) from Azure blob storage. ${e}`);
    //     return;
    // }
}
