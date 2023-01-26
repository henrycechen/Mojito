// import common interfaces
// import { IMemberMemberMapping, INoticeInfo, IMemberPostMapping, IMemberComprehensive, IConciseMemberInfo, IMemberStatistics, ILoginJournal, INotificationStatistics, IAttitudeComprehensive, IAttitideMapping, ICommentComprehensive, IEditedCommentComprehensive, IRestrictedCommentComprehensive, IChannelStatistics, ITopicComprehensive, ITopicPostMapping, IPostComprehensive, IEditedPostComprehensive, IRestrictedPostComprehensive } from '../../../../lib/interfaces';

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

export interface IUpdatePasswordCredentials extends ICredentials {
    partitionKey: string; // email address sh1 hash
    rowKey: 'UpdatePassword';
    ResetPasswordToken: string;
}

// [RL] & [PRL] ...MemberMapping
export interface IMemberMemberMapping extends IAzureTableEntity {
    partitionKey: string; // subject member id
    rowKey: string; // object member id
    IsActive: boolean;
}

// [PRL] Notice
export interface INoticeInfo extends IAzureTableEntity {
    partitionKey: string; // notified member id
    rowKey: string; // notice id
    Category: 'cue' | 'reply' | 'like' | 'pin' | 'save' | 'follow';
    InitiateId: string; // initiate member id
    Nickname: string; // initiate member nickname
    PostTitle?: string;
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

// [C] memberComprehensive
export interface IMemberComprehensive extends IAtlasCollectionDocument {
    memberId: string; // 10 characters, UPPERCASE
    providerId?: string; // "MojitoMemberSystem" | "GitHubOAuth" | ...
    registeredTime?: number;
    verifiedTime?: number;
    emailAddress?: string;
    memberIndex?: number;
    nickname?: string;
    nicknameBase64?: string; // prevent duplicated nickname when re-naming
    avatarImageUrl?: string;
    briefIntro?: string;
    gender?: -1 | 0 | 1;
    birthday?: string;
    status: number;
    allowPosting?: boolean;
    allowCommenting?: boolean;
}

export interface IConciseMemberInfo {
    memberId: string;
    nickname: string;
    avatarImageUrl: string;
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

export interface IConciseMemberStatistics extends IAtlasCollectionDocument {
    memberId: string;
    totalCreationCount: number;
    totalCreationLikedCount: number;
    totalFollowedByCount: number;
}

// [C] loginJournal
export interface ILoginJournal extends IAtlasCollectionDocument {
    memberId: string;
    category: 'error' | 'success';
    providerId: 'MojitoMemberSystem' | string; // LoginProviderId
    timestamp: string; // new Date().toISOString()
    message: string; // short message, e.g., 'Attempted to login while email address not verified.'
}

// [C] notificationStatistics
export interface INotificationStatistics extends IAtlasCollectionDocument {
    memberId?: string; // member id
    cue?: number; // cued times accumulated from last count reset
    reply?: number;
    like?: number;
    pin?: number;
    save?: number;
    follow?: number;
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
    commentId: string; // 12 ~ 13 characters, UPPERCASE, comment id begin with 'C', subcomment id begin with 'D'
    parentId: string; //  post id (comment entities) or comment id (subcomment entities)
    postId: string;
    memberId: string;
    createdTime: number; // created time of this document
    content: string;
    cuedMemberInfoArr: IConciseMemberInfo[];

    //// management ////
    status: number;

    //// statistics ////
    totalLikedCount: number;
    totalUndoLikedCount: number;
    totalDislikedCount: number;
    totalUndoDislikedCount: number;
    totalSubcommentCount?: number; // for comment entities only
    totalSubcommentDeleteCount?: number; // for comment entities only
    totalEditCount: number;

    //// edit info ////
    edited: IEditedCommentComprehensive[];
}

export interface IEditedCommentComprehensive extends IAtlasCollectionDocument {
    editedTime: number;
    contentBeforeEdit: string;
    cuedMemberInfoArrBeforeEdit: IConciseMemberInfo[];
    //// Statistics ////
    totalLikedCountBeforeEdit: number;
    totalDislikedCountBeforeEdit: number;
    totalSubcommentCountBeforeEdit?: number;
}

export interface IRestrictedCommentComprehensive extends IAtlasCollectionDocument {
    //// info ////
    commentId: string; //12 ~ 13 characters, UPPERCASE, comment id begin with 'C', subcomment id begin with 'D'
    postId: string;
    memberId: string;
    createdTime: number; // created time of this document
    content: string;
    cuedMemberInfoArr: IConciseMemberInfo[];

    //// management ////
    status: number;

    //// statistics ////
    totalLikedCount: number;
    totalDislikedCount: number;
    totalSubcommentCount: number; // -1 for parent comments

    //// edit info ////
    editedTime?: number;
}

export interface IRestrictedCommentComprehensiveWithMemberInfo extends IAtlasCollectionDocument {
    //// info ////
    commentId: string; //12 ~ 13 characters, UPPERCASE, comment id begin with 'C', subcomment id begin with 'D'
    postId: string;
    memberId: string;
    nickname: string;
    avatarImageUrl: string;
    createdTime: number; // created time of this document
    content: string;
    cuedMemberInfoArr: IConciseMemberInfo[];

    //// management ////
    status: number;

    //// statistics ////
    totalLikedCount: number;
    totalDislikedCount: number;
    totalSubcommentCount: number; // -1 for parent comments

    //// edit info ////
    editedTime?: number;
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

export interface IConciseTopicComprehensive extends IAtlasCollectionDocument {
    topicId: string; // base64 string from topic content string
    channelId: string;
    totalPostCount: number;
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
    cuedMemberInfoArr: IConciseMemberInfo[];
    channelId: string;
    topicIdsArr: string[];
    pinnedCommentId: string | null;

    //// management ////
    status: number;

    //// statistics ////
    totalHitCount: number; // viewed times accumulator
    totalMemberHitCount: number;
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
    titleBeforeEdit: string;
    imageUrlsArrBeforeEdit: string[];
    paragraphsArrBeforeEdit: string[];
    cuedMemberInfoArrBeforeEdit: IConciseMemberInfo[];
    channelIdBeforeEdit: string;
    topicIdsArrBeforeEdit: string[];
    totalLikedCountBeforeEdit: number;
    totalDislikedCountBeforeEdit: number;
}

export interface IRestrictedPostComprehensive extends IAtlasCollectionDocument {
    //// info ////
    postId: string; // 10 characters, UPPERCASE
    memberId: string;
    createdTime: number; // created time of this document (post est.)
    title: string;
    imageUrlsArr: string[];
    paragraphsArr: string[];
    cuedMemberInfoArr: IConciseMemberInfo[];
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

export interface IConcisePostComprehensive extends IAtlasCollectionDocument {
    postId: string; // 10 characters, UPPERCASE
    memberId: string;
    createdTime: number; // created time of this document (post est.)
    title: string;
    imageUrlsArr: string[];

    totalHitCount: number; // viewed times accumulator
    totalLikedCount: number;
}
export interface IConcisePostComprehensiveWithMemberInfo extends IAtlasCollectionDocument {
    postId: string; // 10 characters, UPPERCASE
    memberId: string;
    nickname: string;
    avatarImageUrl: string;
    createdTime: number; // created time of this document (post est.)
    title: string;
    imageUrlsArr: string[];

    totalHitCount: number; // viewed times accumulator
    totalLikedCount: number;
}