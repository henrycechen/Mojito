import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';

import { MemberInfo } from '../../../../../../lib/types';
import { response405, response500 } from '../../../../../../lib/utils';

// This index only accept POST 'create' comment
// Use 'api/comment/of/[postId]/info/[commentId]' to GET comment info

// Default to NotifyReplied when Commented (UI)

export default async function CreateComment(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;
    if ('POST' !== method) {
        response405(req, res);
        return;
    }
    // Step #1 verify post id
    // Step #2 verify identity
    // Step #3 verify post status
    // Step #4.1 create a new comment id
    // Step #4.2 createEntity (commentInfo:ICommentComprehensive) to [T] PostCommentMappingComprehensive
    // Step #4.3 createEntity (noticeInfo:INoticeInfo) [PRL] NotifyReplied
    
    res.send('comment created');

}