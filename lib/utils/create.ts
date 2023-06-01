// Utils for creating ids and strings v0.1.1

// Last update 16/02/2023


//  Rules of creating random IDs / names
//
//  IDs
//  - Member id : 8 ~ 9 characters, UPPERCASE, begin with 'M'
//  - Notice id : UPPERCASE, begin with 'N'
//  - Post id : 10 ~ 11 characters, UPPERCASE, begin with 'P'
//  - Comment/Subcomment id : 12 ~ 13 characters, UPPERCASE, comment begin with 'C', subcomment begin with 'D'
//  - Affair id : 12 ~ 13 characters, UPPERCASE, begin with 'R'
//
//  Names
//  - Image filename : 10 characters, lowercase
//
//  Tokens
//  - Verify email address token: 8 characters Hex, UPPERCASE
//  - Reset password token: 8 characters Hex, UPPERCASE
//
export function createId(catergory: 'member' | 'notice' | 'post' | 'comment' | 'subcomment' | 'affair'): string {
    switch (catergory) {
        case 'member': return 'M' + Math.floor(Math.random() * Math.pow(10, 11)).toString(35).toUpperCase();
        case 'notice': return 'N' + Math.floor(Math.random() * Math.pow(10, 8)).toString(35).toUpperCase();
        case 'post': return 'P' + Math.floor(Math.random() * Math.pow(10, 14)).toString(35).toUpperCase();
        case 'comment': return 'C' + Math.floor(Math.random() * Math.pow(10, 8)).toString(35).toUpperCase() + Math.floor(Math.random() * Math.pow(10, 9)).toString(35).toUpperCase();
        case 'subcomment': return 'D' + Math.floor(Math.random() * Math.pow(10, 8)).toString(35).toUpperCase() + Math.floor(Math.random() * Math.pow(10, 9)).toString(35).toUpperCase();
        case 'affair': return 'R' + Math.floor(Math.random() * Math.pow(10, 8)).toString(35).toUpperCase() + Math.floor(Math.random() * Math.pow(10, 9)).toString(35).toUpperCase();
    }
}

export function createNoticeId(category: 'cue' | 'reply' | 'like' | 'pin' | 'save' | 'follow', initiateId: string, postId = '', commentId = ''): string {
    switch (category) {
        case 'cue': return `NC-${initiateId}${'' === postId ? '' : `-${postId}`}${'' === commentId && postId !== commentId ? '' : `-${commentId}`}`;
        case 'reply': return `NR-${initiateId}${'' === postId ? '' : `-${postId}`}${'' === commentId && postId !== commentId ? '' : `-${commentId}`}`;
        case 'like': return `NL-${initiateId}${'' === postId ? '' : `-${postId}`}${'' === commentId && postId !== commentId ? '' : `-${commentId}`}`;
        case 'pin': return `NP-${initiateId}${'' === postId ? '' : `-${postId}`}${'' === commentId && postId !== commentId ? '' : `-${commentId}`}`;
        case 'save': return `NS-${initiateId}${'' === postId ? '' : `-${postId}`}`;
        case 'follow': return 'NF-' + initiateId;
    }
}

export function getRandomIdStr(useUpperCase: boolean = false): string { // Length of 10
    if (useUpperCase) {
        return Math.floor(Math.random() * Math.pow(10, 15)).toString(35).toUpperCase();
    } else {
        return Math.floor(Math.random() * Math.pow(10, 15)).toString(35);
    }
}

export function getRandomHexStr(useUpperCase: boolean = false): string { // Length of 8 (Hex)
    if (useUpperCase) {
        return Math.floor(Math.random() * Math.pow(10, 10)).toString(16).toUpperCase();
    } else {
        return Math.floor(Math.random() * Math.pow(10, 10)).toString(16);
    }
}

export function getTimeBySecond(): number {
    return Math.floor(new Date().getTime() / 1000);
}
