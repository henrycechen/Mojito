//////// Process States ////////
export interface IProcessStates {
    [key: string]: any
}

//////// Azure Table Entity ////////
export interface IAzureTableEntity {
    partitionKey: string;
    rowKey: string;
    [key: string]: any;
}

// [RL] Credentials
interface ICredentials extends IAzureTableEntity {
    partitionKey: string; // email address sh1 hash
    rowKey: string;
    [key: string]: any;
}

export interface ILoginCredentials extends ICredentials {
    partitionKey: string; // email address sh1 hash
    rowKey: string; // login provider id
    MemberId: string;
    PasswordHash?: string;
}

export interface IMojitoMemberSystemLoginCredentials extends ILoginCredentials {
    partitionKey: string; // email address sh1 hash
    rowKey: 'MojitoMemberSystem'; // login provider id
    MemberId: string;
    PasswordHash: string;
}

export interface IVerifyEmailAddressCredentials extends ICredentials {
    partitionKey: string; // email address sh1 hash
    rowKey: 'VerifyEmailAddress';
    VerifyEmailAddressToken: string;
}

export interface IResetPasswordCredentials extends ICredentials {
    partitionKey: string; // email address sh1 hash
    rowKey: 'ResetPassword';
    ResetPasswordToken: string;
}

// [PRL] Notice
export interface INoticeInfo extends IAzureTableEntity {
    partitionKey: string; // notified member id
    rowKey: string; // entity id (post / comment / subcomment id)
    Category: 'Cued' | 'Replied' | 'Liked' | 'Pinned' | 'Saved' | 'Followed';
    InitiateId: string; // initiate member id
    Nickname: string; // initiate member nickname
    PostId?: string;
    PostTitle?: string;
    CommentId?: string;
    CommentBrief?: string;
}

// [RL] HistoryMapping
export interface IMemberPostMapping extends IAzureTableEntity {
    partitionKey: string; // member id
    rowKey: string; // post id
    IsActive: boolean;
}

//////// Atlas Collection Entity ////////
export interface IAtlasCollectionDocument {
    [key: string]: any;
}

// [C] notificationStatistics
export interface INotificationStatistics extends IAtlasCollectionDocument {
    memberId: string; // member id
    cuedCount?: number; // cued times accumulated from last count reset
    repliedCount?: number;
    likedCount?: number;
    savedCount?: number;
    followedCound?: number;
}

// [C] memberComprehensive
export interface IMemberComprehensive extends IAtlasCollectionDocument {
    memberId: string; // 10 characters, UPPERCASE
    providerId?: string; // "MojitoMemberSystem" | "GitHubOAuth" | ...
    registeredTime?: number;
    verifiedTime?: number;
    emailAddress?: string;
    memberIndex?: number;
    nickname?: string;
    nicknameHash?: string; // prevent duplicated nickname when re-naming
    avatarImageUrl?: string;
    briefIntro?: string;
    gender?: -1 | 0 | 1;
    birthday?: string;
    status?: number;
    allowPosting?: boolean;
    allowCommenting?: boolean;
}

// [C] memberStatistics
export interface IMemberStatistics extends IAtlasCollectionDocument {
    memberId: string;

    // creation
    totalCreationCount: number; // info page required
    totalCreationHitCount: number;
    totalCreationEditCount: number;
    totalCreationDeleteCount: number;
    totalCreationLikedCount: number; // info page required
    totalCreationUndoLikedCount: number;
    totalCreationDislikedCount: number;
    totalCreationUndoDislikedCount: number;
    totalCreationSavedCount: number; // info page required
    totalCreationUndoSavedCount: number;

    // attitude
    totalLikeCount: number;
    totalUndoLikeCount: number;
    totalDislikeCount: number;
    totalUndoDislikeCount: number;

    // comment
    totalCommentCount: number;
    totalCommentEditCount: number;
    totalCommentDeleteCount: number;
    totalCommentLikedCount: number;
    totalCommentUndoLikedCount: number;
    totalCommentDislikedCount: number;
    totalCommentUndoDislikedCount: number;

    // post
    totalSavedCount: number;
    totalUndoSavedCount: number;

    // on other members
    totalFollowingCount: number;
    totalUndoFollowingCount: number;
    totalBlockingCount: number;
    totalUndoBlockingCount: number;

    // by other members
    totalFollowedByCount: number; // info page required
    totalUndoFollowedByCount: number;
    totalBlockedByCount: number;
    totalUndoBlockedByCount: number;
}

// [C] loginJournal
export interface ILoginJournal extends IAtlasCollectionDocument {
    memberId: string;
    category: 'error' | 'success';
    providerId: 'MojitoMemberSystem' | string; // LoginProviderId
    timestamp: string; // new Date().toISOString()
    message: string; // short message, e.g., 'Attempted login while email address not verified.'
}

// [C] attitudeComprehensive
export interface IAttitudeComprehensive extends IAtlasCollectionDocument {
    memberId: string;
    postId: string; // divided by post id
    attitude: number; // -1 | 0 | 1
    commentAttitudeMapping: {
        [key: string]: number
    };
}

export interface IAttitideMapping extends IAtlasCollectionDocument {
    attitude: number; // -1 | 0 | 1
    commentAttitudeMapping: {
        [key: string]: number
    };
}

