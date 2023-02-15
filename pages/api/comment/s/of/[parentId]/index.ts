import type { NextApiRequest, NextApiResponse } from 'next';
import { MongoError } from 'mongodb';

import AtlasDatabaseClient from '../../../../../../modules/AtlasDatabaseClient';

import { INoticeInfo, IMemberPostMapping, INotificationStatistics, IMemberComprehensive, IMemberStatistics, ILoginJournal, IAttitudeComprehensive, IAttitideMapping, ICommentComprehensive, IEditedCommentComprehensive, IRestrictedCommentComprehensive, IChannelStatistics, ITopicComprehensive, ITopicPostMapping, IPostComprehensive, IEditedPostComprehensive, IRestrictedPostComprehensive } from '../../../../../../lib/interfaces';
import { verifyId, response405, response500, logWithDate, getRestrictedFromCommentComprehensive } from '../../../../../../lib/utils';

// This interface only accepts GET requests
// 
// Info requried
// - parentId: string (post / comment id)
//
// Info will be returned
// - commentsArray: IRestrictedCommentComprehensive[] (for query with 'post' id category)
// - subcommentsArray: IRestrictedCommentComprehensive[] (for query with 'comment' id category)

export default async function GetCommentsByParentId(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;
    if ('GET' !== method) {
        response405(req, res);
        return;
    }




    // FIXME: test
    if ('P1234ABCD' === req.query?.parentId) {
        res.send([

            {
                commentId: 'C12345ABCDE',
                parentId: 'P1234ABCD',
                postId: 'P1234ABCD',
                memberId: 'M1234XXXX',
                nickname: 'WebMaster',
                avatarImageUrl: '',
                createdTime: 1673485052321,
                content: `周杰倫在電影《頭文字D》（2005年）中開始了他的電影事業；他從此涉足許多其他的電影企劃。周杰倫也管理他自己的唱片和經紀公司杰威爾音樂。2011年首度進入好萊塢，飾演《青蜂俠》之助理Kato；2016年再次進入好萊塢，在電影《出神入化2》中扮演小李。 @WebMaster`,
                cuedMemberInfoArr: [{ memberId: 'M1234ABCD', nickname: '县长马邦德' }],
                status: 200,

                totalLikedCount: 14,
                totalDislikedCount: 1,
                totalSubcommentCount: 3,

            },
            {
                commentId: 'C12345ABCDF',
                parentId: 'P1234ABCD',
                postId: 'P1234ABCD',
                memberId: 'M1234XXXX',
                nickname: 'WebMaster',
                avatarImageUrl: '',
                createdTime: 1673485052321,
                content: `2001年起開始與蔡依林傳出雙J戀[13]，直至2005年農曆新年期間，周杰倫被香港雜誌《忽然1周》拍攝到他與年代電視新聞主播侯佩岑同遊東京互動親暱的照片[14]。之後周杰倫在記者會上承認追求侯佩岑，同時否認過去與蔡依林的戀情傳聞[15]。後續記者採訪朋友張洛君與蔡依林父親則表示兩人在一起過但早已分手[16][17]。但在2006年中與侯佩岑雙雙否認曾在一起[18][19]。而蔡依林則於2010年接受陶晶瑩的專訪時，才坦承當年經由媒體接獲周侯戀的消息後，曾恨了周杰倫一年，直到2008年才漸漸釋懷。[20]@县长马邦德`,
                cuedMemberInfoArr: [{ memberId: 'M1234ABCD', nickname: '县长马邦德' }],
                status: 200,

                totalLikedCount: 126,
                totalDislikedCount: 1,
                totalSubcommentCount: 2,

            },
            {
                commentId: 'C12345ABCDG',
                parentId: 'P1234ABCD',
                postId: 'P1234ABCD',
                memberId: 'M1234ABCE',
                nickname: '林北',
                avatarImageUrl: '',
                createdTime: 1673485052321,
                content: `曾愷玹（英語：Alice Tzeng Kai-Syuan），台灣女演員、作家、藝術工作者。因飾演電影《不能說的秘密》晴依一角而入圍金馬獎最佳女配角廣受矚目。 `,
                cuedMemberInfoArr: [{ memberId: 'M1234ABCD', nickname: '县长马邦德' }],
                status: 200,

                totalLikedCount: 3,
                totalDislikedCount: 1,
                totalSubcommentCount: 0,

            },

        ]);
    }

    if ('C12345ABCDE' === req.query?.parentId) {
        res.send([{
            commentId: 'D12345ABCDE',
            parentId: 'C12345ABCDE',
            postId: 'P1234ABCD',
            memberId: 'M1234ABCD',
            nickname: '县长马邦德',
            avatarImageUrl: '',
            createdTime: 1673485211040,
            content: `周杰倫在臺北縣林口鄉（今新北市林口區）長大[5]，為家中的獨生子。父親周耀中，當時任教於蘆洲國中，教授生物[6]；母親葉惠美則是林口國中美術教師。14歲時父母離異，由父親擔任監護人，年滿18歲後選擇與母親共同生活[7]。周杰倫曾在台灣民視新聞台由胡婉玲主持的節目《台灣演義》專訪中澄清《爸，我回來了》只是對社會上家暴現象的感慨，並非指涉父母間的狀況；父親方面的親戚也曾質疑過他，他還為此向親戚們澄清，為此誤解抱歉過[8]。`,
            cuedMemberInfoArr: [],
            status: 201,
            totalLikedCount: 1,
            totalDislikedCount: 1
        },
        {
            commentId: 'D12345ABCDF',
            parentId: 'C12345ABCDE',
            postId: 'P1234ABCD',
            memberId: 'M1234XXXX',
            nickname: 'WebMaster',
            avatarImageUrl: '',
            createdTime: 1673485211040,
            content: `周杰倫自小對音樂表現出濃厚的興趣，並且喜歡模仿歌星、演員表演和變魔術。3歲開始學習鋼琴。周杰倫國小時住在臺北市光華商場附近，就讀忠孝國小。國中時就讀金華國中[9]，此時期他的父母因長年爭執而決議離婚，使周杰倫的性情大受影響。除了音樂外，周杰倫熱愛籃球，在國中參加籃球隊，結識學長陳建州。@县长马邦德 `,
            cuedMemberInfoArr: [{ memberId: 'M1234ABCD', nickname: '县长马邦德' }],
            status: 201,
            totalLikedCount: 1,
            totalDislikedCount: 1
        }]);
    }

    if ('C12345ABCDF' === req.query?.parentId) {
        res.send([{
            commentId: 'D12345ABCDG',
            parentId: 'C12345ABCDF',
            postId: 'P1234ABCD',
            memberId: 'M1234ABCD',
            nickname: '县长马邦德',
            avatarImageUrl: '',
            createdTime: 1673485211040,
            content: `高中就讀於台北縣私立淡江中學第一屆音樂科（本來是想報考華岡藝校，但錯過了報名時間，幸好淡江中學恰巧新設了音樂科），主修鋼琴，副修大提琴，為將來的音樂發展打下了深厚的基礎[10]。這時的他因正值青春期，常常秀琴技想吸引女同學的注意。但學科成績不甚理想，故高中畢業時，大學聯考落榜。又因患有僵直性脊椎炎，依據臺灣兵役制度得以免服義務兵役[11]。 `,
            cuedMemberInfoArr: [{ memberId: 'M1234XXXX', nickname: 'WebMaster' }],
            status: 201,
            totalLikedCount: 1,
            totalDislikedCount: 1
        }])
    }




















    const { isValid, category, id: parentId } = verifyId(req.query?.parentId);
    //// Verify id ////
    if (!isValid) {
        res.status(400).send('Invalid post or comment id');
        return;
    }
    //// Verify category ////
    if (!['post', 'comment'].includes(category)) {
        res.status(400).send('Invalid id category');
        return;
    }
    //// Declare DB client ////
    const atlasDbClient = AtlasDatabaseClient();
    try {
        // Step #1 look up document (of IPostComprehensive) in [C] postComprehensive
        if ('post' === category) {
            await atlasDbClient.connect();
            const postComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IPostComprehensive>('post');
            const postComprehensiveQueryResult = await postComprehensiveCollectionClient.findOne({ postId: parentId });
            if (null === postComprehensiveQueryResult) {
                res.status(404).send('Post not found');
                await atlasDbClient.close();
                return;
            }
        }
        if ('comment' === category) {
            await atlasDbClient.connect();
            // Step #1 look up document (of ICommentComprehensive) in [C] commentComprehensive
            const commentComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<ICommentComprehensive>('comment');
            const commentComprehensiveQueryResult = await commentComprehensiveCollectionClient.findOne({ commentId: parentId });
            if (null === commentComprehensiveQueryResult) {
                res.status(404).send('Comment not found');
                await atlasDbClient.close();
                return;
            }
        }
        // Step #2 look up documents (of ICommentComprehensive) in [C] commentComprehensive
        const commentsArray = [];
        const commentComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<ICommentComprehensive>('comment');
        const commentComprehensiveQuery = commentComprehensiveCollectionClient.find({ parentId });
        let commentComprehensiveQueryResult = await commentComprehensiveQuery.next();
        while (null !== commentComprehensiveQueryResult) {
            commentsArray.push(getRestrictedFromCommentComprehensive(commentComprehensiveQueryResult))
        }
        res.status(200).send(commentsArray)
        await atlasDbClient.close();
        return;
    } catch (e: any) {
        let msg: string;
        if (e instanceof MongoError) {
            msg = 'Attempt to communicate with atlas mongodb.';
        } else {
            msg = `Uncategorized. ${e?.msg}`;
        }
        if (!res.headersSent) {
            response500(res, msg);
        }
        logWithDate(msg, e);
        await atlasDbClient.close();
        return;
    }
}