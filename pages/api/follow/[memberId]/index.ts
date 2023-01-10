import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt'
import { RestError } from '@azure/data-tables';
import { MongoError } from 'mongodb';

import AzureTableClient from '../../../../modules/AzureTableClient';
import AtlasDatabaseClient from "../../../../modules/AtlasDatabaseClient";

import { IMemberMemberMapping, INoticeInfo, INotificationStatistics, IMemberComprehensive, IMemberStatistics } from '../../../../lib/interfaces';
import { createNoticeId, getNicknameFromToken, verifyId, response405, response500, log, } from '../../../../lib/utils';
const recaptchaServerSecret = process.env.INVISIABLE_RECAPTCHA_SECRET_KEY ?? '';

/** This interface ONLY accepts POST requests
 * 
 * Info required for POST requests
 * 
 * recaptchaResponse: string (query string)
 * token: JWT
 * id: string (query, member id)
*/

export default async function FollowOrUndoFollowMemberById(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;
    if ('POST' !== method) {
        response405(req, res);
        return;
    }
    // FIXME: deactived human/bot verification for tests
    //// Verify human/bot ////
    // const { recaptchaResponse } = req.query;
    // const { status, message } = await verifyRecaptchaResponse(recaptchaServerSecret, recaptchaResponse);
    // if (200 !== status) {
    //     if (403 === status) {
    //         res.status(403).send(message);
    //         return;
    //     }
    //     if (500 === status) {
    //         response500(res, message);
    //         return;
    //     }
    // }
    //// Verify identity ////
    const token = await getToken({ req });
    if (!(token && token?.sub)) {
        res.status(400).send('Invalid identity');
        return;
    }
    const { isValid, category, id: memberId_object } = verifyId(req.query?.id);
    //// Verify member id ////
    if (!(isValid && 'member' === category)) {
        res.status(400).send('Invalid member id');
        return;
    }
    const { sub: memberId } = token;
    if (memberId === memberId_object) {
        res.status(400).send('Unable to follow oneself');
        return;
    }
    //// Declare DB client ////
    const atlasDbClient = AtlasDatabaseClient();
    try {
        await atlasDbClient.connect()
        //// Verify member status ////
        const memberComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IMemberComprehensive>('member');
        const memberComprehensiveQueryResult = await memberComprehensiveCollectionClient.findOne({ memberId });
        if (null === memberComprehensiveQueryResult) {
            throw new Error(`Member was trying following or undo following on a member but have no document (of IMemberComprehensive, member id: ${memberId}) in [C] memberComprehensive`);
        }
        const { status: memberStatus } = memberComprehensiveQueryResult;
        if (0 > memberStatus) {
            res.status(403).send('Method not allowed due to member suspended or deactivated');
            await atlasDbClient.close();
            return;
        }
        let isFollowed: boolean;
        // Step #1.1 look up record (of IMemberMemberMapping) in [RL] FollowingMemberMapping
        const followingMemberMappingTableClient = AzureTableClient('FollowingMemberMapping');
        const followingMemberMappingQuery = followingMemberMappingTableClient.listEntities({ queryOptions: { filter: `PartitionKey eq '${memberId}' and RowKey eq '${memberId_object}'` } });
        //// [!] attemp to reterieve entity makes the probability of causing RestError ////
        const followingMemberMappingQueryResult = await followingMemberMappingQuery.next();
        // Step #1.2 verify if member has been followed
        if (!followingMemberMappingQueryResult.value) {
            // Case [Follow]
            isFollowed = false;
        } else {
            // Pending
            isFollowed = !!followingMemberMappingQueryResult.value?.IsActive;
        }
        if (isFollowed) {
            // Case [Undo follow]
            // Step #2.1 update record (of IMemberMemberMapping) in [C] FollowingMemberMapping
            await followingMemberMappingTableClient.upsertEntity<IMemberMemberMapping>({
                partitionKey: memberId,
                rowKey: memberId_object,
                IsActive: false
            }, 'Replace');
            // Step #2.2 update totalUndoFollowingCount (of IMemberStatistics) in [C] memberStatistics
            const memberStatisticsCollectionClient = atlasDbClient.db('statistics').collection<IMemberStatistics>('member');
            const memberStatisticsUpdateResult = await memberStatisticsCollectionClient.updateOne({ memberId }, {
                $inc: {
                    totalUndoFollowingCount: 1
                }
            });
            if (!memberStatisticsUpdateResult.acknowledged) {
                log(`Failed to update totalUndoFollowingCount (of IMemberStatistics, member id: ${memberId}) in [C] memberStatistics`);
            }
            // Step #2.3 update totalUndoFollowedByCount (of IMemberStatistics) in [C] memberStatistics
            const memberFollowedStatisticsUpdateResult = await memberStatisticsCollectionClient.updateOne({ memberId: memberId_object }, {
                $inc: {
                    totalUndoFollowedByCount: 1
                }
            });
            if (!memberFollowedStatisticsUpdateResult.acknowledged) {
                log(`Failed to update totalUndoFollowedByCount (of IMemberStatistics, member id: ${memberId_object}) in [C] memberStatistics`);
            }
        } else {
            // Case [Follow]
            await followingMemberMappingTableClient.upsertEntity<IMemberMemberMapping>({
                partitionKey: memberId,
                rowKey: memberId_object,
                IsActive: true
            }, 'Replace');
            // Step #2.1 update totalFollowingCount (of IMemberStatistics) in [C] memberStatistics
            const memberStatisticsCollectionClient = atlasDbClient.db('statistics').collection<IMemberStatistics>('member');
            const memberStatisticsUpdateResult = await memberStatisticsCollectionClient.updateOne({ memberId }, {
                $inc: {
                    totalFollowingCount: 1
                }
            });
            if (!memberStatisticsUpdateResult.acknowledged) {
                log(`Failed to update totalFollowingCount (of IMemberStatistics, member id: ${memberId}) in [C] memberStatistics`);
            }
            // Step #2.2 update totalFollowedByCount (of IMemberStatistics) in [C] memberStatistics
            const memberFollowedStatisticsUpdateResult = await memberStatisticsCollectionClient.updateOne({ memberId: memberId_object }, {
                $inc: {
                    totalFollowedByCount: 1
                }
            });
            if (!memberFollowedStatisticsUpdateResult.acknowledged) {
                log(`Failed to update totalFollowedByCount (of IMemberStatistics, member id: ${memberId_object}) in [C] memberStatistics`);
            }
            //// Handle notice.follow (cond.) ////
            // Step #2.3 (cond.) look up record (of IMemberMemberMapping) in [RL] BlockingMemberMapping
            const blockingMemberMappingTableClient = AzureTableClient('BlockingMemberMapping');
            const blockingMemberMappingQuery = blockingMemberMappingTableClient.listEntities({ queryOptions: { filter: `PartitionKey eq '${memberId_object}' and RowKey eq '${memberId}'` } });
            //// [!] attemp to reterieve entity makes the probability of causing RestError ////
            const blockingMemberMappingQueryResult = await blockingMemberMappingQuery.next();
            if (!blockingMemberMappingQueryResult.value) {
                //// [!] member expressed attitude has not been blocked by target member ////
                // Step #2.4 upsert record (of INoticeInfo.Follow) in [PRL] Notice
                const noticeTableClient = AzureTableClient('Notice');
                await noticeTableClient.upsertEntity<INoticeInfo>({
                    partitionKey: memberId_object, // notified member id, in this case, member having been followed by
                    rowKey: createNoticeId('follow', memberId), // combined id
                    Category: 'follow',
                    InitiateId: memberId,
                    Nickname: getNicknameFromToken(token)
                }, 'Replace');
                // Step #5 update follow (of INotificationStatistics, of the member having been followed by) in [C] notificationStatistics
                const notificationStatisticsCollectionClient = atlasDbClient.db('statistics').collection<INotificationStatistics>('notification');
                const notificationStatisticsUpdateResult = await notificationStatisticsCollectionClient.updateOne({ memberId: memberId_object }, { $inc: { follow: 1 } });
                if (!notificationStatisticsUpdateResult.acknowledged) {
                    log(`Failed to update follow (of INotificationStatistics, member id: ${memberId_object}) in [C] notificationStatistics`);
                }
            }
        }
        await atlasDbClient.close();
        // Step #4 upsert record (of IMemberMemberMapping) in [PRL] FollowedByMemberMapping
        const followedByMemberMappingTableClient = AzureTableClient('FollowedByMemberMapping');
        await followedByMemberMappingTableClient.upsertEntity<IMemberMemberMapping>({
            partitionKey: memberId_object,
            rowKey: memberId,
            IsActive: isFollowed
        }, 'Replace');
        res.status(200).send(`${isFollowed ? 'Undo follow' : 'Follow'} success`);
    } catch (e: any) {
        let msg;
        if (e instanceof RestError) {
            msg = 'Was trying communicating with azure table storage.';
        } else if (e instanceof MongoError) {
            msg = 'Was trying communicating with atlas mongodb.';
        } else {
            msg = `Uncategorized. ${e?.msg}`;
        }
        if (!res.headersSent) {
            response500(res, msg);
        }
        log(msg, e);
        await atlasDbClient.close();
        return;
    }
}