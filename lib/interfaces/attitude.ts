/** Interfaces for Attitude Class v0.1.1
 * 
 * Last update 16/02/2023
 */

// [C] attitudeComprehensive
export interface IAttitudeComprehensive {
    memberId: string;
    postId: string; // divided by post id
    attitude: number; // -1 | 0 | 1
    commentAttitudeMapping: {
        [key: string]: number
    };
}

export interface IAttitudeMapping {
    attitude: number; // -1 | 0 | 1
    commentAttitudeMapping: {
        [key: string]: number
    };
}