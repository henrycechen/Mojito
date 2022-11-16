import type { NextApiRequest, NextApiResponse } from 'next';

export default async function Info(req: NextApiRequest, res: NextApiResponse) {
    await setTimeout(() => {
        res.send('info');
    }, 800);
    return;
}