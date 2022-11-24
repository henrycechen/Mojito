import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from "next-auth/jwt"

import { MemberInfo } from '../../../lib/types';
import { response405, response500 } from '../../../lib/utils';

// This index only accept POST/PUT/DELETE request to 'create' / 'update' / 'delete' subcomment
// Use 'api/subcomment/[subcommentId]' to GET subcomment info

export default async function Index(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;
    if ('POST' === method) {
        res.send('ok')
        return;
    }
    if ('PUT' === method) {
        res.send('ok')
        return;
    }
    if ('DELETE' === method) {
        res.send('ok')
        return;
    }
    response405(req, res);
    return;


}