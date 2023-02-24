import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import { RestError } from '@azure/data-tables';
import { MongoError } from 'mongodb';

import AzureTableClient from '../../../../modules/AzureTableClient';
import AtlasDatabaseClient from "../../../../modules/AtlasDatabaseClient";

import { IMemberComprehensive } from '../../../../lib/interfaces/member';
import { IConcisePostComprehensive, IPostComprehensive, IRestrictedPostComprehensive, } from '../../../../lib/interfaces/post';
import { logWithDate, response405, response500 } from '../../../../lib/utils/general';
import { getRestrictedFromPostComprehensive } from '../../../../lib/utils/for/post';
import { createId, getRandomHexStr } from '../../../../lib/utils/create';
import { verifyId } from '../../../../lib/utils/verify';
import { IMemberPostMapping } from '../../../../lib/interfaces/mapping';

const fname = GetOrDeleteSavedPosts.name;

/** GetOrDeleteBrowsingHistory v0.1.3 FIXME: test mode
 * 
 * Last update: 24/02/2023
 * 
 * This interface accepts GET requests
 * 
 * Info required for GET requests
 * - token: JWT (optional)
 * - memberId: string (query)
 * 
 * Info will be returned
 * - arr: IConcisePostComprehensive[]
*/

const bb1 = [
    {
        postId: createId('post'),
        memberId: createId('member'),
        nickname: getRandomHexStr(true),

        createdTime: 1674610376336,
        imageUrlsArr: ['https://i.imgur.com/tGBVefA.jpeg'],
        title: 'REPUGNANTS',

        totalHitCount: 100,
        totalLikedCount: 3
    },


    {
        postId: createId('post'),
        memberId: createId('member'),
        nickname: getRandomHexStr(true),

        avatarImageUrl: 'https://www.google.com/url?sa=i&url=https%3A%2F%2Fpikabu.monster%2Fposts-1%3Ftag%3D%25D0%2590%25D0%25B2%25D0%25B0%25D1%2582%25D0%25B0%25D1%2580%25D0%25BA%25D0%25B0%255C%25D0%2590%25D0%25BD%25D0%25B8%25D0%25BC%25D0%25B5&psig=AOvVaw37861TIpzR_kDsdNyMsUHJ&ust=1675373812288000&source=images&cd=vfe&ved=2ahUKEwjw0ez4o_X8AhVDpOkKHbxjBV8QjRx6BAgAEAo',

        createdTime: 1674610376336,
        imageUrlsArr: ['https://i.imgur.com/3PcGJbZ.jpeg'],
        title: 'What a nice Tuesday',

        totalHitCount: 100,
        totalLikedCount: 3
    },
    {
        postId: createId('post'),
        memberId: createId('member'),
        nickname: getRandomHexStr(true),

        createdTime: 1674610376336,
        imageUrlsArr: ['https://i.imgur.com/aqaWs3K.jpeg'],
        title: '#cakeday',

        totalHitCount: 100,
        totalLikedCount: 3
    },
    {
        postId: createId('post'),
        memberId: createId('member'),
        nickname: getRandomHexStr(true),

        createdTime: 1674610376336,
        imageUrlsArr: ['https://i.imgur.com/GwMvtMD.jpeg'],
        title: 'The Acropolis of Athens, the great jewel of classical Greece',

        totalHitCount: 100,
        totalLikedCount: 3
    },
    {
        postId: createId('post'),
        memberId: createId('member'),
        nickname: getRandomHexStr(true),

        createdTime: 1674610376336,
        imageUrlsArr: ['https://i.imgur.com/qbeOXWl.jpeg'],
        title: 'I FOUND IT.',

        totalHitCount: 100,
        totalLikedCount: 3
    },
    {
        postId: createId('post'),
        memberId: createId('member'),
        nickname: getRandomHexStr(true),

        createdTime: 1674610376336,
        imageUrlsArr: ['https://i.imgur.com/RnGBjx2.jpeg'],
        title: 'Actors and their stunt doubles!',

        totalHitCount: 100,
        totalLikedCount: 3
    },
]

