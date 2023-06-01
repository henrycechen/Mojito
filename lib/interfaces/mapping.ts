/**
 * -     partitionKey: string // subject member id
 * -     rowKey: string // object member id
 * -     Nickname: string
 * -     BriefIntro: string
 * -     CreatedTimeBySecond: number
 * -     IsActive: boolean
 * 
 * Last update: 08/05/2023 v0.1.1
 */
export interface IMemberMemberMapping {
    partitionKey: string; // subject member id
    rowKey: string; // object member id
    Nickname: string;
    BriefIntro: string;
    CreatedTimeBySecond: number;
    IsActive: boolean;
}

/**
 * -     memberId: string // member id
 * -     postId: string // post id, also used as cover image fullname (e.g., P12345ABCDE.png)
 * -     title: string
 * -     channelId: string
 * -     authorId: string
 * -     nickname: string
 * -     createdTimeBySecond: number
 * -     status: number
 * 
 * Last update: 
 * - 08/05/2023 v0.1.1
 * - 09/05/2023 v0.1.2
 * - 31/05/2023 v0.1.2
 */
export interface IMemberPostMapping {
    memberId: string; // member id
    postId: string; // post id, also used as cover image fullname (e.g., P12345ABCDE.png)
    title: string;
    channelId: string;
    authorId: string;
    nickname: string;
    createdTimeBySecond: number;
    status: number;
}

/**
 * -     topicId: string
 * -     postId: string
 * -     title: string
 * -     channelId: string
 * -     memberId: string
 * -     nickname: string
 * -     createdTimeBySecond: number // created time of this document
 * -     status: number
 * 
 * Last update: 08/05/2023 v0.1.1
 * Last update: 31/05/2023 v0.1.2
 */
export interface ITopicPostMapping {
    topicId: string;
    postId: string;
    title: string;
    channelId: string;
    memberId: string;
    nickname: string;
    createdTimeBySecond: number; // created time of this document
    status: number;
}