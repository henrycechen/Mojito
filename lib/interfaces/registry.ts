/** Interfaces for Registry Class v0.1.0
 * 
 * Last update 16/02/2023
 */

export interface INicknameRegistry {
    partitionKey: string; // 'nickname'
    rowKey: string; // nickname base64 string
    MemberId: string;
    Nickname: string;
    IsActive: boolean;
}