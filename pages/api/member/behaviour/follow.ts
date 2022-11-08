import type { NextApiRequest, NextApiResponse } from 'next';

export default async function Follow(req: NextApiRequest, res: NextApiResponse) {
    const { method, url } = req;
    switch (method) {
        case 'GET':
              res.send('');
        case 'POST':
            res.send(`${method} ${url}`);
            break;
    }
}