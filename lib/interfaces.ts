import { AzureKeyCredential } from "@azure/core-auth";

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

// [T] MemberLogin
interface IMemberLoginEntity extends IAzureTableEntity {
    partitionKey: string;
    rowKey: 'PasswordHash' | 'ResetPasswordToken';
    [key: string]: any;
}

export interface IPasswordHash extends IMemberLoginEntity {
    partitionKey: string;
    rowKey: 'PasswordHash'
    PasswordHashStr: string;
    IsActive?: boolean;
}

export interface IResetPasswordToken extends IMemberLoginEntity {
    partitionKey: string;
    rowKey: 'ResetPasswordToken';
    ResetPasswordTokenStr?: string;
    EmailMessageId?: string;
    IsActive?: boolean;
}

// [RL] LoginCredentialsMapping
interface ILoginCredentialsMappingEntity extends IAzureTableEntity {
    partitionKey: 'EmailAddress' | 'MojitoMemberId';
    rowKey: string;
    MemberId: string
    IsActive: boolean;
}

export interface IEmailAddressLoginCredentialMapping extends ILoginCredentialsMappingEntity {
    partitionKey: 'EmailAddress';
    rowKey: string; // email address
    MemberId: string;
    IsActive: boolean;
}

// [PRL] NicknameMapping
export interface INicknameMapping extends IAzureTableEntity {
    partitionKey: 'Nickname';
    rowKey: string; // nickname
    MemberId: string
}

// [T] MemberComprehensive
interface IComprehensiveEntity extends IAzureTableEntity {
    partitionKey: string; // id
    rowKey: 'Info' | 'Management';
    [key: string]: any;
}

// [T] MemberComprehensive
interface IMemberComprehensive extends IComprehensiveEntity {
    partitionKey: string; // member id
    rowKey: 'Info' | 'Management';
    [key: string]: any;
}

export interface IMemberInfo extends IMemberComprehensive {
    partitionKey: string; // member id
    rowKey: 'Info';
    EmailAddress: string;
    Nickname?: string;
    AvatarImageUrl?: string;
    BriefIntro?: string;
    Gender: -1 | 0 | 1;
    Birthday?: string;
}

export interface IMemberManagement extends IMemberComprehensive {
    partitionKey: string; // member id
    rowKey: 'Management';
    MemberStatus: number;
    AllowPosting: boolean;
    AllowCommenting: boolean;
}

// [T] PostCommentMappingComprehensive
export interface IPostCommentMappingComprehensive extends IAzureTableEntity {
    partitionKey: string; // post id
    rowKey: string; // comment id
    MemberId: string;
    Content: string;
    CommentStatus: number;
}

// [T] CommentSubcommentMappingComprehensive
export interface ICommentSubcommentMappingComprehensive extends IAzureTableEntity {
    partitionKey: string; // comment id
    rowKey: string; // subcomment id
    MemberId: string;
    Content: string;
    SubommentStatus: number;
}

// [PRL] Notification
export interface INotification extends IAzureTableEntity {
    partitionKey: string; // notified member id
    rowKey: string; // notify id
    Initiate: string; // initiate member id
    Nickname: string; // initiate member nickname
    PostId?: string;
    PostBrief?: string;
    CommentId?: string;
    CommentBrief?: string;
}

// [T] TopicComprehensive
interface ITopicComprehensive extends IComprehensiveEntity {
    partitionKey: string; // topic id
    rowKey: 'Info' | 'Management';
    [key: string]: any;
}

export interface ITopicInfo extends ITopicComprehensive {
    partitionKey: string; // topic id
    rowKey: 'Info';
    Name: string;
}

export interface ITopicManagement extends ITopicComprehensive {
    partitionKey: string; // topic id
    rowKey: 'Management';
    TopicStatus: number;
}

// [T] PostComprehensive
interface IPostComprehensive extends IComprehensiveEntity {
    partitionKey: string; // post id
    rowKey: 'Info' | 'Management';
    [key: string]: any;
}

export interface IPostInfo extends IPostComprehensive {
    partitionKey: string; // post id
    rowKey: 'Info';
    MemberId: string; // member id
    Title: string;
    ImageUrlsArr: string; // stringified array
    ParagraphsArr: string; // stringified array
    ChannelId: string;
    TopicIdsArr: string; // stringified array
}

export interface IPostManagement extends IPostComprehensive {
    partitionKey: string; // post id
    rowKey: 'Management';
    PostStatus: number;
}

//////// Atlas Collection Entity////////
export interface IAtlasCollectionEntity {
    _id: string; // mongodb object id
    [key: string]: any;
}