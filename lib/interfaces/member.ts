/** Interfaces for Member Class v0.1.1
 * 
 * Last update 16/02/2023
 */

export interface IMemberComprehensive {
    memberId: string; // 10 characters, UPPERCASE

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

    status: number;
    allowPosting: boolean;
    allowCommenting: boolean;
}

export interface IRestrictedMemberInfo{
    memberId: string;

    providerId: string; // "MojitoMemberSystem" | "GitHubOAuth" | ...
    registeredTimeBySecond: number; // Math.floor(new Date().getTime() / 1000)
    verifiedTimeBySecond: number;

    nickname: string;
    briefIntro: string;
    birthdayBySecond: number;
}

export interface IConciseMemberInfo {
    memberId: string;
    nickname: string;
}

export interface IConciseMemberInfoWithCreatedTimeBySecond {
    memberId: string;
    nickname: string;
    createdTimeBySecond: number;
}

export interface IConciseMemberInfoWithBriefIntroAndCreatedTimeBySecond {
    memberId: string;
    nickname: string;
    briefIntro: string | undefined;
    createdTimeBySecond: number;
}

export interface IMemberStatistics {
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

export interface IConciseMemberStatistics {
    memberId: string;
    totalCreationCount: number;
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
