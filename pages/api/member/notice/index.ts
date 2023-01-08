import type { NextApiRequest, NextApiResponse } from 'next';

export default async function GetNotice(req: NextApiRequest, res: NextApiResponse) {
    res.send('ok')
}