import type { NextApiRequest, NextApiResponse } from 'next';

import AzureTableClient from '../../../../modules/AzureTableClient';
import { response405, response500 } from '../../../../lib/utils';

export default async function GetList(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;
    if ('GET' !== method) {
        response405(req, res);
        return;
    }
    try {
        // [!] No idenitity-ban for this Api
        const { id } = req.query;
        // Step #1 verify channelId
        if ('string' !== typeof id) {
            res.status(400).send('Improper channel id');
            return;
        }
        // Step #2 look up channelId from [Table]
        const channelInfoTableClient = AzureTableClient('ChannelInfo');
        const channelInfoQuery = channelInfoTableClient.listEntities({ queryOptions: { filter: `PartitionKey eq 'ChannelInfo' and RowKey eq '${id}'` } });
        // [!] attemp to reterieve entity makes the probability of causing RestError
        let channelInfoQueryResult = await channelInfoQuery.next();
        if (!channelInfoQueryResult.value) {
            response500(res, 'Corresponding channel info not found');
            return;
        }
        const { CH, EN, SvgIconPath: svgIconPath } = channelInfoQueryResult.value;
        // Step #3 response with channel info
        res.status(200).send({ id, name: { ch: CH, en: EN }, svgIconPath });
    } catch (e) {
        response500(res, `Uncategorized Error occurred. ${e}`);
        return;
    }
}