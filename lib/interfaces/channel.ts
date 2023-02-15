/** Interfaces for Channel Class v0.1.1
 * 
 * Last update 16/02/2023
 */


export type IChannelInfo = {
    channelId: string;
    name: {
        [lang: string]: string;
    };
    svgIconPath?: string;
}

export type IChannelInfoStates = {
    channelIdSequence: string[];
}

export type IChannelInfoDictionary = {
    [channelId: string]: IChannelInfo
}


// [C] channelStatistics
export interface IChannelStatistics {
    //// info ////
    channelId: string; // pre-defined channel id
    createdTime: number;

    //// total statistics ////
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