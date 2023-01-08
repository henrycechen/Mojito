import type { NextApiRequest, NextApiResponse } from 'next';

export default async function GetTopicsByChannelId(req: NextApiRequest, res: NextApiResponse) {
    res.send('ok');
}