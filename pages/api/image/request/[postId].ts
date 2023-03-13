import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import { MongoError } from 'mongodb';
import CryptoJS from 'crypto-js';

import AtlasDatabaseClient from '../../../../modules/AtlasDatabaseClient';

import { logWithDate, response405, response500 } from '../../../../lib/utils/general';
import { IMemberComprehensive } from '../../../../lib/interfaces/member';
import { TUploadImageRequestInfo } from '../../../../lib/types';
import { getTimeBySecond } from '../../../../lib/utils/create';
import { IPostComprehensive } from '../../../../lib/interfaces/post';
import { verifyId } from '../../../../lib/utils/verify';

const appSecret = process.env.APP_AES_SECRET ?? '';
const fname = RequestImageUpload.name;

/** RequestImageUpload v0.1.1
 * 
 * Last update: 3/3/2023
 * 
 * This interface ONLY accepts GET requests
 * 
 * Info required for GET requests
 * - token: JWT
 * - postId: string (query string)
 * 
 * Info will be returned for GET requests
 * - requestInfo: string
 */

export default async function RequestImageUpload(req: NextApiRequest, res: NextApiResponse) {

    const { method } = req;
    if ('GET' !== method) {
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

    //// Declare DB client ////
    const atlasDbClient = AtlasDatabaseClient();
    try {

        //// Verify member status ////
        const memberComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IMemberComprehensive>('member');
        const memberComprehensiveQueryResult = await memberComprehensiveCollectionClient.findOne({ memberId: tokenId }, { projection: { _id: 0, status: 1, allowPosting: 1, lastUploadImageRequestTimeBySecond: 1 } });
        if (null === memberComprehensiveQueryResult) {
            throw new Error(`Member attempt to request image-upload token but have no document (of IMemberComprehensive, member id: ${tokenId}) in [C] memberComprehensive`);
        }
        const { status: memberStatus, allowPosting, lastUploadImageRequestTimeBySecond } = memberComprehensiveQueryResult;

        if (!(0 < memberStatus && allowPosting)) {
            res.status(403).send('Method not allowed due to member suspended or deactivated');
            await atlasDbClient.close();
            return;
        }

        const now = getTimeBySecond();
        if (15 > (now - lastUploadImageRequestTimeBySecond)) { // time difference no greater than 15 seconds
            res.status(403).send('Method not allowed due to frequent request for upload image');
            await atlasDbClient.close();
            return;
        }

        //// Verify post status ////
        const postComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IPostComprehensive>('post');
        const postComprehensiveQueryResult = await postComprehensiveCollectionClient.findOne({ postId }, { projection: { _id: 0, imageFullnamesArr: 1, status: 1, allowEditing: 1 } });
        if (null === postComprehensiveQueryResult) {
            res.status(403).send('Method not allowed due to post not found');
            await atlasDbClient.close();
            return;
        }

        const { status: postStatus, allowEditing, imageFullnamesArr } = postComprehensiveQueryResult;
        if (!([1, 200].includes(postStatus) && allowEditing)) { // 1: initiated, 200: normal (allow to edit)
            res.status(403).send('Method not allowed due to restriced post status or management');
            await atlasDbClient.close();
            return;
        }

        let remainingUploads: number;
        if (1 === postStatus) {
            remainingUploads = 10;
        } else {
            remainingUploads = 10 - imageFullnamesArr.length;;
        }

        //// Update member management ////
        const memberComprehensiveUpdateResult = await memberComprehensiveCollectionClient.updateOne({ memberId: tokenId }, { $set: { lastUploadImageRequestTimeBySecond: now } });
        if (!memberComprehensiveUpdateResult.acknowledged) {
            res.status(500).send(`Attempt to update member comprehensive`);
            await atlasDbClient.close();
            return;
        }

        //// Create token (request info) ////
        const info: TUploadImageRequestInfo = {
            memberId: tokenId,
            postId,
            remainingUploads,
            expireDateBySecond: getTimeBySecond() + 60 // valid for 1 minutes
        };

        //// Encrypt token (request info) ////
        const tkn = Buffer.from(CryptoJS.AES.encrypt(JSON.stringify(info), appSecret).toString()).toString('base64');
        res.status(200).send(tkn);

        await atlasDbClient.close();
        return;
    } catch (e: any) {
        let msg;
        if (e instanceof MongoError) {
            msg = `Attempt to communicate with atlas mongodb.`;
        } else {
            msg = `Uncategorized. ${e?.msg}`;
        }
        if (!res.headersSent) {
            response500(res, msg);
        }
        logWithDate(msg, fname, e);
        await atlasDbClient.close();
        return;
    }
}