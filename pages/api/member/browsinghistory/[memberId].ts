import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import { RestError } from '@azure/data-tables';
import { MongoError } from 'mongodb';

import AzureTableClient from '../../../../modules/AzureTableClient';
import AtlasDatabaseClient from "../../../../modules/AtlasDatabaseClient";

import { IMemberComprehensive } from '../../../../lib/interfaces/member';
import { IPostComprehensive, IRestrictedPostComprehensive, } from '../../../../lib/interfaces/post';
import { logWithDate, response405, response500 } from '../../../../lib/utils/general';
import { getRestrictedFromPostComprehensive } from '../../../../lib/utils/for/post';

const fnn = `${GetOrDeleteBrowsingHistory.name} (API)`;

/** FIXME:FIXME:FIXME:FIXME:FIXME:FIXME:FIXME:FIXME:FIXME:FIXME:FIXME:
 * This interface accepts GET and DELETE requests
 * 
 * Info required for GET requests
 * -     token: JWT
 * -     quantity: number (query string, optional, maximum 20)
 * -     positionId: string (query string, the last post id of the last request, optional)
 * 
 * Info will be returned
 * -     restrictedComprehensiveArr: IRestrictedPostComprehensive[]
 * 
 * Last update:
 * - 21/02/2023
*/

export default async function GetOrDeleteBrowsingHistory(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;

    if ('GET' !== method) {
        res.send([]);
    } else {
        res.send('ok');
    }

    return;

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
        const historyMappingTableClient = AzureTableClient('HistoryMapping');
        const historyMappingQuery = historyMappingTableClient.listEntities({ queryOptions: { filter: `PartitionKey eq '${memberId}' and IsActive eq true` } });
        //// [!] attemp to reterieve entity makes the probability of causing RestError ////
        let quantity: number;
        if ('string' === typeof req.query?.quantity) {
            quantity = parseInt(req.query.quantity);
        } else {
            quantity = 20;
        }
        if (20 < quantity) {
            quantity = 20;
        }
        let postIdArr = [];
        let historyMappingQueryResult = await historyMappingQuery.next();
        while ((historyMappingQueryResult.value && postIdArr.length < quantity)) {
            postIdArr.push(historyMappingQueryResult.value?.RowKey);
            historyMappingQueryResult = await historyMappingQuery.next();
        }
        let restrictedComprehensiveArr: IRestrictedPostComprehensive[] = [];
        const postComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IPostComprehensive>('post');
        for await (const postId of postIdArr) {
            const postComprehensiveQueryResult = await postComprehensiveCollectionClient.findOne({ postId });
            if (null !== postComprehensiveQueryResult) {
                restrictedComprehensiveArr.push(getRestrictedFromPostComprehensive(postComprehensiveQueryResult));
            }
        }
        res.status(200).send(restrictedComprehensiveArr);
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