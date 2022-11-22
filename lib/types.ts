export type LangConfigs = { [key: string]: any };

// States
export type SignInCredentialStates = {
    emailAddress: string;
    password: string;
    repeatpassword: string;
    showpassword: boolean;
}

export interface ProcessStates {
    [key: string]: any
}

export type Helper = {
    memorizeViewPortPositionY: number | undefined; // help scroll to memorized browsing position on viewport.width <= md
}

// Mail
export type EmailMessage = {
    sender: '<donotreply@mojito.co.nz>';
    content: {
        subject: string;
        plainText?: string;
        html?: string;
    },
    recipients: {
        to: [EmailRecipient]
    }
}

export type EmailRecipient = {
    email: string;
}

// Member
export type MemberInfo = {
    id?: string;
}

export type VerifyAccountRequestInfo = {
    memberId: string;
}

export type ResetPasswordRequestInfo = {
    memberId: string;
    resetPasswordToken: string;
    expireDate: number;
}

// Post
export type PostInfo = {
    id?: string;
    title: string;
    content: string;
    channel: string;
    imageUrlList: string[];
    viewedTimes?: number;
    likedTimes?: number;
    dislikedTimes?: number;
    savedTimes?: number;
    commentNumber?: number;
}

// Channel
export type ChannelInfo = {
    id: string;
    name: {
        [key: string]: string;
    };
    svgIconPath?: string;
}

export type ChannelDictionary = {
    [key: string]: ChannelInfo
}

// Comment

export type CommentInfo = {
    id?: string;
    memberId: string;
    content: string;
    likedTimes: number;
    dislikedTimes: number;
    commentStatus?: number;
}

// Azure Table Entity
export interface AzureTableEntity {
    partitionKey: string;
    rowKey: string;
    [key: string]: any;
}

export interface PasswordHash extends AzureTableEntity {
    partitionKey: string;
    rowKey: string;
    PasswordHashStr: string;
    IsActive?: boolean;
}

export interface ResetPasswordToken extends AzureTableEntity {
    partitionKey: string;
    rowKey: 'ResetPasswordToken';
    ResetPasswordTokenStr?: string;
    EmailMessageId?: string;
    IsActive?: boolean;
}

export interface LoginCredentialsMapping extends AzureTableEntity {
    partitionKey: string;
    rowKey: string;
    MemberIdStr: string;
    IsActive: boolean;
}

