/**
 * -     partitionKey: string // 'nickname'
 * -     rowKey: string // nickname base64 string
 * -     MemberId: string
 * -     Nickname: string
 * -     IsActive: boolean
 * 
 * Last update: 16/02/2023 v0.1.1
 */
export interface INicknameRegistry {
    partitionKey: string; // 'nickname'
    rowKey: string; // nickname base64 string
    MemberId: string;
    Nickname: string;
    IsActive: boolean;
}