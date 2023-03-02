import type { NextApiRequest, NextApiResponse } from 'next';

// will be returned 
// - IConcisePostComprehensive



export default async function PostRankingOf7DaysHottest(req: NextApiRequest, res: NextApiResponse) {

    console.log('7d');
    console.log(req.query?.channelId, req.query?.withMemberInfo, req.query?.quantity);

    res.send([

        {
            postId: 'P1234ABCDF5',
            memberId: '1',

            nickname: '經典特侖蘇',
            avatarImageUrl: '',


            createdTime: 1674610376336,
            imageUrlsArr: ['https://i.imgur.com/fQdY6Fs.jpeg'],
            title: 'beautiful art by Sam Yang',

            channelId: 'chat',

            totalCommentCount: 12, totalHitCount: 100,
            totalLikedCount: 3
        },

        {
            postId: 'P1234ABCDF4',
            memberId: '1',

            nickname: '經典特侖蘇',
            avatarImageUrl: '',


            createdTime: 1674610376336,
            imageUrlsArr: ['https://i.imgur.com/9qTKlKW.jpeg'],
            title: 'The Fellowship of the Ring (1978)',

            channelId: 'chat', totalCommentCount: 12, totalHitCount: 100,
            totalLikedCount: 3
        },
        {
            postId: 'P1234ABCDF3',
            memberId: '1',

            nickname: 'Youtube Remix',
            avatarImageUrl: '',


            createdTime: 1674610376336,
            imageUrlsArr: ['https://i.imgur.com/Ne2hcBt.jpeg'],
            title: 'Home of Stephen King, Bangor, ME',

            channelId: 'chat', totalCommentCount: 12, totalHitCount: 100,
            totalLikedCount: 3
        },
        {
            postId: 'P1234ABCDF2',
            memberId: '1',

            nickname: 'Youtube Remix',
            avatarImageUrl: '',


            createdTime: 1674610376336,
            imageUrlsArr: ['https://i.imgur.com/IWP1cL4.jpeg'],
            title: 'Just a Golden Retriever in the Fall Leaves',

            channelId: 'chat', totalCommentCount: 12, totalHitCount: 100,
            totalLikedCount: 3
        },


        {
            postId: 'P1234ABCDF0',
            memberId: '1',

            nickname: 'Youtube Remix',
            avatarImageUrl: '',


            createdTime: 1674610376336,
            imageUrlsArr: ['https://mui.com/static/images/cards/paella.jpg'],
            title: 'WebMaster看得最多的一张图片',

            channelId: 'chat', totalCommentCount: 12, totalHitCount: 100,
            totalLikedCount: 3
        },
        {
            postId: 'P1234ABCDF1',
            memberId: '1',

            nickname: 'Youtube Remix',
            avatarImageUrl: '',


            createdTime: 1674610376336,
            imageUrlsArr: ['https://i.imgur.com/cYDG24D.jpeg'],
            title: '在Imgur上看到的Elonald Trusk',

            channelId: 'chat', totalCommentCount: 12, totalHitCount: 100,
            totalLikedCount: 3
        },



    ]);

}