/**
 * Registration Info
 * -     providerId: string // "MojitoMemberSystem" | "GitHubOAuth" | ...
 * -     emailAddress: string
 * -     registeredTimeBySecond: number
 * -     verifiedTimeBySecond: number
 * 
 * Member Info
 * -     memberId: string // 10 characters, UPPERCASE
 * -     nickname: string
 * -     lastNicknameUpdatedTimeBySecond: number
 * -     briefIntro: string
 * -     lastBriefIntroUpdatedTimeBySecond: number
 * -     gender: number // -1 | 0 | 1
 * -     lastGenderUpdatedTimeBySecond: number
 * -     birthdayBySecond: number
 * -     lastBirthdayUpdatedTimeBySecond: number
 * -     lastSettingUpdatedTimeBySecond: number
 * 
 * Management
 * -     status: number
 * -     allowPosting: boolean
 * -     lastUploadImageRequestTimeBySecond: number
 * -     allowCommenting: boolean
 * -     allowKeepingBrowsingHistory: boolean
 * -     allowVisitingFollowedMembers: boolean
 * -     allowVisitingSavedPosts: boolean
 * -     hidePostsAndCommentsOfBlockedMember: boolean
 * 
 * Last update: 08/05/2023 v0.1.1
 */
export interface IMemberComprehensive {
    providerId: string; // "MojitoMemberSystem" | "GitHubOAuth" | ...
    emailAddress: string;
    registeredTimeBySecond: number;
    verifiedTimeBySecond: number;
    
    memberId: string; // 10 characters, UPPERCASE
    nickname: string;
    lastNicknameUpdatedTimeBySecond: number;
    briefIntro: string;
    lastBriefIntroUpdatedTimeBySecond: number;
    gender: number; // -1 | 0 | 1
    lastGenderUpdatedTimeBySecond: number;
    birthdayBySecond: number;
    lastBirthdayUpdatedTimeBySecond: number;
    lastSettingUpdatedTimeBySecond: number;

    status: number;
    allowPosting: boolean;
    lastUploadImageRequestTimeBySecond: number;
    allowCommenting: boolean;
    allowKeepingBrowsingHistory: boolean;
    allowVisitingFollowedMembers: boolean;
    allowVisitingSavedPosts: boolean;
    hidePostsAndCommentsOfBlockedMember: boolean;
}

/**
 * *Registration process specialized*
 * 
 * Registration Info
 * -     providerId: string // "MojitoMemberSystem" | "GitHubOAuth" | ...
 * -     emailAddress: string;
 * -     registeredTimeBySecond: number
 * 
 * Member Info
 * -     memberId: string // 10 characters, UPPERCASE
 * -     nickname: string;
 * 
 * Management
 * -     status: number; // email address not verified
 * -     allowPosting: boolean;
 * -     allowCommenting: boolean;
 * 
 * Last update: 08/05/2023 v0.1.1
 */
export interface IMinimumMemberComprehensive {
    providerId: string; // "MojitoMemberSystem" | "GitHubOAuth" | ...
    emailAddress: string;
    registeredTimeBySecond: number; // Math.floor(new Date().getTime() / 1000)
    memberId: string; // 10 characters, UPPERCASE
    nickname: string;
    status: number; // email address not verified
    allowPosting: boolean;
    allowCommenting: boolean;
}

/**
 * Registration Info
 * -     providerId: string // "MojitoMemberSystem" | "GitHubOAuth" | ...
 * -     registeredTimeBySecond: number // Math.floor(new Date().getTime() / 1000)
 * -     verifiedTimeBySecond: number
 * 
 * Member Info
 * -     memberId: string
 * -     emailAddress: string
 * -     nickname: string
 * -     briefIntro: string
 * -     gender: number
 * -     birthdayBySecond: number
 * 
 * Management
 * -     status: number
 * -     allowPosting: boolean
 * -     allowCommenting: boolean
 * -     allowKeepingBrowsingHistory: boolean
 * -     allowVisitingFollowedMembers: boolean
 * -     allowVisitingSavedPosts: boolean
 * -     hidePostsAndCommentsOfBlockedMember: boolean
 * 
 * Last update: 08/05/2023 v0.1.1
 */
export interface IRestrictedMemberComprehensive {
    providerId: string; // "MojitoMemberSystem" | "GitHubOAuth" | ...
    emailAddress: string;
    registeredTimeBySecond: number; // Math.floor(new Date().getTime() / 1000)
    verifiedTimeBySecond: number;
    
