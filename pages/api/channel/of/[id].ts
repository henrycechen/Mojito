import type { NextApiRequest, NextApiResponse } from 'next';
import { RestError } from '@azure/data-tables';

import AzureTableClient from '../../../../modules/AzureTableClient';
import { response405, response500, log } from '../../../../lib/utils';

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
        if (!('string' === typeof id && '' !== id)) {
            res.status(400).send('Improper channel id');
            return;
        }
        // Step #2 look up channelId from [Table] ChannelInfo
        const channelInfoTableClient = AzureTableClient('ChannelInfo');
        const channelInfoQuery = channelInfoTableClient.listEntities({ queryOptions: { filter: `PartitionKey eq 'Info' and RowKey eq '${id}'` } });
        // [!] attemp to reterieve entity makes the probability of causing RestError
        let channelInfoQueryResult = await channelInfoQuery.next();
        if (!channelInfoQueryResult.value) {
            response500(res, 'Channel info not found');
            return;
        }
        const { TW, CN, EN, SvgIconPath: svgIconPath } = channelInfoQueryResult.value;
        // Step #3 response with channel info
        res.status(200).send({ id, name: { tw: TW, cn: CN, en: EN }, svgIconPath });
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