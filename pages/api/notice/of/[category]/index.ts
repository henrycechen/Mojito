import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt'
import { RestError } from '@azure/data-tables';
import { MongoError } from 'mongodb';

import AzureTableClient from '../../../../../modules/AzureTableClient';
import AtlasDatabaseClient from "../../../../../modules/AtlasDatabaseClient";
import { logWithDate, response405, response500 } from '../../../../../lib/utils/general';
import { createId, createNoticeId } from '../../../../../lib/utils/create';
import { IMemberComprehensive } from '../../../../../lib/interfaces/member';
import { INoticeInfo, INoticeInfoWithMemberInfo } from '../../../../../lib/interfaces/notification';

const fname = GetNoticeByCategory.name;

/** GetNoticeByCategory v0.1.1 FIXME: test mode
 * 
 * Last update:
 * 
 * This interface ONLY accepts GET requests
 * 
 * Info required for GET requests
 * - token: JWT
 * - category: string (query, notice category)
*/

const bb1 = [
    {
        noticeId: `${createNoticeId('like', 'M2950ABBX', createId('post'))}`,
        category: 'like',
        initiateId: 'M2950ABBX',
        nickname: '550W不是Moss',
        avatarImageUrl: 'https://cdn.icon-icons.com/icons2/1371/PNG/512/robot02_90810.png',
        createdTimeBySecond: 1675644625,
        postTitle: '請告訴我，整天說算不算放棄',
    },
    {
        noticeId: `${createNoticeId('like', 'M2950ABBX', createId('post'))}`,
        category: 'like',
        initiateId: 'M2950ABBX',
        nickname: '550W不是Moss',
        avatarImageUrl: 'https://cdn.icon-icons.com/icons2/1371/PNG/512/robot02_90810.png',
        createdTimeBySecond: 1675644894,
        postTitle: '彩色的時間染上空空空白',
    },
    {
        noticeId: `${createNoticeId('like', 'M2950ABBX', createId('post'), createId('comment'))}`,
        category: 'like',
        initiateId: 'M2950ABBX',
        nickname: '550W不是Moss',
        avatarImageUrl: 'https://cdn.icon-icons.com/icons2/1371/PNG/512/robot02_90810.png',
        createdTimeBySecond: 1675645871,
        postTitle: '我不知道你有这么多的话要讲',
        commentBrief: '但是我感觉这篇帖子发的都是一些发话'
    },
    {
        noticeId: `${createNoticeId('like', 'M1234XXXX', createId('post'))}`,
        category: 'like',
        initiateId: 'M1234XXXX',
        nickname: 'WebMaster',
        avatarImageUrl: 'https://www.nicepng.com/png/full/804-8049853_med-boukrima-specialist-webmaster-php-e-commerce-web.png',
        createdTimeBySecond: 1675645871,
        postTitle: '想象不到如此心跳',
    },
    {
        noticeId: `${createNoticeId('like', 'M1234XXXX', createId('post'))}`,
        category: 'like',
        initiateId: 'M3380ACMM',
        nickname: '測試一下名字最長可以有多長雖然可能會被拒絕',
        avatarImageUrl: 'https://store.playstation.com/store/api/chihiro/00_09_000/container/PT/pt/19/EP4067-NPEB01320_00-AVPOPULUSM000897/image?w=320&h=320&bg_color=000000&opacity=100&_version=00_09_000',
        createdTimeBySecond: 1675645871,
        postTitle: '想象不到如此心跳',
    },
];

const bb2 = [
    {
        noticeId: `${createNoticeId('save', 'M2950ABBX', createId('post'))}`,
        category: 'save',
        initiateId: 'M2950ABBX',
        nickname: '550W不是Moss',
        avatarImageUrl: 'https://cdn.icon-icons.com/icons2/1371/PNG/512/robot02_90810.png',
        createdTimeBySecond: 1675645871,
        postTitle: '我不知道你有这么多的话要讲',
        commentBrief: '但是我感觉这篇帖子发的都是一些发话'
    },
    {
        noticeId: `${createNoticeId('save', 'M1234XXXX', createId('post'))}`,
        category: 'save',
        initiateId: 'M1234XXXX',
        nickname: 'WebMaster',
        avatarImageUrl: 'https://www.nicepng.com/png/full/804-8049853_med-boukrima-specialist-webmaster-php-e-commerce-web.png',
        createdTimeBySecond: 1675645871,
        postTitle: '想象不到如此心跳',
    },
    {
        noticeId: `${createNoticeId('save', 'M3380ACMM', createId('post'))}`,
        category: 'save',
        initiateId: 'M3380ACMM',
        nickname: '測試一下名字最長可以有多長雖然可能會被拒絕',
        avatarImageUrl: 'https://store.playstation.com/store/api/chihiro/00_09_000/container/PT/pt/19/EP4067-NPEB01320_00-AVPOPULUSM000897/image?w=320&h=320&bg_color=000000&opacity=100&_version=00_09_000',
        createdTimeBySecond: 1675645871,
        postTitle: '想象不到如此心跳',
    },
];

