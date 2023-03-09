import { ITopicComprehensive, ITopicInfo } from '../../interfaces/topic';
import { getTimeBySecond } from '../create';


// Topic
export function getTopicInfoArrayFromRequestBody(requestBody: any): ITopicInfo[] {
    if ('object' !== typeof requestBody) {
        return [];
    }
    if (!(undefined !== requestBody['topicInfoArr'] && Array.isArray(requestBody['topicInfoArr']))) {
        return [];
    }
    return requestBody['topicInfoArr'];
}

export function createTopicComprehensive(topicId: string, content: string, channelId: string): ITopicComprehensive {
    return {
        topicId, // base64 string from topic content string
        content,
        channelId,
        createdTimeBySecond: getTimeBySecond(),
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
    };
}
