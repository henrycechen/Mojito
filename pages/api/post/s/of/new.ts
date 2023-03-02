import type { NextApiRequest, NextApiResponse } from 'next';

export default async function PostRankingOf24HoursNewest(req: NextApiRequest, res: NextApiResponse) {

    console.log(`GET new posts of: ${req.query?.channelId}`);

    res.send([
        {
            postId: 'P1234ABCDR0',
            memberId: 'M1234XXMM',

            nickname: '猴賽雷啊',
            avatarImageUrl: 'https://cdn1.iconfinder.com/data/icons/animal-avatars-1/60/Sloth-animals-nature-wildlife-animal-avatars-1024.png',

            createdTime: 1674610376336,
            imageUrlsArr: ['https://mui.com/static/images/cards/paella.jpg'],
            title: 'WebMaster看得最多的一张图片',

            totalHitCount: 100,
            totalLikedCount: 3
        },
        {
            postId: 'P1234ABCDR1',
            memberId: 'M1234XXXX',

            nickname: 'WebMaster',
            avatarImageUrl: '',

            createdTime: 1674610376336,
            imageUrlsArr: ['https://i.imgur.com/cYDG24D.jpeg'],
            title: '在Imgur上看到的Elonald Trusk',

            totalHitCount: 100,
            totalLikedCount: 3
        },
        {
            postId: 'P1234ABCDR2',
            memberId: 'M1234XXXX',

            nickname: 'WebMaster',
            avatarImageUrl: '',

            createdTime: 1674610376336,
            imageUrlsArr: ['https://i.imgur.com/IWP1cL4.jpeg'],
            title: 'Just a Golden Retriever in the Fall Leaves',

            totalHitCount: 100,
            totalLikedCount: 3
        },
        {
            postId: 'P1234ABCDR3',
            memberId: 'M1234XXXX',

            nickname: 'WebMaster',
            avatarImageUrl: '',

            createdTime: 1674610376336,
            imageUrlsArr: ['https://i.imgur.com/Ne2hcBt.jpeg'],
            title: 'Home of Stephen King, Bangor, ME',

            totalHitCount: 100,
            totalLikedCount: 3
        },
        {
            postId: 'P1234ABCDR4',
            memberId: 'M1234XXXX',

            nickname: 'WebMaster',
            avatarImageUrl: '',

            createdTime: 1674610376336,
            imageUrlsArr: ['https://i.imgur.com/9qTKlKW.jpeg'],
            title: 'The Fellowship of the Ring (1978)',

            totalHitCount: 100,
            totalLikedCount: 3
        },
        {
            postId: 'P1234ABCDR5',
            memberId: 'M1234XXXX',

            nickname: 'WebMaster',
            avatarImageUrl: '',

            createdTime: 1674610376336,
            imageUrlsArr: ['https://i.imgur.com/fQdY6Fs.jpeg'],
            title: 'beautiful art by Sam Yang',

            totalHitCount: 100,
            totalLikedCount: 3
        },
        {
            postId: 'P1234ABCDR6',
            memberId: 'M1234XXXX',

            nickname: 'WebMaster',
            avatarImageUrl: '',

            createdTime: 1674610376336,
            imageUrlsArr: ['https://i.imgur.com/tGBVefA.jpeg'],
            title: 'REPUGNANTS',

            totalHitCount: 100,
            totalLikedCount: 3
        },
        {
            postId: 'P1234ABCDR7',
            memberId: 'M1234XXXX',

            nickname: 'Pikabu Monster',
            avatarImageUrl: 'https://www.google.com/url?sa=i&url=https%3A%2F%2Fpikabu.monster%2Fposts-1%3Ftag%3D%25D0%2590%25D0%25B2%25D0%25B0%25D1%2582%25D0%25B0%25D1%2580%25D0%25BA%25D0%25B0%255C%25D0%2590%25D0%25BD%25D0%25B8%25D0%25BC%25D0%25B5&psig=AOvVaw37861TIpzR_kDsdNyMsUHJ&ust=1675373812288000&source=images&cd=vfe&ved=2ahUKEwjw0ez4o_X8AhVDpOkKHbxjBV8QjRx6BAgAEAo',

            createdTime: 1674610376336,
            imageUrlsArr: ['https://i.imgur.com/3PcGJbZ.jpeg'],
            title: 'What a nice Tuesday',

            totalHitCount: 100,
            totalLikedCount: 3
        },
        {
            postId: 'P1234ABCDR8',
            memberId: 'M1234XXXX',

            nickname: 'WebMaster',
            avatarImageUrl: '',

            createdTime: 1674610376336,
            imageUrlsArr: ['https://i.imgur.com/aqaWs3K.jpeg'],
            title: '#cakeday',

            totalHitCount: 100,
            totalLikedCount: 3
        },
        {
            postId: 'P1234ABCDR9',
            memberId: 'M1234XXXX',

            nickname: 'WebMaster',
            avatarImageUrl: '',

            createdTime: 1674610376336,
            imageUrlsArr: ['https://i.imgur.com/GwMvtMD.jpeg'],
            title: 'The Acropolis of Athens, the great jewel of classical Greece',

            totalHitCount: 100,
            totalLikedCount: 3
        },
        {
            postId: 'P1234ABCDR10',
            memberId: 'M1234XXXX',

            nickname: 'WebMaster',
            avatarImageUrl: '',

            createdTime: 1674610376336,
            imageUrlsArr: ['https://i.imgur.com/qbeOXWl.jpeg'],
            title: 'I FOUND IT.',

            totalHitCount: 100,
            totalLikedCount: 3
        },
        {
            postId: 'P1234ABCDR11',
            memberId: 'M1234XXXX',

            nickname: 'WebMaster',
            avatarImageUrl: '',

            createdTime: 1674610376336,
            imageUrlsArr: ['https://i.imgur.com/RnGBjx2.jpeg'],
            title: 'Actors and their stunt doubles!',

            totalHitCount: 100,
            totalLikedCount: 3
        },
        {
            postId: 'P1234ABCDR12',
            memberId: 'M1234XXXX',

            nickname: 'WebMaster',
            avatarImageUrl: '',

            createdTime: 1674610376336,
            imageUrlsArr: ['https://i.imgur.com/fgOXKnw.jpeg'],
            title: 'Thor Odinbun: God of Bunder',

            totalHitCount: 100,
            totalLikedCount: 3
        },
        {
            postId: 'P1234ABCDR13',
            memberId: 'M1234XXXX',

            nickname: 'WebMaster',
            avatarImageUrl: '',

            createdTime: 1674610376336,
            imageUrlsArr: ['https://i.imgur.com/1TlSUWC.jpeg'],
            title: 'Beautiful art',

            totalHitCount: 100,
            totalLikedCount: 3
        },
        {
            postId: 'P1234ABCDR14',
            memberId: 'M1234XXXX',

            nickname: 'WebMaster',
            avatarImageUrl: '',

            createdTime: 1674610376336,
            imageUrlsArr: ['https://i.imgur.com/CBAjNKS.jpeg'],
            title: 'Finally finished this Philippa Eilhart Cosplay from The Witcher',

            totalHitCount: 100,
            totalLikedCount: 3
        },
        {
            postId: 'P1234ABCDR15',
            memberId: 'M1234XXXX',

            nickname: 'WebMaster',
            avatarImageUrl: '',

            createdTime: 1674610376336,
            imageUrlsArr: ['https://i.imgur.com/2uKxVvO.jpeg'],
            title: 'It was a long day',

            totalHitCount: 100,
            totalLikedCount: 3
        },
        {
            postId: 'P1234ABCDR16',
            memberId: 'M1234XXXX',

            nickname: 'WebMaster',
            avatarImageUrl: '',

            createdTime: 1674610376336,
            imageUrlsArr: ['https://i.imgur.com/C9V5MX8.jpeg'],
            title: 'A photo of my dog Panko every day',

            totalHitCount: 100,
            totalLikedCount: 3
        },
        {
            postId: 'P1234ABCDR17',
            memberId: 'M1234XXXX',

            nickname: 'WebMaster',
            avatarImageUrl: '',

            createdTime: 1674610376336,
            imageUrlsArr: ['https://i.imgur.com/UALNrSn.jpeg'],
            title: 'It\'s my cake day! To celebrate, here\'s my wedding dress that I made myself!!',

            totalHitCount: 100,
            totalLikedCount: 3
        },
        {
            postId: 'P1234ABCDR18',
            memberId: 'M1234XXXX',

            nickname: 'WebMaster',
            avatarImageUrl: '',

            createdTime: 1674610376336,
            imageUrlsArr: ['https://i.imgur.com/S9IYY5x.jpeg'],
            title: 'Me too!!',

            totalHitCount: 100,
            totalLikedCount: 3
        },
        {
            postId: 'P1234ABCDR19',
            memberId: 'M1234XXXX',

            nickname: 'WebMaster',
            avatarImageUrl: '',

            createdTime: 1674610376336,
            imageUrlsArr: ['https://i.imgur.com/dcNstYH.jpeg'],
            title: 'A Dump of Cute Animal Memes ',

            totalHitCount: 100,
            totalLikedCount: 3
        },
        {
            postId: 'P1234ABCDR20',
            memberId: 'M1234XXXX',

            nickname: 'WebMaster',
            avatarImageUrl: '',

            createdTime: 1674610376336,
            imageUrlsArr: ['https://i.imgur.com/PbcaRNa.png'],
            title: 'Animal derps',

            totalHitCount: 100,
            totalLikedCount: 3
        },
        {
            postId: 'P1234ABCDR21',
            memberId: 'M1234XXXX',

            nickname: 'WebMaster',
            avatarImageUrl: '',

            createdTime: 1674610376336,
            imageUrlsArr: ['https://i.imgur.com/Ae1wefj.jpeg'],
            title: 'Then and now. She destroys every stuffed animal except this one. :)',

            totalHitCount: 100,
            totalLikedCount: 3
        },
        {
            postId: 'P1234ABCDR22',
            memberId: 'M1234XXXX',

            nickname: 'WebMaster',
            avatarImageUrl: '',

            createdTime: 1674610376336,
            imageUrlsArr: ['https://i.imgur.com/jSrk41C.png'],
            title: '?',

            totalHitCount: 100,
            totalLikedCount: 3
        },
        {
            postId: 'P1234ABCDR23',
            memberId: 'M1234XXXX',

            nickname: 'WebMaster',
            avatarImageUrl: '',

            createdTime: 1674610376336,
            imageUrlsArr: ['https://i.imgur.com/h4YdP09.jpeg'],
            title: 'I’m kinda stoked',

            totalHitCount: 100,
            totalLikedCount: 3
        },
        {
            postId: 'P1234ABCDR24',
            memberId: 'M1234XXXX',

            nickname: 'WebMaster',
            avatarImageUrl: '',

            createdTime: 1674610376336,
            imageUrlsArr: ['https://i.imgur.com/v8RoSVP.png'],
            title: 'A Larger guide to Imgur animal names PT 2!',

            totalHitCount: 100,
            totalLikedCount: 3
        },
        {
            postId: 'P1234ABCDR25',
            memberId: 'M1234XXXX',

            nickname: 'WebMaster',
            avatarImageUrl: '',

            createdTime: 1674610376336,
            imageUrlsArr: ['https://i.imgur.com/ncoNpAo.jpeg'],
            title: 'Tumblr : Animal Edition',

            totalHitCount: 100,
            totalLikedCount: 3
        },
        {
            postId: 'P1234ABCDR26',
            memberId: 'M1234XXXX',

            nickname: 'WebMaster',
            avatarImageUrl: '',

            createdTime: 1674610376336,
            imageUrlsArr: ['https://i.imgur.com/ogUchxX.jpeg'],
            title: 'cat',

            totalHitCount: 100,
            totalLikedCount: 3
        },
        {
            postId: 'P1234ABCDR27',
            memberId: 'M1234XXXX',

            nickname: 'WebMaster',
            avatarImageUrl: '',

            createdTime: 1674610376336,
            imageUrlsArr: ['https://i.imgur.com/Ct5jAYO.jpeg'],
            title: 'Bond villain confirmed',

            totalHitCount: 100,
            totalLikedCount: 3
        },
        {
            postId: 'P1234ABCDR28',
            memberId: 'M1234XXXX',

            nickname: 'WebMaster',
            avatarImageUrl: '',

            createdTime: 1674610376336,
            imageUrlsArr: ['https://i.imgur.com/V0Ao5Il.jpeg'],
            title: 'Beautiful Victorian Architecture Fort Hamilton Parkway Brooklyn',

            totalHitCount: 100,
            totalLikedCount: 3
        },
        {
            postId: 'P1234ABCDR29',
            memberId: 'M1234XXXX',

            nickname: 'WebMaster',
            avatarImageUrl: '',

            createdTime: 1674610376336,
            imageUrlsArr: ['https://i.imgur.com/ZwgUOWg.jpeg'],
            title: 'A very American genius…',

            totalHitCount: 100,
            totalLikedCount: 3
        },
    ]);
}