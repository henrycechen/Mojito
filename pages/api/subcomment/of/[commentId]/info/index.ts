import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from "next-auth/jwt"

import { MemberInfo } from '../../../../../../lib/types';
import { response405, response500 } from '../../../../../../lib/utils';

// This index only accept POST/PUT/DELETE request to 'create' / 'update' / 'delete' subcomment
// Use 'api/subcomment/of/[commentId]/info/[subcommentId]' to GET subcomment info

// Default to NotifyReplied when reply to Comment (UI)
// Default to NotifyCued when reply to Subcomment (UI)

export default async function CreateSubcomment(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;
    if ('POST' !== method) {
        response405(req, res);
        return;
    }
    // Step #1 verify comment id
    res.send('subcomment created');
    // Step #2 verify identity
    // Step #3 verify post status
    // Step #4.1 create a new comment id
    // Step #4.2 createEntity (commentInfo) to [T] CommentSubcommentMappingComprehensive
    // Step #4.3 createEntity (noticeInfo:INoticeInfo) NotifyReplied


}