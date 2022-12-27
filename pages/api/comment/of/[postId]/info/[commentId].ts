import type { NextApiRequest, NextApiResponse } from 'next';
import { MongoError } from 'mongodb';
import { getToken } from 'next-auth/jwt'

import AtlasDatabaseClient from "../../../../../../modules/AtlasDatabaseClient";

import { ICommentComprehensive } from '../../../../../../lib/interfaces';
import { MemberInfo } from '../../../../../../lib/types';
import { verifyId, response405, response500, log } from '../../../../../../lib/utils';

export default async function CommentInfoIndex(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;
    if (!['GET', 'POST', 'PUT', 'DELETE'].includes(method ?? '')) {
        response405(req, res);
        return;
    }
    //// Verify identity ////
    const token = await getToken({ req });
    if (!(token && token?.sub)) {
        // called by member him/herself
        res.status(400).send('Invalid identity');
        return;
    }
    const { sub: memberId } = token;
    const { postId, commentId } = req.query;
    //// Verify post id and comment id ////
    if (!(verifyId(postId, 16) && verifyId(commentId, 16))) {
        res.status(400).send('Invalid post id or comment id');
        return;
    }
    //// Declare DB client ////
    const atlasDbClient = AtlasDatabaseClient();
    try {

        atlasDbClient.connect();
        //// Look up comment (ICommentComprehensive) in [C] commentComprehensive
        const commentComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<ICommentComprehensive>('comment');
        const commentComprehensiveQueryResult = await commentComprehensiveCollectionClient.findOne<ICommentComprehensive>({ postId, commentId });
        if (null === commentComprehensiveQueryResult) {
            res.status(404).send('comment document not found');
            await atlasDbClient.close();
            return;
        }
        //// GET | info ////
        if ('GET' === method) {
            //TODO: do some other stuff
            const { status: commentStatus } = commentComprehensiveQueryResult;
            if ([-3, -1].includes(commentStatus)) {
                // send content + '[deleted]'
            } else if (200 === commentStatus) {
                // send content
            } else if (201 === commentStatus) {
                // send content + '[edited]'
            } else {
                throw new Error(`Invalid comment status code (${commentStatus}) for comment id: ${commentId}`);
            }
            res.status(200).send(commentComprehensiveQueryResult);
        }
        //// PUT | edit ////
        if ('PUT' === method) {
            const requestInfo = req.body;
            const { content } = JSON.parse(requestInfo);
            //// [!] attemp to parse info JSON string makes the probability of causing SyntaxError ////

            // Step # [T] PostCommentMappingComprehensive
            await commentComprehensiveCollectionClient.updateOne({ postId, commentId }, {
                $set: {
                    content
                }
            });
            // if cued, Step # [PRL] NotifyReplied + [C] Notification
            res.status(200).send('ok');
            const memberStatisticsCollectionClient = atlasDbClient.db('statistics').collection<ICommentComprehensive>('member');
            await memberStatisticsCollectionClient.updateOne({ memberId }, {
                $inc: {
                    totalCommentEditCount: 1
                }
            });
        }
        //// DELETE | delete comment ////
        if ('DELETE' === method) {
            // Step # [T] PostCommentMappingComprehensive
            await commentComprehensiveCollectionClient.updateOne({ postId, commentId }, {
                $set: {
                    status: -1
                }
            });
            const memberStatisticsCollectionClient = atlasDbClient.db('statistics').collection<ICommentComprehensive>('member');
            await memberStatisticsCollectionClient.updateOne({ memberId }, {
                $inc: {
                    totalCommentDeleteCount: 1
                }
            });
            res.status(200).send('ok');
        }
        await atlasDbClient.close();
        return;
    } catch (e: any) {
        let msg;
        if (e instanceof SyntaxError) {
            res.status(400).send('Improperly normalized request info');
            return;
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