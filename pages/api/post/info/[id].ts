import type { NextApiRequest, NextApiResponse } from 'next';
import { PostInfo } from '../../../../lib/types';
import { response405, response500 } from '../../../../lib/utils';

export default async function Index(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;
    if ('GET' !== method) {
        response405(req, res);
        return;
    }
    try {
        const { id } = req.query;
        // Step #1 verify post id
        if ('string' !== typeof id) {
            res.status(400).send('Improper post id');
            return;
        }
        const info: PostInfo = {
            id,
            memberId: '1',
            timeStamp: '2022-11-22T23:22:13.9762448Z',
            title: '在Mojito上发的WebMasterの第一篇（测试）帖子',
            content: '问下大家，在 function 里定义的 type 和在 function 外定义有区别嘛？ Typescript 这里的 function 是 function component ，是在写前端时遇到的疑惑，感谢！我能想到的就只有作用域的区别了。',
            contentParagraphsArray: [
                '问下大家，在 function 里定义的 type 和在 function 外定义有区别嘛？',
                'Typescript 这里的 function 是 function component ',
                '在写前端时遇到的疑惑，感谢！我能想到的就只有作用域的区别了。',
            ],
            imageUrlList: [
                
                'https://images.unsplash.com/photo-1553095066-5014bc7b7f2d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1171&q=80',
                'https://images.pexels.com/photos/259915/pexels-photo-259915.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
                // 'https://i.imgur.com/NeY9Bah.jpeg'
            ],
            channelId: 'work',
            topicList: [
                {
                    id: '1vakw6fe998',
                    channelId:'work',
                    name: 'Typescript',
                },
                {
                    id: 'iefx61n10y',
                    channelId:'work',
                    name: '测试',
                },
                {
                    id: '757wp7wg36',
                    channelId:'work',
                    name: '前端',
                },
            ],
            viewedTimes: 99,
            likedTimes: 3,
            dislikedTimes: 1,
            savedTimes: 2,
            commentNumber: 5
        }
        res.send(info);
    } catch (e) {
        response500(res, `Was trying . ${e}`);
        return;
    }
}