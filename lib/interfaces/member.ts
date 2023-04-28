// Interfaces for Member Class v0.1.1

export interface IMemberComprehensive {
    memberId: string; // 10 characters, UPPERCASE

    //// info ////
    providerId: string; // "MojitoMemberSystem" | "GitHubOAuth" | ...
    registeredTimeBySecond: number; // Math.floor(new Date().getTime() / 1000)
    verifiedTimeBySecond: number;
    emailAddress: string;

    nickname: string;
    lastNicknameUpdatedTimeBySecond: number;
    briefIntro: string;
    lastBriefIntroUpdatedTimeBySecond: number;
    gender: number; // -1 | 0 | 1
    lastGenderUpdatedTimeBySecond: number;
    birthdayBySecond: number;
    lastBirthdayUpdatedTimeBySecond: number;
    lastSettingUpdatedTimeBySecond: number;

    //// management ////
    status: number;
    allowPosting: boolean;
    lastUploadImageRequestTimeBySecond: number;
    allowCommenting: boolean;

    allowKeepingBrowsingHistory: boolean;
    allowVisitingFollowedMembers: boolean;
    allowVisitingSavedPosts: boolean;
    hidePostsAndCommentsOfBlockedMember: boolean;
}

// *registration process specialized
export interface IMinimumMemberComprehensive {
    memberId: string; // 10 characters, UPPERCASE
    providerId: string; // "MojitoMemberSystem" | "GitHubOAuth" | ...
    registeredTimeBySecond: number; // Math.floor(new Date().getTime() / 1000)
    emailAddress: string;
    nickname: string;
    status: number; // email address not verified
    allowPosting: boolean;
    allowCommenting: boolean;
}

export interface IRestrictedMemberComprehensive {
    memberId: string;

    providerId: string; // "MojitoMemberSystem" | "GitHubOAuth" | ...
    registeredTimeBySecond: number; // Math.floor(new Date().getTime() / 1000)
    verifiedTimeBySecond: number;
    emailAddress: string;

    nickname: string;
    briefIntro: string;
    gender: number;
    birthdayBySecond: number;

    status: number,
    allowPosting: boolean;
    allowCommenting: boolean;
    allowKeepingBrowsingHistory: boolean;
    allowVisitingFollowedMembers: boolean;
    allowVisitingSavedPosts: boolean;
    hidePostsAndCommentsOfBlockedMember: boolean;
}

/**
 * @property memberId: string;
 * @property nickname: string;
 * @property briefIntro: string;
 * @property createdTimeBySecond: number;
 */

export interface IMemberInfo {
    memberId: string;
    nickname: string;
    briefIntro: string;
    createdTimeBySecond: number;
}

export interface IMemberStatistics {
    memberId: string;

    // creation
    totalCreationsCount: number; // info page required
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

    // affair
    totalAffairOfCreationCount: number;
    totalAffairOfCommentCount: number;
}

export interface IConciseMemberStatistics {
    memberId: string;
    totalCreationsCount: number;
    totalCreationHitCount: number;
    totalFollowedByCount: number;
    totalCreationLikedCount: number;
    totalCreationSavedCount: number;
}

export interface ILoginJournal {
    memberId: string;
    category: 'error' | 'success';
    providerId: string; // LoginProviderId, e.g., 'MojitoMemberSystem'
    timestamp: string; // new Date().toISOString()
    message: string; // short message, e.g., 'Attempted to login while email address not verified.'
}
