/** Interfaces for Credentials Class v0.1.1
 * 
 * Last update 16/02/2023
 */

export interface ILoginCredentials {
    partitionKey: string; // email address sh1 hash
    rowKey: string; // login provider id
    MemberId: string;
    PasswordHash: string;
    LastUpdatedTimeBySecond: number;
}

export interface IMojitoMemberSystemLoginCredentials {
    partitionKey: string; // email address sh1 hash
    rowKey: 'MojitoMemberSystem'; // login provider id
    MemberId: string;
    PasswordHash: string;
    LastUpdatedTimeBySecond: number;
}

export interface IVerifyEmailAddressCredentials {
    partitionKey: string; // email address sh1 hash
    rowKey: 'VerifyEmailAddress';
    VerifyEmailAddressToken: string;
    CreatedTimeBySecond: number;
}

export interface IResetPasswordCredentials {
    partitionKey: string; // email address sh1 hash
    rowKey: 'ResetPassword';
    ResetPasswordToken: string;
    CreateTimeBySecond: number; // Math.floor(new Date().getTime() / 1000)
}