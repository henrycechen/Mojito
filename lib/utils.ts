import type { NextApiRequest, NextApiResponse } from 'next';
import { IAttitudeComprehensive, IAttitideMapping, ICommentComprehensive, IRestrictedCommentComprehensive, IRestrictedPostComprehensive, ISubcommentComprehensive, IRestrictedSubommentComprehensive, IPostComprehensive } from './interfaces';
import { ProcessStates } from './types';

//  Rules of creating random IDs / names
//
//  IDs
//  - Member id : 7 ~ 8 characters, UPPERCASE, begin with 'M'
//  - Post id : 9 ~ 10 characters, UPPERCASE, begin with 'P'
//  - Topic id : base64 string from topic content string, begin with 'T'
//  - Comment id : 12 ~ 13 characters, UPPERCASE, begin with 'C'
//  - Subcomment id : 12 ~ 13 characters, UPPERCASE, begin with 'D'
//
//  Names
//  - Image filename : 10 characters, lowercase
//
//  Tokens
//  - Verify email address token: 8 characters Hex, UPPERCASE
//  - Reset password token: 8 characters Hex, UPPERCASE
//
export function createId(catergory: 'member' | 'post' | 'comment' | 'subcomment'): string {
    switch (catergory) {
        case 'member': return 'M' + Math.floor(Math.random() * Math.pow(10, 10)).toString(35).toUpperCase(); // Length of 8 (1 + 7)
        case 'post': return 'P' + Math.floor(Math.random() * Math.pow(10, 13)).toString(35).toUpperCase(); // Length of 10 (1 + 9)
        case 'comment': return 'C' + Math.floor(Math.random() * Math.pow(10, 7)).toString(35).toUpperCase() + Math.floor(Math.random() * Math.pow(10, 8)).toString(35).toUpperCase(); // Length of 12 (1 + 11)
        case 'subcomment': return 'D' + Math.floor(Math.random() * Math.pow(10, 7)).toString(35).toUpperCase() + Math.floor(Math.random() * Math.pow(10, 8)).toString(35).toUpperCase(); // Length of 12 (1 + 11)
    }
}

export function getRandomIdStr(useUpperCase: boolean = false): string { // Length of 10
    if (useUpperCase) {
        return Math.floor(Math.random() * Math.pow(10, 15)).toString(35).toUpperCase();
    } else {
        return Math.floor(Math.random() * Math.pow(10, 15)).toString(35);
    }
}

export function getRandomIdStrL(useUpperCase: boolean = false): string { // Length of 16
    if (useUpperCase) {
        return Math.floor(Math.random() * Math.pow(10, 12)).toString(35).toUpperCase() + Math.floor(Math.random() * Math.pow(10, 12)).toString(35).toUpperCase();
    } else {
        return Math.floor(Math.random() * Math.pow(10, 12)).toString(35) + Math.floor(Math.random() * Math.pow(10, 12)).toString(35);
    }
}


export function getRandomHexStr(useUpperCase: boolean = false): string { // Length of 8 (Hex)
    if (useUpperCase) {
        return Math.floor(Math.random() * Math.pow(10, 10)).toString(16).toUpperCase();
    } else {
        return Math.floor(Math.random() * Math.pow(10, 10)).toString(16);
    }
}

export function getRandomHexStrS(useUpperCase: boolean = false): string {
    if (useUpperCase) {
        return Math.floor(Math.random() * Math.pow(10, 5)).toString(16).toUpperCase();
    } else {
        return Math.floor(Math.random() * Math.pow(10, 5)).toString(16);
    }
}

export function timeStampToString(timeStamp: any): string {
    if (!timeStamp) {
        return '0分钟前';
    }
    const diff = new Date().getTime() - new Date(timeStamp).getTime();
    if (24 * 3600000 < diff) {
        return `${(diff / (24 * 3600000)).toFixed()}天前`;
    }
    const mins = diff % 3600000;
    if (mins === diff) {
        return `${(mins / 60000).toFixed()}分钟前`
    }
    return `${(diff / 3600000).toFixed()}小时${(mins / 60000).toFixed()}分钟前`
}

