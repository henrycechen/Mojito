import { IMemberInfo } from './member';

/**
 * Comment Info
 * -     commentId: string // 12 ~ 13 characters, UPPERCASE, comment id begin with 'C', subcomment id begin with 'D'
 * -     parentId: string //  post id (comment entities) or comment id (subcomment entities)
 * -     postId: string
 * -     memberId: string
 * -     nickname: string
 * -     createdTimeBySecond: number // created time of this document
 * -     content: string
 * -     cuedMemberInfoArr: IMemberInfo[]
 * 
 * Management
 * -     status: number
 * 
 * Statistics
 * -     totalLikedCount: number
 * -     totalUndoLikedCount: number
 * -     totalDislikedCount: number
 * -     totalUndoDislikedCount: number
 * -     totalSubcommentCount?: number // for comment entities only
 * -     totalSubcommentDeleteCount?: number // for comment entities only
 * -     totalAffairCount: number
 * -     totalEditCount: number
 * 
 * Edit Info
 * -     edited: IEditedCommentComprehensive[]
 * 
 * Last update: 08/05/2023 v0.1.1
 */
export interface ICommentComprehensive {
    // Comment Info
    commentId: string; // 12 ~ 13 characters, UPPERCASE, comment id begin with 'C', subcomment id begin with 'D'
    parentId: string; //  post id (comment entities) or comment id (subcomment entities)
    postId: string;
    memberId: string;
    nickname: string;
    createdTimeBySecond: number; // created time of this document
    content: string;
    cuedMemberInfoArr: IMemberInfo[];

    // Management
    status: number;

    // Statistics
    totalLikedCount: number;
    totalUndoLikedCount: number;
    totalDislikedCount: number;
    totalUndoDislikedCount: number;
    totalSubcommentCount?: number; // for comment entities only
    totalSubcommentDeleteCount?: number; // for comment entities only
    totalAffairCount: number;
    totalEditCount: number;

    // Edit Info
    edited: IEditedCommentComprehensive[];
}

/**
 * -     editedTimeBySecond: number
 * -     contentBeforeEdit: string
 * -     cuedMemberInfoArrBeforeEdit: IMemberInfo[]
 * -     totalLikedCountBeforeEdit: number
 * -     totalDislikedCountBeforeEdit: number
 * -     totalSubcommentCountBeforeEdit?: number
 * -     totalAffairCountBeforeEdit: number
 * 
 * Last update: 08/05/2023 v0.1.1
 */
export interface IEditedCommentComprehensive {
    editedTimeBySecond: number;
    contentBeforeEdit: string;
    cuedMemberInfoArrBeforeEdit: IMemberInfo[];
    totalLikedCountBeforeEdit: number;
    totalDislikedCountBeforeEdit: number;
    totalSubcommentCountBeforeEdit?: number;
    totalAffairCountBeforeEdit: number;
}

/**
 * Comment Info
 * -     commentId: string //12 ~ 13 characters, UPPERCASE, comment id begin with 'C', subcomment id begin with 'D'
 * -     postId: string
 * -     memberId: string
 * -     nickname: string
 * -     createdTimeBySecond: number // created time of this document
 * -     content: string
 * -     cuedMemberInfoArr: IMemberInfo[]
 * 
 * Management
 * -     status: number
 * 
 * Statistics
 * -     totalLikedCount: number
 * -     totalDislikedCount: number
 * -     totalSubcommentCount: number // -1 for parent comments
 * 
 * Edit Info
 * -     editedTimeBySecond: number
 * 
 * Last update: 08/05/2023 v0.1.1
 */
export interface IRestrictedCommentComprehensive {
    // Comment Info
    commentId: string; //12 ~ 13 characters, UPPERCASE, comment id begin with 'C', subcomment id begin with 'D'
    postId: string;
    memberId: string;
    nickname: string;
    createdTimeBySecond: number; // created time of this document
    content: string;
    cuedMemberInfoArr: IMemberInfo[];

    // Management
    status: number;

    // Statistics
    totalLikedCount: number;
    totalDislikedCount: number;
    totalSubcommentCount: number; // -1 for parent comments

    // Edit Info
    editedTimeBySecond: number;
}