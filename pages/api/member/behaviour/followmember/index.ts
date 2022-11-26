import type { NextApiRequest, NextApiResponse } from 'next';

// This endpoint has been depreacted

export default async function FollowMember(req: NextApiRequest, res: NextApiResponse) {
    res.send([

        {
            id: 2,
            nickname: 'piggy'
        },
        {
            id: 3,
            nickname: 'armstrong'
        },
        {
            id: 4,
            nickname: 'steve'
        },
        {
            id: 5,
            nickname: 'handsome'
        },
        {
            id: 6,
            nickname: 'boss'
        },
    ])
}