/** Utils for verifying information v0.1.1
 * 
 * Last update 16/02/2023
 */

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
    const regex = new RegExp(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[$&+,:;=?@#|'<>.^*()%!-])[A-Za-z\d$&+,:;=?@#|'<>.^*()%!-]{8,}$/);
    return regex.test(password);
}

export function verifyId(id: any): { isValid: boolean; category: string; id: string; } {
    if (!(undefined !== id && 'string' === typeof id)) {
        return { isValid: false, category: '', id: '' };
    }
    const ref = `${id}`.toUpperCase();
    const cat = ref.slice(0, 1);
    if (!(new RegExp(/[CDMNPT]/).test(cat))) {
        return { isValid: false, category: '', id: '' };
    }
    switch (cat) {
        case 'M':
            if (new RegExp(`^[A-Z0-9]{8,9}$`).test(ref)) { return { isValid: true, category: 'member', id: ref }; }
            else { return { isValid: false, category: 'member', id: '' }; }
        case 'N':
            if (new RegExp(`^[A-Z0-9]{6,39}$`).test(ref)) { return { isValid: true, category: 'notice', id: ref }; }
            else { return { isValid: false, category: 'notice', id: '' }; }
        case 'C':
            if (new RegExp(`^[A-Z0-9]{12,13}$`).test(ref)) { return { isValid: true, category: 'comment', id: ref }; }
            else { return { isValid: false, category: 'comment', id: '' }; }
        case 'D':
            if (new RegExp(`^[A-Z0-9]{12,13}$`).test(ref)) { return { isValid: true, category: 'subcomment', id: ref }; }
            else { return { isValid: false, category: 'subcomment', id: '' }; }
        case 'P':
            if (new RegExp(`^[A-Z0-9]{10,11}$`).test(ref)) { return { isValid: true, category: 'post', id: ref }; }
            else { return { isValid: false, category: 'post', id: '' }; }
        case 'T':
            return { isValid: true, category: 'topic', id: ref };
        default: return {
            isValid: false,
            category: '',
            id: ''
        };
    }
}

export function verifyNoticeId(id: any): { isValid: boolean; category: string; entity: string; } {
    if (!(undefined !== id && 'string' === typeof id)) {
        return { isValid: false, category: '', entity: '' };
    }
    const ref = `${id}`.toUpperCase();
    const cat = ref.slice(0, 2);
    if (!(new RegExp(/N[CRLPSF]/).test(cat))) {
        return { isValid: false, category: '', entity: '' };
    }
    const num = ref.split('-').length;
    switch (cat) {
        case 'NC':
            if (3 === num) { return { isValid: true, category: 'cue', entity: 'post' }; }
            else if (4 === num) { return { isValid: true, category: 'cue', entity: 'comment' }; }
            else { return { isValid: false, category: 'cue', entity: '' }; }
        case 'NR':
            if (3 === num) { return { isValid: true, category: 'reply', entity: 'post' }; }
            else if (4 === num) { return { isValid: true, category: 'reply', entity: 'comment' }; }
            else { return { isValid: false, category: 'reply', entity: '' }; }
        case 'NL':
            if (3 === num) { return { isValid: true, category: 'like', entity: 'post' }; }
            else if (4 === num) { return { isValid: true, category: 'like', entity: 'comment' }; }
            else { return { isValid: false, category: 'like', entity: '' }; }
        case 'NP':
            if (4 === num) { return { isValid: true, category: 'pin', entity: '' }; }
            else { return { isValid: false, category: 'pin', entity: '' }; }
        case 'NS':
            if (3 === num) { return { isValid: true, category: 'save', entity: 'post' }; }
            else { return { isValid: false, category: 'save', entity: 'post' }; }
        case 'NF':
            if (2 === num) { return { isValid: true, category: 'follow', entity: '' }; }
            else { return { isValid: false, category: 'follow', entity: '' }; }
        default:
            return { isValid: false, category: '', entity: '' };
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

export async function verifyRecaptchaResponse(recaptchaServerSecret: string, recaptchaResponse: any): Promise<{
    status: number;
    message: string;
}> {
    try {
        if ('string' !== typeof recaptchaResponse || '' === recaptchaResponse) {
            return {
                status: 403,
                message: 'Invalid ReCAPTCHA response'
            };
        }
        if ('' === recaptchaServerSecret) {
            return {
                status: 500,
                message: 'ReCAPTCHA shared key not found'
            };
        }
        const recaptchaVerifyResp = await fetch(`https://www.google.com/recaptcha/api/siteverify?secret=${recaptchaServerSecret}&response=${recaptchaResponse}`, { method: 'POST' });
        // [!] invoke of json() make the probability of causing TypeError
        const { success } = await recaptchaVerifyResp.json();
        if (!success) {
            return {
                status: 403,
                message: 'ReCAPTCHA either failed or expired'
            };
        }
        return {
            status: 200,
            message: ''
        };
    } catch (e) {
        return {
            status: 500,
            message: e instanceof TypeError ? `Attempt to reterieve info from ReCAPTCHA response. ${e}` : `Uncategorized Error occurred. ${e}`
        };
    }
}

export function verifyEnvironmentVariable(obj: { [key: string]: string; }): string | undefined {
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key) && '' === obj[key]) {
            return key;
        }
    }
    return undefined;
}
