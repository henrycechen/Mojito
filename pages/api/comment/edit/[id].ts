import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from "next-auth/jwt"

import { MemberInfo } from '../../../../lib/types';
import { response405, response500 } from '../../../../lib/utils';


export default async function Operate(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;
    if (!['GET', 'PUT', 'DELETE'].includes(method ?? '')) {
        response405(req, res);
        return;
    }
    // Step #0 verify identity
    const {id} = req.query; 
    // Step #1 verify comment id
    if ('string' !== typeof id) {
        res.status(400).send('Improper member id');
        return;
    }
    res.send('ok')
    return;


}