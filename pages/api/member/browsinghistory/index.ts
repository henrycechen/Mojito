import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import { MongoError } from 'mongodb';

import AtlasDatabaseClient from '../../../../modules/AtlasDatabaseClient';

import { IMemberComprehensive } from '../../../../lib/interfaces/member';
import { logWithDate, response405, response500 } from '../../../../lib/utils/general';
import { IMemberPostMapping } from '../../../../lib/interfaces/mapping';
import { verifyId } from '../../../../lib/utils/verify';

const fnn = `${GetOrDeleteBrowsingHistory.name} (API)`;

/**
 * This interface accepts GET and DELETE requests
 * 
 * Info required for GET requests
 * -     token: JWT
 * -     quantity: number (query string, optional, maximum 20)
 * -     positionId: string (query string, the last post id of the last request, optional)
 * 
 * Info will be returned for GET requests
 * -     arr: IConcisePostComprehensive[]
 * 
 * Info required for DELETE requets
 * -     token: JWT
 * -     postId: string (query string)
 * 
 * Last update:
 * - 21/02/2023 v0.1.1
 * - 10/05/2023 v0.1.2
*/

export default async function GetOrDeleteBrowsingHistory(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;

    if (!['GET', 'DELETE'].includes(method ?? '')) {
        response405(req, res);
        return;
    }

    //// Verify identity ////
    const token = await getToken({ req });
    if (!(token && token?.sub)) {
        res.status(400).send('Invalid identity');
        return;
    }
    const { sub: memberId } = token;

    //// Declare DB client ////
    const atlasDbClient = AtlasDatabaseClient();
    try {
        await atlasDbClient.connect();

        //// Verify member status ////
        const memberComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IMemberComprehensive>('member');
        const memberComprehensiveQueryResult = await memberComprehensiveCollectionClient.findOne({ memberId }, { projection: { _id: 0, status: 1 } });
        if (null === memberComprehensiveQueryResult) {
            throw new Error(`Member attempt to get browsing history records but have no document (of IMemberComprehensive, member id: ${memberId}) in [C] memberComprehensive`);
        }
        const { status: memberStatus } = memberComprehensiveQueryResult;
        if (0 > memberStatus) {
            res.status(403).send('Method not allowed due to member suspended or deactivated');
            await atlasDbClient.close();
            return;
        }

        const memberPostMappingCollectionClient = atlasDbClient.db('mapping').collection<IMemberPostMapping>('member-post-history');

        if ('DELETE' === method) {
            //// Verify post id ////
            const { isValid, category, id: postId } = verifyId(req.query?.postId);
            if (!(isValid && 'post' === category)) {
                res.status(400).send('Invalid post id');
                return;
            }

            const deleteResult = await memberPostMappingCollectionClient.findOneAndUpdate({ memberId, postId }, { $set: { status: 0 } });
            if (deleteResult.value) {
                //// Response 200 ////
                res.status(200).send('Delete browsing history success');
            } else {
                res.status(500).send('Delete browsing history failed');
            }

            await atlasDbClient.close();
            return;
        }

        //// GET ////
        const { channelId } = req.query;
        const conditions = [{ memberId: { $eq: memberId } }, { status: { $gt: 0 } }, ('string' === typeof channelId && !['', 'all'].includes(channelId)) ? { channelId: channelId } : {}];
        const pipeline = [
            { $match: { $and: conditions } },
            { $limit: 30 },
            { $sort: { createdTimeBySecond: -1 } },
            {
                $project: {
                    _id: 0,
                    memberId: 1,
                    postId: 1,
                    title: 1,
                    channelId: 1,
                    authorId: 1,
                    nickname: 1,
                    createdTimeBySecond: 1,
                }
            }
        ];

        const query = memberPostMappingCollectionClient.aggregate(pipeline);

        //// Response 200 ////
        res.status(200).send(await query.toArray());

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