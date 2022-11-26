import type { NextApiRequest, NextApiResponse } from 'next';
import { RestError } from '@azure/data-tables';
import CryptoJS from 'crypto-js';

import AzureTableClient from '../../../../../modules/AzureTableClient';
import { AzureTableEntity, MemberIdIndex } from '../../../../../lib/types';
import { verifyRecaptchaResponse, verifyEnvironmentVariable, response405, response500 } from '../../../../../lib/utils';

const appSecret = process.env.APP_AES_SECRET ?? '';
const recaptchaServerSecret = process.env.INVISIABLE_RECAPTCHA_SECRET_KEY ?? '';

export default async function VerifyToken(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;
    if ('POST' !== method) {
        response405(req, res);
        return;
    }
    try {
        // Step #0 verify environment variables
        const environmentVariable = verifyEnvironmentVariable({ appSecret, recaptchaServerSecret });
        if (!!environmentVariable) {
            response500(res, `${environmentVariable} not found`);
            return;
        }
        const { recaptchaResponse } = req.query;
        // Step #1 verify if it is bot
        const { status, message } = await verifyRecaptchaResponse(recaptchaServerSecret, recaptchaResponse);
        if (200 !== status) {
            if (403 === status) {
                res.status(403).send(message);
                return;
            }
            if (500 === status) {
                response500(res, message);
                return;
            }
        }
        // Step #2 verify request info
        const { requestInfo } = req.query;
        if ('string' !== typeof requestInfo || '' === requestInfo) {
            res.status(403).send('Invalid request info');
            return;
        }
        // Step #3.1 decode base64 string to cypher
        const infoCypher = Buffer.from(requestInfo, 'base64').toString();
        // Step #3.2 decode cypher to json string
        const infoJsonStr = CryptoJS.AES.decrypt(infoCypher, appSecret).toString(CryptoJS.enc.Utf8);
        if (infoJsonStr.length === 0) {
            res.status(400).send('Inappropriate request info');
            return;
        }
        // [!] attemp to parse info json string makes the probability of causing SyntaxError
        const { memberId } = JSON.parse(infoJsonStr);
        if (!memberId) {
            res.status(400).send('Incomplete request info');
            return;
        }
        // Step #4.1 look up account status from [Table] MemberManagement
        const memberManagementTableClient = AzureTableClient('MemberManagement');
        const memberStatusQuery = memberManagementTableClient.listEntities({ queryOptions: { filter: `PartitionKey eq '${memberId}' and RowKey eq 'MemberStatus'` } });
        const memberStatusQueryResult = await memberStatusQuery.next();
        if (!memberStatusQueryResult.value) {
            res.status(404).send('Account status not found');
            return;
        }
        // Step #4.2 verify account status
        const { MemberStatusValue: memberStatusValue } = memberStatusQueryResult.value;
        if (0 !== memberStatusValue) {
            res.status(400).send('Member is not activatable');
            return;
        }
        // Step #3.4 updateEntity to [Table] MemberManagement
        const memberStatus: AzureTableEntity = {
            partitionKey: memberId,
            rowKey: 'MemberStatus',
            MemberStatusValue: 200
        }
        await memberManagementTableClient.updateEntity(memberStatus, 'Merge');
        res.status(200).send('Account verified');
        // FIXME: statistic moved to MongoDB Atlas collections

        // // Step #4.1 createEntity to [Table] MemberStatistics
        // const memberStatisticsTableClient = AzureTableClient('MemberStatistics');
        // const memberIdIndex: MemberIdIndex = {
        //     partitionKey: 'MemberIdIndex',
        //     rowKey: memberId,
        //     MemberIdIndexValue: 0
        // }
        // await memberStatisticsTableClient.createEntity(memberIdIndex);
        // // Step #4.2 get member id index
        // const memberIdIndexQuery = memberStatisticsTableClient.listEntities({ queryOptions: { filter: `PartitionKey eq 'MemberIdIndex' and RowKey eq '${memberId}'` } });
        // let i: number = 0;
        // for await (const memberIdIndexEntity of memberIdIndexQuery) {
        //     if (memberId === memberIdIndexEntity.rowKey) {
        //         memberIdIndex.MemberIdIndexValue = i;
        //         return;
        //     } else {
        //         i++;
        //     }
        // }
        // // Step #4.3 updateEntity to [Table] MemberStatistics
        // await memberStatisticsTableClient.updateEntity(memberIdIndex, 'Merge');
    } catch (e) {
        if (e instanceof SyntaxError) {
            res.status(400).send('Improperly normalized request info');
        }
        else if (e instanceof TypeError) {
            response500(res, `Was trying decoding recaptcha verification response. ${e}`);
        }
        else if (e instanceof RestError) {
            response500(res, `Was trying communicating with db. ${e}`);
        }
        else {
            response500(res, `Uncategorized Error occurred. ${e}`);
        }
        return;
    }
}