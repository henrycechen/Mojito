import type { NextApiRequest, NextApiResponse } from 'next';
import { ProcessStates } from './types';

//////// Create random string ////////
//
//  Rules of create random strings
//
//  IDs
//  - Member ID : 10 characters, uppercase
//  - Post ID : 10 characters, uppercase
//  - Topic ID : 10 characters, lowercase
//  - Comment ID : 10 characters, lowercase
//  - Subcomment ID : 10 characters, lowercase
//
//  Names
//  - Image Filename : 20 characters, lowercase
//
export function getRandomStr(useLowerCase: boolean = false): string { // Length of 10
    if (useLowerCase) {
        return Math.floor(Math.random() * Math.pow(10, 15)).toString(35);
    } else {
        return Math.floor(Math.random() * Math.pow(10, 15)).toString(35).toUpperCase();
    }
}

export function getRandomLongStr(useLowerCase: boolean = false): string { // Length of 20
    if (useLowerCase) {
        return Math.floor(Math.random() * Math.pow(10, 15)).toString(35) + Math.floor(Math.random() * Math.pow(10, 15)).toString(35);
    } else {
        return Math.floor(Math.random() * Math.pow(10, 15)).toString(35).toUpperCase() + Math.floor(Math.random() * Math.pow(10, 15)).toString(35).toUpperCase();
    }
}

export function getRandomHexStr(useLowerCase: boolean = false): string { // Length of 8
    if (useLowerCase) {
        return Math.floor(Math.random() * Math.pow(10, 10)).toString(16);
    } else {
        return Math.floor(Math.random() * Math.pow(10, 10)).toString(16).toUpperCase();
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

export function verifyPassword(password: string): boolean {
    const regex = new RegExp(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/);
    return regex.test(password);
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