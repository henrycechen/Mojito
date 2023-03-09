import { IMemberInfo } from './member';
import { ITopicInfo } from './topic';

// [C] postComprehensive
export interface IPostComprehensive {
    //// info ////
    postId: string; // 10 characters, UPPERCASE, also used as coverImageFullname (e.g., P12345ABCDE.png)
    memberId: string;
    createdTimeBySecond: number; // created time of this document (post est.)
    // content
    title: string;
    imageFullnamesArr: string[];
    paragraphsArr: string[];
    // category & connections
    cuedMemberInfoArr: IMemberInfo[];
    channelId: string;
    topicInfoArr: ITopicInfo[];
    pinnedCommentId: string | null;

    //// management ////
    status: number;
    allowEditing: boolean;
    allowCommenting: boolean;

    //// statistics ////
    // hit
    totalHitCount: number; // viewed times accumulator
    totalMemberHitCount: number;
    // like
    totalLikedCount: number;
    totalUndoLikedCount: number;
    // dislike
    totalDislikedCount: number;
    totalUndoDislikedCount: number;
    // comment
    totalCommentCount: number;
    totalCommentDeleteCount: number;
    // save
    totalSavedCount: number;
    totalUndoSavedCount: number;
    // affair
    totalAffairCount: number;
    //edit
    totalEditCount: number;

    //// edit info ////
    edited: IEditedPostComprehensive[];
}

export interface IEditedPostComprehensive {
    editedTimeBySecond: number;

    titleBeforeEdit: string;
    imageFullnamesArrBeforeEdit: string[];
    paragraphsArrBeforeEdit: string[];

    cuedMemberInfoArrBeforeEdit: IMemberInfo[];
    channelIdBeforeEdit: string;
    topicInfoArrBeforeEdit: ITopicInfo[];

    totalLikedCountBeforeEdit: number;
    totalDislikedCountBeforeEdit: number;
    totalAffairCountBeforeEdit: number;
}

export interface IRestrictedPostComprehensive {
    postId: string; // 10 characters, UPPERCASE
    memberId: string;
    createdTimeBySecond: number; // created time of this document (post est.)

    title: string;
    imageFullnamesArr: string[];
    paragraphsArr: string[];

    cuedMemberInfoArr: IMemberInfo[];
    channelId: string;
    topicInfoArr: ITopicInfo[];
    pinnedCommentId: string | null;

    status: number;
    allowEditing: boolean;
    allowCommenting: boolean;

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

    createdTimeBySecond: number; // created time of this document (post est.)
    title: string;
    channelId: string;
    hasImages: boolean; // [?] 0 === imageFullnamesArr.length

    totalCommentCount: number;
    totalHitCount: number; // viewed times accumulator
    totalLikedCount: number;
}