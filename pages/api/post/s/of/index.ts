import type { NextApiRequest, NextApiResponse } from 'next';
import { response405 } from '../../../../../lib/utils';

export default function Post(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;
    if (!!method && !['GET', 'POST'].includes(method)) {
        response405(req, res);
        return;
    }
    if ('GET' === method) {
        const { ranking } = req.query;
        if ('hotest' === ranking) {
            res.send([
                {
                    id: 'post-id-0',
                    memberId: '1',
                    timestamp: '2022-10-04T00:56:55.3670973Z',
                    imgUrl: 'https://mui.com/static/images/cards/paella.jpg',
                    title: 'WebMaster看得最多的一张图片',

                },
                {
                    id: 'post-id-1',
                    memberId: '1',
                    timestamp: '2022-10-04T01:56:55.3670973Z',
                    imgUrl: 'https://i.imgur.com/cYDG24D.jpeg',
                    title: '在Imgur上看到的Elonald Trusk',

                },
                {
                    id: 'post-id-2',
                    memberId: '1',
                    timestamp: '2022-10-04T02:56:55.3670973Z',
                    imgUrl: 'https://i.imgur.com/IWP1cL4.jpeg',
                    title: 'Just a Golden Retriever in the Fall Leaves',

                },
                {
                    id: 'post-id-3',
                    memberId: '1',
                    timestamp: '2022-10-04T03:56:55.3670973Z',
                    imgUrl: 'https://i.imgur.com/Ne2hcBt.jpeg',
                    title: 'Home of Stephen King, Bangor, ME',

                },
                {
                    id: 'post-id-4',
                    memberId: '1',
                    timestamp: '2022-10-04T04:56:55.3670973Z',
                    imgUrl: 'https://i.imgur.com/9qTKlKW.jpeg',
                    title: 'The Fellowship of the Ring (1978)',

                },
                {
                    id: 'post-id-5',
                    memberId: '1',
                    timestamp: '2022-10-04T05:56:55.3670973Z',
                    imgUrl: 'https://i.imgur.com/fQdY6Fs.jpeg',
                    title: 'beautiful art by Sam Yang',

                },
                {
                    id: 'post-id-6',
                    memberId: '1',
                    timestamp: '2022-10-04T06:56:55.3670973Z',
                    imgUrl: 'https://i.imgur.com/tGBVefA.jpeg',
                    title: 'REPUGNANTS',

                },
                {
                    id: 'post-id-7',
                    memberId: '1',
                    timestamp: '2022-10-04T07:56:55.3670973Z',
                    imgUrl: 'https://i.imgur.com/3PcGJbZ.jpeg',
                    title: 'What a nice Tuesday',

                },
                {
                    id: 'post-id-8',
                    memberId: '1',
                    timestamp: '2022-10-04T08:56:55.3670973Z',
                    imgUrl: 'https://i.imgur.com/aqaWs3K.jpeg',
                    title: '#cakeday',

                },
                {
                    id: 'post-id-9',
                    memberId: '1',
                    timestamp: '2022-10-04T09:56:55.3670973Z',
                    imgUrl: 'https://i.imgur.com/GwMvtMD.jpeg',
                    title: 'The Acropolis of Athens, the great jewel of classical Greece',

                },
                {
                    id: 'post-id-10',
                    memberId: '1',
                    timestamp: '2022-10-04T09:56:55.3670973Z',
                    imgUrl: 'https://i.imgur.com/qbeOXWl.jpeg',
                    title: 'I FOUND IT.',

                },
            ])
            return;
        }
        res.send([
            {
                id: 'post-id-0',
                memberId: '1',
                timestamp: '2022-10-04T00:56:55.3670973Z',
                imgUrl: 'https://mui.com/static/images/cards/paella.jpg',
                title: 'WebMaster看得最多的一张图片',

            },
            {
                id: 'post-id-1',
                memberId: '1',
                timestamp: '2022-10-04T01:56:55.3670973Z',
                imgUrl: 'https://i.imgur.com/cYDG24D.jpeg',
                title: '在Imgur上看到的Elonald Trusk',

            },
            {
                id: 'post-id-2',
                memberId: '1',
                timestamp: '2022-10-04T02:56:55.3670973Z',
                imgUrl: 'https://i.imgur.com/IWP1cL4.jpeg',
                title: 'Just a Golden Retriever in the Fall Leaves',

            },
            {
                id: 'post-id-3',
                memberId: '1',
                timestamp: '2022-10-04T03:56:55.3670973Z',
                imgUrl: 'https://i.imgur.com/Ne2hcBt.jpeg',
                title: 'Home of Stephen King, Bangor, ME',

            },
            {
                id: 'post-id-4',
                memberId: '1',
                timestamp: '2022-10-04T04:56:55.3670973Z',
                imgUrl: 'https://i.imgur.com/9qTKlKW.jpeg',
                title: 'The Fellowship of the Ring (1978)',

            },
            {
                id: 'post-id-5',
                memberId: '1',
                timestamp: '2022-10-04T05:56:55.3670973Z',
                imgUrl: 'https://i.imgur.com/fQdY6Fs.jpeg',
                title: 'beautiful art by Sam Yang',

            },
            {
                id: 'post-id-6',
                memberId: '1',
                timestamp: '2022-10-04T06:56:55.3670973Z',
                imgUrl: 'https://i.imgur.com/tGBVefA.jpeg',
                title: 'REPUGNANTS',

            },
            {
                id: 'post-id-7',
                memberId: '1',
                timestamp: '2022-10-04T07:56:55.3670973Z',
                imgUrl: 'https://i.imgur.com/3PcGJbZ.jpeg',
                title: 'What a nice Tuesday',

            },
            {
                id: 'post-id-8',
                memberId: '1',
                timestamp: '2022-10-04T08:56:55.3670973Z',
                imgUrl: 'https://i.imgur.com/aqaWs3K.jpeg',
                title: '#cakeday',

            },
            {
                id: 'post-id-9',
                memberId: '1',
                timestamp: '2022-10-04T09:56:55.3670973Z',
                imgUrl: 'https://i.imgur.com/GwMvtMD.jpeg',
                title: 'The Acropolis of Athens, the great jewel of classical Greece',

            },
            {
                id: 'post-id-10',
                memberId: '1',
                timestamp: '2022-10-04T09:56:55.3670973Z',
                imgUrl: 'https://i.imgur.com/qbeOXWl.jpeg',
                title: 'I FOUND IT.',

            },
            {
                id: 'post-id-11',
                memberId: '1',
                timestamp: '2022-10-04T09:56:55.3670973Z',
                imgUrl: 'https://i.imgur.com/RnGBjx2.jpeg',
                title: 'Actors and their stunt doubles!',

            },
            {
                id: 'post-id-12',
                memberId: '1',
                timestamp: '2022-10-04T09:56:55.3670973Z',
                imgUrl: 'https://i.imgur.com/fgOXKnw.jpeg',
                title: 'Thor Odinbun: God of Bunder',

            },
            {
                id: 'post-id-13',
                memberId: '1',
                timestamp: '2022-10-04T09:56:55.3670973Z',
                imgUrl: 'https://i.imgur.com/1TlSUWC.jpeg',
                title: 'Beautiful art',

            },
            {
                id: 'post-id-14',
                memberId: '1',
                timestamp: '2022-10-04T09:56:55.3670973Z',
                imgUrl: 'https://i.imgur.com/CBAjNKS.jpeg',
                title: 'Finally finished this Philippa Eilhart Cosplay from The Witcher',

            },
            {
                id: 'post-id-15',
                memberId: '1',
                timestamp: '2022-10-04T09:56:55.3670973Z',
                imgUrl: 'https://i.imgur.com/2uKxVvO.jpeg',
                title: 'It was a long day',

            },
            {
                id: 'post-id-16',
                memberId: '1',
                timestamp: '2022-10-04T09:56:55.3670973Z',
                imgUrl: 'https://i.imgur.com/C9V5MX8.jpeg',
                title: 'A photo of my dog Panko every day',

            },
            {
                id: 'post-id-17',
                memberId: '1',
                timestamp: '2022-10-04T09:56:55.3670973Z',
                imgUrl: 'https://i.imgur.com/UALNrSn.jpeg',
                title: 'It\'s my cake day! To celebrate, here\'s my wedding dress that I made myself!!',

            },
            {
                id: 'post-id-18',
                memberId: '1',
                timestamp: '2022-10-04T09:56:55.3670973Z',
                imgUrl: 'https://i.imgur.com/S9IYY5x.jpeg',
                title: 'Me too!!',
            },
            {
                id: 'post-id-19',
                memberId: '1',
                timestamp: '2022-10-04T09:56:55.3670973Z',
                imgUrl: 'https://i.imgur.com/dcNstYH.jpeg',
                title: 'A Dump of Cute Animal Memes ',
            },
            {
                id: 'post-id-20',
                memberId: '1',
                timestamp: '2022-10-04T09:56:55.3670973Z',
                imgUrl: 'https://i.imgur.com/PbcaRNa.png',
                title: 'Animal derps',
            },
            {
                id: 'post-id-21',
                memberId: '1',
                timestamp: '2022-10-04T09:56:55.3670973Z',
                imgUrl: 'https://i.imgur.com/Ae1wefj.jpeg',
                title: 'Then and now. She destroys every stuffed animal except this one. :)',
            },
            {
                id: 'post-id-22',
                memberId: '1',
                timestamp: '2022-10-04T09:56:55.3670973Z',
                imgUrl: 'https://i.imgur.com/jSrk41C.png',
                title: '?',
            },
            {
                id: 'post-id-23',
                memberId: '1',
                timestamp: '2022-10-04T09:56:55.3670973Z',
                imgUrl: 'https://i.imgur.com/h4YdP09.jpeg',
                title: 'I’m kinda stoked',
            },
            {
                id: 'post-id-24',
                memberId: '1',
                timestamp: '2022-10-04T09:56:55.3670973Z',
                imgUrl: 'https://i.imgur.com/v8RoSVP.png',
                title: 'A Larger guide to Imgur animal names PT 2!',
            },
            {
                id: 'post-id-25',
                memberId: '1',
                timestamp: '2022-10-04T09:56:55.3670973Z',
                imgUrl: 'https://i.imgur.com/ncoNpAo.jpeg',
                title: 'Tumblr : Animal Edition',
            },
            {
                id: 'post-id-26',
                memberId: '1',
                timestamp: '2022-10-04T09:56:55.3670973Z',
                imgUrl: 'https://i.imgur.com/ogUchxX.jpeg',
                title: 'cat',
            },
            {
                id: 'post-id-27',
                memberId: '1',
                timestamp: '2022-10-04T09:56:55.3670973Z',
                imgUrl: 'https://i.imgur.com/Ct5jAYO.jpeg',
                title: 'Bond villain confirmed',
            },
            {
                id: 'post-id-28',
                memberId: '1',
                timestamp: '2022-10-04T09:56:55.3670973Z',
                imgUrl: 'https://i.imgur.com/V0Ao5Il.jpeg',
                title: 'Beautiful Victorian Architecture Fort Hamilton Parkway Brooklyn',
            },
            {
                id: 'post-id-29',
                memberId: '1',
                timestamp: '2022-10-04T09:56:55.3670973Z',
                imgUrl: 'https://i.imgur.com/ZwgUOWg.jpeg',
                title: 'A very American genius…',
            },
        ]);
    }
}