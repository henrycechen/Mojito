export type LangConfigs = { [key: string]: any };

export type VerifyRecaptchaResult = {
    status: number;
    message: string;
}

// States
export type SignInCredentialStates = {
    emailAddress: string;
    password: string;
    repeatpassword: string;
    showpassword: boolean;
}

// Mail
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

export type EmailRecipient = {
    email: string;
}

// Request Info
export type VerifyAccountRequestInfo = {
    memberId: string;
}

export type ResetPasswordRequestInfo = {
    memberId: string;
    resetPasswordToken: string;
    expireDate: number;
}

// [Table] MemberInfo
export type MemberInfo = {
    partitionKey: string;
    rowKey: string;
    [key: string]: any;
}

// [Table] MemberLogin
export type PasswordHash = {
    partitionKey: string;
    rowKey: string;
    PasswordHashStr: string;
    IsActive?: boolean;
}

export type ResetPasswordToken = {
    partitionKey: string;
    rowKey: 'ResetPasswordToken';
    ResetPasswordTokenStr?: string;
    EmailMessageId?: string;
    IsActive?: boolean;
}

// [Table] MemberManagement
export type MemberManagement = {
    partitionKey: string;
    rowKey: string;
    [key: string]: any;
}

// [Table] LoginCredentialsMapping
export type LoginCredentialsMapping = {
    partitionKey: string; // Category name, "EmailAddress" / "Nickname" (not yet supported)
    rowKey: string; // Category name. "EmailAddressStr "/ "NicknameStr" (not yet supported)
    MemberIdStr: string;
    IsActive: boolean;
}

// Post
export type PostChannel = {
    channelId: string;
    channelName: {
        [key: string]: string;
    };
    svgIconPath?: string;
}