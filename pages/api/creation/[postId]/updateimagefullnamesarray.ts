import type { NextApiRequest, NextApiResponse } from 'next';
import { RestError } from '@azure/data-tables';
import { MongoError } from 'mongodb';
import { getToken } from 'next-auth/jwt';

import AzureTableClient from '../../../../modules/AzureTableClient';
import AtlasDatabaseClient from '../../../../modules/AtlasDatabaseClient';
import { logWithDate, response405, response500 } from '../../../../lib/utils/general';
import { createId, createNoticeId, getRandomIdStr, getTimeBySecond } from '../../../../lib/utils/create';
import { IMemberComprehensive, IMemberStatistics } from '../../../../lib/interfaces/member';
import { getTopicInfoArrayFromRequestBody, createTopicComprehensive } from '../../../../lib/utils/for/topic';
import { getCuedMemberInfoArrayFromRequestBody, getImageFullnamesArrayFromRequestBody, getParagraphsArrayFromRequestBody } from '../../../../lib/utils/for/post';
import { IPostComprehensive } from '../../../../lib/interfaces/post';
import { IChannelStatistics } from '../../../../lib/interfaces/channel';
import { ITopicComprehensive } from '../../../../lib/interfaces/topic';
import { INoticeInfo, INotificationStatistics } from '../../../../lib/interfaces/notification';
import { getNicknameFromToken } from '../../../../lib/utils/for/member';
import { verifyId } from '../../../../lib/utils/verify';
import { IMemberMemberMapping } from '../../../../lib/interfaces/mapping';

const domain = process.env.NEXT_PUBLIC_APP_DOMAIN;
const ffn = `${UpdateImageFullnamesArray.name} (API)`;

/**
 * This interface ONLY accepts PUT method
 * 
 * Post info required
 * -     token: JWT
 * -     title
 * -     channelId
 * 
 * Last update:
 * - 10/05/2023 v0.1.1
 */

