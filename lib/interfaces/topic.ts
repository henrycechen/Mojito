/** Interfaces for Topic Class v0.1.1
 * 
 * Last update 16/02/2023
 */

// [C] topicComprehensive
export interface ITopicComprehensive {
    //// info ////
    topicId: string; // base64 string from topic content string
    channelId: string;
    createdTimeBySecond: number;

    //// management ////
    status: number;

    //// total statistics ////
    totalHitCount: number; // total hit count of total posts of this topic
    totalSearchCount: number;
    totalPostCount: number;
    totalPostDeleteCount: number;
    totalLikedCount: number;
    totalUndoLikedCount: number;
    totalCommentCount: number;
    totalCommentDeleteCount: number;
    totalSavedCount: number;
    totalUndoSavedCount: number;
}

export interface IConciseTopicComprehensive {
    topicId: string; // base64 string from topic content string
    channelId: string;
    totalPostCount: number;
}

// [C] topicPostMapping
export interface ITopicPostMapping {
    topicId: string;
    postId: string;
    channelId: string;
    createdTimeBySecond: number; // created time of this document (post est. time)
    status: number;
}