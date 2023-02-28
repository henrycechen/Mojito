// Interface for affair

export interface IAffairComprehensive {
    affairId: string;

    defendantId: string; // member id
    referenceId: string; // post or comment id
    referenceContent: string;
    category: number; // 1 ~ 7

    additionalInfo: string;

    createdTimeBySecond: number; // created time of this document (post est.)
    status: number;
}