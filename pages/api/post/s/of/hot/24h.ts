import type { NextApiRequest, NextApiResponse } from 'next';

export default async function PostRankingOf24HoursHottest(req: NextApiRequest, res: NextApiResponse) {

    console.log('24h');
    console.log(req.query?.channelId, req.query?.withMemberInfo, req.query?.quantity);

    res.send([
        {
            postId: 'post-id-0',
            memberId: '1',

            nickname: 'Youtube Remix'
            ,
            avatarImageUrl: '',

            createdTime: 1674610376336,
            imageUrlsArr: ['https://mui.com/static/images/cards/paella.jpg'],
            title: 'WebMaster看得最多的一张图片',

            totalHitCount: 100,
            totalLikedCount: 3
        },
        {
            postId: 'post-id-1',
            memberId: '1',

            nickname: 'Youtube Remix'
            ,
            avatarImageUrl: '',

            createdTime: 1674610376336,
            imageUrlsArr: ['https://i.imgur.com/cYDG24D.jpeg'],
            title: '在Imgur上看到的Elonald Trusk',

            totalHitCount: 100,
            totalLikedCount: 3
        },
        {
            postId: 'post-id-2',
            memberId: '1',

            nickname: 'Youtube Remix'
            ,
            avatarImageUrl: '',

            createdTime: 1674610376336,
            imageUrlsArr: ['https://i.imgur.com/IWP1cL4.jpeg'],
            title: 'Just a Golden Retriever in the Fall Leaves',

            totalHitCount: 100,
            totalLikedCount: 3
        },
        {
            postId: 'post-id-3',
            memberId: '1',

            nickname: 'Youtube Remix'
            ,
            avatarImageUrl: '',

            createdTime: 1674610376336,
            imageUrlsArr: ['https://i.imgur.com/Ne2hcBt.jpeg'],
            title: 'Home of Stephen King, Bangor, ME',

            totalHitCount: 100,
            totalLikedCount: 3
        },
        {
            postId: 'post-id-4',
            memberId: '1',

            nickname: 'Youtube Remix'
            ,
            avatarImageUrl: '',

            createdTime: 1674610376336,
            imageUrlsArr: ['https://i.imgur.com/9qTKlKW.jpeg'],
            title: 'The Fellowship of the Ring (1978)',

            totalHitCount: 100,
            totalLikedCount: 3
        },
        {
            postId: 'post-id-5',
            memberId: '1',

            nickname: 'Youtube Remix'
            ,
            avatarImageUrl: '',

            createdTime: 1674610376336,
            imageUrlsArr: ['https://i.imgur.com/fQdY6Fs.jpeg'],
            title: 'beautiful art by Sam Yang',

            totalHitCount: 100,
            totalLikedCount: 3
        }
    ]);
}