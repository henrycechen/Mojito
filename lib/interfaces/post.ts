import { IConciseMemberInfo } from './member';
/** Interfaces for Post Class v0.1.1
 * 
 * Last update 16/02/2023
 */




// [C] postComprehensive
export interface IPostComprehensive {
    //// info ////
    postId: string; // 10 characters, UPPERCASE
    memberId: string;
    createdTime: number; // created time of this document (post est.)
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
    createdTime: number; // created time of this document (post est.)
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
    totalLikedCount: number;
    totalDislikedCount: number;
    totalCommentCount: number;
    totalSavedCount: number;

    //// edit info ////
    editedTime: number | null;
}

export interface IConcisePostComprehensive {
    postId: string; // 10 characters, UPPERCASE
    memberId: string;
    createdTime: number; // created time of this document (post est.)
    title: string;
    imageUrlsArr: string[];

    totalHitCount: number; // viewed times accumulator
    totalLikedCount: number;
}

export interface IConcisePostComprehensiveWithMemberInfo {
    postId: string; // 10 characters, UPPERCASE
    memberId: string;
    nickname: string;
    avatarImageFullName: string;
    createdTime: number; // created time of this document (post est.)
    title: string;
    imageUrlsArr: string[];

    totalHitCount: number; // viewed times accumulator
    totalLikedCount: number;
}