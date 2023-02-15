import { ICommentComprehensive, IRestrictedCommentComprehensive } from '../../interfaces/comment';
import { IConciseMemberInfo } from '../../interfaces/member';

/** Utils for Comment Class v0.1.1
 * 
 * Last update 16/02/2023
 */

type CommentComprehensiveUpdate = {
    content: string;
    cuedMemberInfoArr: IConciseMemberInfo[];
    status: 201;
    totalLikedCount: 0; // reset liked and disliked count
    totalUndoLikedCount: 0; // reset undo liked and undo disliked count
    totalDislikedCount: 0;
    totalUndoDislikedCount: 0;
}

export function createCommentComprehensive(commentId: string, parentId: string, postId: string, memberId: string, content: string, cuedMemberInfoArr: any): ICommentComprehensive {
    const arr = [];
    if (Array.isArray(cuedMemberInfoArr) && cuedMemberInfoArr.length !== 0) {
        arr.push(...cuedMemberInfoArr);
    }
    const comment: ICommentComprehensive = {
        commentId,
        parentId,
        postId,
        memberId,
        createdTime: new Date().getTime(),
        content, // required
        cuedMemberInfoArr: arr,
        status: 200,
        totalLikedCount: 0,
        totalUndoLikedCount: 0,
        totalDislikedCount: 0,
        totalUndoDislikedCount: 0,
        totalEditCount: 0,
        edited: []
    }
    if ('C' === commentId.slice(0, 1)) {
        comment.totalSubcommentCount = 0
        comment.totalSubcommentDeleteCount = 0

    }
    return comment;
}

export function provideCommentComprehensiveUpdate(content: string, cuedMemberInfoArr: IConciseMemberInfo[]): CommentComprehensiveUpdate {
    const updated: CommentComprehensiveUpdate = {
        content,
        cuedMemberInfoArr,
        status: 201,
        totalLikedCount: 0, // reset liked and disliked count
        totalUndoLikedCount: 0, // reset undo liked and undo disliked count
        totalDislikedCount: 0,
        totalUndoDislikedCount: 0
    };
    return updated;
}

export function getRestrictedFromCommentComprehensive(commentComprehensive: ICommentComprehensive): IRestrictedCommentComprehensive {
    const { status, totalLikedCount, totalUndoLikedCount, totalDislikedCount, totalUndoDislikedCount } = commentComprehensive;
    const restricted: IRestrictedCommentComprehensive = {
        commentId: commentComprehensive.commentId, // 12 ~ 13 characters, UPPERCASE, begin with 'C'
        postId: commentComprehensive.postId,
        memberId: commentComprehensive.memberId,
        createdTime: commentComprehensive.createdTime, // created time of this document (comment est.)
        content: '',
        cuedMemberInfoArr: [],
        status: status,
        totalLikedCount: totalLikedCount - totalUndoLikedCount,
        totalDislikedCount: totalDislikedCount - totalUndoDislikedCount,
        totalSubcommentCount: -1
    }
    const { totalSubcommentCount, totalSubcommentDeleteCount } = commentComprehensive;
    if (('number' === typeof totalSubcommentCount) && ('number' === typeof totalSubcommentDeleteCount)) {
        if (0 > totalSubcommentCount - totalSubcommentDeleteCount) {
            restricted.totalSubcommentCount = 0
        } else {
            restricted.totalSubcommentCount = totalSubcommentCount - totalSubcommentDeleteCount;
        }
    }
    if ('number' === typeof status && 0 > status) {
        return restricted;
    }
    restricted.content = commentComprehensive.content;
    restricted.cuedMemberInfoArr.push(...commentComprehensive.cuedMemberInfoArr);
    if ('number' === typeof status && 1 === status % 100) {
        const { edited } = commentComprehensive;
        if (Array.isArray(edited) && edited.length !== 0) {
            restricted.editedTime = edited[edited.length - 1].editedTime;
        }
    }
    return restricted;
}

