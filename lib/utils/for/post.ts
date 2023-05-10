import { IMemberInfo } from '../../interfaces/member';
import { IConcisePostComprehensive, IEditedPostComprehensive, IPostComprehensive, IRestrictedPostComprehensive } from '../../interfaces/post';
import { ITopicInfo } from '../../interfaces/topic';
import { getRandomHexStr, getTimeBySecond } from '../create';
import { verifyUrl } from '../verify';

export function contentToParagraphsArray(content: string): string[] {
    if ('' === content) {
        return [];
    }
    return content.split(/\r?\n/);
}

export function cuedMemberInfoDictionaryToArray(dict: { [memberId: string]: IMemberInfo; }): IMemberInfo[] {
    const ids = Object.keys(dict);
    if (0 === ids.length) {
        return [];
    }
    return ids.map(id => dict[id]);
}

export function provideCoverImageUrl(postId: string, domain: string, forceBrowserUpdate = false): string {
    if (forceBrowserUpdate) {
        return `${domain}/api/coverimage/a/${postId}.jpeg?variant=${getRandomHexStr()}`;
    } else {
        return `${domain}/api/coverimage/a/${postId}.jpeg`;
    }
}

export function provideImageUrl(fullname: string, domain: string, forceBrowserUpdate = false): string {
    if (forceBrowserUpdate) {
        return `${domain}/api/image/a/${fullname}?variant=${getRandomHexStr()}`;
    } else {
        return `${domain}/api/image/a/${fullname}`;
    }
}

export function getImageFullnamesArrayFromRequestBody(body: any): string[] {
    if ('object' !== typeof body) {
        return [];
    }
    if (!(undefined !== body['imageFullNamesArr'] && Array.isArray(body['imageFullNamesArr']))) {
        return [];
    }
    return Array.prototype.filter.call([...body['imageFullNamesArr']], (imageUrl) => verifyUrl(imageUrl));
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

export function getCuedMemberInfoArrayFromRequestBody(requestBody: any): IMemberInfo[] {
    if ('object' !== typeof requestBody) {
        return [];
    }
    if (!(undefined !== requestBody['cuedMemberInfoArr'] && Array.isArray(requestBody['cuedMemberInfoArr']))) {
        return [];
    }
    return [...requestBody['cuedMemberInfoArr']];
}

type PostComprehensiveUpdate = {
    nickname: string;
    title: string;
    imageFullNamesArr: string[];
    paragraphsArr: string[];
    cuedMemberInfoArr: IMemberInfo[];
    channelId: string;
    topicInfoArr: ITopicInfo[];

    status: 21 | 201;

    totalLikedCount: 0; // reset liked and disliked count
    totalUndoLikedCount: 0; // reset undo liked and undo disliked count
    totalDislikedCount: 0;
    totalUndoDislikedCount: 0;
};

export function providePostComprehensiveUpdate(nickname: string, title: string, hasImages: boolean, paragraphsArr: string[], cuedMemberInfoArr: IMemberInfo[], channelId: string, topicInfoArr: ITopicInfo[]): PostComprehensiveUpdate {
    const updated: PostComprehensiveUpdate = {
        nickname,
        title,
        imageFullNamesArr: [],
        paragraphsArr,
        cuedMemberInfoArr,
        channelId,
        topicInfoArr,

        status: hasImages ? 21 : 201, // [!] 21: waiting on images upload

        totalLikedCount: 0,
        totalUndoLikedCount: 0,
        totalDislikedCount: 0,
        totalUndoDislikedCount: 0
    };
    return updated;
}

export function provideEditedPostInfo(postComprehensive: IPostComprehensive, editedTimeBySecond: number): IEditedPostComprehensive {
    return {
        editedTimeBySecond,
        nicknameBeforeEdit: postComprehensive.nickname,
        titleBeforeEdit: postComprehensive.title,
        imageFullnamesArrBeforeEdit: [...postComprehensive.imageFullnamesArr],
        paragraphsArrBeforeEdit: [...postComprehensive.paragraphsArr],
        cuedMemberInfoArrBeforeEdit: [...postComprehensive.cuedMemberInfoArr],
        channelIdBeforeEdit: postComprehensive.channelId,
        topicInfoArrBeforeEdit: [...postComprehensive.topicInfoArr],
        totalLikedCountBeforeEdit: postComprehensive.totalLikedCount,
        totalDislikedCountBeforeEdit: postComprehensive.totalDislikedCount,
        totalAffairCountBeforeEdit: postComprehensive.totalAffairCount
    };
}

export function getRestrictedFromPostComprehensive(postComprehensive: IPostComprehensive): IRestrictedPostComprehensive {
    const { status } = postComprehensive;

    const restricted: IRestrictedPostComprehensive = {

        postId: postComprehensive.postId,
        memberId: postComprehensive.memberId,
        createdTimeBySecond: postComprehensive.createdTimeBySecond,
        title: '',
        imageFullnamesArr: [],

        paragraphsArr: [],
        cuedMemberInfoArr: [],
        channelId: postComprehensive.channelId,
        topicInfoArr: [],
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
    restricted.imageFullnamesArr.push(...postComprehensive.imageFullnamesArr);
    restricted.paragraphsArr.push(...postComprehensive.paragraphsArr);
    restricted.cuedMemberInfoArr.push(...postComprehensive.cuedMemberInfoArr);
    restricted.topicInfoArr.push(...postComprehensive.topicInfoArr);
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

export function getConciseFromPostComprehensive(postComprehensive: IPostComprehensive): IConcisePostComprehensive {
    return {
        postId: postComprehensive.postId,
        memberId: postComprehensive.memberId,
        nickname: postComprehensive.nickname,
        createdTimeBySecond: postComprehensive.createdTimeBySecond,
        title: postComprehensive.title,
        channelId: postComprehensive.channelId,
        hasImages: 0 !== postComprehensive.imageFullnamesArr.length,
        totalHitCount: postComprehensive.totalHitCount,
        totalLikedCount: postComprehensive.totalLikedCount,
        totalDislikedCount: postComprehensive.totalDislikedCount,
        totalCommentCount: postComprehensive.totalCommentCount,

    };
}

export function fakeRestrictedPostComprehensive(): IRestrictedPostComprehensive {
    return {
        postId: '',
        memberId: '',
        createdTimeBySecond: 0,
        title: '',
        imageFullnamesArr: [],
        paragraphsArr: [],
        cuedMemberInfoArr: [],
        channelId: '',
        topicInfoArr: [],
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
    };
}
