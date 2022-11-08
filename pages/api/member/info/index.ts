import type { NextApiRequest, NextApiResponse } from 'next';
import CryptoJS from 'crypto-js';


export default async function Info(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;
    if ('GET' === method) {
        const text = '---I-LOVE-MOJITO---';
        const cypher = CryptoJS.AES.encrypt(text, 'WE_LOVE_MOJITO').toString()
        const plaintext = CryptoJS.AES.decrypt('U2FsdGVkX1/Pokjq/JIG6n4AA5skSD2S5tfopI8oGLrY1E7fGtCeHmJ8MWrI8vRc3MG0MOVPh/M15sudTbbXhEGUWszuLWSy0we90/YpHb5MU/3Bw3nocS6nuSwlVe/klOlB4mkMApBf5TIJ3hz5mg==', 'WE_LOVE_MOJITO').toString(CryptoJS.enc.Utf8)
        res.send(plaintext)
    }

}