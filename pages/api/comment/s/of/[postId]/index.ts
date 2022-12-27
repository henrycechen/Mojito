import type { NextApiRequest, NextApiResponse } from 'next';
import { RestError } from '@azure/data-tables';
import { MongoError } from 'mongodb';

import AzureTableClient from '../../../../../../modules/AzureTableClient';
import AtlasDatabaseClient from '../../../../../../modules/AtlasDatabaseClient';

import { ICommentComprehensive } from '../../../../../../lib/interfaces';
import { CommentInfo, MemberInfo } from '../../../../../../lib/types';
import { verifyId, response405, response500, log } from '../../../../../../lib/utils';


export default async function GetCommentsByPostId(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;
    if ('GET' !== method) {
        response405(req, res);
        return;
    }
    //// Verify post id ////
    const { postId } = req.query;
    if ('string' !== typeof postId || !verifyId(postId, 10)) {
        res.status(400).send('Improper post id');
        return;
    }

    const atlasDbClient = AtlasDatabaseClient(); // Db client declared at top enable access from catch statement on error

    try {
        // Step #3 look up comment info records in [T] PostCommentMappingComprehensive

        const postCommentMappingComprehensiveTableClient = AzureTableClient('PostCommentMappingComprehensive');
        const commentComprehensiveQuery = await postCommentMappingComprehensiveTableClient.listEntities({ queryOptions: { filter: `PartitionKey eq '${postId}' and CommentStatus gt 0` } });
        let commentComprehensiveQueryResult = await commentComprehensiveQuery.next();
        if (!commentComprehensiveQueryResult.value) {
            res.status(204).send('No comment records of this post');
            return;
        }
        const commentInfo: { [key: string]: CommentInfo } = {};
        do {
            const {
                rowKey: id,
                CreateTimestamp: createTimestamp,
                MemberId: memberId,
                Content: content
            } = commentComprehensiveQueryResult.value;
            commentInfo[id] = {
                id,
                createTimestamp,
                memberId,
                content
            }
        } while (!commentComprehensiveQueryResult.done)
        // Step #4 look up comment statistics in [C] commentStatistics
        await atlasDbClient.connect();
        const commentStatisticsCollectionClient = atlasDbClient.db('mojito-records-dev').collection('commentStatistics');
        const commentStatisticsDoc = commentStatisticsCollectionClient.findOne({postId});
        res.send(['ok']);
        await atlasDbClient.close();


    } catch (e: any) {
        let msg: string;
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