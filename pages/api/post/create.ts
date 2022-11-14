import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from "next-auth/jwt"

import AzureTableClient from '../../../modules/AzureTableClient';
import { PostChannel } from '../../../lib/types';
import { response405, response500 } from '../../../lib/utils';


export default async function Channel(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;
    if ('GET' !== method) {
        response405(req, res);
        return;
    }
    res.send('ok')
}