    // Info
    memberId: string;
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
 * -     memberId: string
 * -     nickname: string
 * -     briefIntro: string
 * -     createdTimeBySecond: number
 * 
 * Last update: 08/05/2023 v0.1.1
 */
export interface IMemberInfo {
    memberId: string;
    nickname: string;
    briefIntro: string;
    createdTimeBySecond: number;
}

/**
 * -     memberId: string;
 * 
 * Creation
 * -     totalCreationsCount: number // info page required
 * -     totalCreationHitCount: number
 * -     totalCreationEditCount: number
 * -     totalCreationDeleteCount: number
 * -     totalCreationLikedCount: number // info page required
 * -     totalCreationUndoLikedCount: number
 * -     totalCreationDislikedCount: number
 * -     totalCreationUndoDislikedCount: number
 * -     totalCreationSavedCount: number // info page required
 * -     totalCreationUndoSavedCount: number
 * 
 * Attitude
 * -     totalLikeCount: number
 * -     totalUndoLikeCount: number
 * -     totalDislikeCount: number
 * -     totalUndoDislikeCount: number
 * 
 * Comment
 * -     totalCommentCount: number
 * -     totalCommentEditCount: number
 * -     totalCommentDeleteCount: number
 * -     totalCommentLikedCount: number
 * -     totalCommentUndoLikedCount: number
 * -     totalCommentDislikedCount: number
 * -     totalCommentUndoDislikedCount: number
 * 
 * Post
 * -     totalSavedCount: number
 * -     totalUndoSavedCount: number
 * 
 * On other members
 * -     totalFollowingCount: number
 * -     totalUndoFollowingCount: number
 * -     totalBlockingCount: number
 * -     totalUndoBlockingCount: number
 * 
 * By other members
 * -     totalFollowedByCount: number // info page required
 * -     totalUndoFollowedByCount: number
 * -     totalBlockedByCount: number
 * -     totalUndoBlockedByCount: number
 * 
 * Affair
 * -     totalAffairOfCreationCount: number
 * -     totalAffairOfCommentCount: number
 * 
 * Last update: 08/05/2023 v0.1.1
 */
export interface IMemberStatistics {
    memberId: string;

    // Creation
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

    // Attitude
    totalLikeCount: number;
    totalUndoLikeCount: number;
    totalDislikeCount: number;
    totalUndoDislikeCount: number;

    // Comment
    totalCommentCount: number;
    totalCommentEditCount: number;
    totalCommentDeleteCount: number;
    totalCommentLikedCount: number;
    totalCommentUndoLikedCount: number;
    totalCommentDislikedCount: number;
    totalCommentUndoDislikedCount: number;

    // Post
    totalSavedCount: number;
    totalUndoSavedCount: number;

    // On other members
    totalFollowingCount: number;
    totalUndoFollowingCount: number;
    totalBlockingCount: number;
    totalUndoBlockingCount: number;

    // By other members
    totalFollowedByCount: number; // info page required
    totalUndoFollowedByCount: number;
    totalBlockedByCount: number;
    totalUndoBlockedByCount: number;

    // Affair
    totalAffairOfCreationCount: number;
    totalAffairOfCommentCount: number;
}

/**
 * -     memberId: string
 * -     totalCreationsCount: number
 * -     totalCreationHitCount: number
 * -     totalFollowedByCount: number
 * -     totalCreationLikedCount: number
 * -     totalCreationSavedCount: number
 * 
 * Last update: 08/05/2023 v0.1.1
 */
export interface IConciseMemberStatistics {
    memberId: string;
    totalCreationsCount: number;
    totalCreationHitCount: number;
    totalFollowedByCount: number;
    totalCreationLikedCount: number;
    totalCreationSavedCount: number;
}

/**
 * -     memberId: string
 * -     category: 'error' | 'success'
 * -     providerId: string // LoginProviderId, e.g., 'MojitoMemberSystem'
 * -     timestamp: string // new Date().toISOString()
 * -     message: string // short message, e.g., 'Attempted to login while email address not verified.'
 * 
 * Last update: 08/05/2023 v0.1.1
 */
export interface ILoginJournal {
    memberId: string;
    category: 'error' | 'success';
    providerId: string; // LoginProviderId, e.g., 'MojitoMemberSystem'
    timestamp: string; // new Date().toISOString()
    message: string; // short message, e.g., 'Attempted to login while email address not verified.'
}
