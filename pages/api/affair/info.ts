import type { NextApiRequest, NextApiResponse } from 'next';
import { MongoError } from 'mongodb';

import AtlasDatabaseClient from '../../../modules/AtlasDatabaseClient';

import { response405, response500, logWithDate } from '../../../lib/utils/general';
import { IMemberComprehensive } from '../../../lib/interfaces/member';
import { verifyId } from '../../../lib/utils/verify';

const fnn = `${GetEntityInfoById.name} (API)`;

/**
 * This interface ONLY accepts GET requests
 * 
 * Info required for GET requests
 * -     recaptchaResponse: string (query string)
 * -     memberId: string (query string)
 * -     referenceId: string (query string)
 * 
 * Info will be returned
 * -    memberId: string
 * -    nickname: string
 * -    referenceId: string
 * -    referenceContent: string
 * 
 * Last update:
 * - 11/05/2023 v0.1.1
*/

export default async function GetEntityInfoById(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;
    if ('GET' !== method) {
        response405(req, res);
        return;
    }

    const { memberId: referenceMemberId, referenceId: referenceEntityId } = req.query;

    //// Verify member id ////
    const { isValid: isValidMemberId, category: c0, id: memberId } = verifyId(referenceMemberId);
    if (!(isValidMemberId && 'member' === c0)) {
        res.status(400).send('Invalid member id');
        return;
    }

    //// Verify comment id ////
    const { isValid: isValidEntityId, category: c1, id: entityId } = verifyId(referenceEntityId);
    if (!(isValidEntityId && ['post', 'comment', 'subcomment'].includes(c1))) {
        res.status(400).send('Invalid reference id');
        return;
    }

    //// Declare DB client ////
    const atlasDbClient = AtlasDatabaseClient();
    try {
        await atlasDbClient.connect();

        const memberComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IMemberComprehensive>('member');
        const memberComprehensiveQueryResult = await memberComprehensiveCollectionClient.findOne({ memberId }, { projection: { _id: 0, nickname: 1 } });
        if (null === memberComprehensiveQueryResult) {
            res.status(404).send('Member not found');
            await atlasDbClient.close();
            return;
        }

        const entityComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<any>('post' === c1 ? 'post' : 'comment');
        const query: any = {};
        query['post' === c1 ? 'postId' : 'commentId'] = entityId;
        const entityComprehensiveQueryResult = await entityComprehensiveCollectionClient.findOne(query);
        if (null === entityComprehensiveQueryResult) {
            res.status(404).send('Entity not found');
            await atlasDbClient.close();
            return;
        }
        
        res.status(200).send({
            memberId,
            nickname: memberComprehensiveQueryResult.nickname,
            referenceId: referenceEntityId,
            referenceContent: 'post' === c1 ? entityComprehensiveQueryResult.title : entityComprehensiveQueryResult.content
        });
        
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
        logWithDate(msg, fnn, e);
        await atlasDbClient.close();
        return;
    }
}