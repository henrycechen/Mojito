// Interfaces for Mapping Class v0.1.2

export interface IMemberMemberMapping {
    partitionKey: string; // subject member id
    rowKey: string; // object member id
    Nickname: string;
    BriefIntro: string;
    CreatedTimeBySecond: number; // Math.floor(new Date().getTime() / 1000) 
    IsActive: boolean;
}

export interface IMemberPostMapping {
    partitionKey: string; // member id
    rowKey: string; // post id, also used as cover image fullname (e.g., P12345ABCDE.png)
    Nickname: string;
    Title: string;
    CreatedTimeBySecond: number;
    IsActive: boolean;
}