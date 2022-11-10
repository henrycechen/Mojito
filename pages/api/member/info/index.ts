import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyEnvironmentVariable } from '../../../../lib/utils'


export default async function Info(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;
    if ('GET' === method) {
        const text = '1'
        const text1 = '1'
        const text2 = '1'
        const text3 = '1'
        const name = verifyEnvironmentVariable({ text, text1, text2, text3 })
        res.send(name)
    }
}