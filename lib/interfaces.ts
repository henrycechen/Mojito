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

// [T] CommentSubcommentMappingComprehensive
export interface ISubcommentComprehensive extends IAzureTableEntity {
    partitionKey: string; // comment id
    rowKey: string; // subcomment id
    CreateTimestamp?: string;
    CreateTime?: number;
    MemberId?: string;
    Content?: string;
    SubommentStatus?: number;
}

// [PRL] Notice
export interface INoticeInfo extends IAzureTableEntity {
    partitionKey: string; // notified member id
    rowKey: string; // notify id
    Initiate: string; // initiate member id
    Nickname: string; // initiate member nickname
    PostId?: string;
    PostBrief?: string;
    CommentId?: string;
    CommentBrief?: string;
}

//////// Atlas Collection Entity////////
export interface IAtlasCollectionDocument {
    [key: string]: any;
}

// [C] INotificationStatistics
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
    totalCreationEditCount: number;
    totalCreationDeleteCount: number;
    // comment
    totalCommentCount: number;
    totalCommentEditCount: number;
    totalCommentDeleteCount: number;
    // attitude
    totalLikeCount: number;
    totalDislikeCount: number;
    // on other members
    totalFollowingCount: number;
    totalBlockedCount: number;
    // by other members
    totalCreationHitCount: number;
    totalCreationLikedCount: number; // info page required
    totalCreationDislikedCount: number;
    totalSavedCount: number;
    totalCommentLikedCount: number;
    totalCommentDislikedCount: number;
    totalFollowedByCount: number; // info page required
}

// [C] loginJournal
export interface ILoginJournal extends IAtlasCollectionDocument {
    memberId: string;
    category: 'error' | 'success';
    providerId: 'MojitoMemberSystem' | string; // LoginProviderId
    timestamp: string; // new Date().toISOString()
    message: string; // short message, e.g., 'Attempted login while email address not verified.'
}