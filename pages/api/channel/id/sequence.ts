import type { NextApiRequest, NextApiResponse } from 'next';
import { RestError } from '@azure/data-tables';

import AzureTableClient from '../../../../modules/AzureTableClient';
import { response405, response500, logWithDate } from '../../../../lib/utils/general';

const fnn = `${GetChannelIdSequence.name} (API)`;

/** 
 * This interface ONLY accepts GET requests
 * 
 * No info required for GET requests
 * 
 * Last update:
 * - 21/02/2023 v0.1.1
 */

export default async function GetChannelIdSequence(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;
    if ('GET' !== method) {
        response405(req, res);
        return;
    }
    try {
        // #1 look up channels from [T] ChannelInfo
        const channelInfoTableClient = AzureTableClient('ChannelInfo');
        const ChannelIdArrayQuery = channelInfoTableClient.listEntities({ queryOptions: { filter: `PartitionKey eq 'IdArray' and RowKey eq 'default'` } });
        // [!] attemp to reterieve entity makes the probability of causing RestError
        let ChannelIdArrayQueryResult = await ChannelIdArrayQuery.next();
        if (!ChannelIdArrayQueryResult.value) {
            response500(res, 'No records of channel id array');
            return;
        }
        const { IdArrayValue } = ChannelIdArrayQueryResult.value;
        // #2 response with channel id array (stringified string)
        res.status(200).send(IdArrayValue);
        return;
    } catch (e: any) {
        let msg: string;
        if (e instanceof SyntaxError) {
            msg = `Attempt to parse post channel id array string.`;
        } else if (e instanceof RestError) {
            msg = `Attempt to communicate with azure table storage.`;
        } else {
            msg = `Uncategorized. ${e?.msg}`;
        }
        if (!res.headersSent) {
            response500(res, msg);
        }
        logWithDate(msg, fnn, e);
        return;
    }
}