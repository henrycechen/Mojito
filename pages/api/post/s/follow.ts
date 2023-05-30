import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import { MongoError } from 'mongodb';

import AtlasDatabaseClient from '../../../../modules/AtlasDatabaseClient';
import AzureTableClient from '../../../../modules/AzureTableClient';

import { IPostComprehensive } from '../../../../lib/interfaces/post';
import { logWithDate, response405, response500 } from '../../../../lib/utils/general';
import { verifyId } from '../../../../lib/utils/verify';
import { IMemberComprehensive } from '../../../../lib/interfaces/member';
import { IMemberMemberMapping } from '../../../../lib/interfaces/mapping';

const fnn = `${PostsOfFollowedMember.name} (API)`;

/**
 * This interface ONLY accepts GET requests
 * 
 * Info required for GET requests
 * -     memberId: string (token)
 * 
 * Info will be returned
 * -     IConcisePostComprehensive[]
 * 
 * Last update:
 * - 30/05/2023 v0.1.1
 */

export default async function PostsOfFollowedMember(req: NextApiRequest, res: NextApiResponse) {
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

    const memberId = token.sub;

    //// Declare DB client ////
    const atlasDbClient = AtlasDatabaseClient();
    try {
        await atlasDbClient.connect();

        //// Verify member status ////
        const memberComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IMemberComprehensive>('member');
        const memberComprehensiveQueryResult = await memberComprehensiveCollectionClient.findOne({ memberId }, { projection: { _id: 0, status: 1 } });
        if (null === memberComprehensiveQueryResult) {
            throw new Error(`Member attempt to follow or undo follow on a member but have no document (of IMemberComprehensive, member id: ${memberId}) in [C] memberComprehensive`);
        }
        const { status: memberStatus } = memberComprehensiveQueryResult;
        if (0 > memberStatus) {
            res.status(403).send('Method not allowed due to member suspended or deactivated');
            await atlasDbClient.close();
            return;
        }

        const arr: string[] = [];
        //// Look up record (of IMemberMemberMapping) in [RL] FollowingMemberMapping ////
        const followingMemberMappingTableClient = AzureTableClient('FollowingMemberMapping');
        const followingMemberMappingQuery = followingMemberMappingTableClient.listEntities<IMemberMemberMapping>({ queryOptions: { filter: `PartitionKey eq '${memberId}' and IsActive eq true` } });
        //// [!] attemp to reterieve entity makes the probability of causing RestError ////
        let followingMemberMappingQueryResult = await followingMemberMappingQuery.next();
        while (!followingMemberMappingQueryResult.done) {
            arr.push(followingMemberMappingQueryResult.value.rowKey);
            followingMemberMappingQueryResult = await followingMemberMappingQuery.next();
        }

        const conditions: any = [{ status: { $gt: 0 } }];

        arr.forEach(mId => {
            conditions.push({
                memberId: { $eq: mId }
            });
        });

        const pipeline = [
            { $match: { $and: conditions } },
            { $limit: 30 },
            { $sort: { totalHitCount: 1 } },
            {
                $project: {
                    _id: 0,
                    postId: 1,
                    memberId: 1,
                    nickname: 1,
                    createdTimeBySecond: 1,
                    title: 1,
                    channelId: 1,
                    hasImages: 1,
                    totalCommentCount: 1,
                    totalHitCount: 1,
                    totalLikedCount: 1,
                    totalDislikedCount: 1,
                }
            }
        ];

        const collectionClient = atlasDbClient.db('comprehensive').collection<IPostComprehensive>('post');
        const query = collectionClient.aggregate(pipeline);

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