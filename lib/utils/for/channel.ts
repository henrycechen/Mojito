import type { NextApiRequest, NextApiResponse } from 'next';
import { IAttitudeComprehensive, IAttitudeMapping } from '../../interfaces/attitude';
import { IChannelInfo } from '../../interfaces/channel';
import { ICommentComprehensive, IRestrictedCommentComprehensive } from '../../interfaces/comment';
import { IConciseMemberInfo, IConciseMemberStatistics } from '../../interfaces/member';
import { INoticeInfoWithMemberInfo } from '../../interfaces/notification';
import { IEditedPostComprehensive, IPostComprehensive, IRestrictedPostComprehensive } from '../../interfaces/post';
import { ITopicComprehensive } from '../../interfaces/topic';
import { getRandomHexStr } from '../create';
import { verifyNoticeId, verifyUrl } from '../verify';

/** Utils for Channel Class v0.1.1
 * 
 * Last update 16/02/2023
 */

export function fakeChannel(): IChannelInfo {
    return {
        channelId: '',
        name: {},
        svgIconPath: ''
    }
}

