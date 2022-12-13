import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from "next-auth/jwt"

import { MemberInfo } from '../../../../../../lib/types';
import { response405, response500 } from '../../../../../../lib/utils';

export default async function Index(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;
    if ('GET' !== method) {
        response405(req, res);
        return;
    }
    try {
        // [!] Conditional idenitity-ban for this Api
        const { id } = req.query; // comment id
       
        res.send(id);
    } catch (e) {
        response500(res, `Was trying . ${e}`);
        return;
    }
}