import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt'
import { RestError } from '@azure/data-tables';
import { MongoError } from 'mongodb';

import AtlasDatabaseClient from "../../../../modules/AtlasDatabaseClient";
import { logWithDate, response405, response500 } from '../../../../lib/utils/general';

const fname = GetMembersFollowedByMe.name;

//////// Find out who am I following ////////

/** GetMyFollowingMembersById v0.1.1 FIXME: test mode
 * 
 * Last update 20/02/2023
 *  
 * This interface accepts GET and POST requests
 * 
 * Info required for GET requests
 * - recaptchaResponse: string (query string)
 * - memberId: string
 * 
*/

export default async function GetMembersFollowedByMe(req: NextApiRequest, res: NextApiResponse) {

    const { method } = req;
    if ('POST' !== method) {
        response405(req, res);
        return;
    }

    res.send([
        {
            memberId: 'M1234ABCD',
            nickname: '县长马邦德',
            avatarImageUrl: 'https://p3-pc-sign.douyinpic.com/image-cut-tos-priv/3e1f26ab6652e8bab2146d9685309421~tplv-dy-resize-origshort-autoq-75:330.jpeg?x-expires=1988985600&x-signature=QXW59uArpZ4MLuzLDFUUD8X80Kg%3D&from=3213915784&s=PackSourceEnum_AWEME_DETAIL&se=false&sc=cover&biz_tag=pcweb_cover&l=202301140039005D37849F840BB8293C1A',
            briefIntro: '我來鵝城只辦三件事，公平！公平！還是他媽的公平！',
            createdTime: 1675645871314,
            createdTimeBySecond: 1675645871,
        }
    ])
    return;

    //// Declare DB client ////
    const atlasDbClient = AtlasDatabaseClient();
    try {

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