import type { NextApiRequest, NextApiResponse } from 'next';
import { RestError } from '@azure/data-tables';
import { getToken } from "next-auth/jwt"

import AzureTableClient from '../../../../../modules/AzureTableClient';
import AtlasDatabaseClient from '../../../../../modules/AtlasDatabaseClient';

import { IMemberPostMapping } from '../../../../../lib/interfaces';
import { MemberInfo } from '../../../../../lib/types';
import { verifyId, response405, response500, log } from '../../../../../lib/utils';

export default async function SavedPostsInfo(req: NextApiRequest, res: NextApiResponse) {
    res.send('ok')
}