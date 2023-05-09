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
 * -     partitionKey: string // member id
 * -     rowKey: string // post id, also used as cover image fullname (e.g., P12345ABCDE.png)
 * -     Nickname: string
 * -     Title: string
 * -     ChannelId: string
 * -     HasImages: boolean
 * -     CreatedTimeBySecond: number
 * -     IsActive: boolean
 * 
 * Last update: 
 * - 08/05/2023 v0.1.1
 * - 09/05/2023 v0.1.2
 */
export interface IMemberPostMapping {
    partitionKey: string; // member id
    rowKey: string; // post id, also used as cover image fullname (e.g., P12345ABCDE.png)
    Nickname: string;
    Title: string;
    ChannelId: string;
    HasImages: boolean;
    CreatedTimeBySecond: number;
    IsActive: boolean;
}

/**
 * -     topicId: string
 * -     postId: string
 * -     channelId: string
 * -     createdTimeBySecond: number // created time of this document
 * -     status: number
 * 
 * Last update: 08/05/2023 v0.1.1
 */
export interface ITopicPostMapping {
    topicId: string;
    postId: string;
    channelId: string;
    createdTimeBySecond: number; // created time of this document
    status: number;
}