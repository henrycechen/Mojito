import type { NextApiRequest, NextApiResponse } from 'next';
import { RestError } from '@azure/data-tables';

import AzureTableClient from '../../../../../../modules/AzureTableClient';
import { response405, response500, log } from '../../../../../../lib/utils';

export default async function GetChannelInfoById(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;
    if ('GET' !== method) {
        response405(req, res);
        return;
    }
    try {
        const { channelId } = req.query;
        // Step #1 verify channelId
        if (!('string' === typeof channelId && '' !== channelId)) {
            res.status(400).send('Improper channel id');
            return;
        }
        // Step #2 look up channelId from [Table] ChannelInfo
        const channelInfoTableClient = AzureTableClient('ChannelInfo');
        const channelInfoQuery = channelInfoTableClient.listEntities({ queryOptions: { filter: `PartitionKey eq 'Info' and RowKey eq '${channelId}'` } });
        // [!] attemp to reterieve entity makes the probability of causing RestError
        let channelInfoQueryResult = await channelInfoQuery.next();
        if (!channelInfoQueryResult.value) {
            response500(res, 'Channel info not found');
            return;
        }
        const { TW, CN, EN, SvgIconPath: svgIconPath } = channelInfoQueryResult.value;
        // Step #3 response with channel info
        res.status(200).send({ id: channelId, name: { tw: TW, cn: CN, en: EN }, svgIconPath });
    } catch (e: any) {

        let msg;
        if (e instanceof RestError) {
            msg = 'Attempt to communicate with azure table storage.';
        } else {
            msg = `Uncategorized. ${e?.msg}`;
        }
        if (!res.headersSent) {
            response500(res, msg);
        }
        log(msg, e);
        return;
    }
}