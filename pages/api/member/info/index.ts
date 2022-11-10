import type { NextApiRequest, NextApiResponse } from 'next';

export default async function Info(req: NextApiRequest, res: NextApiResponse) {
    res.send('info');
}