const bb3 = [
    {
        noticeId: `${createNoticeId('reply', 'M2950ABBX', createId('post'), createId('comment'))}`,
        category: 'reply',
        initiateId: 'M2950ABBX',
        nickname: '550W不是Moss',
        avatarImageUrl: 'https://cdn.icon-icons.com/icons2/1371/PNG/512/robot02_90810.png',
        createdTimeBySecond: 1675645871,
        postTitle: '我不知道你有这么多的话要讲',
        commentBrief: '但是我感觉这篇帖子发的都是一些发话'
    },
];

const bb4 = [
    {
        noticeId: `${createNoticeId('cue', 'M3380ACMM', createId('post'))}`,
        category: 'cue',
        initiateId: 'M3380ACMM',
        nickname: '測試一下名字最長可以有多長雖然可能會被拒絕',
        avatarImageUrl: 'https://store.playstation.com/store/api/chihiro/00_09_000/container/PT/pt/19/EP4067-NPEB01320_00-AVPOPULUSM000897/image?w=320&h=320&bg_color=000000&opacity=100&_version=00_09_000',
        createdTimeBySecond: 1675645871,
        postTitle: '想象不到如此心跳',
    },
];

export default async function GetNoticeByCategory(req: NextApiRequest, res: NextApiResponse) {

    const { method } = req;
    if ('GET' !== method) {
        response405(req, res);
        return;
    }

    const { category:cat } = req.query;
    if ('like' === cat) {
        res.send(bb1)
    }
    if ('save' === cat) {
        res.send(bb2)
    }
    if ('reply' === cat) {
        res.send(bb3)
    }
    if ('cue' === cat) {
        res.send(bb4)
    }
    return;


    //// Verify identity ////
    const token = await getToken({ req });
    if (!(token && token?.sub)) {
        res.status(400).send('Invalid identity');
        return;
    }

    // const category = req.query?.category;
    //// Verify notice category ////
    const { category } = req.query;
    if (!('string' === typeof category && ['cue', 'reply', 'like', 'pin', 'save', 'follow'].includes(category))) {
        res.status(400).send('Invalid notice category');
        return;
    }
    //// Declare DB client ////
    const atlasDbClient = AtlasDatabaseClient();
    try {
        const { sub: memberId } = token;
        //// Verify member status ////
        const memberComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IMemberComprehensive>('member');
        const memberComprehensiveQueryResult = await memberComprehensiveCollectionClient.findOne({ memberId });
        if (null === memberComprehensiveQueryResult) {
            throw new Error(`Member attempt to GET record (of INoticeInfo) but have no document (of IMemberComprehensive, member id: ${memberId}) in [C] memberComprehensive`);
        }
        const { status: memberStatus } = memberComprehensiveQueryResult;
        if (0 > memberStatus) {
            res.status(403).send('Method not allowed due to member suspended or deactivated');
            await atlasDbClient.close();
            return;
        }
        await atlasDbClient.close();
        const noticeTableClient = AzureTableClient('Notice');
        const noticeQuery = noticeTableClient.listEntities<INoticeInfo>({ queryOptions: { filter: `PartitionKey eq '${memberId}' and Category eq '${category}' and IsActive eq true` } });

        let arr: INoticeInfoWithMemberInfo[] = [];
        let noticeQueryResult = await noticeQuery.next();
        while (!noticeQueryResult.done) {
            arr.push({
                noticeId: noticeQueryResult.value.rowKey,
                category: noticeQueryResult.value.Category,
                initiateId: noticeQueryResult.value.InitiateId,
                nickname: noticeQueryResult.value.Nickname,
                postTitle: noticeQueryResult.value.PostTitle,
                commentBrief: noticeQueryResult.value.CommentBrief,
                createdTimeBySecond: noticeQueryResult.value.CreatedTimeBySecond
            });
            noticeQueryResult = await noticeQuery.next();
        }
        res.status(200).send(arr);
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