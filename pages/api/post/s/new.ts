import type { NextApiRequest, NextApiResponse } from 'next';

const fnn = `${PostRankingOf24HoursNewest.name} (API)`;

/**
 * 
 * Last update:
 * - 10/05/2023 v0.1.1
 */

export default async function PostRankingOf24HoursNewest(req: NextApiRequest, res: NextApiResponse) {
    res.send([]);
}