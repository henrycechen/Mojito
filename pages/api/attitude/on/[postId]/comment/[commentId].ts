import type { NextApiRequest, NextApiResponse } from 'next';

import { response405, response500, log } from '../../../../../../lib/utils';

export default async function AttitudeOnPostIndex(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;
    if ('POST' !== method) {
        response405(req, res);
        return;
    }
    //// Verify identity ////

    res.send('attitude on comment, ok');
}