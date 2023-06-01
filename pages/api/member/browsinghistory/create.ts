import type { NextApiRequest, NextApiResponse } from 'next';
import { MongoError } from 'mongodb';
import { getToken } from 'next-auth/jwt';

import AtlasDatabaseClient from '../../../../modules/AtlasDatabaseClient';

import { IMemberComprehensive, IMemberStatistics } from '../../../../lib/interfaces/member';
import { IMemberPostMapping } from '../../../../lib/interfaces/mapping';
import { IPostComprehensive } from '../../../../lib/interfaces/post';

import { response405, response500, logWithDate, } from '../../../../lib/utils/general';
import { verifyId } from '../../../../lib/utils/verify';
import { getTimeBySecond } from '../../../../lib/utils/create';

const fnn = `${CreateBrowsingHistory.name} (API)`;

/**
 * This interface ONLY accepts POST method
 * 
 * Info required for POST method
 * -     postId: string (query)
 * 
 * Last update:
 * - 04/02/2023 v0.1.1
 * - 31/05/2023 v0.1.1
 */

export default async function CreateBrowsingHistory(req: NextApiRequest, res: NextApiResponse) {

    const { method } = req;
    if ('POST' !== method) {
        response405(req, res);
        return;
    }

    //// Verify identity ////
    const token = await getToken({ req });
    if (!(token && token?.sub)) {
        res.status(400).send('Invalid identity');
        return;
    }

    //// Verify post id ////
    const { isValid, id: postId } = verifyId(req.query?.postId);
    if (!isValid) {
        res.status(400).send('Invalid post id');
        return;
    }

    //// Declare DB client ////
    const atlasDbClient = AtlasDatabaseClient();
    try {
        await atlasDbClient.connect();

        //// Look up post status ////
        const postComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IPostComprehensive>('post');
        const postComprehensiveQueryResult = await postComprehensiveCollectionClient.findOne({ postId });
        if (null === postComprehensiveQueryResult) {
            res.status(404).send('Post not found');
            await atlasDbClient.close();
            return;
        }

        //// Verify post status ////
        const { status: postStatus } = postComprehensiveQueryResult;
        if (0 > postStatus) {
            res.status(404).send('Method not allowed due to post deleted');
            await atlasDbClient.close();
            return;
        }

        const memberId = token.sub;

        //// Look up member status ////
        const memberComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IMemberComprehensive>('member');
        const memberComprehensiveQueryResult = await memberComprehensiveCollectionClient.findOne({ memberId }, { projection: { _id: 0, status: 1 } });
        if (null === memberComprehensiveQueryResult) {
            throw new Error(`Member attempt to upsert entity (of browsing history, of IMemberPostMapping) but have no document (of IMemberComprehensive, member id: ${memberId}) in [C] memberComprehensive`);
        }

        //// Verify member status ////
        const { status: memberStatus } = memberComprehensiveQueryResult;
        if (0 < memberStatus) {

            //// Create history (of IMemberPostMapping) in [C] member-post-history ////
            const { memberId: authorId, nickname, title, channelId, } = postComprehensiveQueryResult;
            const memberPostMappingCollectionClient = atlasDbClient.db('mapping').collection<IMemberPostMapping>('member-post-history');
            await memberPostMappingCollectionClient.updateOne({ postId }, {
                $set: {
                    memberId,
                    postId,
                    title,
                    channelId,
                    authorId,
                    nickname,
                    createdTimeBySecond: getTimeBySecond(),
                    status: 200
                }
            }, { upsert: true });
        }

        //// Update statistics ////

        //// Update totalHitCount (of IPostComprehensive) in [C] postComprehensive ////
        const postComprehensiveUpdateResult = await postComprehensiveCollectionClient.updateOne({ postId }, {
            $inc: { totalMemberHitCount: 1 }
        });
        if (!postComprehensiveUpdateResult.acknowledged) {
            logWithDate(`Failed to update totalHitCount/totalMemberHitCount (of IPostComprehensive, post id: ${postId}) in [C] postComprehensive`, fnn);
        }

        //// Response 200 ////
        res.status(200).send('Create browsing history success');

        await atlasDbClient.close();
        return;
    } catch (e: any) {
        let msg;
        if (e instanceof SyntaxError) {
            res.status(400).send('Improperly normalized request info');
            return;
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