import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import { RestError } from '@azure/data-tables';
import { MongoError } from 'mongodb';

import AzureTableClient from '../../../../../modules/AzureTableClient';
import AtlasDatabaseClient from '../../../../../modules/AtlasDatabaseClient';

import { logWithDate, response405, response500 } from '../../../../../lib/utils/general';
import { IMemberComprehensive } from '../../../../../lib/interfaces/member';
import { INoticeInfo, INoticeInfoWithMemberInfo } from '../../../../../lib/interfaces/notification';

const fnn = `${GetNoticeByCategory.name} (API)`;

/**
 * This interface ONLY accepts GET requests
 * 
 * Info required for GET requests
 * -     token: JWT
 * -     category: string (query, notice category)
 * 
 * Last update:
 * - 13/05/2023 v0.1.1
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

    //// Verify notice category ////
    const { category } = req.query;
    if (!('string' === typeof category && ['cue', 'reply', 'like', 'pin', 'save', 'follow'].includes(category))) {
        res.status(400).send('Invalid notice category');
        return;
    }

    //// Declare DB client ////
    const atlasDbClient = AtlasDatabaseClient();
    try {
        await atlasDbClient.connect();

        //// Verify member status ////
        const { sub: memberId } = token;
        const memberComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IMemberComprehensive>('member');
        const memberComprehensiveQueryResult = await memberComprehensiveCollectionClient.findOne({ memberId });
        if (null === memberComprehensiveQueryResult) {
            throw new Error(`Member attempt to GET record (of INoticeInfo) but have no document (of IMemberComprehensive, member id: ${memberId}) in [C] memberComprehensive`);
        }

        const { status: memberStatus } = memberComprehensiveQueryResult;
        if (0 > memberStatus) {
            res.status(403).send('Method not allowed due to member suspended or deactivated');
            await atlasDbClient.close();
            return;
        }

        await atlasDbClient.close();

        const noticeTableClient = AzureTableClient('Notice');
        const noticeQuery = noticeTableClient.listEntities<INoticeInfo>({ queryOptions: { filter: `PartitionKey eq '${memberId}' and Category eq '${category}' and IsActive eq true` } });

        let arr: INoticeInfoWithMemberInfo[] = [];
        let noticeQueryResult = await noticeQuery.next();
        while (!noticeQueryResult.done) {
            arr.push({
                noticeId: noticeQueryResult.value.rowKey,
                category: noticeQueryResult.value.Category,
                initiateId: noticeQueryResult.value.InitiateId,
                nickname: noticeQueryResult.value.Nickname,
                postTitle: noticeQueryResult.value.PostTitle,
                commentBrief: noticeQueryResult.value.CommentBrief,
                createdTimeBySecond: noticeQueryResult.value.CreatedTimeBySecond
            });
            noticeQueryResult = await noticeQuery.next();
        }

        //// Response 200 ////
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
        logWithDate(msg, fnn, e);
        await atlasDbClient.close();
        return;
    }
}