import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import busboy from 'busboy';

import AzureBlobClient from '../../../modules/AzureBlobClient';

import { response405, response500 } from '../../../lib/utils';
import { getRandomIdStr } from '../../../lib/utils';

export const config = {
    api: {
        bodyParser: false
    }
}

export default async function Image(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;
    if ('POST' !== method) {
        response405(req, res);
        return;
    }

    //////////////////// fake image upload ///////////////// 
    setTimeout(() => {

        res.status(200).send('fake-upload-image-name.jpeg');

    }, 1000)
    return;

    // Step #0 verify session
    const token = await getToken({ req });
    if (!token) {
        res.status(401).send('Unauthorized');
        return;
    }
    // Step #1 upload image
    try {
        let imageName = getRandomIdStr();
        const contianerClient = AzureBlobClient('image');
        const bb = busboy({ headers: req.headers });
        bb.on('file', async (name, file, info) => {
            const { mimeType } = info;
            let buf = Array<any>();
            imageName = `${imageName}.${mimeType.split('/').pop()}`;
            file
                .on('data', (data) => {
                    buf.push(data);
                })
                .on('close', async () => {
                    const blockClient = contianerClient.getBlockBlobClient(imageName);
                    const id = await blockClient.uploadData(Buffer.concat(buf));
                });
        });
        bb.on('close', () => {
            res.status(200).send(imageName);
            return;
        });
        req.pipe(bb);
    } catch (e) {
        response500(res, `Was try uploading blob (image) ${e}`);
        return;
    }
}