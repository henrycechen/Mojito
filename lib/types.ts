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
    nickname?: string;
    avatarImageUrl?: string | undefined;
    briefIntro?: string | undefined;
    gender?: -1 | 0 | 1;
    birthday?: string | undefined;
    postCounts?: number;
    commentCounts?: number;
    followingCounts?: number;
    followedByCounts?: number;
    savedCounts?: number;
    likedCounts?: number;
    dislikedCounts?: number;
}

export type VerifyEmailAddressRequestInfo = {
    emailAddress: string;
    providerId: string;
    verifyEmailAddressToken: string;
}

export type ResetPasswordRequestInfo = {
    emailAddress: string;
    resetPasswordToken: string;
    expireDate: number;
}

// Post
export type PostInfo = {
    id?: string;
    memberId?: string;
    timeStamp?: string;
    title: string;
    content: string; // depreacted
    contentParagraphsArray?: string[];
    imageUrlArr?: string[];
    channelId?: string;
    topicList?: TopicInfo[]; // string => => [type] topic
    cuedMemberList?: string[]; // string => => [type] member
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

// Topic
export type TopicInfo = {
    id: string;
    channelId: string;
    name: string;
}

// Comment
export type CommentInfo = {
    id?: string;
    memberId: string;
    createTimestamp: string;
    content: string;
    likedTimes?: number;
    dislikedTimes?: number;
    commentStatus?: number;
}