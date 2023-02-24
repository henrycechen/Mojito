import { IConciseMemberInfo } from './member';

// [C] postComprehensive
export interface IPostComprehensive {
    //// info ////
    postId: string; // 10 characters, UPPERCASE
    memberId: string;
    createdTimeBySecond: number; // created time of this document (post est.)
    title: string;
    imageUrlsArr: string[];
    paragraphsArr: string[];
    cuedMemberInfoArr: IConciseMemberInfo[];
    channelId: string;
    topicIdsArr: string[];
    pinnedCommentId: string | null;

    //// management ////
    status: number;

    //// statistics ////
    totalHitCount: number; // viewed times accumulator
    totalMemberHitCount: number;
    totalLikedCount: number;
    totalUndoLikedCount: number;
    totalDislikedCount: number;
    totalUndoDislikedCount: number;
    totalCommentCount: number;
    totalCommentDeleteCount: number;
    totalSavedCount: number;
    totalUndoSavedCount: number;
    totalEditCount: number;

    //// edit info ////
    edited: IEditedPostComprehensive[];
}

export interface IEditedPostComprehensive {
    editedTime: number;
    titleBeforeEdit: string;
    imageUrlsArrBeforeEdit: string[];
    paragraphsArrBeforeEdit: string[];
    cuedMemberInfoArrBeforeEdit: IConciseMemberInfo[];
    channelIdBeforeEdit: string;
    topicIdsArrBeforeEdit: string[];
    totalLikedCountBeforeEdit: number;
    totalDislikedCountBeforeEdit: number;
}

export interface IRestrictedPostComprehensive {
    //// info ////
    postId: string; // 10 characters, UPPERCASE
    memberId: string;
    createdTimeBySecond: number; // created time of this document (post est.)
    title: string;

    imageUrlsArr: string[]; // [!] depreacted
    imageFullnameArr: string[];

    paragraphsArr: string[];
    cuedMemberInfoArr: IConciseMemberInfo[];
    channelId: string;
    topicIdsArr: string[];
    pinnedCommentId: string | null;

    //// management ////
    status: number;

    //// statistics ////
    totalHitCount: number; // viewed times accumulator
    totalLikedCount: number;
    totalDislikedCount: number;
    totalCommentCount: number;
    totalSavedCount: number;

    //// edit info ////
    editedTime: number | null;
}

export interface IConcisePostComprehensive {
    postId: string; // 10 characters, UPPERCASE, also used as coverImageFullname (e.g., P12345ABCDE.png)
    memberId: string;
    nickname: string;
    title: string;
    createdTimeBySecond: number; // created time of this document (post est.)
    totalHitCount: number; // viewed times accumulator
    totalLikedCount: number;
}
