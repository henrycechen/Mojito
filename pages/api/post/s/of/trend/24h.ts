import type { NextApiRequest, NextApiResponse } from 'next';

export default async function PostRankingOf24HoursHottest(req: NextApiRequest, res: NextApiResponse) {

    console.log(`GET 24h trening posts of ${req.query?.channelId}`);

    res.send([
        {
            postId: 'P1234ABCDH0',
            memberId: '1',

            nickname: 'Youtube Remix'
            ,
            avatarImageUrl: '',

            createdTime: 1674610376336,
            imageUrlsArr: ['https://mui.com/static/images/cards/paella.jpg'],
            title: 'WebMaster看得最多的一张图片',

            channelId: 'chat', totalCommentCount: 12, totalHitCount: 100,
            totalLikedCount: 3
        },
        {
            postId: 'P1234ABCDH1',
            memberId: '1',

            nickname: 'Youtube Remix'
            ,
            avatarImageUrl: '',

            createdTime: 1674610376336,
            imageUrlsArr: ['https://i.imgur.com/cYDG24D.jpeg'],
            title: '在Imgur上看到的Elonald Trusk',

            channelId: 'chat', totalCommentCount: 12, totalHitCount: 100,
            totalLikedCount: 3
        },
        {
            postId: 'P1234ABCDH2',
            memberId: '1',

            nickname: 'Youtube Remix'
            ,
            avatarImageUrl: '',

            createdTime: 1674610376336,
            imageUrlsArr: ['https://i.imgur.com/IWP1cL4.jpeg'],
            title: 'Just a Golden Retriever in the Fall Leaves',

            channelId: 'chat', totalCommentCount: 12, totalHitCount: 100,
            totalLikedCount: 3
        },
        {
            postId: 'P1234ABCDH3',
            memberId: '1',

            nickname: 'Youtube Remix'
            ,
            avatarImageUrl: '',

            createdTime: 1674610376336,
            imageUrlsArr: ['https://i.imgur.com/Ne2hcBt.jpeg'],
            title: 'Home of Stephen King, Bangor, ME',

            channelId: 'chat', totalCommentCount: 12, totalHitCount: 100,
            totalLikedCount: 3
        },
        {
            postId: 'P1234ABCDH4',
            memberId: '1',

            nickname: 'Youtube Remix'
            ,
            avatarImageUrl: '',

            createdTime: 1674610376336,
            imageUrlsArr: ['https://i.imgur.com/9qTKlKW.jpeg'],
            title: 'The Fellowship of the Ring (1978)',

            channelId: 'chat', totalCommentCount: 12, totalHitCount: 100,
            totalLikedCount: 3
        },
        {
            postId: 'P1234ABCDH5',
            memberId: '1',

            nickname: 'Youtube Remix'
            ,
            avatarImageUrl: '',

            createdTime: 1674610376336,
            imageUrlsArr: ['https://i.imgur.com/fQdY6Fs.jpeg'],
            title: 'beautiful art by Sam Yang',

            channelId: 'chat', totalCommentCount: 12, totalHitCount: 100,
            totalLikedCount: 3
        }
    ]);
}