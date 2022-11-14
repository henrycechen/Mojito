import type { NextApiRequest, NextApiResponse } from 'next';

export default async function Info(req: NextApiRequest, res: NextApiResponse) {
    await setTimeout(() => {
        res.send('info');
        console.log('It will be printed 3-rd with delay');
    }, 2000);
}