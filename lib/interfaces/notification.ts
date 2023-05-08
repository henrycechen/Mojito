/**
 * -     partitionKey: string // notified member id
 * -     rowKey: string // notice id, combined id string
 * -     Category: string
 * -     InitiateId: string // initiate member id
 * -     Nickname: string // initiate member nickname
 * ~~-     PostId: string // [!] deprecated~~
 * -     PostTitle: string
 * -     CommentBrief: string
 * -     CreatedTimeBySecond: number
 * ~~-     IsActive: boolean // [!] deprecated~~
 * 
 * Last update: 16/02/2023 v0.1.1
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
}

/**
 * -     noticeId: string
 * -     category: string //'cue' | 'reply' | 'like' | 'pin' | 'save' | 'follow';
 * -     initiateId: string // initiate member id
 * -     nickname: string // initiate member nickname
 * -     postTitle: string
 * -     commentBrief: string
 * -     createdTimeBySecond: number
 * 
 * Last update: 08/05/2023 v0.1.1
 */
export interface INoticeInfoWithMemberInfo {
    noticeId: string;
    category: string; //'cue' | 'reply' | 'like' | 'pin' | 'save' | 'follow';
    initiateId: string; // initiate member id
    nickname: string; // initiate member nickname
    postTitle: string;
    commentBrief: string;
    createdTimeBySecond: number;
}

/**
 * -     memberId: string
 * -     cue: number // cued times accumulated from last reset
 * -     reply: number
 * -     like: number
 * -     pin: number
 * -     save: number
 * -     follow: number
 * 
 * Last update: 08/05/2023 v0.1.1
 */
export interface INotificationStatistics {
    memberId: string;
    cue: number; // cued times accumulated from last reset
    reply: number;
    like: number;
    pin: number;
    save: number;
    follow: number;
}