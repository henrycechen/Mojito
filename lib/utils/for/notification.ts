import { INoticeInfoWithMemberInfo } from '../../interfaces/notification';
import { verifyNoticeId } from '../verify';

/** Utils for Notification Class v0.1.1
 * 
 * Last update 16/02/2023
 */


// Notification
export function noticeInfoToString(info: INoticeInfoWithMemberInfo, lang: string): string {
    let _lang = lang;
    if (!['tw', 'cn', 'en'].includes(lang)) {
        _lang = 'tw';
    }
    const { isValid, category, entity } = verifyNoticeId(info.noticeId);
    if (!(isValid && ['cue', 'reply', 'like', 'pin', 'save', 'follow'].includes(category))) {
        switch (_lang) {
            case 'tw': return `某位 Mojito 會員對您做了某些回應`;
            case 'cn': return `某位 Mojito 会员对您做了某些回应`;
            case 'en': return `A Mojito member has done something regarding you`;
        }
    }
    if ('cue' === category) {
        // - WebMaster在帖子“...”的评论“...”中提到了您
        // - WebMaster在帖子“...”中提到了您
        if ('comment' === entity) {
            switch (_lang) {
                case 'tw': return `在帖子 “${info.postTitle}” 的評論“${info.commentBrief}” 中提及了您`;
                case 'cn': return `在帖子 “${info.postTitle}” 的评论“${info.commentBrief}” 中提到了您`;
                case 'en': return `Mentioned you in comment "${info.commentBrief}" in "${info.postTitle}"`;
            }
        } else {
            switch (_lang) {
                case 'tw': return `在帖子“${info.postTitle}”中提及了您`;
                case 'cn': return `在帖子“${info.postTitle}”中提到了您`;
                case 'en': return `Mentioned you in post "${info.postTitle}"`;
            }
        }
    }
    if ('reply' === category) {
        // - WebMaster在帖子“...”中回复了您的评论“...”
        // - WebMaster回复了您的帖子“...”
        if ('comment' === entity) {
            switch (_lang) {
                case 'tw': return `在帖子 “${info.postTitle}” 中回復了您的評論 “${info.commentBrief}”`;
                case 'cn': return `在帖子 “${info.postTitle}” 中回复了您的评论 “${info.commentBrief}”`;
                case 'en': return `Replied your comment "${info.commentBrief}" in "${info.postTitle}"`;
            }
        } else {
            switch (_lang) {
                case 'tw': return `回复了您的帖子 “${info.postTitle}”`;
                case 'cn': return `回复了您的帖子 “${info.postTitle}”`;
                case 'en': return `Replied your post "${info.postTitle}"`;
            }
        }
    }
    if ('like' === category) {
        // - WebMaster喜欢了您在“...”中发表的评论“...”
        // - WebMaster喜欢了您的帖子“...”
        if ('comment' === entity) {
            switch (_lang) {
                case 'tw': return `喜歡了您在帖子 “${info.postTitle}” 中發表的評論 “${info.commentBrief}”`;
                case 'cn': return `赞了您在帖子 “${info.postTitle}” 中发布的评论 “${info.commentBrief}”`;
                case 'en': return `Liked your comment "${info.commentBrief}" in "${info.postTitle}"`;
            }
        } else {
            switch (_lang) {
                case 'tw': return `喜歡了您的帖子 “${info.postTitle}”`;
                case 'cn': return `赞了您在的帖子 “${info.postTitle}”`;
                case 'en': return `Liked your post "${info.postTitle}"`;
            }
        }
    }
    if ('pin' === category) {
        // - WebMaster置顶了您在“...”中发表的评论“...”
        switch (_lang) {
            case 'tw': return `置頂了您在 “${info.postTitle}” 中發表的評論 “${info.commentBrief}”`;
            case 'cn': return `置顶了您在 “${info.postTitle}” 中发布的评论 “${info.commentBrief}”`;
            case 'en': return `Pinned your comment "${info.commentBrief}" in "${info.postTitle}"`;
        }
    }
    if ('save' === category) {
        // - WebMaster收藏了“...”
        switch (_lang) {
            case 'tw': return `收藏了您的帖子 “${info.postTitle}”`;
            case 'cn': return `收藏了您的帖子 “${info.postTitle}”`;
            case 'en': return `Saved your post "${info.postTitle}"`;
        }
    }
    if ('follow' === category) {
        // - WebMaster关注了您
        switch (_lang) {
            case 'tw': return `開始關注您`;
            case 'cn': return `关注了您`;
            case 'en': return `Followed you`;
        }
    }
    return '某位 Mojito 會員對您做了某些回應'
}