// [C] commentComprehensive
export interface ICommentComprehensive extends IAtlasCollectionDocument {
    //// info ////
    commentId: string; // 12 ~ 13 characters, UPPERCASE, begin with 'C'
    postId: string;
    memberId: string;
    createdTime: number; // created time of this document (comment est.)
    content: string;

    //// management ////
    status: number;

    //// statistics ////
    totalLikedCount: number;
    totalUndoLikedCount: number;
    totalDislikedCount: number;
    totalUndoDislikedCount: number;
    totalSubcommentCount: number;
    totalSubcommentDeleteCount: number;
    totalEditCount: number;

    //// edit info ////
    edited: IEditedCommentComprehensive[];
}

export interface IEditedCommentComprehensive extends IAtlasCollectionDocument {
    editedTime: number;
    content: string;
    totalLikedCountBeforeEdit: number;
    totalDislikedCountBeforeEdit: number;
    totalSubcommentCountBeforeEdit?: number;
}

export interface IRestrictedCommentComprehensive extends IAtlasCollectionDocument {
    //// info ////
    commentId: string; //12 ~ 13 characters, UPPERCASE, begin with 'C'
    postId: string;
    memberId: string;
    createdTime: number; // created time of this document (comment est.)
    content: string | null;

    //// management ////
    status: number;

    //// statistics ////
    totalLikedCount: number;
    totalDislikedCount: number;
    totalSubcommentCount: number;

    //// edit info ////
    editedTime: number | null;
}

// [C] subcommentComprehensive
export interface ISubcommentComprehensive extends IAtlasCollectionDocument {
    //// info ////
    commentId: string; // 12 ~ 13 characters, UPPERCASE, begin with 'D'
    parentId: string; // parent comment id
    postId: string;
    memberId: string;
    createdTime: number; // created time of this document (subcomment est.)
    content: string;

    //// management ////
    status: number;

    //// statistics ////
    totalLikedCount: number;
    totalUndoLikedCount: number;
    totalDislikedCount: number;
    totalUndoDislikedCount: number;
    totalEditCount: number;

    //// edit info ////
    edited: IEditedCommentComprehensive[];
}

export interface IRestrictedSubommentComprehensive extends IAtlasCollectionDocument {
    //// info ////
    commentId: string; // 12 ~ 13 characters, UPPERCASE, begin with 'D'
    parentId: string; // parent comment id
    memberId: string;
    createdTime: number; // created time of this document (comment est.)
    content: string | null;

    //// management ////
    status: number;

    //// statistics ////
    totalLikedCount: number;
    totalDislikedCount: number;

    //// edit info ////
    editedTime: number | null;
}

// [C] channelStatistics
export interface IChannelStatistics extends IAtlasCollectionDocument {
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

// [C] topicComprehensive
export interface ITopicComprehensive extends IAtlasCollectionDocument {
    //// info ////
    topicId: string; // base64 string from topic content string
    channelId: string;
    createdTime: number; // create time of this document (topic est.)

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

// [C] topicPostMapping
export interface ITopicPostMapping extends IAtlasCollectionDocument {
    topicId: string;
    postId: string;
    channelId: string;
    createdTime: number; // created time of this document (post est. time)
    status: number;
}

// [C] postComprehensive
export interface IPostComprehensive extends IAtlasCollectionDocument {
    //// info ////
    postId: string; // 10 characters, UPPERCASE
    memberId: string;
    createdTime: number; // created time of this document (post est.)
    title: string;
    imageUrlsArr: string[];
    paragraphsArr: string[];
    channelId: string;
    topicIdsArr: string[];
    pinnedCommentId: string | null;

    //// management ////
    status: number;

    //// statistics ////
    totalHitCount: number; // viewed times accumulator
    totalLikedCount: number;
    totalUndoLikedCount: number;
    totalDislikedCount: number;
    totalUndoDislikedCount: number;
    totalCommentCount: number;
    totalCommentDeleteCount: number;
    totalSavedCount: number;
    totalUndoSavedCount: number;
    totalEditCount: number;

    //// edit info ////
    edited: IEditedPostComprehensive[];
}

export interface IEditedPostComprehensive extends IAtlasCollectionDocument {
    editedTime: number;
    titleBeforeEdited: string;
    imageUrlsArrBeforeEdited: string[];
    paragraphsArrBeforeEdited: string[];
    channelIdBeforeEdited: string;
    topicIdsArrBeforeEdited: string[];
    totalLikedCountBeforeEdit: number;
    totalDislikedCountBeforeEdit: number;
}

export interface IRestrictedPostComprehensive extends IAtlasCollectionDocument {
    //// info ////
    postId: string; // 10 characters, UPPERCASE
    memberId: string;
    createdTime: number; // created time of this document (post est.)
    title: string | null;
    imageUrlsArr: string[];
    paragraphsArr: string[];
    channelId: string;
    topicIdsArr: string[];
    pinnedCommentId: string | null;

    //// management ////
    status: number;

    //// statistics ////
    totalHitCount: number; // viewed times accumulator
    totalLikedCount: number;
    totalDislikedCount: number;
    totalCommentCount: number;
    totalSavedCount: number;

    //// edit info ////
    editedTime: number | null;
}