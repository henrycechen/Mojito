import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from "next-auth/jwt"

import AzureTableClient from '../../../../modules/AzureTableClient';
import { PostChannel } from '../../../../lib/types';
import { response405, response500 } from '../../../../lib/utils';


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
        const loginCredentialsMappingTableClient = AzureTableClient('PostChannel');
        const postChannelQuery = loginCredentialsMappingTableClient.listEntities({ queryOptions: { filter: `PartitionKey eq 'PostChannelIndex' and RowKey eq 'default'` } });
        // [!] attemp to reterieve entity makes the probability of causing RestError
        let postChannelQueryResult = await postChannelQuery.next();
        if (!postChannelQueryResult.value) {
            response500(res, 'No records of post channels');
            return;
        }
        const { value: postChannelIndex } = postChannelQueryResult.value
        // Step #3 response with post channel list
        // [!] attemp to parese string to object makes the probability of causing SyntaxError
        res.status(200).send(JSON.parse(postChannelIndex));
    } catch (e) {
        if (e instanceof SyntaxError) {
            response500(res, `Was trying parse post channel index. ${e}`);
        } else {
            response500(res, `Uncategorized Error occurred. ${e}`);
        }
        return;
    }
}