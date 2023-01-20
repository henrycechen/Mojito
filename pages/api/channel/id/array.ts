import type { NextApiRequest, NextApiResponse } from 'next';
import { RestError } from '@azure/data-tables';

import AzureTableClient from '../../../../modules/AzureTableClient';
import { response405, response500, log } from '../../../../lib/utils';

export default async function GetIdArray(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;
    if ('GET' !== method) {
        response405(req, res);
        return;
    }
    try {
        // [!] No idenitity ban for this API
        // Step #1 look up channels from [T] ChannelInfo
        const channelInfoTableClient = AzureTableClient('ChannelInfo');
        const ChannelIdIndexQuery = channelInfoTableClient.listEntities({ queryOptions: { filter: `PartitionKey eq 'IdArray' and RowKey eq 'default'` } });
        // [!] attemp to reterieve entity makes the probability of causing RestError
        let ChannelIdIndexQueryResult = await ChannelIdIndexQuery.next();
        if (!ChannelIdIndexQueryResult.value) {
            response500(res, 'No records of channel id array');
            return;
        }
        const { IndexValue: channelIdIndex } = ChannelIdIndexQueryResult.value
        // Step #2 response with post channel list
        // [!] attemp to parese string to object makes the probability of causing SyntaxError
        res.status(200).send(JSON.parse(channelIdIndex));
    } catch (e: any) {
        let msg: string;
        if (e instanceof SyntaxError) {
            msg = `Attempt to parse post channel id array string.`;
        } else if (e instanceof RestError) {
            msg = 'Attempt to communicate with azure table storage.';
        } else {
            msg = `Uncategorized. ${e?.msg}`;
        }
        response500(res, msg);
        log(msg, e);
        return;
    }
}