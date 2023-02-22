/** Interfaces for Notification Class v0.1.1
 * 
 * Last update 16/02/2023
 */

export interface INoticeInfo {
    partitionKey: string; // notified member id
    rowKey: string; // notice id, combined id string
    Category: string;
    InitiateId: string; // initiate member id
    Nickname: string; // initiate member nickname
    PostTitle: string;
    CommentBrief: string;
    CreatedTimeBySecond: number;
    IsActive: boolean;
}

export interface INoticeInfoWithMemberInfo {
    noticeId: string; // notice id
    category: string; //'cue' | 'reply' | 'like' | 'pin' | 'save' | 'follow';
    initiateId: string; // initiate member id
    nickname: string; // initiate member nickname
    postTitle: string;
    commentBrief: string;
    createdTimeBySecond: number;
}

// [C] notificationStatistics
export interface INotificationStatistics {
    memberId: string; // member id
    cue: number; // cued times accumulated from last count reset
    reply: number;
    like: number;
    pin: number;
    save: number;
    follow: number;
}