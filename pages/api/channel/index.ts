import type { NextApiRequest, NextApiResponse } from 'next';
import { RestError } from '@azure/data-tables';

import AzureTableClient from '../../../modules/AzureTableClient';
import { response405, response500, log } from '../../../lib/utils';

export default async function GetIndex(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;
    if ('GET' !== method) {
        response405(req, res);
        return;
    }
    try {
        // [!] No idenitity ban for this API
        // Step #1 look up channels from [T] ChannelInfo
        const channelInfoTableClient = AzureTableClient('ChannelInfo');
        const ChannelIdIndexQuery = channelInfoTableClient.listEntities({ queryOptions: { filter: `PartitionKey eq 'ChannelIdIndex' and RowKey eq 'default'` } });
        // [!] attemp to reterieve entity makes the probability of causing RestError
        let ChannelIdIndexQueryResult = await ChannelIdIndexQuery.next();
        if (!ChannelIdIndexQueryResult.value) {
            response500(res, 'No records of channel index');
            return;
        }
        const { ChannelIdIndexValue: ChannelIdIndex } = ChannelIdIndexQueryResult.value
        // Step #2 response with post channel list
        // [!] attemp to parese string to object makes the probability of causing SyntaxError
        res.status(200).send(JSON.parse(ChannelIdIndex));
    } catch (e) {
        let msg: string;
        if (e instanceof SyntaxError) {
            msg = `Was trying parse post channel index string.`;
        } else if (e instanceof RestError) {
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