//////// Nickname ////////
export function getNicknameFromToken(token: any): string {
    if (token.hasOwnProperty('name')) {
        return token.name;
    } else if (token.hasOwnProperty('sub') && '' !== token.sub) {
        let id = `${token.sub}`;
        return 'MojitoMember ' + id.slice(0, 4);
    }
    return 'MojitoMember ' + getRandomHexStrS(true);
}

//////// Content ////////
export function getContentBrief(content: any, length = 21): string {
    if ('string' !== typeof content) {
        return '';
    }
    if (content.length === 0) {
        return '';
    }
    if (content.length > 21) {
        return content.slice(0, 21) + '...';
    }
    return content;
}

//////// Attitude ////////
export function getMappingFromAttitudeComprehensive(attitudeComprehensive: IAttitudeComprehensive | null): IAttitideMapping {
    if (null === attitudeComprehensive) {
        return {
            attitude: 0,
            commentAttitudeMapping: {},
            subcommentAttitudeMapping: {}
        }
    }
    return {
        attitude: attitudeComprehensive.attitude,
        commentAttitudeMapping: { ...attitudeComprehensive.commentAttitudeMapping },
        subcommentAttitudeMapping: { ...attitudeComprehensive.subcommentAttitudeMapping }
    }
}

//////// Comment ////////
export function getRestrictedFromCommentComprehensive(commentComprehensive: ICommentComprehensive): IRestrictedCommentComprehensive {
    const { status, totalLikedCount, totalUndoLikedCount, totalDislikedCount, totalUndoDislikedCount, totalSubcommentCount, totalSubcommentDeleteCount } = commentComprehensive;
    const totalLiked = totalLikedCount - totalUndoLikedCount;
    const totalDisliked = totalDislikedCount - totalUndoDislikedCount;
    const totalSubcomment = totalSubcommentCount - totalSubcommentDeleteCount;
    const restricted: IRestrictedCommentComprehensive = {
        commentId: commentComprehensive.commentId, // 16 characters, UPPERCASE
        postId: commentComprehensive.postId,
        memberId: commentComprehensive.memberId,
        createdTime: commentComprehensive.createdTime, // created time of this document (comment est.)
        content: null,
        status: status,
        totalLikedCount: totalLiked,
        totalDislikedCount: totalDisliked,
        totalSubcommentCount: totalSubcomment,
        editedTime: null
    }
    if ('number' === typeof status && 0 > status) {
        return restricted;
    }
    restricted.content = commentComprehensive.content;
    if ('number' === typeof status && 1 === status % 100) {
        const { edited } = commentComprehensive;
        if (Array.isArray(edited) && edited.length !== 0) {
            const lastEdit = edited[edited.length - 1];
            restricted.editedTime = lastEdit.editedTime;
        }
    }
    return restricted;
}

//////// Subcomment ////////
export function getRestrictedFromSubommentComprehensive(subcommentComprehensive: ISubcommentComprehensive): IRestrictedSubommentComprehensive {
    const { status, totalLikedCount, totalUndoLikedCount, totalDislikedCount, totalUndoDislikedCount } = subcommentComprehensive;
    const totalLiked = totalLikedCount - totalUndoLikedCount;
    const totalDisliked = totalDislikedCount - totalUndoDislikedCount;
    const restricted: IRestrictedSubommentComprehensive = {
        subcommentId: subcommentComprehensive.subcommentId, // 16 characters, UPPERCASE
        commentId: subcommentComprehensive.commentId, // 16 characters, UPPERCASE
        memberId: subcommentComprehensive.memberId,
        createdTime: subcommentComprehensive.createdTime, // created time of this document (comment est.)
        content: null,
        status: status,
        totalLikedCount: totalLiked,
        totalDislikedCount: totalDisliked,
        editedTime: null
    };
    if ('number' === typeof status && 0 > status) {
        return restricted;
    }
    restricted.content = subcommentComprehensive.content;
    if ('number' === typeof status && 1 === status % 100) {
        const { edited } = subcommentComprehensive;
        if (Array.isArray(edited) && edited.length !== 0) {
            const lastEdit = edited[edited.length - 1];
            restricted.editedTime = lastEdit.editedTime;
        }
    }
    return restricted;
}

