/** Interfaces for Notification Class v0.1.1
 * 
 * Last update 16/02/2023
 */

export type INoticeInfoWithMemberInfo = {
    noticeId: string; // notice id
    category: string; //'cue' | 'reply' | 'like' | 'pin' | 'save' | 'follow';
    initiateId: string; // initiate member id
    nickname: string; // initiate member nickname
    avatarImageFullName: string;
    createdTime: number;
    postTitle?: string;
    commentBrief?: string;
}

// [C] notificationStatistics
export interface INotificationStatistics {
    memberId?: string; // member id
    cue?: number; // cued times accumulated from last count reset
    reply?: number;
    like?: number;
    pin?: number;
    save?: number;
    follow?: number;
}