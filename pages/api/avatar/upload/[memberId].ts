import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import { RestError } from '@azure/storage-blob';
import { MongoError } from 'mongodb';

import busboy from 'busboy';
import Jimp from 'jimp';

import AzureBlobClient from '../../../../modules/AzureBlobClient';

import { logWithDate, response405, response500, verifyId } from '../../../../lib/utils';
import AtlasDatabaseClient from '../../../../modules/AtlasDatabaseClient';
import { IMemberComprehensive } from '../../../../lib/interfaces';

export const config = {
    api: {
        bodyParser: false
    }
}

/** AvatarImageUpload v0.1.2
 * 
 * Last update: 15/02/2023
 * 
 * This interface ONLY accepts POST requests
 * 
 * Info required for POST requests
 * 
 * - token: JWT
 * - file: image file (form)
*/

export default async function AvatarImageUpload(req: NextApiRequest, res: NextApiResponse) {
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
    const { sub: memberId_ref } = token;

    //// Verify member id ////
    const { isValid, category, id: memberId } = verifyId(req.query?.memberId);

    if (!(isValid && 'member' === category)) {
        res.status(400).send('Invalid member id');
        return;
    }

    //// Match identity id and request member id ////
    if (memberId_ref !== memberId) {
        res.status(400).send('Requested member id and identity not matched');
        return;
    }

    //// Declare DB client ////
    const atlasDbClient = AtlasDatabaseClient();
    try {
        //// Verify member status ////
        const memberComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IMemberComprehensive>('member');
        const memberComprehensiveQueryResult = await memberComprehensiveCollectionClient.findOne({ memberId });
        if (null === memberComprehensiveQueryResult) {
            throw new Error(`Member attempt to upload avatar image but have no document (of IMemberComprehensive, member id: ${memberId}) in [C] memberComprehensive`);
        }
        const { status: memberStatus } = memberComprehensiveQueryResult;

        if (0 > memberStatus) {
            res.status(403).send('Method not allowed due to member suspended or deactivated');
            await atlasDbClient.close();
            return;
        }
        //// Upload image asynchronously ////
        await uploadAsync(req, memberId);

        //// Update member info ////
        const memberComprehensiveUpdateResult = await memberComprehensiveCollectionClient.updateOne({ memberId }, {
            $set: { lastAvatarImageUpdatedTimeBySeconds: Math.floor(new Date().getTime() / 1000) }
        })
        if (!memberComprehensiveUpdateResult.acknowledged) {
            logWithDate(`Failed to update avatarImageFullName (of IMemberComprehensive, member id: ${memberId}) in [C] memberComprehensive`);
            res.status(500).send(`Failed to update avatar image full name`);
        } else {
            res.status(200).end();
        }
        await atlasDbClient.close();
    } catch (e: any) {
        let msg;
        if (e instanceof RestError) {
            msg = 'Attempt to communicate with azure table storage.';
        } else if (e instanceof MongoError) {
            msg = 'Attempt to communicate with atlas mongodb.';
        } else {
            msg = `Uncategorized. ${e?.msg}`;
        }
        if (!res.headersSent) {
            response500(res, msg);
        }
        logWithDate(msg, e);
        await atlasDbClient.close();
        return;
    }
}

const uploadAsync = (req: NextApiRequest, memberId: string) => {
    return new Promise<void>((resolve, reject) => {
        let imageFullName = `${memberId}.png`;
        const bb = busboy({ headers: req.headers });
        const contianerClient = AzureBlobClient('avatar');
        bb.on('file', async (name, file, info) => {
            let arrBuf = Array<any>();
            file
                .on('data', (data) => {
                    arrBuf.push(data);
                })
                .on('close', async () => {
                    const blockClient = contianerClient.getBlockBlobClient(imageFullName);
                    const initialBuf = Buffer.concat(arrBuf)
                    if (initialBuf.byteLength > 2097152) {
                        reject(new Error(`Attempt to upload avatar image file that exceeds size limit.`))
                    }
                    try {
                        let size, resize, cropX, cropY; // v0.1.2 Add sizing function

                        const image = await Jimp.read(initialBuf);
                        if (image.bitmap.width > image.bitmap.height) {
                            size = image.bitmap.height;
                            cropX = Math.round((image.bitmap.width - image.bitmap.height) / 2);
                            cropY = 0;
                        } else {
                            size = image.bitmap.width;
                            cropX = 0;
                            cropY = Math.round((image.bitmap.height - image.bitmap.width) / 2);
                        }
                        if (50 > size) {
                            resize = 50;
                        } else if (500 < size) {
                            resize = 500;
                        } else {
                            resize = size
                        }

                        image.crop(cropX, cropY, size, size).resize(resize, resize);
                        const convertedBuf = await image.getBufferAsync(Jimp.MIME_PNG);

                        if (await blockClient.uploadData(convertedBuf)) {
                            resolve();
                        } else {
                            reject(`Attemp to upload avatar image file to Azure blob storage.`);
                        }
                    } catch (e) {
                        reject(e);
                    }
                });
        });
        bb.on('close', () => {
            resolve();
        });
        bb.on('error', (e) => {
            reject(e);
        });
        //// Read file from request ////
        req.pipe(bb);
    })
};