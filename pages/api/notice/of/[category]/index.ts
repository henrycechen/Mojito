import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt'
import { RestError } from '@azure/data-tables';
import { MongoError } from 'mongodb';

import AzureTableClient from '../../../../../modules/AzureTableClient';
import AtlasDatabaseClient from "../../../../../modules/AtlasDatabaseClient";

import { IMemberComprehensive, } from '../../../../../lib/interfaces';
import { response405, response500, log } from '../../../../../lib/utils';
const recaptchaServerSecret = process.env.INVISIABLE_RECAPTCHA_SECRET_KEY ?? '';

/** This interface ONLY accepts GET requests
 * 
 * Info required for GET requests
 * token: JWT
 * category: string (query, notice category)
 * quantity: number (query string, optional, maximum 20)
*/

export default async function GetNoticeByCategory(req: NextApiRequest, res: NextApiResponse) {
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
    const category = req.query?.category;
    //// Verify notice category ////
    if (('string' === typeof category && ['cue', 'reply', 'like', 'pin', 'save', 'follow'].includes(category))) {
        res.status(400).send('Invalid notice category');
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
            throw new Error(`Member was trying getting notice records but have no document (of IMemberComprehensive, member id: ${memberId}) in [C] memberComprehensive`);
        }
        const { status: memberStatus } = memberComprehensiveQueryResult;
        if (0 > memberStatus) {
            res.status(403).send('Method not allowed due to member suspended or deactivated');
            await atlasDbClient.close();
            return;
        }
        await atlasDbClient.close();
        const noticeTableClient = AzureTableClient('Notice');
        const noticeQuery = noticeTableClient.listEntities({ queryOptions: { filter: `PartitionKey eq '${memberId}' and Category eq '${category}' and IsActive eq true` } });
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
        let noticeArray = [];
        let noticeQueryResult = await noticeQuery.next();
        while ((!noticeQueryResult.value && noticeArray.length < quantity)) {
            noticeArray.push({
                noticeId: noticeQueryResult.value.rowKey,
                category,
                initiateId: noticeQueryResult.value.InitiateId,
                nickname: noticeQueryResult.value.Nickname,
                postTitle: noticeQueryResult.value?.postTitle,
                commentBreif: noticeQueryResult.value?.commentBreif
            });
            noticeQueryResult = await noticeQuery.next();
        }
        res.status(200).send(noticeArray);
    } catch (e: any) {
        let msg;
        if (e instanceof RestError) {
            msg = 'Was trying communicating with azure table storage.';
        } else if (e instanceof MongoError) {
            msg = 'Was trying communicating with atlas mongodb.';
        } else {
            msg = `Uncategorized. ${e?.msg}`;
        }
        if (!res.headersSent) {
            response500(res, msg);
        }
        log(msg, e);
        await atlasDbClient.close();
        return;
    }
}