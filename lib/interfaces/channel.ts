/**
 * -     channelId: string
 * -     name: { [lang: string]: string; }
 * -     svgIconPath?: string
 * 
 * Last update: 08/05/2023 v0.1.1
 */
export interface IChannelInfo {
    channelId: string;
    name: {
        [lang: string]: string;
    };
    svgIconPath?: string;
};

/**
 * -     channelIdSequence: string[]
 * 
 * Last update: 08/05/2023 v0.1.1
 */
export interface IChannelInfoStates {
    channelIdSequence: string[];
};

/**
 * -     [channelId: string]: IChannelInfo
 * 
 * Last update: 08/05/2023 v0.1.1
 */
export interface IChannelInfoDictionary {
    [channelId: string]: IChannelInfo;
};

/**
 * Info
 * -     channelId: string; // pre-defined channel id
 * -     createdTime: number;

 * Statistics
 * -     totalHitCount: number;
 * -     totalTopicCount: number;
 * -     totalPostCount: number;
 * -     totalPostDeleteCount: number;
 * -     totalLikedCount: number;
 * -     totalUndoLikedCount: number;
 * -     totalCommentCount: number; // subcomment included
 * -     totalCommentDeleteCount: number;
 * -     totalSavedCount: number;
 * -     totalUnavedCount: number;
 * 
 * Last update: 08/05/2023 v0.1.1
 */
export interface IChannelStatistics {
    // Info
    channelId: string; // pre-defined channel id
    createdTime: number;

    // Statistics
    totalHitCount: number;
    totalTopicCount: number;
    totalPostCount: number;
    totalPostDeleteCount: number;

    totalLikedCount: number;
    totalUndoLikedCount: number;

    totalCommentCount: number; // subcomment included
    totalCommentDeleteCount: number;

    totalSavedCount: number;
    totalUnavedCount: number;
}