export default async function GetOrDeleteSavedPosts(req: NextApiRequest, res: NextApiResponse) {

    // res.send(bb1);
    // return;

    const { method } = req;
    if ('GET' !== method) {
        response405(req, res);
        return;
    }

    //// Verify identity ////
    let tokenId = ''; // v0.1.3
    const token = await getToken({ req });
    if (token && token?.sub) {
        tokenId = token.sub;
    }

    //// Verify member id ////
    const { isValid, category, id: memberId } = verifyId(req.query?.memberId);
    if (!(isValid && 'member' === category)) {
        res.status(400).send('Invalid member id');
        return;
    }

    //// Match the member id in token and the one in request ////
    if (tokenId !== memberId) {
        res.status(400).send('Requested member id and identity not matched');
        return;
    }

    //// Declare DB client ////
    const atlasDbClient = AtlasDatabaseClient();
    try {
        await atlasDbClient.connect();

        //// Verify member status ////
        const memberComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IMemberComprehensive>('member');
        const memberComprehensiveQueryResult = await memberComprehensiveCollectionClient.findOne({ memberId }, { projection: { _id: 0, status: 1, allowVisitingSavedPosts: 1 } });
        if (null === memberComprehensiveQueryResult) {
            throw new Error(`Member attempt to get browsing history records but have no document (of IMemberComprehensive, member id: ${memberId}) in [C] memberComprehensive`);
        }

        const { status: memberStatus, allowVisitingSavedPosts: isAllowed } = memberComprehensiveQueryResult;
        if (0 > memberStatus) {
            res.status(403).send('Method not allowed due to member suspended or deactivated');
            await atlasDbClient.close();
            return;
        }
        await atlasDbClient.close();

        let arr: IConcisePostComprehensive[] = [];
        if (tokenId === memberId || isAllowed) { // v0.1.3

            //// Look up record (of IMemberPostMapping) in [RL] SavedMapping ////
            const savedMappingTableClient = AzureTableClient('SavedMapping');
            const savedMappingQuery = savedMappingTableClient.listEntities<IMemberPostMapping>({ queryOptions: { filter: `PartitionKey eq '${memberId}' and IsActive eq true` } });
            
            let savedMappingQueryResult = await savedMappingQuery.next();
            while (!savedMappingQueryResult.done) {
                arr.push({
                    postId: savedMappingQueryResult.value.rowKey,
                    memberId,
                    nickname: savedMappingQueryResult.value.Nickname,
                    createdTimeBySecond: savedMappingQueryResult.value.CreatedTimeBySecond,
                    title: savedMappingQueryResult.value.Title,
                    totalHitCount: 0, // [!] statistics is not supplied for saved posts
                    totalLikedCount: 0,
                });
                savedMappingQueryResult = await savedMappingQuery.next();
            }
        }

        res.status(200).send(arr);
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


// if ('DELETE' !== method) {
//     response405(req, res);
//     return;
// }
// //// Verify identity ////
// const token = await getToken({ req });
// if (!(token && token?.sub)) {
//     res.status(400).send('Invalid identity');
//     return;
// }
// const { sub: memberId } = token;

// // Verify post id
// const { isValid, category, id: postId } = verifyId(req.query?.postId);
// if (!(isValid && 'post' === category)) {
//     res.status(400).send('Invalid post id');
//     return;
// }

// //// Declare DB client ////
// const atlasDbClient = AtlasDatabaseClient();
// try {
//     await atlasDbClient.connect();

//     //// Verify member status ////
//     const memberComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IMemberComprehensive>('member');
//     const memberComprehensiveQueryResult = await memberComprehensiveCollectionClient.findOne({ memberId }, { projection: { _id: 0, status: 1 } });
//     if (null === memberComprehensiveQueryResult) {
//         throw new Error(`Member attempt to delete browsing history record but have no document (of IMemberComprehensive, member id: ${memberId}) in [C] memberComprehensive`);
//     }
//     const { status: memberStatus } = memberComprehensiveQueryResult;
//     if (0 > memberStatus) {
//         res.status(403).send('Method not allowed due to member suspended or deactivated');
//         await atlasDbClient.close();
//         return;
//     }
//     await atlasDbClient.close();

//     //// Update (delete) record (of IMemberPostMapping) in [RL] HistoryMapping ////
//     const noticeTableClient = AzureTableClient('HistoryMapping');
//     await noticeTableClient.updateEntity({
//         partitionKey: memberId,
//         rowKey: postId,
//         IsActive: false
//     }, 'Merge');
//     res.status(200).send('Delete browsing history success');