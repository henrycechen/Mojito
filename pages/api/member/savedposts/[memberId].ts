import type { NextApiRequest, NextApiResponse } from 'next';
import { MongoError } from 'mongodb';

import AtlasDatabaseClient from '../../../../modules/AtlasDatabaseClient';

import { IMemberComprehensive } from '../../../../lib/interfaces/member';
import { IMemberPostMapping } from '../../../../lib/interfaces/mapping';
import { logWithDate, response405, response500 } from '../../../../lib/utils/general';
import { verifyId } from '../../../../lib/utils/verify';

const fnn = `${GetOrUndoSaveSavedPosts.name} (API)`;

/**
 * This interface ONLY accepts GET requests
 * 
 * Info required for GET requests
 * -     memberId: string (query)
 * 
 * Info will be returned
 * -     arr: IConcisePostComprehensive[]
 * 
 * Last update:
 * - 24/02/2023 v0.1.1
 * - 10/05/2023 v0.1.2
 * - 31/05/2023 v0.1.3
*/

export default async function GetOrUndoSaveSavedPosts(req: NextApiRequest, res: NextApiResponse) {

    const { method } = req;
    if ('GET' !== method) {
        response405(req, res);
        return;
    }

    //// Verify member id ////
    const { isValid, category, id: memberId } = verifyId(req.query?.memberId);
    if (!(isValid && 'member' === category)) {
        res.status(400).send('Invalid member id');
        return;
    }

    //// Declare DB client ////
    const atlasDbClient = AtlasDatabaseClient();
    try {
        await atlasDbClient.connect();

        const memberComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IMemberComprehensive>('member');
        const memberComprehensiveQueryResult = await memberComprehensiveCollectionClient.findOne({ memberId }, {
            projection: {
                _id: 0,
                status: 1,
                allowVisitingSavedPosts: 1
            }
        });

        if (null === memberComprehensiveQueryResult) {
            throw new Error(`Attempt to get saved posts of member (member id: ${memberId}) but have no document (of IMemberComprehensive) in [C] memberComprehensive`);
        }

        const { status: memberStatus, allowVisitingSavedPosts: isAllowed } = memberComprehensiveQueryResult;
        if (0 > memberStatus) {
            res.status(403).send('Method not allowed due to member suspended or deactivated');
            await atlasDbClient.close();
            return;
        }

        if (!isAllowed) {
            res.status(403).send('Method not allowed due to member\'s privacy settings');
            await atlasDbClient.close();
            return;
        }

        const { channelId } = req.query;
        const conditions = [{ memberId: { $eq: memberId } }, { status: { $gt: 0 } }, ('string' === typeof channelId && !['', 'all'].includes(channelId)) ? { channelId: channelId } : {}];
        const pipeline = [
            { $match: { $and: conditions } },
            { $limit: 30 },
            { $sort: { createdTimeBySecond: -1 } },
            {
                $project: {
                    _id: 0,
                    memberId:1,
                    postId: 1,
                    title: 1,
                    channelId: 1,
                    authorId: 1,
                    nickname: 1,
                    createdTimeBySecond: 1,
                }
            }
        ];

        const memberPostMappingCollectionClient = atlasDbClient.db('mapping').collection<IMemberPostMapping>('member-post-saved');
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