import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from "next-auth/jwt"

import { MemberInfo } from '../../../../../lib/types';
import { response405, response500 } from '../../../../../lib/utils';


export default async function Save(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;
    // GET - Follow request
    // PUT - Unfollow request
    // req.query.id - following member id
    if ('POST' !== method) {
        response405(req, res);
        return;
    }
    // Step #0 verify identity
    res.send('ok')
    return;


}