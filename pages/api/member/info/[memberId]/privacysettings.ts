import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import { MongoError } from 'mongodb';

import AtlasDatabaseClient from '../../../../../modules/AtlasDatabaseClient';

import { IMemberComprehensive } from '../../../../../lib/interfaces/member';
import { IMemberPostMapping } from '../../../../../lib/interfaces/mapping';

import { response405, response500, logWithDate, } from '../../../../../lib/utils/general';
import { getTimeBySecond } from '../../../../../lib/utils/create';
import { verifyId } from '../../../../../lib/utils/verify';

const fnn = `${UpdatePrivacySettings.name} (API)`;

/** 
 * This interface ONLY accepts PUT requests
 * 
 * Info required for PUT requests
 * -     token: JWT
 * -     setting: string (body, stringified json, TPrivacySettingsStates)
 * 
 * Last update:
 * - 03/05/2023 v0.1.2
 * - 31/05/2023 v0.1.3
*/

export default async function UpdatePrivacySettings(req: NextApiRequest, res: NextApiResponse) {

    const { method } = req;
    if ('PUT' !== method) {
        response405(req, res);
        return;
    }

    //// Verify identity ////
    const token = await getToken({ req });
    if (!(token && token?.sub)) {
        res.status(401).send('Unauthorized');
        return;
    }

    //// Verify member id ////
    const { isValid, category, id: memberId } = verifyId(req.query?.memberId);
    if (!(isValid && 'member' === category)) {
        res.status(400).send('Invalid member id');
        return;
    }

    //// Match the member id in token and the one in request ////
    const { sub: tokenId } = token;
    if (tokenId !== memberId) {
        res.status(400).send('Requested member id and identity not matched');
        return;
    }

    //// Declare DB client ////
    const atlasDbClient = AtlasDatabaseClient();
    try {
        await atlasDbClient.connect();

        //// Verify member status ////
        const memberComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IMemberComprehensive>('member');
        const memberComprehensiveQueryResult = await memberComprehensiveCollectionClient.findOne({ memberId });
        if (null === memberComprehensiveQueryResult) {
            throw new Error(`Member attempt to update (PUT) brief intro but have no document (of IMemberComprehensive, member id: ${memberId}) in [C] memberComprehensive`);
        }

        const { status: memberStatus } = memberComprehensiveQueryResult;
        if (0 > memberStatus) {
            res.status(403).send('Method not allowed due to member suspended or deactivated');
            await atlasDbClient.close();
            return;
        }

        //// Verify alternative intro ////
        const { settings } = req.body;
        if (
            !(
                undefined !== settings
                && settings.hasOwnProperty('allowKeepingBrowsingHistory')
                && settings.hasOwnProperty('allowVisitingFollowedMembers')
                && settings.hasOwnProperty('allowVisitingSavedPosts')
                && settings.hasOwnProperty('hidePostsAndCommentsOfBlockedMember')
            )
        ) {
            res.status(400).send('Update failed due to defavtive update setting object');
            await atlasDbClient.close();
            return;
        }

        //// Update properties (of IMemberComprehensive) in [C] memberComprehensive ////
        const memberComprehensiveUpdateResult = await memberComprehensiveCollectionClient.updateOne({ memberId }, {
            $set: {
                allowKeepingBrowsingHistory: settings.allowKeepingBrowsingHistory,
                allowVisitingFollowedMembers: settings.allowVisitingFollowedMembers,
                allowVisitingSavedPosts: settings.allowVisitingSavedPosts,
                hidePostsAndCommentsOfBlockedMember: settings.hidePostsAndCommentsOfBlockedMember,
                lastSettingsUpdatedTimeBySecond: getTimeBySecond()
            }
        });

        if (!memberComprehensiveUpdateResult.acknowledged) {
            logWithDate(`Failed to update allowKeepingBrowsingHistory, allowVisitingSavedPosts, hidePostsAndCommentsOfBlockedMember, lastSettingUpdatedTimeBySecond (of IMemberComprehensive, member id: ${memberId}) in [C] memberComprehensive`, fnn);
            res.status(500).send(`Attempt to update privacy settings`);
            await atlasDbClient.close();
            return;
        }

        //// Response 200 ////
        res.status(200).send('Privacy settings updated');

        if (!settings.allowKeepingBrowsingHistory) {
            const memberPostMappingCollectionClient = atlasDbClient.db('mapping').collection<IMemberPostMapping>('member-post-history');
            await memberPostMappingCollectionClient.updateMany({ memberId }, { $set: { status: 0 } });
        }

        await atlasDbClient.close();
        return;
    } catch (e: any) {
        let msg;
        if (e instanceof MongoError) {
            msg = `Attempt to communicate with atlas mongodb.`;
        } else {
            msg = `Uncategorized. ${e?.msg}`;
        }
        if (!res.headersSent) {
            response500(res, msg);
        }
        logWithDate(msg, fnn, e);
        await atlasDbClient.close();
        return;
    }
}