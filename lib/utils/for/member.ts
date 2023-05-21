import { IMemberInfo, IConciseMemberStatistics, IRestrictedMemberComprehensive } from '../../interfaces/member';
import { getRandomHexStr } from '../create';

// Utils for Member Class v0.1.1

/**
 * 
 */
export function provideAvatarImageUrl(memberId: any, domain: string, forceUpdateImageCache = false): string {
    if ('string' !== typeof memberId) {
        return ``;
    } else if (forceUpdateImageCache) {
        return `${domain}/api/avatar/${memberId}.jpeg?variant=${getRandomHexStr()}`;
    } else {
        return `${domain}/api/avatar/${memberId}.jpeg`;
    }
}

export function getNicknameBrief(nickname: any): string {
    if (!('string' === typeof nickname && '' !== nickname)) {
        return `Mojito用戶${Math.floor(Math.random() * Math.pow(10, 2)).toString(16).toUpperCase()}`;
    }
    if (nickname.length > 13) {
        return `${nickname.slice(0, 13)}...`;
    }
    return nickname;
}

export function getNicknameFromToken(token: any): string {
    if (token.hasOwnProperty('name')) {
        return token.name;
    } else if (token.hasOwnProperty('sub') && '' !== token.sub) {
        let id = `${token.sub}`;
        return 'MojitoMember ' + id.slice(0, 4);
    }
    return 'MojitoMember ' + getRandomHexStr(true);
}

export function provideMemberInfoPageUrl(memberId: string, domain: string): string {
    return `${domain}/me/id/${memberId}`;
}

export function provideCuedMemberInfoArray(cuedMemberInfoDictionary: { [memberId: string]: IMemberInfo; }): IMemberInfo[] {
    const memberIdArr = Object.keys(cuedMemberInfoDictionary);
    if (0 === memberIdArr.length) {
        return [];
    }
    return memberIdArr.map(memberId => cuedMemberInfoDictionary[memberId]);
}


export function fakeRestrictedMemberInfo(): IRestrictedMemberComprehensive {
    return {
        memberId: '',
        providerId: '',
        registeredTimeBySecond: 1676332800, // Date Tue Feb 14 2023 13:00:00 GMT+1300 (New Zealand Daylight Time)
        verifiedTimeBySecond: 1676332900,
        emailAddress: '',

        nickname: '',
        briefIntro: '',
        gender: -1,
        birthdayBySecond: 1580436000, // Date Fri Jan 31 2020 15:00:00 GMT+1300 (New Zealand Daylight Time)

        status: 0,
        allowPosting: false,
        allowCommenting: false,
        allowVisitingFollowedMembers: false,
        allowVisitingSavedPosts: false,
        allowKeepingBrowsingHistory: false,
        hidePostsAndCommentsOfBlockedMember: false
    };
}

export function fakeConciseMemberInfo(): IMemberInfo {
    return {
        memberId: '',
        nickname: '',
        briefIntro: '',
        createdTimeBySecond: 1671484182
    };
}

export function fakeConciseMemberStatistics(): IConciseMemberStatistics {
    return {
        memberId: '',
        totalCreationsCount: 0,
        totalCreationHitCount: 0,
        totalFollowedByCount: 0,
        totalCreationSavedCount: 0,
        totalCreationLikedCount: 0
    };
}