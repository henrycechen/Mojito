import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt'
import { RestError } from '@azure/data-tables';
import { MongoError } from 'mongodb';

import AzureTableClient from '../../../../../../../modules/AzureTableClient';
import AtlasDatabaseClient from "../../../../../../../modules/AtlasDatabaseClient";
import { logWithDate, response405, response500 } from '../../../../../../../lib/utils/general';
import { verifyId } from '../../../../../../../lib/utils/verify';
import { IMemberComprehensive } from '../../../../../../../lib/interfaces/member';
import { createId } from '../../../../../../../lib/utils/create';

const fname = GetPostsByMemberId.name;

/** GetPostsByMemberId v0.1.1 FIXME: unfinished
 * 
 * Last update: 21/02/2023
 * 
 * This interface ONLY accepts GET requests
 * 
 * Info required for GET requests
 * - memberId: string (query)
 * - channelId: string (query string, optional)
 * - quantity: number (query string, optional, maximum 20)
 * - positionId: string (query string, the last post id of the last request, optional)
*/

const bb1 = [

    {
        postId: createId('post'),
        memberId: 'M1234XXXX',
        nickname: 'WebMaster',

        createdTimeBySecond: 1674610376,
        imageUrlsArr: ['https://i.imgur.com/cYDG24D.jpeg'],
        title: '在Imgur上看到的Elonald Trusk',

        totalHitCount: 100,
        totalLikedCount: 3
    },

    {
        postId: createId('post'),
        memberId: 'M1234XXXX',

        nickname: 'WebMaster',
        

        createdTimeBySecond: 1674610376,
        imageUrlsArr: ['https://i.imgur.com/IWP1cL4.jpeg'],
        title: 'Just a Golden Retriever in the Fall Leaves',

        totalHitCount: 100,
        totalLikedCount: 3
    },

    {
        postId: createId('post'),
        memberId: 'M1234XXXX',

        nickname: 'WebMaster',

        createdTimeBySecond: 1674610376,
        imageUrlsArr: ['https://i.imgur.com/Ne2hcBt.jpeg'],
        title: 'Home of Stephen King, Bangor, ME',

        totalHitCount: 100,
        totalLikedCount: 3
    },

    {
        postId: createId('post'),
        memberId: 'M1234XXXX',

        nickname: 'WebMaster',
        

        createdTimeBySecond: 1674610376,
        imageUrlsArr: ['https://i.imgur.com/9qTKlKW.jpeg'],
        title: 'The Fellowship of the Ring (1978)',

        totalHitCount: 100,
        totalLikedCount: 3
    },

    {
        postId: createId('post'),
        memberId: 'M1234XXXX',

        nickname: 'WebMaster',
        

        createdTimeBySecond: 1674610376,
        imageUrlsArr: ['https://i.imgur.com/fQdY6Fs.jpeg'],
        title: 'beautiful art by Sam Yang',

        totalHitCount: 100,
        totalLikedCount: 3
    },
];

const bb2 = [];

const bb3 = [];

export default async function GetPostsByMemberId(req: NextApiRequest, res: NextApiResponse) {

    const { method } = req;
    if ('GET' !== method) {
        response405(req, res);
        return;
    }

    // Verify author id
    const { memberId, channelId } = req.query;
    const { isValid, category, id: authorId } = verifyId(memberId);
    if (!(isValid && 'member' === category)) {
        res.status(400).send('Invalid member id');
        return;
    }

    //// Declare DB client ////
    const atlasDbClient = AtlasDatabaseClient();
    try {
        // const { sub: memberId } = token;
        // //// Verify member status ////
        // const memberComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IMemberComprehensive>('member');
        // const memberComprehensiveQueryResult = await memberComprehensiveCollectionClient.findOne({ memberId });
        // if (null === memberComprehensiveQueryResult) {
        //     throw new Error(`Member attempt to get browsing history records but have no document (of IMemberComprehensive, member id: ${memberId}) in [C] memberComprehensive`);
        // }
        // const { status: memberStatus } = memberComprehensiveQueryResult;
        // if (0 > memberStatus) {
        //     res.status(403).send('Method not allowed due to member suspended or deactivated');
        //     await atlasDbClient.close();
        //     return;
        // }
        // const historyMappingTableClient = AzureTableClient('HistoryMapping');
        // const historyMappingQuery = historyMappingTableClient.listEntities({ queryOptions: { filter: `PartitionKey eq '${memberId}' and IsActive eq true` } });
        // //// [!] attemp to reterieve entity makes the probability of causing RestError ////
        // let quantity: number;
        // if ('string' === typeof req.query?.quantity) {
        //     quantity = parseInt(req.query.quantity);
        // } else {
        //     quantity = 20;
        // }
        // if (20 < quantity) {
        //     quantity = 20;
        // }
        // let postIdArr = [];
        // let noticeQueryResult = await historyMappingQuery.next();
        // while ((!noticeQueryResult.value && postIdArr.length < quantity)) {
        //     postIdArr.push({
        //         noticeId: noticeQueryResult.value.rowKey,
        //         category,
        //         initiateId: noticeQueryResult.value.InitiateId,
        //         nickname: noticeQueryResult.value.Nickname,
        //         postTitle: noticeQueryResult.value?.postTitle,
        //         commentBreif: noticeQueryResult.value?.commentBreif
        //     });
        //     noticeQueryResult = await historyMappingQuery.next();
        // }

        res.status(200).send([]);
        await atlasDbClient.close();
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