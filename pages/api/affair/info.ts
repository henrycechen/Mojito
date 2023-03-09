import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt'
import { RestError } from '@azure/data-tables';
import { MongoError } from 'mongodb';

import AzureTableClient from '../../../modules/AzureTableClient';
import AtlasDatabaseClient from "../../../modules/AtlasDatabaseClient";


import { response405, response500, logWithDate } from '../../../lib/utils/general';
import { IMemberInfo, IRestrictedMemberComprehensive } from '../../../lib/interfaces/member';


const fname = GetAffairInfoById.name;

type TAffairInfo = {
    memberId: string;
    nickname: string;
    referenceId: string;
    referenceContent: string; // post title or comment content
}
const bbx: TAffairInfo = {
    memberId: 'M1234ABCD',
    nickname: '县长马邦德',
    referenceId: 'C12345ANCDEX',
    referenceContent: '您认为不当或违反社区规范的内容'
}

/** GetAffairInfoById v0.1.1
 * 
 * Last update: 28/02/2023
 * 
 * This interface ONLY accepts GET requests
 * 
 * Info required for ONLY requests
 * recaptchaResponse: string (query string)
 * memberId: string (query string)
 * referenceId: string (query string)
*/


export default async function GetAffairInfoById(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;
    if ('GET' !== method) {
        response405(req, res);
        return;
    }
    res.send(bbx);
    return;



    
}