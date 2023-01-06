import type { NextApiRequest, NextApiResponse } from 'next';
import { MongoError } from 'mongodb';

import AtlasDatabaseClient from '../../../../../../modules/AtlasDatabaseClient';

import { INoticeInfo, IMemberPostMapping, INotificationStatistics, IMemberComprehensive, IMemberStatistics, ILoginJournal, IAttitudeComprehensive, IAttitideMapping, ICommentComprehensive, IEditedCommentComprehensive, IRestrictedCommentComprehensive, IChannelStatistics, ITopicComprehensive, ITopicPostMapping, IPostComprehensive, IEditedPostComprehensive, IRestrictedPostComprehensive } from '../../../../../../lib/interfaces';
import { verifyId, response405, response500, log, getRestrictedFromCommentComprehensive } from '../../../../../../lib/utils';

// This interface only accepts GET requests
// 
// Info requried
// - parentId: string (post / comment id)
//
// Info will be returned
// - commentsArray: IRestrictedCommentComprehensive[] (for query with 'post' id category)
// - subcommentsArray: IRestrictedCommentComprehensive[] (for query with 'comment' id category)

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
        // Step #1 look up document (of IPostComprehensive) in [C] postComprehensive
        if ('post' === category) {
            await atlasDbClient.connect();
            const postComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IPostComprehensive>('post');
            const postComprehensiveQueryResult = await postComprehensiveCollectionClient.findOne({ postId: parentId });
            if (null === postComprehensiveQueryResult) {
                res.status(404).send('Post not found');
                await atlasDbClient.close();
                return;
            }
        }
        if ('comment' === category) {
            await atlasDbClient.connect();
            // Step #1 look up document (of ICommentComprehensive) in [C] commentComprehensive
            const commentComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<ICommentComprehensive>('comment');
            const commentComprehensiveQueryResult = await commentComprehensiveCollectionClient.findOne({ commentId: parentId });
            if (null === commentComprehensiveQueryResult) {
                res.status(404).send('Comment not found');
                await atlasDbClient.close();
                return;
            }
        }
        // Step #2 look up documents (of ICommentComprehensive) in [C] commentComprehensive
        const commentsArray = [];
        const commentComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<ICommentComprehensive>('comment');
        const commentComprehensiveQuery = commentComprehensiveCollectionClient.find({ parentId });
        let commentComprehensiveQueryResult = await commentComprehensiveQuery.next();
        while (null !== commentComprehensiveQueryResult) {
            commentsArray.push(getRestrictedFromCommentComprehensive(commentComprehensiveQueryResult))
        }
        res.status(200).send(commentsArray)
        await atlasDbClient.close();
        return;
    } catch (e: any) {
        let msg: string;
        if (e instanceof MongoError) {
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