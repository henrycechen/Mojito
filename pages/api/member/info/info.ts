import type { NextApiRequest, NextApiResponse } from 'next';
import CryptoJS from 'crypto-js';


export default async function Info(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;
    if ('GET' === method) {
        const p = 'VTJGc2RHVmtYMS9Qb2tqcS9KSUc2bjRBQTVza1NEMlM1dGZvcEk4b0dMclkxRTdmR3RDZUhtSjhNV3JJOHZSYzNNRzBNT1ZQaC9NMTVzdWRUYmJYaEVHVVdzenVMV1N5MHdlOTAvWXBIYjVNVS8zQnczbm9jUzZudVN3bFZlL2tsT2xCNG1rTUFwQmY1VElKM2h6NW1nPT0='
        const text = Buffer.from(p, 'base64');
        res.send(text)
    }

}