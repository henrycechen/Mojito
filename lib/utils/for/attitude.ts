import { IAttitudeComprehensive, IAttitudeMapping } from '../../interfaces/attitude';

/** Utils for Attitude Class v0.1.1
 * 
 * Last update 16/02/2023
 */

type TAttitudeComprehensiveUpdate = {
    attitude?: number;
    commentAttitudeMapping?: { [key: string]: number };
}

export function createAttitudeComprehensive(memberId: string, postId: string, id: string, attitude: number): IAttitudeComprehensive {
    let att = 0;
    if ([-1, 0, 1].includes(attitude)) {
        att = attitude;
    }
    const cat = id.slice(0, 1);
    if ('P' === cat) {
        return {
            memberId,
            postId,
            attitude: att,
            commentAttitudeMapping: {}
        }
    }
    if (['C', 'D'].includes(cat)) {
        return {
            memberId,
            postId,
            attitude: 0,
            commentAttitudeMapping: { [id]: att }
        }
    }
    return {
        memberId,
        postId,
        attitude: 0,
        commentAttitudeMapping: {}
    }
}

export function provideAttitudeComprehensiveUpdate(id: string, attitude: number): TAttitudeComprehensiveUpdate {
    let att = 0;
    if ([-1, 0, 1].includes(attitude)) {
        att = attitude;
    }
    const cat = id.slice(0, 1);
    if ('P' === cat) {
        return {
            attitude: att
        }
    }
    if (['C', 'D'].includes(cat)) {
        return {
            commentAttitudeMapping: { [id]: att }
        }
    }
    return {}
}

export function getMappingFromAttitudeComprehensive(attitudeComprehensive: IAttitudeComprehensive | null): IAttitudeMapping {
    if (null === attitudeComprehensive) {
        return {
            attitude: 0,
            commentAttitudeMapping: {}
        }
    }
    return {
        attitude: attitudeComprehensive.attitude,
        commentAttitudeMapping: { ...attitudeComprehensive.commentAttitudeMapping },
    }
}