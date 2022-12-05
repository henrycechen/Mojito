import type { NextApiRequest, NextApiResponse } from 'next';
import { RestError } from '@azure/data-tables';
import CryptoJS from 'crypto-js';

import AtlasDatabaseClient from '../../../../../modules/AtlasDatabaseClient';
import AzureTableClient from '../../../../../modules/AzureTableClient';
import { AzureTableEntity } from '../../../../../lib/types';
import { verifyRecaptchaResponse, verifyEnvironmentVariable, response405, response500 } from '../../../../../lib/utils';

const appSecret = process.env.APP_AES_SECRET ?? '';
const recaptchaServerSecret = process.env.INVISIABLE_RECAPTCHA_SECRET_KEY ?? '';

export default async function VerifyToken(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;


    const atlasDbClient = AtlasDatabaseClient();
    try {
        await atlasDbClient.connect();
        const memberStatisticsCollectionClient = atlasDbClient.db('mojito-statistics-dev').collection('memberStatistics');
        // const result = await atlasDbClient.db('mojito-statistics-dev').collection('memberStatistics').findOne({memberId: '6TTK1WH0OD'})
        // console.log(result);

        // const result = await memberStatisticsCollectionClient.findOne({memberId: '6TTK1WH0OD'})
        const result = await memberStatisticsCollectionClient.insertOne({memberId: 'test_member_id', memberIdIndex: 2})
        // const result = await memberStatisticsCollectionClient.replaceOne({ memberId: 'test_member_id' }, { memberId: 'test_member_id', memberIdIndex: 3 })
        res.send(result)

    } catch (error) {

    } finally {
        atlasDbClient.close();
    }
}