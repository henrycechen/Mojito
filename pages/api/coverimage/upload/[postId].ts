import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import { RestError } from '@azure/storage-blob';
import CryptoJS from 'crypto-js';

import busboy from 'busboy';
import Jimp from 'jimp';

import AzureBlobClient from '../../../../modules/AzureBlobClient';
import AtlasDatabaseClient from '../../../../modules/AtlasDatabaseClient';

import { IPostComprehensive } from '../../../../lib/interfaces/post';
import { IMemberComprehensive } from '../../../../lib/interfaces/member';
import { logWithDate, response405, response500 } from '../../../../lib/utils/general';
import { verifyId } from '../../../../lib/utils/verify';
import { getTimeBySecond } from '../../../../lib/utils/create';
import { TUploadImageRequestInfo } from '../../../../lib/types';

export const config = {
    api: {
        bodyParser: false
    }
};
const appSecret = process.env.APP_AES_SECRET ?? '';
const fname = `${CoverImageUpload.name} (API)`;

/** CoverImageUpload v0.1.1 FIXME: test mode
 * 
 * Last update: 3/3/2023
 * 
 * This interface ONLY accepts POST requests
 * 
 * Info required for POST requests
 * - token: JWT
 * - requestInfo (token): string (query)
 * - file: formdata
 * 
 */

export default async function CoverImageUpload(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;
    if ('POST' !== method) {
        response405(req, res);
        return;
    }

    //// Verify identity ////
    const token = await getToken({ req });
    if (!(token && token?.sub)) {
        res.status(401).send('Unauthorized');
        return;
    }
    const { sub: tokenId } = token;

    //// Verify postId ////
    const { isValid, category, id: postId } = verifyId(req.query?.postId);
    if (!(isValid && 'post' === category)) {
        res.status(400).send('Invalid post id');
        return;
    }

    //// Verify request info (token) ////
    const { requestInfo } = req.query;
    if ('string' !== typeof requestInfo) {
        res.status(403).send('Invalid request info');
        return;
    }

    //// Declare DB client ////
    const atlasDbClient = AtlasDatabaseClient();
    try {
        await atlasDbClient.connect();

        const tkn = CryptoJS.AES.decrypt(Buffer.from(requestInfo, 'base64').toString(), appSecret).toString(CryptoJS.enc.Utf8);
        // [!] attemp to parse JSON string makes the probability of causing SyntaxError
        const info = JSON.parse(tkn);

        //// Match member id in token and the one in request ////
        if (tokenId !== info.memberId) {
            res.status(403).send('Requested member id and identity not matched');
            return;
        }

        //// Verify expire date ////
        if ('number' !== typeof info.expireDateBySecond) {
            res.status(400).send('Invalid expire date (by second)');
            return;
        } else {
            const diff = getTimeBySecond() - info.expireDateBySecond;
            if (diff > 0) {
                res.status(400).send('Request info (token) expired');
                return;
            }
        }

        //// Upload image asynchronously ////
        await uploadAsync(req, postId);

        //// Renew request info ////
        const updated: TUploadImageRequestInfo = {
            memberId: tokenId,
            postId: info.postId,
            remainingUploads: info.remainingUploads--,
            expireDateBySecond: getTimeBySecond() + 60,
        };

        const _tkn = Buffer.from(CryptoJS.AES.encrypt(JSON.stringify(updated), appSecret).toString()).toString('base64');

        const reply = {
            updatedRequestInfoToken: _tkn
        };

        //// Response 200 ////
        res.status(200).send(reply);
        return;

    } catch (e: any) {
        let msg;
        if (e instanceof RestError) {
            msg = `Attempt to communicate with azure blob storage.`;
        } else if (e instanceof SyntaxError) {
            msg = `Attempt to parse stringified request info.`;
        } else {
            msg = `Uncategorized. ${e}`;
        }
        if (!res.headersSent) {
            response500(res, msg);
        }
        logWithDate(msg, fname, e);
        await atlasDbClient.close();
        return;
    }
}

const uploadAsync = (req: NextApiRequest, postId: string) => {
    return new Promise<void>((resolve, reject) => {

        let imageFullname = `${postId}.jpeg`;
        const bb = busboy({ headers: req.headers });
        const contianerClient = AzureBlobClient('cover'); // [!] "cover"
        bb.on('file', async (name, file, info) => {
            let arrBuf = Array<any>();
            let { mimeType } = info;
            // if ('image/jpeg' !== mimeType) {
            //     reject(`Attemp to upload cover image in unsupported type.`);
            // }
            file
                .on('data', (data) => {
                    arrBuf.push(data);
                })
                .on('close', async () => {
                    const initialBuf = Buffer.concat(arrBuf);

                    if (initialBuf.byteLength > 102400) { // Cover image no larger than 100 KB
                        reject(`Attempt to upload image file that exceeds size limit. {${initialBuf.byteLength}}`);
                    }
                    try {
                        const blockClient = contianerClient.getBlockBlobClient(imageFullname);
                        const image = await Jimp.read(initialBuf);
                        const convertedBuf = await image.getBufferAsync(Jimp.MIME_JPEG);

                        if (await blockClient.uploadData(convertedBuf)) {
                            resolve();
                        } else {
                            reject(`Attemp to upload cover image file to Azure blob storage.`);
                        }
                    } catch (e) {
                        reject(e);
                    }
                });
        });
        // bb.on('close', () => {
        //     resolve();
        // });
        bb.on('error', (e) => {
            reject(e);
        });

        //// Read file from request ////
        req.pipe(bb);
    });
};