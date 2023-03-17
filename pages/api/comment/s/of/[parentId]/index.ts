import type { NextApiRequest, NextApiResponse } from 'next';
import { MongoError } from 'mongodb';

import AtlasDatabaseClient from '../../../../../../modules/AtlasDatabaseClient';
import { logWithDate, response405, response500 } from '../../../../../../lib/utils/general';
import { verifyId } from '../../../../../../lib/utils/verify';
import { IPostComprehensive } from '../../../../../../lib/interfaces/post';
import { ICommentComprehensive } from '../../../../../../lib/interfaces/comment';
import { getRestrictedFromCommentComprehensive } from '../../../../../../lib/utils/for/comment';


const fname = GetCommentsByParentId.name;

/** GetCommentsByParentId v0.1.1 FIXME: test mode
 * 
 * Last update: 21/02/2023
 * 
 * This interface only accepts GET requests
 * 
 * Info requried for GET requests
 * - parentId: string (post / comment id)
 * 
 * Info will be returned for GET requests
 * - commentsArray: IRestrictedCommentComprehensive[] (for query with 'post' id category)
 * - subcommentsArray: IRestrictedCommentComprehensive[] (for query with 'comment' id category)
 * 
 */

export default async function GetCommentsByParentId(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;
    if ('GET' !== method) {
        response405(req, res);
        return;
    }





    res.send([

        {
            commentId: 'C12345ABCDE',
            parentId: 'P4CD624HHS',
            postId: 'P4CD624HHS',
            memberId: 'M1234XXXX',
            nickname: 'WebMaster',
            avatarImageUrl: '',
            createdTimeBySecond: 1673485052,
            content: `周杰倫在電影《頭文字D》（2005年）中開始了他的電影事業；他從此涉足許多其他的電影企劃。周杰倫也管理他自己的唱片和經紀公司杰威爾音樂。2011年首度進入好萊塢，飾演《青蜂俠》之助理Kato；2016年再次進入好萊塢，在電影《出神入化2》中扮演小李。 @县长马邦德`,
            cuedMemberInfoArr: [{ memberId: 'M1234ABCD', nickname: '县长马邦德' }],
            status: 200,

            totalLikedCount: 14,
            totalDislikedCount: 1,
            totalSubcommentCount: 3,

        },
        {
            commentId: 'C12345ABCDF',
            parentId: 'P4CD624HHS',
            postId: 'P4CD624HHS',
            memberId: 'M1234XXXX',
            nickname: 'WebMaster',
            avatarImageUrl: '',
            createdTimeBySecond: 1673485052,
            content: `2001年起開始與蔡依林傳出雙J戀[13]，直至2005年農曆新年期間，周杰倫被香港雜誌《忽然1周》拍攝到他與年代電視新聞主播侯佩岑同遊東京互動親暱的照片[14]。之後周杰倫在記者會上承認追求侯佩岑，同時否認過去與蔡依林的戀情傳聞[15]。後續記者採訪朋友張洛君與蔡依林父親則表示兩人在一起過但早已分手[16][17]。但在2006年中與侯佩岑雙雙否認曾在一起[18][19]。而蔡依林則於2010年接受陶晶瑩的專訪時，才坦承當年經由媒體接獲周侯戀的消息後，曾恨了周杰倫一年，直到2008年才漸漸釋懷。[20]@县长马邦德`,
            cuedMemberInfoArr: [{ memberId: 'M1234ABCD', nickname: '县长马邦德' }],
            status: 200,

            totalLikedCount: 126,
            totalDislikedCount: 1,
            totalSubcommentCount: 2,

        },
        {
            commentId: 'C12345ABCDG',
            parentId: 'P4CD624HHS',
            postId: 'P4CD624HHS',
            memberId: 'M1234ABCE',
            nickname: '林北',
            avatarImageUrl: '',
            createdTimeBySecond: 1673485052,
            content: `曾愷玹（英語：Alice Tzeng Kai-Syuan），台灣女演員、作家、藝術工作者。因飾演電影《不能說的秘密》晴依一角而入圍金馬獎最佳女配角廣受矚目。 `,
            cuedMemberInfoArr: [{ memberId: 'M1234ABCD', nickname: '县长马邦德' }],
            status: 200,

            totalLikedCount: 3,
            totalDislikedCount: 1,
            totalSubcommentCount: 0,

        },

    ]);
    return;

   

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
        // #1 look up document (of IPostComprehensive) in [C] postComprehensive
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
            // #1 look up document (of ICommentComprehensive) in [C] commentComprehensive
            const commentComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<ICommentComprehensive>('comment');
            const commentComprehensiveQueryResult = await commentComprehensiveCollectionClient.findOne({ commentId: parentId });
            if (null === commentComprehensiveQueryResult) {
                res.status(404).send('Comment not found');
                await atlasDbClient.close();
                return;
            }
        }
        // #2 look up documents (of ICommentComprehensive) in [C] commentComprehensive
        const commentsArray = [];
        const commentComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<ICommentComprehensive>('comment');
        const commentComprehensiveQuery = commentComprehensiveCollectionClient.find({ parentId });
        let commentComprehensiveQueryResult = await commentComprehensiveQuery.next();
        while (null !== commentComprehensiveQueryResult) {
            commentsArray.push(getRestrictedFromCommentComprehensive(commentComprehensiveQueryResult));
        }
        res.status(200).send(commentsArray);
        await atlasDbClient.close();
        return;
    } catch (e: any) {
        let msg: string;
        if (e instanceof MongoError) {
            msg = `Attempt to communicate with atlas mongodb.`;
        } else {
            msg = `Uncategorized. ${e?.msg}`;
        }
        if (!res.headersSent) {
            response500(res, msg);
        }
        logWithDate(msg, fname, e);
        await atlasDbClient.close();
        return;
    }
}