export type LangConfigs = { [key: string]: any };

export type EmailMessage = {
    sender: '<donotreply@mojito.co.nz>';
    content: {
        subject: string;
        plainText: string;
    },
    recipients: {
        to: [EmailRecipient]
    }
}

export type EmailRecipient = {
    email: string;
}

export type ResetPasswordRequestInfo = {
    memberId: string;
    resetPasswordToken: string;
    expireDate: number;
}

export type VerifyRecaptchaResult = {
    status: number;
    msg: string;
}


/**
 * [Class] MemberLogin
 */
export type PasswordHash = {
    partitionKey: string;
    rowKey: string;
    PasswordHashStr: string;
}

export type ResetPasswordToken = {
    partitionKey: string;
    rowKey: 'ResetPasswordToken';
    IsActive?: boolean;
    ResetPasswordTokenStr?: string;
    EmailMessageId?: string;
}