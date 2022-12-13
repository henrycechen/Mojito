import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt'

import { MemberInfo } from '../../../../../../lib/types';
import { response405, response500 } from '../../../../../../lib/utils';

export default async function CommentInfoIndex(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;
    if (!['GET', 'POST', 'PUT', 'DELETE'].includes(method ?? '')) {
        response405(req, res);
        return;
    }
    const { id } = req.query;
    // Step #1 verify comment id
    if ('string' !== typeof id) {
        res.status(400).send('Improper member id');
        return;
    } 
    //// GET //// comment info ////
    if ('GET' === method) {

        res.send('ok');
        return;
    }
    // Step #1.2 verify comment status
    // Step #1.2 verify identity 
    // const 
    // POST //// express attitude ////
    if ('POST' === method) {
        const {attitude} = req.query; // attitude: -1 | 1
        // Step #2 verify attitude value
        if ('string' !== attitude) {
            res.status(400).send('Improper attitude value');
            return;
        }
        // Step #3 [PRL] AttitudeCommentMapping
        // Step #4 [PRL] NotifyLiked (conditional)
        // Step #5 [C] Notification (accumlate)
        // Step #6 [C] CommentStatistics (accumlate)
        res.send('ok');
        return;
    }

    //// PUT //// edit comment ////
    if ('PUT' === method) {
        // Step # [T] PostCommentMappingComprehensive
        // if cued, Step # [PRL] NotifyReplied + [C] Notification
        res.send('ok');
        return;
    }
    //// DELETE /// delete comment ////
    if ('DELETE' === method) {
        // Step # [T] PostCommentMappingComprehensive
        // Step #6 [C] CommentStatistics (decrease)
        // Step # [C] memberStatistics.commentCount (decrease)
        res.send('ok');
        return;
    }
}