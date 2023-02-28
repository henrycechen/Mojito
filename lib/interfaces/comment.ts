import { IConciseMemberInfo } from './member';
/** Interfaces for Comment Class v0.1.1
 * 
 * Last update 16/02/2023
 */

// [C] commentComprehensive
export interface ICommentComprehensive {
    //// info ////
    commentId: string; // 12 ~ 13 characters, UPPERCASE, comment id begin with 'C', subcomment id begin with 'D'
    parentId: string; //  post id (comment entities) or comment id (subcomment entities)
    postId: string;
    memberId: string;
    nickname: string;

    createdTimeBySecond: number; // created time of this document
    content: string;
    cuedMemberInfoArr: IConciseMemberInfo[];

    //// management ////
    status: number;

    //// statistics ////
    totalLikedCount: number;
    totalUndoLikedCount: number;
    totalDislikedCount: number;
    totalUndoDislikedCount: number;
    totalSubcommentCount?: number; // for comment entities only
    totalSubcommentDeleteCount?: number; // for comment entities only

    totalAffairCount: number;

    totalEditCount: number;

    //// edit info ////
    edited: IEditedCommentComprehensive[];
}

export interface IEditedCommentComprehensive {
    editedTimeBySecond: number;
    contentBeforeEdit: string;
    cuedMemberInfoArrBeforeEdit: IConciseMemberInfo[];
    totalLikedCountBeforeEdit: number;
    totalDislikedCountBeforeEdit: number;
    totalSubcommentCountBeforeEdit?: number;
    totalAffairCountBeforeEdit: number;
}

export interface IRestrictedCommentComprehensive {
    //// info ////
    commentId: string; //12 ~ 13 characters, UPPERCASE, comment id begin with 'C', subcomment id begin with 'D'
    postId: string;
    memberId: string;
    nickname: string;

    createdTimeBySecond: number; // created time of this document
    content: string;
    cuedMemberInfoArr: IConciseMemberInfo[];

    //// management ////
    status: number;

    //// statistics ////
    totalLikedCount: number;
    totalDislikedCount: number;
    totalSubcommentCount: number; // -1 for parent comments

    //// edit info ////
    editedTimeBySecond: number;
}