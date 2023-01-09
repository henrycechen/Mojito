import type { NextApiRequest, NextApiResponse } from 'next';
import { RestError } from '@azure/data-tables';
import { getToken } from "next-auth/jwt"

import AzureTableClient from '../../../../modules/AzureTableClient';
import AtlasDatabaseClient from '../../../../modules/AtlasDatabaseClient';

import { IMemberPostMapping } from '../../../../lib/interfaces';
import { MemberInfo } from '../../../../lib/types';
import { createNoticeId, verifyId, response405, response500, log } from '../../../../lib/utils';

// This interface ONLY accepts GET method
// Use 'api/post/info/[postId]' to GET post info
//
// Info required for GET request
// token: JWT
//

export default async function GetSavedPosts(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;
    if ('GET' !== method) {
        response405(req, res);
        return;
    }
    //// Verify identity ////
    const token = await getToken({ req });
    if (!(token && token?.sub)) {
        res.status(400).send('Invalid identity');
        return;
    }
    //// Declare DB client ////
    const atlasDbClient = AtlasDatabaseClient();
    
    try {
        
    } catch (e:any) {
        
    }
}