import type { NextApiRequest, NextApiResponse } from 'next';


/// require reCAPTCHA
export default async function QueryMemberByNicknameBase64(req: NextApiRequest, res: NextApiResponse) {
    res.send('ok')
}
