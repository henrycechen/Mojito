export type LangConfigs = {
    [key: string]: any;
};

export type TSignInCredentialStates = {
    emailAddress: string;
    password: string;
    repeatpassword: string;
    showpassword: boolean;
};

export type TBrowsingHelper = {
    memorizeViewPortPositionY: number | undefined; // help scroll to memorized browsing position on viewport.width <= md
};

export type TPreferenceStates = {
    lang: string;
    mode: 'light' | 'dark';
};

export type TVerifyEmailAddressRequestInfo = {
    emailAddress: string;
    providerId: string;
    verifyEmailAddressToken: string;
};

export type TResetPasswordRequestInfo = {
    emailAddress: string;
    resetPasswordToken: string;
    expireDateBySecond: number;
};

export type TUploadImageRequestInfo = {
    memberId: string;
    postId: string;
    remainingUploads: number;
    expireDateBySecond: number;
};