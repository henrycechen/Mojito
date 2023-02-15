import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt'
import { RestError } from '@azure/data-tables';
import { MongoError } from 'mongodb';

import AzureTableClient from '../../../../../../../modules/AzureTableClient';
import AtlasDatabaseClient from "../../../../../../../modules/AtlasDatabaseClient";

import { IMemberComprehensive, } from '../../../../../../../lib/interfaces';
import { verifyId, response405, response500, logWithDate } from '../../../../../../../lib/utils';
const recaptchaServerSecret = process.env.INVISIABLE_RECAPTCHA_SECRET_KEY ?? '';

/** This interface ONLY accepts GET requests
 * 
 * Info required for GET requests
 * memberId: string (query)
 * channelId: string (query string, optional)
 * quantity: number (query string, optional, maximum 20)
 * positionId: string (query string, the last post id of the last request, optional)
*/

export default async function GetPostsByMemberId(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;
    if ('GET' !== method) {
        response405(req, res);
        return;
    }
    // Verify member id (post author)
    const memberId = req.query?.memberId;
    const { isValid, category, id: memberId_author } = verifyId(memberId);
    if (!(isValid && 'member' === category)){
        res.status(400).send('Invalid member id');
        return;
    }
    // Verify channel id (optional)
    const channelId = req.query?.channelId;
    const token = await getToken({ req });


    // TODO: aaaaaaaaaaaaaaaa llllllllllllllotttttttttttttttttt dooooooooooooooooooooooooo

    //// Declare DB client ////
    const atlasDbClient = AtlasDatabaseClient();
    try {
        const { sub: memberId } = token;
        //// Verify member status ////
        const memberComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IMemberComprehensive>('member');
        const memberComprehensiveQueryResult = await memberComprehensiveCollectionClient.findOne({ memberId });
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
        let noticeQueryResult = await historyMappingQuery.next();
        while ((!noticeQueryResult.value && postIdArr.length < quantity)) {
            postIdArr.push({
                noticeId: noticeQueryResult.value.rowKey,
                category,
                initiateId: noticeQueryResult.value.InitiateId,
                nickname: noticeQueryResult.value.Nickname,
                postTitle: noticeQueryResult.value?.postTitle,
                commentBreif: noticeQueryResult.value?.commentBreif
            });
            noticeQueryResult = await historyMappingQuery.next();
        }


        //TODO: get post info order by postArray




        res.status(200).send(postIdArr);
        await atlasDbClient.close();
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