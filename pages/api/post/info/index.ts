import type { NextApiRequest, NextApiResponse } from 'next';
import { RestError } from '@azure/data-tables';

import AzureTableClient from '../../../../modules/AzureTableClient';
import { ChannelInfo } from '../../../../lib/types';
import { response405, response500, log } from '../../../../lib/utils';


export default async function CreatePostInfo(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;
    if ('POST' !== method) {
        response405(req, res);
        return;
    }
    try {
        
        res.status(200).send('ok');
    } catch (e) {
        let msg: string;
        if (e instanceof RestError) {
            msg = `Was trying communicating with table storage.`;
        }
        else {
            msg = `Uncategorized Error occurred`;
        }
        response500(res, msg);
        log(msg, e);
        return;
    }
}