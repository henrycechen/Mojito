import type { NextApiRequest, NextApiResponse } from 'next';
import { IAttitudeComprehensive, IAttitudeMapping } from '../../interfaces/attitude';
import { IChannelInfo } from '../../interfaces/channel';
import { ICommentComprehensive, IRestrictedCommentComprehensive } from '../../interfaces/comment';
import { IConciseMemberInfo, IConciseMemberStatistics } from '../../interfaces/member';
import { INoticeInfoWithMemberInfo } from '../../interfaces/notification';
import { IEditedPostComprehensive, IPostComprehensive, IRestrictedPostComprehensive } from '../../interfaces/post';
import { ITopicComprehensive } from '../../interfaces/topic';
import { getRandomHexStr } from '../create';
import { verifyNoticeId, verifyUrl } from '../verify';


// Topic
export function getTopicBase64StringsArrayFromRequestBody(requestBody: any): string[] {
    if ('object' !== typeof requestBody) {
        return [];
    }
    if (!(undefined !== requestBody['topicsArr'] && Array.isArray(requestBody['topicsArr']))) {
        return [];
    }
    return requestBody['topicsArr'].map(topicContent => 'T' + Buffer.from(topicContent).toString('base64'));
}

export function provideTopicComprehensive(topicId: string, channelId: string,): ITopicComprehensive {
    return {
        topicId, // base64 string from topic content string
        channelId,
        createdTime: new Date().getTime(), // create time of this document (topic est.)
        status: 200,
        totalHitCount: 1, // total hit count of total posts of this topic
        totalSearchCount: 0,
        totalPostCount: 1,
        totalPostDeleteCount: 0,
        totalLikedCount: 0,
        totalUndoLikedCount: 0,
        totalCommentCount: 0,
        totalCommentDeleteCount: 0,
        totalSavedCount: 0,
        totalUndoSavedCount: 0,
    }
}