export default async function UpdateImageFullnamesArray(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;
    if ('PUT' !== method) {
        response405(req, res);
        return;
    }

    //// Verify identity ////
    const token = await getToken({ req });
    if (!(token && token?.sub)) {
        res.status(400).send('Invalid identity');
        return;
    }

    //// Verify post id ////
    const { isValid, category, id: postId } = verifyId(req.body?.postId);
    if (!(isValid && 'post' === category)) {
        res.status(400).send('Invalid post id');
        return;
    }

    //// Verify array ////
    const { imageFullnamesArr } = req.body;
    if (!Array.isArray(imageFullnamesArr)) {
        res.status(400).send('Invalid image fullnames array');
        return;
    }

    //// Declare DB client ////
    const atlasDbClient = AtlasDatabaseClient();
    try {
        await atlasDbClient.connect();

        const { sub: memberId } = token;
        const memberComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IMemberComprehensive>('member');
        const memberComprehensiveQueryResult = await memberComprehensiveCollectionClient.findOne<IMemberComprehensive>({ memberId });
        if (null === memberComprehensiveQueryResult) {
            throw new Error(`Member attempt to creating post but have no document (of IMemberComprehensive, member id: ${memberId}) in [C] memberComprehensive`);
        }
        const { status: memberStatus, allowPosting } = memberComprehensiveQueryResult;
        if (!(0 < memberStatus && allowPosting)) {
            res.status(403).send('Method not allowed due to member suspended or deactivated');
            await atlasDbClient.close();
            return;
        }

        //// Verify post status ////
        const postComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IPostComprehensive>('post');
        const postComprehensiveQueryResult = await postComprehensiveCollectionClient.findOne({ postId }, { projection: { _id: 0, status: 1, allowEditing: 1 } });
        if (null === postComprehensiveQueryResult) {
            res.status(404).send('Post not found');
            await atlasDbClient.close();
            return;
        }
        const { status: postStatus, allowEditing, title, cuedMemberInfoArr } = postComprehensiveQueryResult;
        if (!(21 === postStatus && allowEditing)) {
            res.status(403).send('Method not allowed due to restricted post status');
            await atlasDbClient.close();
            return;
        }

        //// Update image fullnames array ////
        const postComprehensiveInsertResult = await postComprehensiveCollectionClient.updateOne({ postId }, {
            $set: {
                imageFullnamesArr,
                status: 201
            }
        });
        if (!postComprehensiveInsertResult.acknowledged) {
            throw new Error(`Failed to update document (of IPostComprehensive, member id: ${memberId}) in [C] postComprehensive`);
        }

        //// Response 200 ////
        res.status(200).send('Image fullname array updated');

        //// (Cond.) Handle notice.cue ////
        if (cuedMemberInfoArr.length !== 0) {
            const blockingMemberMappingTableClient = AzureTableClient('BlockingMemberMapping');
            const notificationStatisticsCollectionClient = atlasDbClient.db('statistics').collection<INotificationStatistics>('notification');

            // #1 maximum 12 members are allowed to cued at one time (in one comment)
            const cuedMemberIdsArrSliced = cuedMemberInfoArr.slice(0, 12);
            for await (const cuedMemberInfo of cuedMemberIdsArrSliced) {
                const { memberId: cuedId } = cuedMemberInfo;

                let isBlocked = false;
                // #2 look up record (of IMemberMemberMapping) in [RL] BlockingMemberMapping
                const blockingMemberMappingQuery = blockingMemberMappingTableClient.listEntities<IMemberMemberMapping>({ queryOptions: { filter: `PartitionKey eq '${cuedId}' and RowKey eq '${memberId}'` } });
                // [!] attemp to reterieve entity makes the probability of causing RestError
                const blockingMemberMappingQueryResult = await blockingMemberMappingQuery.next();
                if (blockingMemberMappingQueryResult.value) {
                    const { IsActive: isActive } = blockingMemberMappingQueryResult.value;
                    isBlocked = isActive;
                }
                if (!isBlocked) {
                    // #3 upsert record (INoticeInfo.Cued) in [PRL] Notice
                    const noticeTableClient = AzureTableClient('Notice');
                    noticeTableClient.upsertEntity<INoticeInfo>({
                        partitionKey: cuedId,
                        rowKey: createNoticeId('cue', memberId, postId), // combined id
                        Category: 'cue',
                        InitiateId: memberId,
                        Nickname: getNicknameFromToken(token),
                        // PostId: postId,
                        PostTitle: title,
                        CommentBrief: '', // [!] comment brief is not supplied in this case
                        CreatedTimeBySecond: getTimeBySecond()
                    }, 'Replace');
                    // #4 update cue (of INotificationStatistics) (of cued member) in [C] notificationStatistics
                    const notificationStatisticsUpdateResult = await notificationStatisticsCollectionClient.updateOne({ memberId: cuedId }, { $inc: { cue: 1 } });
                    if (!notificationStatisticsUpdateResult.acknowledged) {
                        logWithDate(`Document (IPostComprehensive, post id: ${postId}) inserted in [C] postComprehensive successfully but failed to update cue (of INotificationStatistics, member id: ${cuedId}) in [C] notificationStatistics`, ffn);
                    }
                }
            }
        }

        await atlasDbClient.close();
        return;
    } catch (e: any) {
        let msg;
        if (e instanceof SyntaxError) {
            res.status(400).send('Improperly normalized request info');
            return;
        } else if (e instanceof RestError) {
            msg = `Attempt to communicate with azure table storage.`;
        } else if (e instanceof MongoError) {
            msg = `Attempt to communicate with atlas mongodb.`;
        } else {
            msg = `Uncategorized. ${e?.msg}`;
        }
        if (!res.headersSent) {
            response500(res, msg);
        }
        logWithDate(msg, ffn, e);
        await atlasDbClient.close();
        return;
    }
}