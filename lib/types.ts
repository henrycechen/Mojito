import { IConciseMemberInfo } from "./interfaces";

export type LangConfigs = {
    [key: string]: any
};

// States
export type TSignInCredentialStates = {
    emailAddress: string;
    password: string;
    repeatpassword: string;
    showpassword: boolean;
}

export type TBrowsingHelper = {
    memorizeViewPortPositionY: number | undefined; // help scroll to memorized browsing position on viewport.width <= md
}

// Preference
export type TPreferenceStates = {
    lang: string;
    mode: 'light' | 'dark';
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
export type TMemberInfo = {
    memberId?: string;
    nickname?: string;
    avatarImageUrl?: string | undefined;
    briefIntro?: string | undefined;
    gender?: -1 | 0 | 1;
    birthday?: string | undefined;
}

export type TMemberStatistics = {
    memberId?: string;
    totalCreationCount?: number; // info page required
    totalCreationLikedCount?: number; // info page required
    totalFollowedByCount?: number; // info page required
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

// Notice
export type TNoticeInfoWithMemberInfo = {
    noticeId: string; // notice id
    category: string; //'cue' | 'reply' | 'like' | 'pin' | 'save' | 'follow';
    initiateId: string; // initiate member id
    nickname: string; // initiate member nickname
    avatarImageUrl: string;
    createdTime: number;
    postTitle?: string;
    commentBrief?: string;
}

// Comment

export type TRestrictedCommentInfo = {
    commentId: string; //12 ~ 13 characters, UPPERCASE, comment id begin with 'C', subcomment id begin with 'D'
    parentId: string;
    postId: string;
    memberId: string;
    createdTime: number; // created time of this document
    content: string | null;
    cuedMemberInfoArr: IConciseMemberInfo[];

    //// management ////
    status: number;
}

// Channel
export type TChannelInfo = {
    channelId: string;
    name: {
        [lang: string]: string;
    };
    svgIconPath?: string;
}

export type TChannelInfoStates = {
    channelIdSequence: string[];
}

export type TChannelInfoDictionary = {
    [channelId: string]: TChannelInfo
}

// Post
export type TRestrictedPostComprehensive = {
    postId: string; // 10 characters, UPPERCASE
    memberId: string;
    createdTime: number; // created time of this document (post est.)
    title: string | null;
    imageUrlsArr: string[];
    paragraphsArr: string[];
    cuedMemberInfoArr: IConciseMemberInfo[];
    channelId: string;
    topicIdsArr: string[];
    pinnedCommentId?: string | null;

    //// management ////
    status: number;

    //// statistics ////
    totalHitCount: number; // viewed times accumulator
    totalLikedCount: number;
    totalDislikedCount: number;
    totalCommentCount: number;
    totalSavedCount: number;

    //// edit info ////
    editedTime?: number | null;
}

export type TPostStatistics = {
    totalHitCount: number; // viewed times accumulator
    totalLikedCount: number;
    totalDislikedCount: number;
    totalCommentCount: number;
    totalSavedCount: number;
}