import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from "next-auth/jwt"

import AzureTableClient from '../../../modules/AzureTableClient';
import { ChannelInfo } from '../../../lib/types';
import { response405, response500 } from '../../../lib/utils';


export default async function GetList(req: NextApiRequest, res: NextApiResponse) {
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
        const channelInfoQuery = channelInfoTableClient.listEntities({ queryOptions: { filter: `PartitionKey eq 'ChannelInfo' and IsActive eq true` } });
        // [!] attemp to reterieve entity makes the probability of causing RestError
        let channelInfoQueryResult = await channelInfoQuery.next();
        if (!channelInfoQueryResult.value) {
            response500(res, 'No records of post channels');
            return;
        }
        const channelInfo: { [key: string]: ChannelInfo } = {};
        do {
            const { rowKey, CH, EN, SvgIconPath } = channelInfoQueryResult.value
            channelInfo[rowKey] = {
                id: rowKey,
                name: {
                    ch: CH,
                    en: EN
                },
                svgIconPath: SvgIconPath
            }
            channelInfoQueryResult = await channelInfoQuery.next();
        } while (!channelInfoQueryResult.done)
        // Step #3 response with post channel list
        res.status(200).send(channelInfo);
    } catch (e) {
        response500(res, `Uncategorized Error occurred. ${e}`);
        return;
    }
}