//////// Topic ////////
export function getTopicBase64StringsArrayFromRequestBody(requestBody: any): string[] {
    if ('object' !== typeof requestBody) {
        return [];
    }
    if (!(undefined !== requestBody['topicsArr'] && Array.isArray(requestBody['topicsArr']))) {
        return [];
    }
    return requestBody['topicsArr'].map(topicContent => 'T' + Buffer.from(topicContent).toString('base64'));
}

//////// Post ////////
export function getImageUrlsArrayFromRequestBody(requestBody: any): string[] {
    if ('object' !== typeof requestBody) {
        return [];
    }
    if (!(undefined !== requestBody['imageUrlsArr'] && Array.isArray(requestBody['imageUrlsArr']))) {
        return [];
    }
    return Array.prototype.filter.call([...requestBody['imageUrlsArr']], (imageUrl) => verifyUrl(imageUrl))
}

export function getParagraphsArrayFromRequestBody(requestBody: any): string[] {
    if ('object' !== typeof requestBody) {
        return [];
    }
    if (!(undefined !== requestBody['paragraphsArr'] && Array.isArray(requestBody['paragraphsArr']))) {
        return [];
    }
    return [...requestBody['paragraphsArr']];
}

export function getRestrictedFromPostComprehensive(postComprehensive: IPostComprehensive): IRestrictedPostComprehensive {
    ``
    const { status, totalLikedCount, totalUndoLikedCount, totalDislikedCount, totalUndoDislikedCount, totalCommentCount, totalCommentDeleteCount, totalSavedCount, totalUndoSavedCount } = postComprehensive;
    const totalLiked = totalLikedCount - totalUndoLikedCount;
    const totalDisliked = totalDislikedCount - totalUndoDislikedCount;
    const totalComment = totalCommentCount - totalCommentDeleteCount;
    const totalSaved = totalSavedCount - totalUndoSavedCount;
    const restricted: IRestrictedPostComprehensive = {
        //// info ////
        postId: postComprehensive.postId,
        memberId: postComprehensive.memberId,
        createdTime: postComprehensive.createdTime,
        title: null,
        imageUrlsArr: [],
        paragraphsArr: [],
        channelId: postComprehensive.channelId,
        topicIdsArr: [],
        pinnedCommentId: null,

        //// management ////
        status: status,

        //// statistics ////
        totalHitCount: postComprehensive.totalHitCount,
        totalLikedCount: totalLiked,
        totalDislikedCount: totalDisliked,
        totalCommentCount: totalComment,
        totalSavedCount: totalSaved,

        //// edit info ////
        editedTime: null,
    };
    if ('number' === typeof status && 0 > status) {
        return restricted;
    }
    restricted.title = postComprehensive.title;
    restricted.imageUrlsArr.push(...postComprehensive.imageUrlsArr);
    restricted.paragraphsArr.push(...postComprehensive.paragraphsArr);
    restricted.topicIdsArr.push(...postComprehensive.topicIdsArr);
    restricted.pinnedCommentId = postComprehensive.pinnedCommentId;
    if ('number' === typeof status && 1 === status % 100) {
        const { edited } = postComprehensive;
        if (Array.isArray(edited) && edited.length !== 0) {
            const lastEdit = edited[edited.length - 1];
            restricted.editedTime = lastEdit.editedTime;
        }
    }
    return restricted;
}

//////// Utilize local storage ////////
export function updateLocalStorage(storageName: string) {
    const update = (processStates: ProcessStates) => {
        const states: ProcessStates = { ...processStates };
        window.localStorage.setItem(storageName, JSON.stringify(states))
    }
    return update;
}

export function restoreFromLocalStorage(storageName: string) {
    const restore = (setProcessStates: Function) => {
        const prevStates: ProcessStates = JSON.parse(window.localStorage.getItem(storageName) ?? '{}')
        if (prevStates !== null && Object.keys(prevStates).length !== 0) {
            setProcessStates(prevStates);
        }
    }
    return restore;
}

//////// Verify infomation ////////
export function verifyEmailAddress(emailAddress: string): boolean {
    const regex = new RegExp(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/);
    return regex.test(emailAddress);
}

export function verifyPassword(password: any): boolean {
    if (undefined === password) {
        return false;
    }
    if ('string' !== typeof password) {
        return false;
    }
    const regex = new RegExp(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/);
    return regex.test(password);
}

