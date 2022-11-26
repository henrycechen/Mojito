import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from "next-auth/jwt"

import AzureTableClient from '../../../modules/AzureTableClient';
import { response405, response500 } from '../../../lib/utils';

export default async function GetIndex(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;
    if ('GET' !== method) {
        response405(req, res);
        return;
    }
    try {
        // const token = await getToken({ req });
        // // Step #0 verify session
        // if (!token) {
        //     res.status(401).send('Unauthorized');
        //     return;
        // }
        // Step #2 look up channels from [Table]
        const channelInfoTableClient = AzureTableClient('ChannelInfo');
        const ChannelIdIndexQuery = channelInfoTableClient.listEntities({ queryOptions: { filter: `PartitionKey eq 'ChannelIdIndex' and RowKey eq 'default'` } });
        // [!] attemp to reterieve entity makes the probability of causing RestError
        let ChannelIdIndexQueryResult = await ChannelIdIndexQuery.next();
        if (!ChannelIdIndexQueryResult.value) {
            response500(res, 'No records of channel index');
            return;
        }
        const { ChannelIdIndexValue: ChannelIdIndex } = ChannelIdIndexQueryResult.value
        // Step #3 response with post channel list
        // [!] attemp to parese string to object makes the probability of causing SyntaxError
        res.status(200).send(JSON.parse(ChannelIdIndex));
    } catch (e) {
        if (e instanceof SyntaxError) {
            response500(res, `Was trying parse post channel index. ${e}`);
        } else {
            response500(res, `Uncategorized Error occurred. ${e}`);
        }
        return;
    }
}