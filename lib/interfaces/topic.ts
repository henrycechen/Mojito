/**
 * Info
 * -     topicId: string // base64 string from topic content string
 * -     content: string
 * -     channelId: string
 * -     createdTimeBySecond: number

 * Management
 * -     status: number
 * 
 * Statistics
 * -     totalHitCount: number // total hit count of total posts of this topic
 * -     totalSearchCount: number
 * -     totalPostCount: number
 * -     totalPostDeleteCount: number
 * -     totalLikedCount: number
 * -     totalUndoLikedCount: number
 * -     totalCommentCount: number
 * -     totalCommentDeleteCount: number
 * -     totalSavedCount: number
 * -     totalUndoSavedCount: number
 * 
 * Last update: 16/02/2023 v0.1.1
 */
export interface ITopicComprehensive {
    // Info
    topicId: string; // base64 string from topic content string
    content: string;
    channelId: string;
    createdTimeBySecond: number;

    // Management
    status: number;

    // Statistics
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

/**
 * -     topicId: string // base64 string from topic content string
 * -     content: string
 * -     channelId: string
 * -     totalHitCount: number
 * -     totalPostCount: number
 * 
 * Last update: 16/02/2023 v0.1.1
 */
export interface IConciseTopicComprehensive {
    topicId: string; // base64 string from topic content string
    content: string;
    channelId: string;
    totalHitCount: number;
    totalPostCount: number;
}

/**
 * -     topicId: string // base64 string from topic content string
 * -     content: string
 * 
 * Last update: 16/02/2023 v0.1.1
 */
export interface ITopicInfo {
    topicId: string; // base64 string from topic content string
    content: string;
}