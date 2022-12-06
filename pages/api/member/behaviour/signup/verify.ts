import type { NextApiRequest, NextApiResponse } from 'next';
import { RestError } from '@azure/data-tables';
import CryptoJS from 'crypto-js';

import AzureTableClient from '../../../../../modules/AzureTableClient';
import AtlasDatabaseClient from '../../../../../modules/AtlasDatabaseClient';

import { verifyRecaptchaResponse, verifyEnvironmentVariable, response405, response500 } from '../../../../../lib/utils';
import { IMemberInfo, IMemberManagement, IMemberIdIndex, IMemberStatistics } from '../../../../../lib/interfaces';

const appSecret = process.env.APP_AES_SECRET ?? '';
const recaptchaServerSecret = process.env.INVISIABLE_RECAPTCHA_SECRET_KEY ?? '';

export default async function VerifyToken(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;
    if ('POST' !== method) {
        response405(req, res);
        return;
    }
    const atlasDbClient = AtlasDatabaseClient();
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
        // [!] attemp to parse info JSON string makes the probability of causing SyntaxError
        const { memberId } = JSON.parse(infoJsonStr);
        if (!memberId) {
            res.status(400).send('Incomplete request info');
            return;
        }
        // Step #4.1 look up management record in [T] MemberComprehensive.Management
        const memberComprehensiveTableClient = AzureTableClient('MemberComprehensive');

        const memberManagementQuery = memberComprehensiveTableClient.listEntities({ queryOptions: { filter: `PartitionKey eq '${memberId}' and RowKey eq 'Management'` } });
        const memberManagementQueryResult = await memberManagementQuery.next();
        if (!memberManagementQueryResult.value) {
            res.status(404).send('Member management record not found');
            return;
        }
        // Step #4.2 verify MemberManagement.MemberStatus
        const { MemberStatus: memberStatus } = memberManagementQueryResult.value;
        if (0 !== memberStatus) {
            res.status(409).send('Request for activating member cannot be fulfilled');
            return;
        }
        // Step #4.3 updateEntity (memberInfo) to [T] MemberComprehensive.Info
        const memberInfo: IMemberInfo = {
            partitionKey: memberId,
            rowKey: 'Info',
            VerifiedTimestamp: new Date().toISOString(),
        }
        await memberComprehensiveTableClient.updateEntity(memberInfo, 'Merge');
        // Step #4.4 updateEntity (memberManagement) to [T] MemberComprehensive.Management
        const memberManagement: IMemberManagement = {
            partitionKey: memberId,
            rowKey: 'Management',
            MemberStatus: 200,
            AllowPosting: true,
            AllowCommenting: true
        }
        await memberComprehensiveTableClient.updateEntity(memberManagement, 'Merge');
        res.status(200).send('Account verified');
        // Step #5.1 createEntity (memberIdIndex) to [PRL] Statistics
        const memberIdIndex: IMemberIdIndex = {
            partitionKey: 'MemberIdIndex',
            rowKey: memberId,
            MemberIdIndex: 0,
        }
        const statisticsTableClient = AzureTableClient('Statistics');
        await statisticsTableClient.createEntity(memberIdIndex);
        // Step #5.2 look up member id index in [PRL] Statistics
        const memberIdIndexQuery = statisticsTableClient.listEntities({ queryOptions: { filter: `PartitionKey eq 'MemberIdIndex' and RowKey eq '${memberId}'` } });
        let i = 0;
        for await (const memberIdIndexEntity of memberIdIndexQuery) {
            if (memberId === memberIdIndexEntity.rowKey) {
                memberIdIndex.MemberIdIndex = i;
                return;
            } else {
                i++;
            }
        }
        // Step #5.3 updateEntity (memberIdIndex) to [PRL] Statistics
        await statisticsTableClient.updateEntity(memberIdIndex, 'Merge');
        // Step #6 insertOne (memberStatistics) to [C] memberStatistics
        const memberStatistics: IMemberStatistics = {
            memberId,
            postCount: 0,
            replyCount: 0,
            likeCount: 0,
            dislikeCount: 0,
            saveCount: 0,
            followingCount: 0,
            followedByCount: 0,
            blockedCount: 0,
        }
        await atlasDbClient.connect();
        const memberStatisticsCollectionClient = atlasDbClient.db('mojito-statistics-dev').collection('memberStatistics');
        await memberStatisticsCollectionClient.insertOne(memberStatistics);
    } catch (e) {
        if (res.headersSent) {

        } else if (e instanceof SyntaxError) {
            res.status(400).send('Improperly normalized request info');
        }
        else if (e instanceof TypeError) {
            response500(res, `Was trying decoding recaptcha verification response. ${e}`);
        }
        else if (e instanceof RestError) {
            response500(res, `Was trying communicating with table storage. ${e}`);
        }
        else {
            response500(res, `Uncategorized Error occurred. ${e}`);
        }
        console.log(e);
    } finally {
        atlasDbClient.close();
    }
}