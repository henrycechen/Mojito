import { IConciseMemberInfo } from './member';

// [C] postComprehensive
export interface IPostComprehensive {
    //// info ////
    postId: string; // 10 characters, UPPERCASE, also used as coverImageFullname (e.g., P12345ABCDE.png)
    memberId: string;
    createdTimeBySecond: number; // created time of this document (post est.)
    title: string;

    // imageUrlsArr: string[]; // [!] depreacted
    imageFullnamesArr: string[];

    paragraphsArr: string[];
    cuedMemberInfoArr: IConciseMemberInfo[];
    channelId: string;
    topicIdsArr: string[];
    pinnedCommentId: string | null;

    //// management ////
    status: number;
    allowEditing: boolean;
    allowCommenting: boolean;

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

    totalAffairCount: number;

    totalEditCount: number;

    //// edit info ////
    edited: IEditedPostComprehensive[];
}

export interface IEditedPostComprehensive {
    editedTimeBySecond: number;
    titleBeforeEdit: string;
    // imageUrlsArrBeforeEdit: string[]; // [!] depreacted
    imageFullnamesArrBeforeEdit: string[];
    paragraphsArrBeforeEdit: string[];
    cuedMemberInfoArrBeforeEdit: IConciseMemberInfo[];
    channelIdBeforeEdit: string;
    topicIdsArrBeforeEdit: string[];
    
    totalLikedCountBeforeEdit: number;
    totalDislikedCountBeforeEdit: number;
    totalAffairCountBeforeEdit: number;
}

export interface IRestrictedPostComprehensive {
    //// info ////
    postId: string; // 10 characters, UPPERCASE
    memberId: string;
    createdTimeBySecond: number; // created time of this document (post est.)
    title: string;

    // imageUrlsArr: string[]; // [!] depreacted
    imageFullnamesArr: string[];

    paragraphsArr: string[];
    cuedMemberInfoArr: IConciseMemberInfo[];
    channelId: string;
    topicIdsArr: string[];
    pinnedCommentId: string | null;

    //// management ////
    status: number;
    allowEditing: boolean;
    allowCommenting: boolean;

    //// statistics ////
    totalHitCount: number; // viewed times accumulator
    totalLikedCount: number;
    totalDislikedCount: number;
    totalCommentCount: number;
    totalSavedCount: number;

    //// edit info ////
    editedTimeBySecond: number | null;
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