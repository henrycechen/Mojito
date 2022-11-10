import type { NextApiRequest, NextApiResponse } from 'next';
import type { VerifyRecaptchaResult } from './types';

type EnvironmentVariableObject = {
    [key: string]: string;
}

// Create random string
export function getRandomStr(): string {
    return Math.floor(Math.random() * Math.pow(10, 16)).toString(35).toUpperCase();
}

export function getRandomHexStr(): string {
    return Math.floor(Math.random() * Math.pow(10, 16)).toString(16).toUpperCase();
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

// Verify
export function verifyEmailAddress(emailAddress: string): boolean {
    const regex = new RegExp(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/);
    return regex.test(emailAddress);
}

export function verifyPassword(password: string): boolean {
    const regex = new RegExp(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/);
    return regex.test(password);
}

export async function verifyRecaptchaResponse(recaptchaServerSecret: string, recaptchaResponse: any): Promise<VerifyRecaptchaResult> {
    try {
        if ('string' !== typeof recaptchaResponse || '' === recaptchaResponse) {
            return {
                status: 403,
                msg: 'Invalid ReCAPTCHA response'
            }
        }
        if ('' === recaptchaServerSecret) {
            return {
                status: 500,
                msg: 'ReCAPTCHA shared key not found'
            }
        }
        const recaptchaVerifyResp = await fetch(`https://www.google.com/recaptcha/api/siteverify?secret=${recaptchaServerSecret}&response=${recaptchaResponse}`, { method: 'POST' })
        // [!] invoke of json() make the probability of causing TypeError
        const { success } = await recaptchaVerifyResp.json();
        if (!success) {
            return {
                status: 403,
                msg: 'ReCAPTCHA either failed or expired'
            }
        }
        return {
            status: 200,
            msg: ''
        }
    } catch (e) {
        return {
            status: 500,
            msg: e instanceof TypeError ? `Was trying to reterieve info from ReCAPTCHA response. ${e}` : `Uncategorized Error occurred. ${e}`
        }
    }
}

export function verifyEnvironmentVariable(obj: EnvironmentVariableObject): string | undefined {
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key) && '' === obj[key]) {
            return key;
        }
    }
    return undefined;
}

// Response
export function response405(request: NextApiRequest, response: NextApiResponse) {
    const { url, method } = request;
    response.status(405).send(`${url}: ${method} is not allowed`);
}

export function response500(response: NextApiResponse, msg: string) {
    response.status(500).send(msg);
    // response.status(500).send('development' === process.env.NODE_ENV ? msg : 'Internal Server Error');
}