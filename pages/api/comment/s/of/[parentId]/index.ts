import type { NextApiRequest, NextApiResponse } from 'next';
import { MongoError } from 'mongodb';

import AtlasDatabaseClient from '../../../../../../modules/AtlasDatabaseClient';
import { logWithDate, response405, response500 } from '../../../../../../lib/utils/general';
import { verifyId } from '../../../../../../lib/utils/verify';
import { IPostComprehensive } from '../../../../../../lib/interfaces/post';
import { ICommentComprehensive } from '../../../../../../lib/interfaces/comment';
import { getRestrictedFromCommentComprehensive } from '../../../../../../lib/utils/for/comment';

const ffn = GetCommentsByParentId.name;

/** GetCommentsByParentId v0.1.2
 * 
 * This interface only accepts GET requests
 * 
 * Info requried for GET requests
 * - parentId: string (post / comment id)
 * 
 * Info will be returned for GET requests
 * - commentsArray: IRestrictedCommentComprehensive[] (for query with 'post' id category)
 * - subcommentsArray: IRestrictedCommentComprehensive[] (for query with 'comment' id category)
 * 
 * Last update: 21/02/2023 v0.1.1
 * Last update: 08/05/2023 v0.1.2 Fix issue communicating with atlas db
 */

export default async function GetCommentsByParentId(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;
    if ('GET' !== method) {
        response405(req, res);
        return;
    }

    const { isValid, category, id: parentId } = verifyId(req.query?.parentId);
    //// Verify id ////
    if (!isValid) {
        res.status(400).send('Invalid post or comment id');
        return;
    }
    //// Verify category ////
    if (!['post', 'comment'].includes(category)) {
        res.status(400).send('Invalid id category');
        return;
    }
    //// Declare DB client ////
    const atlasDbClient = AtlasDatabaseClient();
    try {
        await atlasDbClient.connect();
        if ('post' === category) {
            // #1 look up document (of IPostComprehensive) in [C] postComprehensive
            const postComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IPostComprehensive>('post');
            const postComprehensiveQueryResult = await postComprehensiveCollectionClient.findOne({ postId: parentId });
            if (null === postComprehensiveQueryResult) {
                res.status(404).send('Post not found');
                await atlasDbClient.close();
                return;
            }
        }
        if ('comment' === category) {
            // #1 look up document (of ICommentComprehensive) in [C] commentComprehensive
            const commentComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<ICommentComprehensive>('comment');
            const commentComprehensiveQueryResult = await commentComprehensiveCollectionClient.findOne({ commentId: parentId });
            if (null === commentComprehensiveQueryResult) {
                res.status(404).send('Comment not found');
                await atlasDbClient.close();
                return;
            }
        }
        // #2 look up documents (of ICommentComprehensive) in [C] commentComprehensive
        const comments = [];
        const commentComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<ICommentComprehensive>('comment');
        const commentComprehensiveQuery = commentComprehensiveCollectionClient.find({ parentId });
        while (await commentComprehensiveQuery.hasNext()) {
            let commentComprehensiveQueryResult = await commentComprehensiveQuery.next();
            if (null !== commentComprehensiveQueryResult && Object.keys(commentComprehensiveQueryResult).length !== 0) {
                comments.push(getRestrictedFromCommentComprehensive(commentComprehensiveQueryResult));
            }
        }
        res.status(200).send(comments);
        await atlasDbClient.close();
        return;
    } catch (e: any) {
        let msg: string;
        if (e instanceof MongoError) {
            msg = `Attempt to communicate with atlas mongodb.`;
        } else {
            msg = `Uncategorized. ${e?.msg}`;
        }
        if (!res.headersSent) {
            response500(res, msg);
        }
        logWithDate(msg, ffn, e);
        await atlasDbClient.close();
        return;
    }
}