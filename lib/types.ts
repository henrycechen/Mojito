import { IConciseMemberInfo } from "./interfaces";

export type LangConfigs = {
    [key: string]: any
};

export type TSignInCredentialStates = {
    emailAddress: string;
    password: string;
    repeatpassword: string;
    showpassword: boolean;
}

export type TBrowsingHelper = {
    memorizeViewPortPositionY: number | undefined; // help scroll to memorized browsing position on viewport.width <= md
}

export type TPreferenceStates = {
    lang: string;
    mode: 'light' | 'dark';
}

export type EmailMessage = {
    sender: '<donotreply@mojito.co.nz>';
    content: {
        subject: string;
        plainText?: string;
        html?: string;
    },
    recipients: {
        to: [EmailRecipient]
    }
}

type EmailRecipient = {
    email: string;
}

export type TVerifyEmailAddressRequestInfo = {
    emailAddress: string;
    providerId: string;
    verifyEmailAddressToken: string;
}

export type TResetPasswordRequestInfo = {
    emailAddress: string;
    resetPasswordToken: string;
    expireDate: number;
}