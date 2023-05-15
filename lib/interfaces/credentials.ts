/**
 * -     partitionKey: string // email address sh1 hash
 * -     rowKey: string // login provider id
 * -     MemberId: string
 * -     PasswordHash: string
 * -     LastUpdatedTimeBySecond: number
 * 
 * Last update: 08/05/2023 v0.1.1
 */
export interface ILoginCredentials {
    partitionKey: string; // email address sh1 hash
    rowKey: string; // login provider id
    MemberId: string;
    PasswordHash: string;
    LastUpdatedTimeBySecond: number;
}

/**
 * -     partitionKey: string // email address sh1 hash
 * -     rowKey: 'MojitoMemberSystem' // login provider id
 * -     MemberId: string
 * -     PasswordHash: string
 * -     LastUpdatedTimeBySecond: number
 * 
 * Last update: 08/05/2023 v0.1.1
 */
export interface IMojitoMemberSystemLoginCredentials {
    partitionKey: string; // email address sh1 hash
    rowKey: 'MojitoMemberSystem'; // login provider id
    MemberId: string;
    PasswordHash: string;
    LastUpdatedTimeBySecond: number;
}

/**
 * -     partitionKey: string // email address sh1 hash
 * -     rowKey: 'VerifyEmailAddress'
 * -     VerifyEmailAddressToken: string
 * -     CreatedTimeBySecond: number
 * 
 * Last update: 08/05/2023 v0.1.1
 */
export interface IVerifyEmailAddressCredentials {
    partitionKey: string; // email address sh1 hash
    rowKey: 'VerifyEmailAddress';
    VerifyEmailAddressToken: string;
    CreatedTimeBySecond: number;
}

/**
 * -     partitionKey: string // email address sh1 hash
 * -     rowKey: 'ResetPassword'
 * -     ResetPasswordToken: string
 * -     CreateTimeBySecond: number
 * 
 * Last update: 08/05/2023 v0.1.1
 */
export interface IResetPasswordCredentials {
    partitionKey: string; // email address sh1 hash
    rowKey: 'ResetPassword';
    ResetPasswordToken: string;
    CreateTimeBySecond: number;
}