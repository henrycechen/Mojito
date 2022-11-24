import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from "next-auth/jwt"

import AzureTableClient from '../../../modules/AzureTableClient';
import { AzureTableEntity, PostInfo } from '../../../lib/types';
import { getRandomStr, response405, response500 } from '../../../lib/utils';
import { RestError } from '@azure/storage-blob';



export default async function Channel(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;
    if ('POST' !== method) {
        response405(req, res);
        return;
    }
    try {
        // Step #0 verify token (session)
        const token = await getToken({ req });
        if (!token) {
            res.status(401).send('Unauthorized');
            return;
        }
        const { id: memberId } = token;
        if ('string' !== typeof memberId || '' === memberId) {
            res.status(401).send('Unauthorized');
            return;
        }
        // Step #1 verify post integrity
        const { title, content, channelId: channel, imageUrlList }: PostInfo = req.body;
        if ('string' !== typeof title || '' === title) {
            res.status(400).send('Improper post title');
            return;
        }
        if ('string' !== typeof content) {
            res.status(400).send('Improper post content');
            return;
        }
        if ('string' !== typeof channel || '' === channel) {
            res.status(400).send('Improper post channel');
            return;
        }
        if ('object' !== typeof imageUrlList) {
            res.status(400).send('Improper post image url list');
            return;
        }
        // Step #2.1 create a postId
        const postId = getRandomStr();
        // Step #2.2 loop up postId from [Table] PostManagement
        const PostManagementTableClient = AzureTableClient('PostManagement');
        const mappingQuery = PostManagementTableClient.listEntities({ queryOptions: { filter: `PartitionKey eq '${postId}' and RowKey eq 'PostStatus'` } });
        // [!] attemp to reterieve entity makes the probability of causing RestError
        const mappingQueryResult = await mappingQuery.next();
        if (mappingQueryResult.value && mappingQueryResult.value.PostStatus !== -1) { // PostStatus (-1): Inactive / Deactivated
            res.status(400).send('PostId has been registered');
            return;
        }
        const postInfoTableClient = AzureTableClient('PostInfo');
        // Step #3.1 upsertEntity memberId to [Table] PostInfo
        const postInfoMemberId: AzureTableEntity = {
            partitionKey: postId,
            rowKey: 'MemberId',
            MemberIdStr: memberId
        }
        await postInfoTableClient.upsertEntity(postInfoMemberId, 'Replace');
        // Step #3.2 upsertEntity image url list to [Table] PostInfo
        const postInfoImageUrlList: AzureTableEntity = {
            partitionKey: postId,
            rowKey: 'ImageUrlList',
            ImageUrlListStr: JSON.stringify(imageUrlList)
        }
        await postInfoTableClient.upsertEntity(postInfoImageUrlList, 'Replace');
        // Step #3.3 upsertEntity title to [Table] PostInfo
        const postInfoTitle: AzureTableEntity = {
            partitionKey: postId,
            rowKey: 'Title',
            TitleStr: title
        }
        await postInfoTableClient.upsertEntity(postInfoTitle, 'Replace');
        // Step #3.4 upsertEntity content to [Table] PostInfo
        const postInfoContent: AzureTableEntity = {
            partitionKey: postId,
            rowKey: 'Content',
            ContentStr: content
        }
        await postInfoTableClient.upsertEntity(postInfoContent, 'Replace');
        // Step #3.5 upsertEntity channel to [Table] PostInfo
        const postInfoChannel: AzureTableEntity = {
            partitionKey: postId,
            rowKey: 'ChannelId',
            ChannelIdStr: channel
        }
        await postInfoTableClient.upsertEntity(postInfoChannel, 'Replace');
        // (Not-in-use) Step #3.6 upsertEntity tags to [Table] PostInfo 
        // Step #4 upsertEntity to [Table] PostMapping
        const postMapping: AzureTableEntity = {
            partitionKey: memberId,
            rowKey: postId
        }
        const postMappingTableClient = AzureTableClient('PostMapping');
        await postMappingTableClient.upsertEntity(postMapping, 'Replace');
        // Step #5 upsertEntity to [Table] PostManagement
        const postmanagementPostStatus: AzureTableEntity = {
            partitionKey: postId,
            rowKey: 'PostStatus',
            PostStatusValue: 200
        }
        await PostManagementTableClient.upsertEntity(postmanagementPostStatus, 'Replace');
        res.status(200).send(postId)
    } catch (e) {
        if (e instanceof SyntaxError) {
            response500(res, `Was trying parsing request body. ${e}`);
        }
        if (e instanceof RestError) {
            response500(res, `Was trying communicating with db. ${e}`);
        }
        return;
    }
}