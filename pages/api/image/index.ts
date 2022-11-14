import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import busboy from 'busboy';

import AzureBlobClient from '../../../modules/AzureBlobClient';

import { response405 } from '../../../lib/utils';
import { getRandomLongStr } from '../../../lib/utils';

export const config = {
    api: {
        bodyParser: false
    }
}

export default async function Image(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;
    if ('GET' === method) {
        return;
    }
    if ('POST' === method) {
        // const token = await getToken({ req });
        // // Step #0 verify session
        // if (!token) {
        //     res.status(401).send('Unauthorized');
        //     return;
        // }

        const imageName = getRandomLongStr();
        const contianerClient = AzureBlobClient('image');
        const bb = busboy({ headers: req.headers });
        bb.on('file', async (name, file, info) => {
            // TODO: 
            // 1. create a new file name for photo
            // 2. record encoding info
            // 3. record mimeType for display photo
            const { filename, encoding, mimeType } = info;
            console.log(
                `File [${name}]: filename: %j, encoding: %j, mimeType: %j`,
                filename,
                encoding,
                mimeType
            );
            let buf = Array<any>();
            const imageExtension = mimeType.split('/').pop();
            file
                .on('data', (data) => {
                    buf.push(data);
                })
                .on('close', async () => {
                    const blockClient = contianerClient.getBlockBlobClient(`${imageName}.${imageExtension}`);
                    const id = await blockClient.uploadData(Buffer.concat(buf));
                    console.log(`File [${name}] done`);
                    console.log(`Upload-Id: ${id}`);
                });
        });
        bb.on('field', (name, val, info) => {
            console.log(`Field [${name}]: value: %j`, val);
        });

        bb.on('close', () => {
            console.log('Done parsing form!');
            // res.writeHead(303, { Connection: 'close', Location: '/' });
            // res.end();
            res.status(200).send(imageName);
        });
        req.pipe(bb);
        return;
    }
    response405(req, res);
}