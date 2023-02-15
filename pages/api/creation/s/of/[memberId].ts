import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt'
import { RestError } from '@azure/data-tables';
import { MongoError } from 'mongodb';

import AzureTableClient from '../../../../../modules/AzureTableClient';
import AtlasDatabaseClient from "../../../../../modules/AtlasDatabaseClient";

import { INoticeInfo, IMemberPostMapping, INotificationStatistics, IMemberComprehensive, IConciseMemberInfo, IMemberStatistics, ILoginJournal, IAttitudeComprehensive, IAttitideMapping, ICommentComprehensive, IEditedCommentComprehensive, IRestrictedCommentComprehensive, IChannelStatistics, ITopicComprehensive, ITopicPostMapping, IPostComprehensive, IEditedPostComprehensive, IRestrictedPostComprehensive, IConcisePostComprehensive } from '../../../../../lib/interfaces';
import { createId, createNoticeId, getRandomIdStr, getRandomIdStrL, getRandomHexStr, timeToString, getNicknameFromToken, getContentBrief, createCommentComprehensive, provideCommentComprehensiveUpdate, getRestrictedFromCommentComprehensive, getTopicBase64StringsArrayFromRequestBody, getImageUrlsArrayFromRequestBody, getParagraphsArrayFromRequestBody, getRestrictedFromPostComprehensive, verifyEmailAddress, verifyPassword, verifyId, verifyUrl, verifyRecaptchaResponse, verifyEnvironmentVariable, response405, response500, logWithDate, getCuedMemberInfoArrayFromRequestBody } from '../../../../../lib/utils';

const recaptchaServerSecret = process.env.INVISIABLE_RECAPTCHA_SECRET_KEY ?? '';

// This interface ONLY accepts GET requests

export default async function GetCreationsByMemberId(req: NextApiRequest, res: NextApiResponse) {
    const arr: IConcisePostComprehensive[] = [
        {
            postId: 'P12345ABCD1',
            memberId: 'M1234ABCD',
            createdTime: 1674203401288,
            title: '世界上只有一个周杰伦',
            imageUrlsArr: ['https://media.uweekly.sg/wp-content/uploads/2022/12/20221217-cs-rotator.jpg'],
            totalHitCount: 1024,
            totalLikedCount: 24,
        },
        {
            postId: 'P12345ABCD2',
            memberId: 'M1234ABCD',
            createdTime: 1674203508637,
            title: '第一次看到头文字D的海报',
            imageUrlsArr: ['https://upload.wikimedia.org/wikipedia/zh/f/f7/Initial_D_poster.jpg?20170330200904'],
            totalHitCount: 299,
            totalLikedCount: 2,
        },
        {
            postId: 'P12345ABCD0',
            memberId: 'M1234ABCD',
            createdTime: 1674203260956,
            title: '最喜欢的专辑是十一月的萧邦',
            imageUrlsArr: ['https://upload.wikimedia.org/wikipedia/zh/9/93/Jay_chopin_cover270.jpg'],
            totalHitCount: 23,
            totalLikedCount: 0
        },
    ];
    res.send(arr);
}


// 