import { IMemberInfo } from './member';
import { ITopicInfo } from './topic';

/**
 * Info
 * -     postId: string; // 10 characters, UPPERCASE, also used as coverImageFullname (e.g., P12345ABCDE.png)
 * -     memberId: string;
 * -     nickname: string; // initial nickname used to create this post
 * -     createdTimeBySecond: number; // created time of this document (post est.)
 * 
 * Content
 * -     title: string;
 * -     imageFullnamesArr: string[]
 * -     paragraphsArr: string[]
 * 
 * Connections & Classification
 * -     cuedMemberInfoArr: IMemberInfo[]
 * -     channelId: string
 * -     topicInfoArr: ITopicInfo[]
 * -     pinnedCommentId: string | null
 * 
 * Management
 * -     status: number
 * -     allowEditing: boolean
 * -     allowCommenting: boolean
 * 
 * Statistics
 * -     totalHitCount: number
 * -     totalMemberHitCount: number
 * 
 * Attitude
 * -     totalLikedCount: number
 * -     totalUndoLikedCount: number
 * -     totalDislikedCount: number
 * -     totalUndoDislikedCount: number
 * 
 * Comment
 * -     totalCommentCount: number
 * -     totalCommentDeleteCount: number
 * 
 * Save
 * -     totalSavedCount: number
 * -     totalUndoSavedCount: number
 * 
 * Affair
 * -     totalAffairCount: number
 * 
 * Edit Info
 * -     totalEditCount: number
 * -     edited: IEditedPostComprehensive[]
 * 
 * Last update: 08/05/2023 v0.1.1
 */
export interface IPostComprehensive {
    // Info
    postId: string; // 10 characters, UPPERCASE, also used as coverImageFullname (e.g., P12345ABCDE.png)
    memberId: string;
    nickname: string;
    createdTimeBySecond: number; // created time of this document (post est.)

    // Content
    title: string;
    imageFullnamesArr: string[];
    paragraphsArr: string[];

    // Connections and Classification
    cuedMemberInfoArr: IMemberInfo[];
    channelId: string;
    topicInfoArr: ITopicInfo[];
    pinnedCommentId: string | null;

    // Management
    status: number;
    allowEditing: boolean;
    allowCommenting: boolean;

    // Statistics
    totalHitCount: number; // viewed times accumulator
    totalMemberHitCount: number;

    // Attitude
    totalLikedCount: number;
    totalUndoLikedCount: number;
    totalDislikedCount: number;
    totalUndoDislikedCount: number;

    // Comment
    totalCommentCount: number;
    totalCommentDeleteCount: number;

    // Save
    totalSavedCount: number;
    totalUndoSavedCount: number;

    // Affair
    totalAffairCount: number;

    // Edit Info
    totalEditCount: number;
    edited: IEditedPostComprehensive[];
}

/**
 * Info
 * -     editedTimeBySecond: number
 * -     nicknameBeforeEdit: string
 * -     titleBeforeEdit: string
 * -     imageFullnamesArrBeforeEdit: string[]
 * -     paragraphsArrBeforeEdit: string[]
 * 
 * Connections & Classification
 * -     cuedMemberInfoArrBeforeEdit: IMemberInfo[];
 * -     channelIdBeforeEdit: string;
 * -     topicInfoArrBeforeEdit: ITopicInfo[];
 * 
 * Statistics
 * -     totalLikedCountBeforeEdit: number;
 * -     totalDislikedCountBeforeEdit: number;
 * -     totalAffairCountBeforeEdit: number;
 * 
 * last update: 08/05/2023 v0.1.1
 */
export interface IEditedPostComprehensive {
    editedTimeBySecond: number;

    nicknameBeforeEdit: string;

    titleBeforeEdit: string;
    imageFullnamesArrBeforeEdit: string[];
    paragraphsArrBeforeEdit: string[];

    cuedMemberInfoArrBeforeEdit: IMemberInfo[];
    channelIdBeforeEdit: string;
    topicInfoArrBeforeEdit: ITopicInfo[];

    totalLikedCountBeforeEdit: number;
    totalDislikedCountBeforeEdit: number;
    totalAffairCountBeforeEdit: number;
}

/**
 * Info
 * -     postId: string
 * -     memberId: string
 * -     createdTimeBySecond: number
 * -     title: string
 * -     imageFullnamesArr: string[]
 * -     paragraphsArr: string[]
 * 
 * Connections & Classification
 * -     cuedMemberInfoArr: IMemberInfo[]
 * -     channelId: string
 * -     topicInfoArr: ITopicInfo[]
 * -     pinnedCommentId: string | null
 * 
 * Management
 * -     status: number
 * -     allowEditing: boolean
 * -     allowCommenting: boolean
 * 
 * Statistics
 * -     totalHitCount: number
 * -     totalLikedCount: number
 * -     totalDislikedCount: number
 * -     totalCommentCount: number
 * -     totalSavedCount: number
 * 
 * Last update: 08/05/2023 v0.1.1
 */
export interface IRestrictedPostComprehensive {
    postId: string; // 10 characters, UPPERCASE
    memberId: string;
    createdTimeBySecond: number; // created time of this document (post est.)
    title: string;
    imageFullnamesArr: string[];
    paragraphsArr: string[];
    cuedMemberInfoArr: IMemberInfo[];
    channelId: string;
    topicInfoArr: ITopicInfo[];
    pinnedCommentId: string | null;

    status: number;
    allowEditing: boolean;
    allowCommenting: boolean;

    totalHitCount: number; // viewed times accumulator
    totalLikedCount: number;
    totalDislikedCount: number;
    totalCommentCount: number;
    totalSavedCount: number;

    //// edit info ////
    editedTimeBySecond: number | null;
}

/**
 * *Mainly used for create post cards in post layout components*
 * 
 * Info
 * -     postId: string
 * -     memberId: string
 * -     nickname?: string
 * -     createdTimeBySecond: number
 * -     title: string
 * -     channelId: string
 * -     *hasImages: boolean
 * 
 * Statistics
 * -     totalCommentCount: number
 * -     totalHitCount: number
 * -     totalLikedCount: number
 * -     totalDislikedCount: number
 * 
 * *`hasImages` is a unique property only exists in **IConcisePostComprehensive** comparing to its siblings.
 * It's used to tell generate the post cards with image cover or the title-only ones.
 * 
 * Last update: 08/05/2023 v0.1.1
 */
export interface IConcisePostComprehensive {
    postId: string; // 10 characters, UPPERCASE, also used as coverImageFullname (e.g., P12345ABCDE.png)
    memberId: string;
    nickname?: string;
    createdTimeBySecond: number; // created time of this document (post est.)
    title: string;
    channelId: string;
    hasImages: boolean; // [?] 0 !== imageFullnamesArr.length
    totalCommentCount: number;
    totalHitCount: number; // viewed times accumulator
    totalLikedCount: number;
    totalDislikedCount: number;
}