import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt'
import { RestError } from '@azure/data-tables';
import { MongoError } from 'mongodb';

import AzureTableClient from '../../../../modules/AzureTableClient';
import AtlasDatabaseClient from "../../../../modules/AtlasDatabaseClient";



import { IConciseMemberStatistics, IMemberComprehensive, IMemberStatistics } from '../../../../lib/interfaces/member';
import { response405, response500, logWithDate } from '../../../../lib/utils/general';
import { verifyId } from '../../../../lib/utils/verify';

const fname = GetConciseMemberStatisticsById.name;

/** GetMemberStatisticsById v0.1.2 FIXME: test mode
 * 
 * Last update: 23/02/2023
 * 
 * This interface ONLY accepts GET requests
 * 
 * Info required for GET requests
 * - memberId: string (query, member id)
*/

export default async function GetConciseMemberStatisticsById(req: NextApiRequest, res: NextApiResponse) {


    res.send({
        totalCreationCount: 4,
        totalCreationHitCount: 1783,
        totalFollowedByCount: 18,
        totalCreationSavedCount: 127,
        totalCreationLikedCount: 335,
    });
    return;


    const { method } = req;
    if ('GET' !== method) {
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

    //// Verify id ////
    const { isValid, category, id: objectId } = verifyId(req.query?.memberId);
    if (!(isValid && 'member' === category)) {
        res.status(400).send('Invalid member id');
        return;
    }

    //// Declare DB client ////
    const atlasDbClient = AtlasDatabaseClient();
    try {
        await atlasDbClient.connect();

        //// Verify member status ////
        const memberComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IMemberComprehensive>('member');
        const memberComprehensiveQueryResult = await memberComprehensiveCollectionClient.findOne({ memberId }, { projection: { _id: 0, status: 1 } });
        if (null === memberComprehensiveQueryResult) {
            throw new Error(`${fname}: Member attempt to GET member statistics but have no document (of IMemberComprehensive, member id: ${memberId}) in [C] memberComprehensive`);
        }
        const { status: memberStatus } = memberComprehensiveQueryResult;
        if (0 > memberStatus) {
            res.status(403).send('Method not allowed due to member suspended or deactivated');
            await atlasDbClient.close();
            return;
        }

        const statistics: IConciseMemberStatistics = {
            memberId,
            totalCreationCount: 0,
            totalCreationHitCount: 0,
            totalFollowedByCount: 0,
            totalCreationLikedCount: 0,
            totalCreationSavedCount: 0,
        };
        const memberStatisticsCollectionClient = atlasDbClient.db('comprehensive').collection<IMemberStatistics>('member');
        const memberStatisticsQueryResult = await memberStatisticsCollectionClient.findOne({ memberId }, {
            projection: {
                _id: 0,
                totalCreationCount: 1,
                totalCreationDeleteCount: 1,

                totalCreationHitCount: 1,

                totalFollowedByCount: 1,
                totalUndoFollowedByCount: 1,

                totalCreationSavedCount: 1,
                totalCreationUndoSavedCount: 1,

                totalCreationLikedCount: 1,
                totalCreationUndoLikedCount: 1,
            }
        });
        if (null === memberStatisticsQueryResult) {
            await memberStatisticsCollectionClient.insertOne({
                memberId,

                // creation
                totalCreationCount: 0, // info page required
                totalCreationHitCount: 0,
                totalCreationEditCount: 0,
                totalCreationDeleteCount: 0,
                totalCreationLikedCount: 0, // info page required
                totalCreationUndoLikedCount: 0,
                totalCreationDislikedCount: 0,
                totalCreationUndoDislikedCount: 0,
                totalCreationSavedCount: 0, // info page required
                totalCreationUndoSavedCount: 0,

                // attitude
                totalLikeCount: 0,
                totalUndoLikeCount: 0,
                totalDislikeCount: 0,
                totalUndoDislikeCount: 0,

                // comment
                totalCommentCount: 0,
                totalCommentEditCount: 0,
                totalCommentDeleteCount: 0,
                totalCommentLikedCount: 0,
                totalCommentUndoLikedCount: 0,
                totalCommentDislikedCount: 0,
                totalCommentUndoDislikedCount: 0,

                // post
                totalSavedCount: 0,
                totalUndoSavedCount: 0,

                // on other members
                totalFollowingCount: 0,
                totalUndoFollowingCount: 0,
                totalBlockingCount: 0,
                totalUndoBlockingCount: 0,

                // by other members
                totalFollowedByCount: 0, // info page required
                totalUndoFollowedByCount: 0,
                totalBlockedByCount: 0,
                totalUndoBlockedByCount: 0
            });
        } else {
            statistics.totalCreationCount = memberStatisticsQueryResult.totalCreationCount - memberStatisticsQueryResult.totalCreationDeleteCount;
            statistics.totalCreationHitCount = memberStatisticsQueryResult.totalCreationHitCount;
            statistics.totalFollowedByCount = memberStatisticsQueryResult.totalFollowedByCount - memberStatisticsQueryResult.totalUndoFollowedByCount;
            statistics.totalCreationSavedCount = memberStatisticsQueryResult.totalCreationSavedCount - memberStatisticsQueryResult.totalCreationUndoSavedCount;
            statistics.totalCreationLikedCount = memberStatisticsQueryResult.totalCreationLikedCount - memberStatisticsQueryResult.totalCreationUndoLikedCount;
        }

        res.send(statistics);
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
        logWithDate(msg, fname, e);
        await atlasDbClient.close();
        return;
    }
}