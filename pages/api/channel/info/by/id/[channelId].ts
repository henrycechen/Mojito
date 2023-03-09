import type { NextApiRequest, NextApiResponse } from 'next';
import { RestError } from '@azure/data-tables';

import AzureTableClient from '../../../../../../modules/AzureTableClient';
import { logWithDate, response405, response500 } from '../../../../../../lib/utils/general';
const fname = GetChannelInfoById.name;

/** GetChannelInfoById v0.1.1
 * 
 * Last update: 21/02/2023
 * 
 * This interface ONLY accepts GET requests
 * 
 * Info required for GET requests
 * - channelId: string (query, member id)
 * 
 */

export default async function GetChannelInfoById(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;
    if ('GET' !== method) {
        response405(req, res);
        return;
    }
    try {
        const { channelId } = req.query;
        // #1 verify channelId
        if (!('string' === typeof channelId && '' !== channelId)) {
            res.status(400).send('Improper channel id');
            return;
        }
        // #2 look up channelId from [Table] ChannelInfo
        const channelInfoTableClient = AzureTableClient('ChannelInfo');
        const channelInfoQuery = channelInfoTableClient.listEntities({ queryOptions: { filter: `PartitionKey eq 'Info' and RowKey eq '${channelId}'` } });
        // [!] attemp to reterieve entity makes the probability of causing RestError
        let channelInfoQueryResult = await channelInfoQuery.next();
        if (!channelInfoQueryResult.value) {
            response500(res, 'Channel info not found');
            return;
        }
        const { TW, CN, EN, SvgIconPath: svgIconPath } = channelInfoQueryResult.value;
        // #3 response with channel info
        res.status(200).send({ id: channelId, name: { tw: TW, cn: CN, en: EN }, svgIconPath });
    } catch (e: any) {

        let msg;
        if (e instanceof RestError) {
            msg = `Attempt to communicate with azure table storage.`;
        } else {
            msg = `Uncategorized. ${e?.msg}`;
        }
        if (!res.headersSent) {
            response500(res, msg);
        }
        logWithDate(msg, fname, e);
        return;
    }
}