import type { NextApiRequest, NextApiResponse } from 'next';
import { RestError } from '@azure/data-tables';
import { getToken } from "next-auth/jwt"
import { MongoError } from 'mongodb';

import AzureTableClient from '../../../../modules/AzureTableClient';
import AtlasDatabaseClient from "../../../../modules/AtlasDatabaseClient";

import { IMemberComprehensive, IMemberPostMapping } from '../../../../lib/interfaces';
import { MemberInfo } from '../../../../lib/types';
import { verifyId, response405, response500, log } from '../../../../lib/utils';

// This interface ONLY accepts POST method
// Use 'api/post/info/[postId]' to GET post info
//
// Info required for POST request
// token: JWT
// postId: string
//
export default async function SaveOrUndoSavePostById(req: NextApiRequest, res: NextApiResponse) {
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
    const { isValid, category, id: postId } = verifyId(req.query?.postId);
    //// Verify post id ////
    if (!(isValid && 'post' === category)) {
        res.status(400).send('Invalid post id');
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
            throw new Error(`Member was trying saving or undo saving a post but have no document (of IMemberComprehensive, member id: ${memberId}) in [C] memberComprehensive`);
        }
        const { status: memberStatus } = memberComprehensiveQueryResult;
        if (0 > memberStatus) {
            res.status(403).send('Method not allowed due to member suspended or deactivated');
            await atlasDbClient.close();
            return;
        }


        // TODO: recommend to copy from attitude API



        const savedMappingTableClient = AzureTableClient('SavedMapping');
        const savedMappingQuery = savedMappingTableClient.listEntities({ queryOptions: { filter: `PartitionKey eq '${memberId}' and RowKey eq '${postId}'` } });
        //// [!] attemp to reterieve entity makes the probability of causing RestError ////
        const savedMappingQueryResult = await savedMappingQuery.next();
        if (!savedMappingQueryResult.value) {
            //// [!] no record ////
            await savedMappingTableClient.upsertEntity<IMemberPostMapping>({ partitionKey: memberId, rowKey: postId, IsActive: true }, 'Replace');
        } else {
            const { IsActive: isActive } = savedMappingQueryResult.value?.IsActive;
            await savedMappingTableClient.upsertEntity<IMemberPostMapping>({ partitionKey: memberId, rowKey: postId, IsActive: !isActive }, 'Merge');
        }


        res.status(200).send(`${} success`);
    }
    catch (e: any) {
        let msg;
        if (e instanceof RestError) {
            msg = 'Was trying communicating with azure table storage.';
        } else {
            msg = `Uncategorized. ${e?.msg}`;
        }
        if (!res.headersSent) {
            response500(res, msg);
        }
        log(msg, e);
        return;
    }

}