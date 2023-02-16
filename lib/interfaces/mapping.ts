/** Interfaces for Mapping Class v0.1.1
 * 
 * Last update 16/02/2023
 */

export interface IMemberMemberMapping {
    partitionKey: string; // subject member id
    rowKey: string; // object member id
    IsActive: boolean;
}

export interface IMemberPostMapping {
    partitionKey: string; // member id
    rowKey: string; // post id
    IsActive: boolean;
}