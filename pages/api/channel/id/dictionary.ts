import type { NextApiRequest, NextApiResponse } from 'next';
import { RestError } from '@azure/data-tables';

import AzureTableClient from '../../../../modules/AzureTableClient';
import { ChannelInfo } from '../../../../lib/types';
import { response405, response500, log } from '../../../../lib/utils';


export default async function GetDictionary(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;
    if ('GET' !== method) {
        response405(req, res);
        return;
    }
    try {
        // [!] No idenitity ban for this API
        // Step #1 look up channels from [Table]
        const channelInfoTableClient = AzureTableClient('ChannelInfo');
        const channelInfoQuery = channelInfoTableClient.listEntities({ queryOptions: { filter: `PartitionKey eq 'Info' and IsActive eq true` } });
        // [!] attemp to reterieve entity makes the probability of causing RestError
        let channelInfoQueryResult = await channelInfoQuery.next();
        if (!channelInfoQueryResult.value) {
            response500(res, 'No records of channel dictionary');
            return;
        }
        const channelInfo: { [key: string]: ChannelInfo } = {};
        do {
            const { rowKey, TW, CN, EN, SvgIconPath } = channelInfoQueryResult.value
            channelInfo[rowKey] = {
                id: rowKey,
                name: {
                    tw: TW,
                    cn: CN,
                    en: EN
                },
                svgIconPath: SvgIconPath
            }
            channelInfoQueryResult = await channelInfoQuery.next();
        } while (!channelInfoQueryResult.done)
        // Step #2 response with post channel list
        res.status(200).send(channelInfo);
    } catch (e: any) {
        let msg: string;
        if (e instanceof RestError) {
            msg = `Attempt to communicate with azure table storage.`;
        } else {
            msg = `Uncategorized. ${e?.msg}`;
        }
        response500(res, msg);
        log(msg, e);
        return;
    }
}