export function verifyId(id: any) {
    if (!(undefined !== id && 'string' !== typeof id)) {
        return {
            isValid: false,
            category: undefined,
            id: undefined
        }
    }
    const ref = `${id}`.toUpperCase();
    const cat = ref.slice(0, 1);
    if (!(new RegExp(/[MPTCD]/).test(cat))) {
        return {
            isValid: false,
            category: undefined,
            id: undefined
        }
    }
    const idc = ref.split(cat)[1];
    switch (cat) {
        case 'M':
            if (new RegExp(`^[A-Z0-9]{7,8}$`).test(idc)) {
                return { isValid: false, category: 'member', id: undefined }
            } else {
                return { isValid: true, category: 'member', id: ref }
            }
        case 'P':
            if (new RegExp(`^[A-Z0-9]{9,10}$`).test(idc)) {
                return { isValid: false, category: 'post', id: undefined }
            } else {
                return { isValid: true, category: 'post', id: ref }
            }
        case 'T':
            if (new RegExp(`^[A-Z0-9]{5,6}$`).test(idc)) {
                return { isValid: false, category: 'topic', id: undefined }
            } else {
                return { isValid: true, category: 'topic', id: ref }
            }
        case 'C':
            if (new RegExp(`^[A-Z0-9]{12,13}$`).test(idc)) {
                return { isValid: false, category: 'comment', id: undefined }
            } else {
                return { isValid: true, category: 'comment', id: ref }
            }
        case 'D':
            if (new RegExp(`^[A-Z0-9]{12,13}$`).test(idc)) {
                return { isValid: false, category: 'subcomment', id: undefined }
            } else {
                return { isValid: true, category: 'subcomment', id: ref }
            }
        default: return {
            isValid: false,
            category: undefined,
            id: undefined
        }
    }
}

export function verifyUrl(url: any): boolean {
    if (undefined === url) {
        return false;
    }
    if ('string' !== typeof url) {
        return false;
    }
    const regex = new RegExp(/^(?:https?):\/\/(.?\w)+(:\d+)?(\/([\w.%\-\/]))?$/);
    return regex.test(url);
}

type VerifyRecaptchaResult = {
    status: number;
    message: string;
}

export async function verifyRecaptchaResponse(recaptchaServerSecret: string, recaptchaResponse: any): Promise<VerifyRecaptchaResult> {
    try {
        if ('string' !== typeof recaptchaResponse || '' === recaptchaResponse) {
            return {
                status: 403,
                message: 'Invalid ReCAPTCHA response'
            }
        }
        if ('' === recaptchaServerSecret) {
            return {
                status: 500,
                message: 'ReCAPTCHA shared key not found'
            }
        }
        const recaptchaVerifyResp = await fetch(`https://www.google.com/recaptcha/api/siteverify?secret=${recaptchaServerSecret}&response=${recaptchaResponse}`, { method: 'POST' })
        // [!] invoke of json() make the probability of causing TypeError
        const { success } = await recaptchaVerifyResp.json();
        if (!success) {
            return {
                status: 403,
                message: 'ReCAPTCHA either failed or expired'
            }
        }
        return {
            status: 200,
            message: ''
        }
    } catch (e) {
        return {
            status: 500,
            message: e instanceof TypeError ? `Was trying to reterieve info from ReCAPTCHA response. ${e}` : `Uncategorized Error occurred. ${e}`
        }
    }
}

type EnvironmentVariableObject = {
    [key: string]: string;
}

export function verifyEnvironmentVariable(obj: EnvironmentVariableObject): string | undefined {
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key) && '' === obj[key]) {
            return key;
        }
    }
    return undefined;
}

//////// Compose response ////////
export function response405(request: NextApiRequest, response: NextApiResponse) {
    const { url, method } = request;
    response.status(405).send(`${url}: ${method} is not allowed`);
}

export function response500(response: NextApiResponse, msg: string) {
    // response.status(500).send(msg);
    response.status(500).send('development' === process.env.NODE_ENV ? msg : 'Internal Server Error');
}

//////// Log ////////
export function log(msg: string, e: any = {}) {
    console.log(`[${new Date().toISOString()}] ${msg} ${e?.stack}`);
}