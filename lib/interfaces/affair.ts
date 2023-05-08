
/**
 * -     affairId: string
 * -     defendantId: string // member id
 * -     referenceId: string // post or comment id
 * -     referenceContent: string
 * -     category: number // 1 ~ 7
 * -     additionalInfo: string
 * -     createdTimeBySecond: number // created time of this document
 * -     status: number
 * 
 * Last update: 08/05/2023 v0.1.1
 */
export interface IAffairComprehensive {
    affairId: string;

    defendantId: string; // member id
    referenceId: string; // post or comment id
    referenceContent: string;
    category: number; // 1 ~ 7

    additionalInfo: string;

    createdTimeBySecond: number; // created time of this document
    status: number;
}