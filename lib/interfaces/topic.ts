/** Interfaces for Topic Class v0.1.1
 * 
 * Last update 16/02/2023
 */

// [C] topicComprehensive
export interface ITopicComprehensive {
    //// info ////
    topicId: string; // base64 string from topic content string
    content: string;
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
    content: string;
    channelId: string;
    totalHitCount: number;
    totalPostCount: number;
}

export interface ITopicInfo {
    topicId: string; // base64 string from topic content string
    content: string;
}