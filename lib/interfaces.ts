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

export interface IMemberMapping extends IAzureTableEntity {
    partitionKey: string; // member id (subject)
    rowKey: string; // member id (object)
}

// [PRL] Notice
export interface INoticeInfo extends IAzureTableEntity {
    partitionKey: string; // notified member id
    rowKey: string; // notify id
    Category: 'Cued' | 'Replied' | 'Liked' | 'Pinned' | 'Saved' | 'Followed';
    InitiateId: string; // initiate member id
    Nickname: string; // initiate member nickname
    PostId?: string;
    PostTitle?: string;
    CommentId?: string;
    CommentBrief?: string;
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

// [C] attitudePostMapping
export interface IAttitudePostMapping extends IAtlasCollectionDocument {
    memberId: string;
    postId?: string; // divided by post id
    attitude: number; // -1 | 0 | 1
    attitudeCommentMapping: {
        [key: string]: number
    };
    attitudeSubcommentMapping: {
        [key: string]: number
    }
}

// [C] commentComprehensive
export interface ICommentComprehensive extends IAtlasCollectionDocument {
    commentId: string; // 16 characters, UPPERCASE
    postId: string;
    memberId: string;
    createdTime: number; // created time of this document (comment est.)
    content: string;
    status: number;
    edited: IEditedCommentComprehensive | null;
    totalLikedCount: number;
    totalDislikedCount: number;
    totalSubcommentCount: number;
}

export interface IEditedCommentComprehensive extends IAtlasCollectionDocument {
    editedTime: number;
    content: string;
    totalLikedCountBeforeEdit: number;
    totalDislikedCountBeforeEdit: number;
    totalSubcommentCountBeforeEdit?: number;
}

// [C] subcommentComprehensive
export interface ISubcommentComprehensive extends IAtlasCollectionDocument {
    subcommentId: string; // 16 characters, UPPERCASE
    commentId: string;
    memberId: string;
    createdTime: number; // created time of this document (subcomment est.)
    content: string;
    status: number;
    edited: IEditedCommentComprehensive | null;
    totalLikedCount: number;
    totalDislikedCount: number;
}

// [C] channelStatistics
export interface IChannelStatistics extends IAtlasCollectionDocument {

}

// [C] topicComprehensive
export interface ITopicComprehensive extends IAtlasCollectionDocument {
    topicId: string; // base64 string from topic content string
    channelId: string;
    createdTime: number; // create time of this document (topic est.)
    status: number;
    totalPostCount: number;
    totalHitCount: number; // total hit count of total posts of this topic
    totalCommentCount: number;
    totalSavedCount: number;
    totalSearchCount: number;
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
    postId: string; // 10 characters, UPPERCASE
    memberId: string;
    createdTime: number; // created time of this document (post est.)
    title: string;
    imageUrlsArr: string[];
    paragraphsArr: string[];
    channelId: string;
    topicIdsArr: string[];
    pinnedCommentId: string | null;
    edited: IEditedPostComprehensive | null;
    status: number;
    totalHitCount: number; // viewed times accumulator
    totalLikedCount: number;
    totalDislikedCount: number;
    totalCommentCount: number;
    totalSavedCount: number;
}

export interface IEditedPostComprehensive extends IAtlasCollectionDocument {
    editedTime: number;
    title: string;
    imageUrlsArr: string[];
    paragraphsArr: string[];
    channelId: string;
    topicIdsArr: string[];
    likedCountBeforeEdit: number;
    dislikedCountBeforeEdit: number;
}