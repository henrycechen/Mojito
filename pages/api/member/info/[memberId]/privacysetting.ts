import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import { RestError } from '@azure/storage-blob';
import { MongoError } from 'mongodb';

import { logWithDate, response405, response500, } from '../../../../../lib/utils/general';
import { IMemberComprehensive } from '../../../../../lib/interfaces/member';
import { INicknameRegistry } from '../../../../../lib/interfaces/registry';

import AtlasDatabaseClient from '../../../../../modules/AtlasDatabaseClient';
import AzureTableClient from '../../../../../modules/AzureTableClient';
import { verifyId } from '../../../../../lib/utils/verify';

const fname = UpdatePrivacySettings.name;

/** UpdatePrivacySettings v0.1.1
 * 
 * Last update: 19/02/2023
 * 
 * This interface ONLY accepts PUT requests
 * 
 * Info required for PUT requests
 * - token: JWT
 * - setting: string (body, stringified json, TPrivacySettingsStates)
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
    const { sub: tokenId } = token;

    //// Verify member id ////
    const { isValid, category, id: memberId } = verifyId(req.query?.memberId);

    if (!(isValid && 'member' === category)) {
        res.status(400).send('Invalid member id');
        return;
    }

    //// Match the member id in token and the one in request ////
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
                && settings.hasOwnProperty('allowVisitingSavedPosts')
                && settings.hasOwnProperty('hidePostsAndCommentsOfBlockedMember')
            )
        ) {
            res.status(400).send('Update failed due to defavtive update setting object');
            return;
        }

        //// Update properties (of IMemberComprehensive) in [C] memberComprehensive ////
        const memberComprehensiveUpdateResult = await memberComprehensiveCollectionClient.updateOne({ memberId }, {
            $set: {
                allowKeepingBrowsingHistory: settings.allowKeepingBrowsingHistory,
                allowVisitingSavedPosts: settings.allowVisitingSavedPosts,
                hidePostsAndCommentsOfBlockedMember: settings.hidePostsAndCommentsOfBlockedMember,
                lastSettingsUpdatedTimeBySecond: Math.floor(new Date().getTime() / 1000)
            }
        })

        if (!memberComprehensiveUpdateResult.acknowledged) {
            logWithDate(`Failed to update allowKeepingBrowsingHistory, allowVisitingSavedPosts, hidePostsAndCommentsOfBlockedMember, lastSettingUpdatedTimeBySecond (of IMemberComprehensive, member id: ${memberId}) in [C] memberComprehensive`, fname);
            res.status(500).send(`Attempt to update privacy settings`);
            return;
        }

        // TODO: is not allowed keeping browsing history, clear all records of IMemberPostMapping in [RL] HistoryMapping

        res.status(200).send('Privacy settings updated');
        await atlasDbClient.close();
    } catch (e: any) {
        let msg;
        if (e instanceof RestError) {
            msg = `Attempt to communicate with azure table storage.`;
        } else if (e instanceof MongoError) {
            msg = `Attempt to communicate with atlas mongodb.`;
        } else {
            msg = `Uncategorized. ${e?.msg}`;
        }
        if (!res.headersSent) {
            response500(res, msg);
        }
        logWithDate(msg, fname, e);
        await atlasDbClient.close();
        return;
    }
}