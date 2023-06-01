/**
 * -     noticeId: string
 * -     category: string //'cue' | 'reply' | 'like' | 'pin' | 'save' | 'follow';
 * -     initiateId: string // initiate member id
 * -     nickname: string // initiate member nickname
 * -     postTitle: string
 * -     commentBrief: string
 * -     createdTimeBySecond: number
 * 
 * Last update: 31/05/2023 v0.1.1
 */
export interface INotificationComprehensive {
    noticeId: string;
    category: string; //'cue' | 'reply' | 'like' | 'pin' | 'save' | 'follow';
    memberId: string;
    initiateId: string; // initiate member id
    nickname: string; // initiate member nickname
    postTitle?: string;
    commentBrief?: string;
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