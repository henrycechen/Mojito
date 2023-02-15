import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import { RestError } from '@azure/data-tables';
import { MongoError } from 'mongodb';


import AzureTableClient from '../../../../../modules/AzureTableClient';
import AtlasDatabaseClient from '../../../../../modules/AtlasDatabaseClient';

import { IMemberComprehensive, IMemberPostMapping, IPostComprehensive, IRestrictedPostComprehensive } from '../../../../../lib/interfaces';
import { createNoticeId, verifyId, response405, response500, logWithDate, getRestrictedFromPostComprehensive } from '../../../../../lib/utils';

/** This interface ONLY accepts GET requests
 * 
 * Info required for GET requests
 * - token: JWT
 * - quantity: number (query string, optional, maximum 20)
 * - positionId: string (query string, the last post id of the last request, optional)
 * 
 * Info will be returned
 * - restrictedComprehensiveArr: IRestrictedPostComprehensive[]
*/

export default async function GetSavedPosts(req: NextApiRequest, res: NextApiResponse) {
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
    //// Declare DB client ////
    const atlasDbClient = AtlasDatabaseClient();
    try {
        const { sub: memberId } = token;
        //// Verify member status ////
        const memberComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IMemberComprehensive>('member');
        const memberComprehensiveQueryResult = await memberComprehensiveCollectionClient.findOne({ memberId });
        if (null === memberComprehensiveQueryResult) {
            throw new Error(`Member attempt to getting saved post records but have no document (of IMemberComprehensive, member id: ${memberId}) in [C] memberComprehensive`);
        }
        const { status: memberStatus } = memberComprehensiveQueryResult;
        if (0 > memberStatus) {
            res.status(403).send('Method not allowed due to member suspended or deactivated');
            await atlasDbClient.close();
            return;
        }
        const historyMappingTableClient = AzureTableClient('SavedMapping');
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
        let savedMappingQueryResult = await historyMappingQuery.next();
        while ((savedMappingQueryResult.value && postIdArr.length < quantity)) {
            postIdArr.push(savedMappingQueryResult.value?.RowKey);
            savedMappingQueryResult = await historyMappingQuery.next();
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
            msg = 'Attempt to communicate with azure table storage.';
        } else if (e instanceof MongoError) {
            msg = 'Attempt to communicate with atlas mongodb.';
        } else {
            msg = `Uncategorized. ${e?.msg}`;
        }
        if (!res.headersSent) {
            response500(res, msg);
        }
        logWithDate(msg, e);
        await atlasDbClient.close();
        return;
    }
}