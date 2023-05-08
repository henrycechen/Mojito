import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import { RestError } from '@azure/data-tables';
import { MongoError } from 'mongodb';

import AtlasDatabaseClient from "../../../../modules/AtlasDatabaseClient";
import { logWithDate, response405, response500 } from '../../../../lib/utils/general';
import { verifyId } from '../../../../lib/utils/verify';
import { IMemberInfo, IMemberComprehensive } from '../../../../lib/interfaces/member';
import AzureTableClient from '../../../../modules/AzureTableClient';
import { IMemberMemberMapping } from '../../../../lib/interfaces/mapping';

const fname = GetMembersFollowedByMe.name;

//////// Find out who am I following ////////

/** GetMyFollowingMembersById v0.1.3 FIXME: test mode
 * 
 * Last update 23/02/2023
 *  
 * This interface only accepts GET requests
 * 
 * Info required for GET requests
 * - token: JWT (optional)
 * - memberId: string (query)
 * 
 * Info will be returned
 * - arr: IConciseMemberInfo[]
*/

const bb5 = [
    {
        memberId: 'M1234ABCD',
        nickname: '县长马邦德',
        briefIntro: '我来鹅城。。。',
        createdTimeBySecond: 1673485211

    },
    {
        memberId: 'M4567EFGH',
        nickname: '小学生张三',
        briefIntro: '我是一个小学生，喜欢玩游戏和看动画片。',
        createdTimeBySecond: 1673485222
    },
    {
        memberId: 'M2345MNOP',
        nickname: '游戏达人李四',
        briefIntro: '我是一名游戏开发者，制作了许多受欢迎的游戏。',
        createdTimeBySecond: 1673485244
    },
    {
        memberId: 'M0123UVWX',
        nickname: '健身达人张三',
        briefIntro: '我是一名健身教练，已经帮助许多人成功塑形。',
        createdTimeBySecond: 1673485266
    },
];

export default async function GetMembersFollowedByMe(req: NextApiRequest, res: NextApiResponse) {

    res.send(bb5);
    return;

    const { method } = req;
    if ('GET' !== method) {
        response405(req, res);
        return;
    }

    //// Verify identity ////
    let tokenId = ''; // v0.1.3
    const token = await getToken({ req });
    if (token && token?.sub) {
        tokenId = token.sub;
    }

    //// Verify member id ////
    const { isValid, category, id: memberId } = verifyId(req.query?.memberId);
    if (!(isValid && 'member' === category)) {
        res.status(400).send('Invalid member id');
        return;
    }

    //// Declare DB client ////
    const atlasDbClient = AtlasDatabaseClient();
    try {
        await atlasDbClient.connect();

        //// Verify member status ////
        const memberComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IMemberComprehensive>('member');
        const memberComprehensiveQueryResult = await memberComprehensiveCollectionClient.findOne({ memberId }, { projection: { _id: 0, status: 1, allowVisitingFollowedMembers: 1 } });
        if (null === memberComprehensiveQueryResult) {
            throw new Error(`Member attempt to GET followed member info but have no document (of IMemberComprehensive, member id: ${memberId}) in [C] memberComprehensive`);
        }

        const { status: memberStatus, allowVisitingFollowedMembers: isAllowed } = memberComprehensiveQueryResult;
        if (0 > memberStatus) {
            res.status(403).send('Method not allowed due to member suspended or deactivated');
            await atlasDbClient.close();
            return;
        }
        await atlasDbClient.close();

        const arr: IMemberInfo[] = [];
        if (tokenId === memberId || isAllowed) { // v0.1.3
            //// Look up record (of IMemberMemberMapping) in [RL] FollowingMemberMapping ////
            const followingMemberMappingTableClient = AzureTableClient('FollowingMemberMapping');
            const followingMemberMappingQuery = followingMemberMappingTableClient.listEntities<IMemberMemberMapping>({ queryOptions: { filter: `PartitionKey eq '${memberId}' and IsActive eq true` } });
            //// [!] attemp to reterieve entity makes the probability of causing RestError ////
            let followingMemberMappingQueryResult = await followingMemberMappingQuery.next();
            while (!followingMemberMappingQueryResult.done) {
                arr.push({
                    memberId: followingMemberMappingQueryResult.value.rowKey,
                    nickname: followingMemberMappingQueryResult.value.Nickname,
                    briefIntro: followingMemberMappingQueryResult.value.BriefIntro,
                    createdTimeBySecond: followingMemberMappingQueryResult.value.CreatedTimeBySecond,
                });
                followingMemberMappingQueryResult = await followingMemberMappingQuery.next();
            }
        }

        res.status(200).send(arr);
        return;
    } catch (e: any) {
        let msg;
        if (e instanceof RestError) {
            msg = `Attempt to communicate with azure table storage.`;
        } else if (e instanceof MongoError) {
            msg = `Attempt to communicate with atlas mongodb.`;
        } else {
            msg = `Uncategorized. ${e?.msg}`;
        }
        if (!res.headersSent) {
            response500(res, msg);
        }
        logWithDate(msg, fname, e);
        await atlasDbClient.close();
        return;
    }
}