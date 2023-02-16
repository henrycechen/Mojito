/** Interfaces for Credentials Class v0.1.1
 * 
 * Last update 16/02/2023
 */

interface ICredentials {
    partitionKey: string; // email address sh1 hash
    rowKey: string;
    [key: string]: any;
}

export interface ILoginCredentials extends ICredentials {
    partitionKey: string; // email address sh1 hash
    rowKey: string; // login provider id
    MemberId: string;
    PasswordHash?: string;
}

export interface IMojitoMemberSystemLoginCredentials extends ILoginCredentials {
    partitionKey: string; // email address sh1 hash
    rowKey: 'MojitoMemberSystem'; // login provider id
    MemberId: string;
    PasswordHash: string;
}

export interface IVerifyEmailAddressCredentials extends ICredentials {
    partitionKey: string; // email address sh1 hash
    rowKey: 'VerifyEmailAddress';
    VerifyEmailAddressToken: string;
}

export interface IResetPasswordCredentials extends ICredentials {
    partitionKey: string; // email address sh1 hash
    rowKey: 'ResetPassword';
    ResetPasswordToken: string;
}

export interface IUpdatePasswordCredentials extends ICredentials {
    partitionKey: string; // email address sh1 hash
    rowKey: 'UpdatePassword';
    ResetPasswordToken: string;
}