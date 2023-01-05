import type { NextApiRequest, NextApiResponse } from 'next';
import { MongoError } from 'mongodb';
import { getToken } from 'next-auth/jwt'

import AtlasDatabaseClient from "../../../../modules/AtlasDatabaseClient";

import { response405, response500, log } from '../../../../lib/utils';


export default async function CancelMembership(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;
    if ('DELETE' !== method) {
        response405(req, res);
        return;
    }
    //// Verify identity ////
    const token = await getToken({ req });
    if (!(token && token?.sub)) {
        res.status(400).send('Invalid identity');
        return;
    }
    const { sub: memberId } = token;
    const atlasDbClient = AtlasDatabaseClient();
    try {

    } catch (e) {
        let msg;
        if (e instanceof MongoError) {
            msg = 'Was trying communicating with atlas mongodb.';
        } else {
            msg = `Uncategorized. ${e?.msg}`;
        }
        if (!res.headersSent) {
            response500(res, msg);
        }
        log(msg, e);
        await atlasDbClient.close();
        return;
    }


    await atlasDbClient.close();
    res.send('attitude on comment, ok');
}