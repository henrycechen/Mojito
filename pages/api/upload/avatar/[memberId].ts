import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import { RestError } from '@azure/storage-blob';
import { MongoError } from 'mongodb';

import busboy from 'busboy';
import Jimp from 'jimp';

import AzureBlobClient from '../../../../modules/AzureBlobClient';
import AtlasDatabaseClient from '../../../../modules/AtlasDatabaseClient';

import { getTimeBySecond } from '../../../../lib/utils/create';
import { logWithDate, response405, response500 } from '../../../../lib/utils/general';
import { verifyId } from '../../../../lib/utils/verify';

export const config = {
    api: {
        bodyParser: false
    }
};

const fnn = `${UploadAvatarImage.name} (API)`;

/**
 * This interface ONLY accepts POST requests
 * 
 * Info required for POST requests
 * - token: JWT
 * - file: image file (form)
 * 
 * Last update:
 * - 15/02/2023 v0.1.2
 * - 21/05/2023 v0.1.3 All avatar images now use JPEG
*/

export default async function UploadAvatarImage(req: NextApiRequest, res: NextApiResponse) {
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
    
    //// Verify member id ////
    const { isValid, category, id: memberId } = verifyId(req.query?.memberId);
    if (!(isValid && 'member' === category)) {
        res.status(400).send('Invalid member id');
        return;
    }
    
    //// Match member id in token and the one in request ////
    const { sub: tokenId } = token;
    if (tokenId !== memberId) {
        res.status(400).send('Requested member id and identity not matched');
        return;
    }

    //// Declare DB client ////
    const atlasDbClient = AtlasDatabaseClient();
    try {
        await atlasDbClient.connect();

        //// Verify member status ////
        const memberComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection('member');
        const memberComprehensiveQueryResult = await memberComprehensiveCollectionClient.findOne({ memberId }, { projection: { _id: 0, status: 1 } });
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
            $set: { lastAvatarImageUpdatedTimeBySecond: getTimeBySecond() }
        });
        if (!memberComprehensiveUpdateResult.acknowledged) {
            logWithDate(`Failed to update lastAvatarImageUpdatedTimeBySecond (of IMemberComprehensive, member id: ${memberId}) in [C] memberComprehensive`, fnn);
        }

        //// Response 200 ////
        res.status(200).end();

        await atlasDbClient.close();
        return;
    } catch (e: any) {
        let msg;
        if (e instanceof RestError) {
            msg = `Attempt to communicate with azure table storage.`;
        } else if (e instanceof MongoError) {
            msg = `Attempt to communicate with atlas mongodb.`;
        } else {
            msg = `Uncategorized. ${e?.msg}`;
        }
        if (!res.headersSent) {
            response500(res, msg);
        }
        logWithDate(msg, fnn, e);
        await atlasDbClient.close();
        return;
    }
}

const uploadAsync = (req: NextApiRequest, memberId: string) => {
    return new Promise<void>((resolve, reject) => {
        let imageFullName = `${memberId}.jpeg`;
        const bb = busboy({ headers: req.headers });
        const contianerClient = AzureBlobClient('avatar'); // [!] "avatar"
        bb.on('file', async (name, file, info) => {
            let arrBuf = Array<any>();
            file
                .on('data', (data) => {
                    arrBuf.push(data);
                })
                .on('close', async () => {
                    const initialBuf = Buffer.concat(arrBuf);

                    try {
                        const image = await Jimp.read(initialBuf);

                        // Corp and resize the image
                        if (!(100 === image.bitmap.width && 100 === image.bitmap.height)) {
                            let size, cropX, cropY; // v0.1.2 Add sizing function

                            if (image.bitmap.width > image.bitmap.height) {
                                size = image.bitmap.height;
                                cropX = Math.round((image.bitmap.width - image.bitmap.height) / 2);
                                cropY = 0;
                            } else {
                                size = image.bitmap.width;
                                cropX = 0;
                                cropY = Math.round((image.bitmap.height - image.bitmap.width) / 2);
                            }

                            image.crop(cropX, cropY, size, size);
                            image.resize(100, 100);
                        }

                        // Drop the quality
                        if (102400 < initialBuf.byteLength) {
                            image.quality(85);
                        }

                        // Output to buffer
                        const convertedBuf = await image.getBufferAsync(Jimp.MIME_JPEG);
                        const blockClient = contianerClient.getBlockBlobClient(imageFullName);
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