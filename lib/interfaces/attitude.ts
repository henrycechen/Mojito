/**
 * -     memberId: string
 * -     postId: string // divided by post id
 * -     attitude: number // -1 | 0 | 1
 * -     commentAttitudeMapping: { [key: string]: number }
 * 
 * Last update: 08/05/2023 v0.1.1
 */
export interface IAttitudeComprehensive {
    memberId: string;
    postId: string; // divided by post id
    attitude: number; // -1 | 0 | 1
    commentAttitudeMapping: {
        [key: string]: number;
    };
}

/**
 * -     attitude: number // -1 | 0 | 1
 * -     commentAttitudeMapping: { [key: string]: number }
 * 
 * Last update: 08/05/2023 v0.1.1
 */
export interface IAttitudeMapping {
    attitude: number; // -1 | 0 | 1
    commentAttitudeMapping: {
        [key: string]: number;
    };
}