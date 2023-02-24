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

// Post

export function provideCoverImageUrl(postId: string, domain: string, forceBrowserUpdate = false): string {
    if (forceBrowserUpdate) {
        return `${domain}/api/coverimage/a/${postId}.png?variant=${getRandomHexStr()}`;
    } else {
        return `${domain}/api/coverimage/a/${postId}.png`;
    }
}

export function getImageUrlsArrayFromRequestBody(requestBody: any): string[] {
    if ('object' !== typeof requestBody) {
        return [];
    }
    if (!(undefined !== requestBody['imageUrlsArr'] && Array.isArray(requestBody['imageUrlsArr']))) {
        return [];
    }
    return Array.prototype.filter.call([...requestBody['imageUrlsArr']], (imageUrl) => verifyUrl(imageUrl))
}

export function getParagraphsArrayFromRequestBody(requestBody: any): string[] {
    if ('object' !== typeof requestBody) {
        return [];
    }
    if (!(undefined !== requestBody['paragraphsArr'] && Array.isArray(requestBody['paragraphsArr']))) {
        return [];
    }
    return [...requestBody['paragraphsArr']];
}

export function getCuedMemberInfoArrayFromRequestBody(requestBody: any): IConciseMemberInfo[] {
    if ('object' !== typeof requestBody) {
        return [];
    }
    if (!(undefined !== requestBody['cuedMemberInfoArr'] && Array.isArray(requestBody['cuedMemberInfoArr']))) {
        return [];
    }
    return [...requestBody['cuedMemberInfoArr']];
}

type PostComprehensiveUpdate = {
    //// info ////
    title: string;
    imageUrlsArr: string[];
    paragraphsArr: string[];
    cuedMemberInfoArr: IConciseMemberInfo[];
    channelId: string;
    topicIdsArr: string[];
    //// management ////
    status: 201;
    //// statistics ////
    totalLikedCount: 0; // reset liked and disliked count
    totalUndoLikedCount: 0; // reset undo liked and undo disliked count
    totalDislikedCount: 0;
    totalUndoDislikedCount: 0;
}

export function providePostComprehensiveUpdate(title: string, imageUrlsArr: string[], paragraphsArr: string[], cuedMemberInfoArr: IConciseMemberInfo[], channelId: string, topicIdsArr: string[]): PostComprehensiveUpdate {
    const updated: PostComprehensiveUpdate = {
        title,
        imageUrlsArr,
        paragraphsArr,
        cuedMemberInfoArr,
        channelId,
        topicIdsArr,
        status: 201,
        totalLikedCount: 0,
        totalUndoLikedCount: 0,
        totalDislikedCount: 0,
        totalUndoDislikedCount: 0
    };
    return updated;
}

export function provideEditedPostInfo(postComprehensive: IPostComprehensive): IEditedPostComprehensive {
    return {
        editedTime: new Date().getTime(),
        titleBeforeEdit: postComprehensive.title,
        imageFullnameArrBeforeEdit: [...postComprehensive.imageFullnameArr],
        paragraphsArrBeforeEdit: [...postComprehensive.paragraphsArr],
        cuedMemberInfoArrBeforeEdit: [...postComprehensive.cuedMemberInfoArr],
        channelIdBeforeEdit: postComprehensive.channelId,
        topicIdsArrBeforeEdit: [...postComprehensive.topicIdsArr],
        totalLikedCountBeforeEdit: postComprehensive.totalLikedCount,
        totalDislikedCountBeforeEdit: postComprehensive.totalDislikedCount,
    }
}

export function getRestrictedFromPostComprehensive(postComprehensive: IPostComprehensive): IRestrictedPostComprehensive {
    const { status } = postComprehensive;

    const restricted: IRestrictedPostComprehensive = {

        postId: postComprehensive.postId,
        memberId: postComprehensive.memberId,
        createdTimeBySecond: postComprehensive.createdTimeBySecond,
        title: '',
        imageFullnameArr: [],
        paragraphsArr: [],
        cuedMemberInfoArr: [],
        channelId: postComprehensive.channelId,
        topicIdsArr: [],
        pinnedCommentId: null,

        status: status,
        allowEditing: postComprehensive.allowEditing,
        allowCommenting: postComprehensive.allowCommenting,

        totalHitCount: postComprehensive.totalHitCount,
        totalLikedCount: postComprehensive.totalLikedCount - postComprehensive.totalUndoLikedCount,
        totalDislikedCount: postComprehensive.totalDislikedCount - postComprehensive.totalUndoDislikedCount,
        totalCommentCount: postComprehensive.totalCommentCount - postComprehensive.totalCommentDeleteCount,
        totalSavedCount: postComprehensive.totalSavedCount - postComprehensive.totalUndoSavedCount,

        editedTimeBySecond: null,
    };

    if ('number' === typeof status && 0 > status) {
        return restricted;
    }

    restricted.title = postComprehensive.title;
    restricted.imageFullnameArr.push(...postComprehensive.imageFullnameArr);
    restricted.paragraphsArr.push(...postComprehensive.paragraphsArr);
    restricted.cuedMemberInfoArr.push(...postComprehensive.cuedMemberInfoArr);
    restricted.topicIdsArr.push(...postComprehensive.topicIdsArr);
    restricted.pinnedCommentId = postComprehensive.pinnedCommentId;

    if ('number' === typeof status && 1 === status % 100) {
        const { edited } = postComprehensive;
        if (Array.isArray(edited) && edited.length !== 0) {
            const lastEdit = edited[edited.length - 1];
            restricted.editedTimeBySecond = lastEdit.editedTimeBySecond;
        }
    }
    return restricted;
}

export function fakeRestrictedPostComprehensive(): IRestrictedPostComprehensive {
    return {
        postId: '',
        memberId: '',
        createdTimeBySecond: 0,
        title: '',
        imageFullnameArr: [],
        paragraphsArr: [],
        cuedMemberInfoArr: [],
        channelId: '',
        topicIdsArr: [],
        pinnedCommentId: null,
        status: -1,
        allowEditing: false,
        allowCommenting: false,
        totalHitCount: 0,
        totalLikedCount: 0,
        totalDislikedCount: 0,
        totalCommentCount: 0,
        totalSavedCount: 0,
        editedTimeBySecond: 0
    }
}
