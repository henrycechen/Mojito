import * as React from 'react';

import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { useSession } from 'next-auth/react'

import IconButton from '@mui/material/IconButton';

import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import StarIcon from '@mui/icons-material/Star';
import ReplyIcon from '@mui/icons-material/Reply';
import MoreVertIcon from '@mui/icons-material/MoreVert';


import { ResponsiveCard, CenterlizedBox, TextButton } from '../../ui/Styled';

import Popover from '@mui/material/Popover';
import Backdrop from '@mui/material/Backdrop';

import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper";
import "swiper/css";
import "swiper/css/pagination";

import Navbar from '../../ui/Navbar';

import { IAttitideMapping, IRestrictedCommentComprehensive, IRestrictedCommentComprehensiveWithMemberInfo, IConcisePostComprehensive, IProcessStates } from '../../lib/interfaces';
import { LangConfigs } from '../../lib/types';
import { fakeChannel, fakeRestrictedPostComprehensive, getNicknameBrief, getRandomHexStr, provideCuedMemberInfoArray, restoreFromLocalStorage, timeToString, updateLocalStorage, verifyId, verifyUrl } from '../../lib/utils';

import { IConciseMemberInfo, IConciseMemberStatistics } from '../../lib/interfaces/member';
import { IRestrictedPostComprehensive } from '../../lib/interfaces/post';
import { IChannelInfo } from '../../lib/interfaces/channel';



import Divider from '@mui/material/Divider';
import Container from '@mui/material/Container';


import Chip from '@mui/material/Chip';

import { NextPageContext } from 'next/types';
import { useRouter } from 'next/router';
import { Awaitable } from 'next-auth';
import Copyright from '../../ui/Copyright';
import Link from '@mui/material/Link';
import MemberInfoById from '../api/member/info/[memberId]';
import Tooltip from '@mui/material/Tooltip';
import { Alert } from '@mui/material';
import { fakeConciseMemberInfo, fakeConciseMemberStatistics, provideAvatarImageUrl } from '../../lib/utils/for/member';

const storageName0 = 'PreferenceStates';
const updatePreferenceStatesCache = updateLocalStorage(storageName0);
const restorePreferenceStatesFromCache = restoreFromLocalStorage(storageName0);

type TPostPageProps = {
    restrictedPostComprehensive_ss: IRestrictedPostComprehensive;
    channelInfo_ss: IChannelInfo;
    authorInfo_ss: IConciseMemberInfo;
    authorStatistics_ss: IConciseMemberStatistics;
    redirect404: boolean;
}

type TEditorStates = {
    parentId: string;
    memberId: string;
    nickname: string;
    content: string;
    cuedMemberInfoDict: { [memberId: string]: IConciseMemberInfo };
    alertContent: string;
    displayAlert: boolean;
    displayCueHelper: boolean;
    displayNoFollowedMemberAlert: boolean;
}

type TViewerInfoStates = {
    followedMemberInfoArr: IConciseMemberInfo[]
}

type TConciseMemberStatistics = {
    totalCreationCount: number;
    totalCreationLikedCount: number;
    totalFollowedByCount: number;
}

interface IPostPageProcessStates extends IProcessStates {
    lang: string;
    displayEditor: boolean;
    editorEnchorElement: any;
    displayBackdrop: boolean;
    backdropOnDisplayImageUrl: string | undefined;
}

type MemberBehaviourStates = {
    attitudeOnPost: number;
    attitudeOnComment: { [commentId: string]: number };
    saved: boolean;
    followed: boolean;
}

type TRestrictedCommentComprehensiveWithMemberInfoDict = {
    [commentId: string]: IRestrictedCommentComprehensiveWithMemberInfo;
}

const domain = process.env.NEXT_PUBLIC_APP_DOMAIN;
const defaultLang = process.env.NEXT_PUBLIC_APP_LANG ?? 'tw';
const langConfigs: LangConfigs = {
    title: {
        tw: '撰寫新主題帖',
        cn: '撰写新主题帖',
        en: 'Create a new post'
    },
    editPost: {
        tw: '編輯帖',
        cn: '编辑帖',
        en: 'Edit post'
    },
    createComment: {
        tw: '撰寫評論',
        cn: '撰写评论',
        en: 'Comment on this post'
    },
    editorPlaceholder: {
        tw: (parentId: string, nickname: string) => 'P' === parentId.slice(0, 1) ? `評論@${nickname}的主題帖` : `回復@${nickname}的評論`,
        cn: (parentId: string, nickname: string) => 'P' === parentId.slice(0, 1) ? `评论@${nickname}的主题帖` : `回复@${nickname}的评论`,
        en: (parentId: string, nickname: string) => 'P' === parentId.slice(0, 1) ? `Comment on this post` : `Reply to @${nickname}`,
    },
    noFollowedMember: {
        tw: '您還未曾關注其他會員哦',
        cn: '您还没有关注其他会员',
        en: 'You have not followed any member'
    },
    replyToComment: {
        tw: (nickname: string) => `撰寫評論回復@${nickname}`,
        cn: (nickname: string) => `撰写评论回复@${nickname}`,
        en: (nickname: string) => `Create comment and reply to @${nickname}`
    },
    follow: {
        tw: '關注',
        cn: '关注',
        en: 'Follow'
    },
    followed: {
        tw: '已關注',
        cn: '已关注',
        en: 'Followed'
    },
    undoFollow: {
        tw: '取消關注',
        cn: '取消关注',
        en: 'Undo Follow'
    },
    defaultNickname: {
        tw: '作者',
        cn: '作者',
        en: 'Post author'
    },
    hotPostRecommend: {
        tw: '的热门帖子',
        cn: '的热门帖子',
        en: ''
    },
    expendSubcomments: {
        tw: '展開討論',
        cn: '展开讨论',
        en: 'Expend subcomments'
    },
    undoExpendSubcomments: {
        tw: '摺叠討論',
        cn: '折叠讨论',
        en: 'Undo expend subcomments'
    },
    submitComment: {
        tw: '發表評論',
        cn: '发布评论',
        en: 'Submit'
    },
    emptyCommentAlert: {
        tw: '評論不能為空哦',
        cn: '评论不能为空哦',
        en: 'Can not submit an empty comment'
    },
    createCommentFailAlert: {
        tw: '發表評論未能成功，請再嘗試一下',
        cn: '评论发布失败，请再尝试一下',
        en: 'Fail to submit comment, please try again'
    },
    creations: {
        tw: '創作',
        cn: '发帖',
        en: 'creations',
    },
    followedBy: {
        tw: '關注',
        cn: '粉丝',
        en: 'followed',
    },
    liked: {
        tw: '喜歡',
        cn: '喜欢',
        en: 'liked',
    },
    viewed: {
        tw: '瀏覽',
        cn: '浏览',
        en: 'viewed',
    }
}

//// get multiple info server-side ////
export async function getServerSideProps(context: NextPageContext): Promise<{ props: TPostPageProps }> {
    const { id } = context.query;
    const { isValid, category } = verifyId(id);
    // Verify post id
    if (!(isValid && 'post' === category)) {
        return {
            props: {
                restrictedPostComprehensive_ss: fakeRestrictedPostComprehensive(),
                channelInfo_ss: fakeChannel(),
                authorInfo_ss: fakeConciseMemberInfo(),
                authorStatistics_ss: fakeConciseMemberStatistics(),
                redirect404: true
            }
        }
    }
    // GET restricted post comprehensive
    const restrictedPostComprehensive_resp = await fetch(`${domain}/api/post/rc/${id}`);
    if (200 !== restrictedPostComprehensive_resp.status) {
        throw new Error('Attempt to GET restricted post comprehensive');
    }
    const restrictedPostComprehensive_ss = await restrictedPostComprehensive_resp.json();
    // GET channel info by id
    const channelInfo_resp = await fetch(`${domain}/api/channel/info/by/id/${restrictedPostComprehensive_ss.channelId}`);
    if (200 !== channelInfo_resp.status) {
        throw new Error('Attempt to GET channel info by id');
    }
    const channelInfo_ss = await channelInfo_resp.json();
    // GET author info by id
    const authorInfo_resp = await fetch(`${domain}/api/member/info/${restrictedPostComprehensive_ss.memberId}`);
    if (200 !== authorInfo_resp.status) {
        throw new Error('Attempt to GET member (author) info');
    }
    const authorInfo_ss = await authorInfo_resp.json();
    const authorStatistics_resp = await fetch(`${domain}/api/member/statistics/${restrictedPostComprehensive_ss.memberId}`);
    if (200 !== authorStatistics_resp.status) {
        throw new Error('Attempt to GET member statistics');
    }
    const authorStatistics_ss = await authorStatistics_resp.json()
    // GET author statistics by id
    return {
        props: {
            restrictedPostComprehensive_ss,
            channelInfo_ss,
            authorInfo_ss,
            authorStatistics_ss, // FIXME: have not been used in context
            redirect404: false
        }
    }
}


const Post = ({ restrictedPostComprehensive_ss, channelInfo_ss, authorInfo_ss, authorStatistics_ss, redirect404 }: TPostPageProps) => {

    const router = useRouter();
    React.useEffect(() => {
        if (redirect404) {
            router.push('/404');
        }
    }, [])

    const { data: session, status } = useSession();
    // status - 'unauthenticated' / 'authenticated'

    //////// INFO - viewer //////// (conditional.)
    let viewerId = '';
    if ('authenticated' === status) {
        const viewerSession: any = { ...session };
        viewerId = viewerSession?.user?.id;
    }

    //////// INFO - post ////////
    const {
        postId,
        memberId: authorId,
        createdTimeBySecond,
        title,
        imageUrlsArr,
        paragraphsArr,
        cuedMemberInfoArr,
        // channelId,
        topicIdsArr,
        pinnedCommentId,
        status: postStatus,
        editedTime,
    } = restrictedPostComprehensive_ss;

    //////// INFO - post author ////////
    const {
        nickname,
    } = authorInfo_ss;

    //////// STATES - preference ////////
    const [preferenceStates, setPreferenceStates] = React.useState<any>({
        lang: defaultLang,
        mode: 'light'
    })
    React.useEffect(() => { restorePreferenceStatesFromCache(setPreferenceStates) }, [])


    //////// STATES - swipper (dimensions) ////////
    const [swiperWrapperHeight, setSwiperWrapperHeight] = React.useState(1);
    // Logic:
    // swiperWrapperHeight is designed for adjust Box (swiperslide wrapper) height
    // Initial value set to 1 leads to Box-height having been set to 100% on initializing
    // If there is ultra-high photo in the swiperslide array
    // Then adujust all the Box-height to the swiper (top-level) wrapper height
    // Which makes all the photo aligned center (horizontally)

    React.useEffect(() => {
        const wrapper: HTMLElement | null = document.getElementById('image-swiper-wrapper');
        setSwiperWrapperHeight(wrapper?.offsetHeight ?? 1);
    }, [])

    //////// STATES - process ////////
    const [processStates, setProcessStates] = React.useState<IPostPageProcessStates>({
        lang: defaultLang,
        displayEditor: false,
        displayBackdrop: false,
        backdropOnDisplayImageUrl: undefined,
        editorEnchorElement: null
    });

    const handleBackdropOpen = (imageUrl: string) => (event: React.MouseEvent) => {
        setProcessStates({ ...processStates, displayBackdrop: true, backdropOnDisplayImageUrl: imageUrl });
    };

    const handleBackdropClose = () => {
        setProcessStates({ ...processStates, displayBackdrop: false, backdropOnDisplayImageUrl: undefined });
    };

    //////// STATES - editor ////////
    const [editorStates, setEditorStates] = React.useState<TEditorStates>({
        parentId: '',
        memberId: '',
        nickname: '',
        content: '',
        cuedMemberInfoDict: {},
        alertContent: '',
        displayAlert: false,
        displayCueHelper: false,
        displayNoFollowedMemberAlert: false,
    });

    const handleEditorOpen = (parentId: string, memberId: string, nickname: string) => (event: React.MouseEvent<any>) => {
        // if ('authenticated' !== status) {
        //     router.push(`/signin`);
        //     return;
        // }
        if (editorStates.parentId !== parentId) {
            setEditorStates({ ...editorStates, parentId, memberId, nickname, content: '' });
        }
        setProcessStates({ ...processStates, alertContent: langConfigs.emptyCommentAlert[preferenceStates.lang], displayEditor: true });
    }

    const handleEditorInput = (event: React.ChangeEvent<HTMLInputElement>) => {
        setEditorStates({ ...editorStates, content: event.target.value });
    }

    const handleEditorClose = () => {
        setProcessStates({ ...processStates, displayEditor: false })
    }

    const handleCueHelperOpenAndClose = () => {
        if ('authenticated' === status) { }
        if (0 !== viewerInfoStates.followedMemberInfoArr.length) {
            setEditorStates({ ...editorStates, displayCueHelper: !editorStates.displayCueHelper, displayNoFollowedMemberAlert: false });
        } else {
            setEditorStates({ ...editorStates, displayCueHelper: !editorStates.displayCueHelper, displayNoFollowedMemberAlert: true });
        }
    }

    const handleCue = (memberInfo: IConciseMemberInfo) => (event: React.MouseEvent<HTMLButtonElement>) => {
        if (editorStates.cuedMemberInfoDict.hasOwnProperty(memberInfo.memberId)) {
            const update = { ...editorStates.cuedMemberInfoDict };
            delete update[memberInfo.memberId];
            const content = editorStates.content.split(`@${memberInfo.nickname}`).join('');
            setEditorStates({
                ...editorStates,
                content: content,
                cuedMemberInfoDict: { ...update }
            })
            return;
        } else {
            setEditorStates({
                ...editorStates,
                content: `${editorStates.content}@${memberInfo.nickname}`,
                cuedMemberInfoDict: {
                    ...editorStates.cuedMemberInfoDict,
                    [memberInfo.memberId]: memberInfo
                }
            })
        }
    }

    const handleSubmitComment = async () => {
        if ('' === editorStates.content) {
            setEditorStates({ ...editorStates, displayAlert: true });
            return;
        } else {
            setEditorStates({ ...editorStates, displayAlert: false });
        }
        const resp = await fetch(`/api/comment/on/${editorStates.parentId}`, {
            method: 'POST',
            body: JSON.stringify({
                postId,
                content: editorStates.content,
                cuedMemberInfoArr: provideCuedMemberInfoArray(editorStates.cuedMemberInfoDict)
            })
        });
        if (200 === resp.status) {
            const { parentId, content, cuedMemberInfoDict } = editorStates;
            try {
                const commentId: string = await resp.text();
                const update: IRestrictedCommentComprehensiveWithMemberInfo = {
                    commentId,
                    postId,
                    memberId: viewerId,
                    nickname: '未登录',
                    avatarImageUrl: '',
                    createdTime: new Date().getTime(),
                    content,
                    cuedMemberInfoArr: provideCuedMemberInfoArray(cuedMemberInfoDict),
                    status: 200,
                    totalLikedCount: 0,
                    totalDislikedCount: 0,
                    totalSubcommentCount: 0
                }
                if (postId === parentId) {
                    setRestrictedCommentComprehensiveWithMemberInfoDict({
                        ...restrictedCommentComprehensiveWithMemberInfoDict,
                        [commentId]: update
                    });
                } else {
                    setRestrictedCommentComprehensiveWithMemberInfoDict({
                        ...restrictedCommentComprehensiveWithMemberInfoDict,
                        [parentId]: {
                            ...restrictedCommentComprehensiveWithMemberInfoDict[parentId],
                            totalSubcommentCount: restrictedCommentComprehensiveWithMemberInfoDict[parentId].totalSubcommentCount + 1
                        }
                    });
                    setRestrictedSubcommentComprehensiveDict({
                        ...restrictedSubcommentComprehensiveDict,
                        [parentId]: {
                            ...restrictedSubcommentComprehensiveDict[parentId],
                            [commentId]: update
                        }
                    })
                }
                setEditorStates({ ...editorStates, parentId: '', memberId: '', nickname: '', content: '', cuedMemberInfoDict: {}, alertContent: '' });
                setProcessStates({ ...processStates, displayEditor: false });
            } catch (e) {
                console.log(`Attempt to create comment on ${parentId}. ${e}`);
            }
        } else {
            setProcessStates({ ...processStates, alertContent: langConfigs.emptyCommentAlert[preferenceStates.lang], displayEditor: true });
        }
    }

    //////// STATES - viewer info //////// TODO:
    const [viewerInfoStates, setViewerInfoStates] = React.useState<TViewerInfoStates>({
        followedMemberInfoArr: []
        // blockedMemberInfoArr TODO:
    });

    React.useEffect(() => {
        if ('authenticated' === status) {
        }
        updateViewerInfoStates();
    }, []);

    const updateViewerInfoStates = async () => {
        // get followed member info
        const resp = await fetch(`/api/member/followedbyme/${'viewerId'}`);
        if (200 === resp.status) {
            try {
                const memberInfoArr = await resp.json();
                setViewerInfoStates({
                    ...viewerInfoStates,
                    followedMemberInfoArr: [...memberInfoArr]
                });
            } catch (e) {
                console.log(`Attempt to GET following restricted member info array. ${e}`);
            }
        }
    }

    //////// STATES - post statistics ////////
    const [postStatisticsState, setPostStatisticsState] = React.useState<TPostStatistics>({
        totalHitCount: restrictedPostComprehensive_ss.totalHitCount,
        totalLikedCount: restrictedPostComprehensive_ss.totalLikedCount,
        totalDislikedCount: restrictedPostComprehensive_ss.totalDislikedCount,
        totalCommentCount: restrictedPostComprehensive_ss.totalCommentCount,
        totalSavedCount: restrictedPostComprehensive_ss.totalSavedCount
    });

    //////// STATES - author statistics ////////
    const [authorStatisticsState, setAuthorStatisticsState] = React.useState<TConciseMemberStatistics>({
        totalCreationCount: 0,
        totalCreationLikedCount: 0,
        totalFollowedByCount: 0,
    });

    React.useEffect(() => {
        updateAuthorStatistics();
    }, []);

    const updateAuthorStatistics = async () => {
        // get followed member info
        const resp = await fetch(`/api/member/statistics/${'viewerId'}`);
        if (200 === resp.status) {
            try {
                const statistics = await resp.json();
                setAuthorStatisticsState({ ...statistics });
            } catch (e) {
                console.log(`Attempt to GET member (author) statistics. ${e}`);
            }
        }
    }


    //////// STATES - concise creations info (of author) array  ////////
    const [conciseCreationInfoArrState, setConciseCreationInfoArrState] = React.useState<IConcisePostComprehensive[]>([]);

    React.useEffect(() => { updateCreationArr() }, []);

    const updateCreationArr = async () => {
        const resp = await fetch(`/api/creation/s/of/${authorId}`);
        if (200 === resp.status) {
            try {
                const infoArr = await resp.json();
                setConciseCreationInfoArrState([...infoArr]);
            } catch (e) {
                console.log(`Attempt to GET hot creations of ${authorId}. ${e}`);
            }
        }
    }

    const handleRedirectToPost = (postId: string) => (event: React.MouseEvent<any>) => {
        router.push(`/post/${postId}`);
    }

    //////// STATES - member behaviour ////////
    const [behaviourStates, setBehaviourStates] = React.useState<MemberBehaviourStates>({
        attitudeOnPost: 0,
        attitudeOnComment: {},
        saved: false,
        followed: false
    });

    React.useEffect(() => {
        initializeBehaviourStates();
    }, [])

    const initializeBehaviourStates = async () => {
        let attitudeOnPost = 0;
        let attitudeOnComment: { [commentId: string]: number } = {};
        let saved = false;
        let followed = false;
        try {
            //// GET attitude mapping ////
            const attitudeMapping = await fetch(`/api/attitude/on/${'P1234ABCD'}`).then(resp => resp.json());
            if (null !== attitudeMapping) {
                if (attitudeMapping.hasOwnProperty('attitude')) {
                    attitudeOnPost = attitudeMapping.attitude
                    // setPostStatisticsState({ ...postStatisticsState, totalLikedCount: postStatisticsState.totalLikedCount + attitudeMapping.attitude })
                }
                if (attitudeMapping.hasOwnProperty('commentAttitudeMapping') && 0 !== Object.keys(attitudeMapping.commentAttitudeMapping).length) {
                    Object.keys(attitudeMapping.commentAttitudeMapping).forEach(commentId => {
                        attitudeOnComment[commentId] = attitudeMapping.commentAttitudeMapping[commentId];
                    });
                }
            }
            if ('authenticated' === status) {
                //// VERIFY if saved ////
                const resp_saved = await fetch(`/api/save/${postId}`);
                if (200 === resp_saved.status) {
                    try {
                        saved = await resp_saved.json();
                    } catch (e) {
                        console.log(`Attemp to verify if saved post`);
                    }
                }
                //// VERIFY if followed ////
                const resp_followed = await fetch(`/api/follow/${authorId}`);
                if (200 === resp_followed.status) {
                    try {
                        followed = await resp_followed.json();
                    } catch (e) {
                        console.log(`Attemp to verify if followed post author`);
                    }
                }
            }
            setBehaviourStates({
                ...behaviourStates,
                attitudeOnPost,
                attitudeOnComment: { ...attitudeOnComment },
                saved: !!saved,
                followed: !!followed
            });
        } catch (e) {
            console.log(`Attempt to initialize behaviour STATES`);
        }
    }

    //////// Handle member behaviours ////////
    const handleExpressAttitudeOnPost = (attitude: number) => (event: React.MouseEvent<any>) => {
        if ('authenticated' !== status) {
            router.push(`/signin`);
            return;
        }
        if (behaviourStates.attitudeOnPost === attitude) {
            setBehaviourStates({ ...behaviourStates, attitudeOnPost: 0 });
        } else {
            setBehaviourStates({ ...behaviourStates, attitudeOnPost: attitude });
        }

    }

    const handleSave = () => {
        if ('authenticated' !== status) {
            router.push(`/signin`);
            return;
        }
        setBehaviourStates({ ...behaviourStates, saved: !behaviourStates.saved });
    }

    const handleFollow = (event: React.MouseEvent<any>) => {
        setBehaviourStates({ ...behaviourStates, followed: !behaviourStates.followed });
    }

    //////// STATES - restricted comment comprehensive with member info dictionary ////////
    const [restrictedCommentComprehensiveWithMemberInfoDict, setRestrictedCommentComprehensiveWithMemberInfoDict] = React.useState<TRestrictedCommentComprehensiveWithMemberInfoDict>({});

    React.useEffect(() => {
        updateRestrictedCommentComprehensiveWithMemberInfoDict();
    }, []);

    const updateRestrictedCommentComprehensiveWithMemberInfoDict = async () => {
        const restrictedCommentComprehensiveArr = await fetch(`/api/comment/s/of/${'P1234ABCD'}`).then(resp => resp.json());
        const update: TRestrictedCommentComprehensiveWithMemberInfoDict = {};
        if (Array.isArray(restrictedCommentComprehensiveArr)) {
            restrictedCommentComprehensiveArr.forEach(restrictedCommentComprehensive => {
                update[restrictedCommentComprehensive.commentId] = {
                    ...restrictedCommentComprehensive,
                    isExpended: false
                };
            });
        }
        setRestrictedCommentComprehensiveWithMemberInfoDict({
            ...restrictedCommentComprehensiveWithMemberInfoDict,
            ...update
        });
    }

    const handleExpressAttitudeOnComment = (commentId: string, attitude: number) => (event: React.MouseEvent<any>) => {
        //// FIXME: test
        // if ('authenticated' !== status) {
        //     router.push(`/signin`);
        //     return;
        // }
        let stateUpdate = 0;
        let dictionaryUpdate = 0;
        if (behaviourStates.attitudeOnComment[commentId] === attitude) {
            stateUpdate = 0;
            dictionaryUpdate = 0 - attitude;
        } else if (1 === Math.abs(behaviourStates.attitudeOnComment[commentId])) {
            stateUpdate = attitude;
            dictionaryUpdate = attitude * 2;
        } else {
            stateUpdate = attitude;
            dictionaryUpdate = attitude;
        }
        setBehaviourStates({ ...behaviourStates, attitudeOnComment: { ...behaviourStates.attitudeOnComment, [commentId]: stateUpdate } });
        setRestrictedCommentComprehensiveWithMemberInfoDict({
            ...restrictedCommentComprehensiveWithMemberInfoDict,
            [commentId]: {
                ...restrictedCommentComprehensiveWithMemberInfoDict[commentId],
                totalLikedCount: restrictedCommentComprehensiveWithMemberInfoDict[commentId].totalLikedCount + dictionaryUpdate
            }
        });
    }

    const handleEditPost = () => {
        router.push(`/me/editpost/${postId}`);
    }

    const handleUndoExpendSubcomments = (commentId: string) => (event: React.MouseEvent<any>) => {
        setRestrictedCommentComprehensiveWithMemberInfoDict({
            ...restrictedCommentComprehensiveWithMemberInfoDict, [commentId]: {
                ...restrictedCommentComprehensiveWithMemberInfoDict[commentId],
                isExpended: !restrictedCommentComprehensiveWithMemberInfoDict[commentId].isExpended
            }
        })
    }

    const handleExpendSubcomments = async (commentId: string) => {
        setRestrictedCommentComprehensiveWithMemberInfoDict({
            ...restrictedCommentComprehensiveWithMemberInfoDict, [commentId]: {
                ...restrictedCommentComprehensiveWithMemberInfoDict[commentId],
                isExpended: !restrictedCommentComprehensiveWithMemberInfoDict[commentId].isExpended
            }
        })
        if (!restrictedSubcommentComprehensiveDict.hasOwnProperty(commentId)) {
            const resp = await fetch(`/api/comment/s/of/${commentId}`);
            if (200 === resp.status) {
                try {
                    const subcommentArr = await resp.json();
                    const update: { [key: string]: IRestrictedCommentComprehensiveWithMemberInfo } = {};
                    if (Array.isArray(subcommentArr)) {
                        subcommentArr.forEach(comment => {
                            update[comment.commentId] = { ...comment };
                        });
                    }
                    setRestrictedSubcommentComprehensiveDict({
                        ...restrictedSubcommentComprehensiveDict,
                        [commentId]: { ...update }
                    })
                } catch (e) {
                    console.log(`Attempt to GET subcomments of ${commentId}. ${e}`);
                }
            }
        }
    }

    //////// STATES - restricted (sub)comment comprehensive dictionary STATES ////////
    const [restrictedSubcommentComprehensiveDict, setRestrictedSubcommentComprehensiveDict] = React.useState<any>({});

    const handleExpressAttitudeOnSubcomment = (parentId: string, commentId: string, attitude: number) => (event: React.MouseEvent<any>) => {
        const prev = restrictedSubcommentComprehensiveDict[parentId]; // previous STATES of subcomments of the given parent id
        if (behaviourStates.attitudeOnComment[commentId] === attitude) {
            setBehaviourStates({ ...behaviourStates, attitudeOnComment: { ...behaviourStates.attitudeOnComment, [commentId]: 0 } });
            setRestrictedSubcommentComprehensiveDict({
                ...restrictedSubcommentComprehensiveDict,
                [parentId]: {
                    ...prev,
                    [commentId]: {
                        ...prev[commentId],
                        totalLikedCount: prev[commentId].totalLikedCount - attitude
                    }
                }
            });
        } else if (1 === Math.abs(behaviourStates.attitudeOnComment[commentId])) {
            setBehaviourStates({ ...behaviourStates, attitudeOnComment: { ...behaviourStates.attitudeOnComment, [commentId]: attitude } });
            setRestrictedSubcommentComprehensiveDict({
                ...restrictedSubcommentComprehensiveDict,
                [parentId]: {
                    ...prev,
                    [commentId]: {
                        ...prev[commentId],
                        totalLikedCount: prev[commentId].totalLikedCount + attitude * 2
                    }
                }
            });
        } else {
            setBehaviourStates({ ...behaviourStates, attitudeOnComment: { ...behaviourStates.attitudeOnComment, [commentId]: attitude } });
            setRestrictedSubcommentComprehensiveDict({
                ...restrictedSubcommentComprehensiveDict,
                [parentId]: {
                    ...prev,
                    [commentId]: {
                        ...prev[commentId],
                        ...prev[commentId],
                        totalLikedCount: prev[commentId].totalLikedCount + attitude
                    }
                }
            });
        }
    }

    //// utils
    const makeParagraph = (paragraph: string, cuedMemberInfoArr: IConciseMemberInfo[]) => {
        if (0 === cuedMemberInfoArr.length) {
            return (
                <Typography variant={'body1'} mt={1} key={getRandomHexStr()}>{paragraph}</Typography>
            )
        }
        if (!(0 !== paragraph.length && -1 !== paragraph.indexOf('@'))) {
            return (<Typography variant={'body1'} mt={1} key={getRandomHexStr()}>{paragraph}</Typography>)
        }
        const elementArr: { text: string, type: string, memberId?: string }[] = [];
        paragraph.split('@').forEach(fragment => {
            let idx = -1;
            for (let i = 0; i < cuedMemberInfoArr.length; i++) {
                const { memberId, nickname } = cuedMemberInfoArr[i];
                idx = fragment.indexOf(nickname);
                if (-1 !== idx) {
                    elementArr.push({
                        type: 'link',
                        text: `@${nickname}`,
                        memberId
                    })
                    elementArr.push({
                        type: 'text',
                        text: fragment.split(nickname)[1]
                    })
                    return;
                }
            }
            if (-1 === idx) {
                elementArr.push({
                    type: 'text',
                    text: fragment
                })
            }
        })
        return (
            <Typography variant={'body1'} mt={1} key={getRandomHexStr()}>{
                elementArr.map(element => {
                    if ('text' === element.type) {
                        return element.text
                    }
                    if ('link' === element.type) {
                        return (
                            <Link href={`/me/${element?.memberId}`} underline={'none'} key={getRandomHexStr()} >
                                {element.text}
                            </Link>
                        )
                    }
                })
            }</Typography>
        )
    }

    const makeTopic = (topicId: string) => {
        return (
            <Link href={`/query/${topicId}`} underline={'none'} key={getRandomHexStr()} >
                #{Buffer.from(topicId, 'base64').toString()}
            </Link>
        )
    }

    return (
        <>
            <Navbar />
            {/* post component */}
            <Container disableGutters >
                <Grid container >

                    {/* //// placeholder - left //// */}
                    <Grid item xs={0} sm={1} md={1} />

                    {/* //// middle column //// */}
                    <Grid item xs={12} sm={10} md={7} >

                        {/* middle card-stack */}
                        <Stack maxWidth={800} spacing={{ xs: 1, sm: 2 }}>

                            {/* the post */}
                            <ResponsiveCard sx={{ padding: { sm: 4 }, boxShadow: { sm: 1 } }}>

                                {/* post-title: desktop style */}
                                <Box display={{ xs: 'none', sm: 'block' }}>

                                    {/* channel name */}
                                    <Typography variant={'subtitle1'} fontWeight={400} color={'grey'}>{channelInfo_ss.name[preferenceStates.lang]}</Typography>

                                    {/* title */}
                                    <Typography variant={'h6'} fontWeight={700}>{title}</Typography>

                                    {/* member info & timestamp */}
                                    <TextButton color='inherit' sx={{ flexDirection: 'row', marginTop: 1 }}>
                                        <Typography variant='body2'>{`${nickname} ${timeToString(createdTimeBySecond, preferenceStates.lang)}`}</Typography>
                                    </TextButton>
                                </Box>

                                {/* post-title: mobile style */}
                                <Stack mt={0.5} direction={'row'} sx={{ display: { xs: 'flex', sm: 'none' } }}>
                                    <IconButton sx={{ padding: 0 }}>
                                        <Avatar src={provideAvatarImageUrl(authorId, domain)} sx={{ width: 38, height: 38, bgcolor: 'grey' }}>{nickname?.charAt(0).toUpperCase()}</Avatar>
                                    </IconButton>
                                    <Grid container ml={1}>

                                        {/* nickname and created time */}
                                        <Grid item >
                                            <TextButton color='inherit'>
                                                <Typography variant='body2' >
                                                    {nickname}
                                                </Typography>
                                                <Typography variant='body2' fontSize={{ xs: 12 }} >
                                                    {timeToString(createdTimeBySecond, preferenceStates.lang)}
                                                </Typography>
                                            </TextButton>
                                        </Grid>

                                        {/* placeholder */}
                                        <Grid item flexGrow={1}></Grid>

                                        {/* follow button */}
                                        <Grid item>
                                            <Chip label={behaviourStates.followed ? langConfigs.followed[preferenceStates.lang] : langConfigs.follow[preferenceStates.lang]} sx={{ paddingX: 1 }} color={behaviourStates.followed ? 'default' : 'primary'} onClick={handleFollow} />
                                        </Grid>
                                    </Grid>
                                </Stack>

                                {/* image list (conditional rendering)*/}
                                {true && <Box id='image-swiper-wrapper' mt={{ xs: 1.5, sm: 2 }} >
                                    <Swiper modules={[Pagination]} pagination={true} >
                                        {imageUrlsArr && imageUrlsArr.map(imgUrl =>
                                            <SwiperSlide key={getRandomHexStr()} onClick={handleBackdropOpen(imgUrl)}>
                                                {/* swiper slide wrapper */}
                                                <Box sx={{ display: 'flex', justifyContent: 'center', alignContent: 'center', height: swiperWrapperHeight }} >
                                                    <Box component={'img'} src={imgUrl} maxWidth={1} maxHeight={500} sx={{ objectFit: 'contain' }}></Box>
                                                </Box>
                                            </SwiperSlide>
                                        )}
                                    </Swiper>
                                </Box>}

                                {/* title */}
                                <Box mt={2} display={{ xs: 'flex', sm: 'none' }}>
                                    <Typography variant={'subtitle1'} fontWeight={700}>{title}</Typography>
                                </Box>

                                {/* paragraphs (conditional rendering)*/}
                                {0 !== paragraphsArr?.length && <Box mt={{ xs: 1, sm: 2 }}>
                                    {paragraphsArr.map(p => makeParagraph(p, cuedMemberInfoArr))}
                                </Box>}

                                {/* topics (conditional rendering) */}
                                {0 !== topicIdsArr?.length && <Box mt={{ xs: 2, sm: 2 }}>
                                    <Typography variant={'body1'}>
                                        {topicIdsArr.map(topicId => makeTopic(topicId))}
                                    </Typography>
                                </Box>}

                                {/* member behaviours */}
                                <Grid container mt={1}>

                                    {/* like */}
                                    <Grid item sx={{ display: 'flex', flexDirection: 'row' }}>
                                        <IconButton aria-label='like' onClick={handleExpressAttitudeOnPost(1)}>
                                            <ThumbUpIcon color={1 === behaviourStates.attitudeOnPost ? 'primary' : 'inherit'} fontSize='small' />
                                        </IconButton>
                                        <Typography variant='body2' sx={{ marginTop: 1 }}>{postStatisticsState.totalLikedCount + behaviourStates.attitudeOnPost}</Typography>
                                    </Grid>

                                    {/* dislike */}
                                    <Grid item sx={{ ml: 1 }}>
                                        <IconButton aria-label='dislike' onClick={handleExpressAttitudeOnPost(-1)}>
                                            <ThumbDownIcon color={-1 === behaviourStates.attitudeOnPost ? 'error' : 'inherit'} fontSize='small' />
                                        </IconButton>
                                    </Grid>

                                    {/* save */}
                                    <Grid item sx={{ display: 'flex', flexDirection: 'row' }}>
                                        <IconButton aria-label='save' onClick={handleSave}>
                                            <StarIcon color={behaviourStates.saved ? 'warning' : 'inherit'} fontSize='small' />
                                        </IconButton>
                                        <Typography variant='body2' sx={{ marginTop: 1 }}>{postStatisticsState.totalSavedCount + (behaviourStates.saved ? 1 : 0)}</Typography>
                                    </Grid>

                                    {/* comment */}
                                    <Grid item sx={{ display: 'flex', flexDirection: 'row' }}>
                                        <Tooltip title={langConfigs.createComment[preferenceStates.lang]}>
                                            <IconButton aria-label='comment' onClick={handleEditorOpen(postId, authorId, nickname ?? langConfigs.defaultNickname[preferenceStates.lang])}>
                                                <ChatBubbleIcon fontSize='small' />
                                            </IconButton>
                                        </Tooltip>
                                        <Typography variant='body2' sx={{ marginTop: 1 }}>{postStatisticsState.totalCommentCount}</Typography>
                                    </Grid>

                                    {/* blank space */}
                                    <Grid item flexGrow={1} />
                                    <Grid item>
                                        <IconButton ><MoreVertIcon fontSize='small' /></IconButton>
                                        {/* FIXME: put the option of "edit post" in the hidden menu */}
                                    </Grid>

                                    {/* edit post */}
                                    {/* <Grid item sx={{ display: 'flex', flexDirection: 'row' }}> */}
                                    {/* FIXME: on testing, should be authorId === viewerId */}
                                    {/* {authorId === authorId && <Button variant='text' sx={{ ml: 1, padding: 0 }} onClick={handleEditPost}>{langConfigs.editPost[preferenceStates.lang]}</Button>} */}
                                    {/* </Grid> */}
                                </Grid>
                            </ResponsiveCard>

                            {/* the comments (conditional rendering)*/}
                            {Object.keys(restrictedCommentComprehensiveWithMemberInfoDict).length !== 0 &&
                                Object.keys(restrictedCommentComprehensiveWithMemberInfoDict).map(commentId => {
                                    const { memberId, nickname, avatarImageUrl, createdTime, content, cuedMemberInfoArr, totalLikedCount } = restrictedCommentComprehensiveWithMemberInfoDict[commentId];
                                    return (
                                        <Box key={commentId}>
                                            <Divider sx={{ display: { xs: 'block', sm: 'none' } }} />
                                            <Box sx={{ padding: { xs: 2, sm: 4 }, borderRadius: 1, boxShadow: { xs: 0, sm: 1 } }}>

                                                {/* member info */}
                                                <Stack direction={'row'}>
                                                    <IconButton sx={{ padding: 0 }}>
                                                        <Avatar src={avatarImageUrl} sx={{ width: 38, height: 38, bgcolor: 'grey' }}>{nickname?.charAt(0).toUpperCase()}</Avatar>
                                                    </IconButton>
                                                    <Box ml={1}>
                                                        <TextButton color='inherit'>
                                                            <Typography variant='body2' >
                                                                {nickname}
                                                            </Typography>
                                                            <Typography variant='body2' fontSize={{ xs: 12 }} >
                                                                {timeToString(createdTimeBySecond, preferenceStates.lang)}
                                                            </Typography>
                                                        </TextButton>
                                                    </Box>
                                                </Stack>

                                                {/* comment content */}
                                                <Box paddingTop={{ xs: 1, sm: 1.5 }} paddingX={0.5}>
                                                    {makeParagraph(content, cuedMemberInfoArr)}
                                                </Box>

                                                {/* member behaviours */}
                                                <Grid container mt={{ xs: 0.5, sm: 1 }}>

                                                    {/* like */}
                                                    <Grid item sx={{ display: 'flex', flexDirection: 'row' }}>
                                                        <IconButton aria-label='like' onClick={handleExpressAttitudeOnComment(commentId, 1)}>
                                                            <ThumbUpIcon color={1 === behaviourStates.attitudeOnComment[commentId] ? 'primary' : 'inherit'} fontSize='small' />
                                                        </IconButton>
                                                        <Typography variant='body2' sx={{ marginTop: 1 }}>{totalLikedCount}</Typography>
                                                    </Grid>

                                                    {/* dislike */}
                                                    <Grid item sx={{ ml: 1 }}>
                                                        <IconButton aria-label='dislike' onClick={handleExpressAttitudeOnComment(commentId, -1)}>
                                                            <ThumbDownIcon color={-1 === behaviourStates.attitudeOnComment[commentId] ? 'error' : 'inherit'} fontSize='small' />
                                                        </IconButton>
                                                    </Grid>

                                                    {/* comment */}
                                                    <Grid item sx={{ display: 'flex', flexDirection: 'row' }}>
                                                        <Tooltip title={langConfigs.replyToComment[preferenceStates.lang](nickname)}>
                                                            <IconButton aria-label='comment' onClick={handleEditorOpen(commentId, memberId, nickname)}>
                                                                <ReplyIcon fontSize='small' />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Typography variant='body2' sx={{ marginTop: 1 }}>{restrictedCommentComprehensiveWithMemberInfoDict[commentId].totalSubcommentCount}</Typography>
                                                    </Grid>

                                                    {/* blank space */}
                                                    <Grid item flexGrow={1} />
                                                    <Grid item>
                                                        <IconButton ><MoreVertIcon fontSize='small' /></IconButton>
                                                        {/* FIXME: put the option of "edit post" in the hidden menu */}
                                                    </Grid>
                                                </Grid>



                                                {/* subcomment stack wrapper */}
                                                <Box sx={{ display: 0 !== restrictedCommentComprehensiveWithMemberInfoDict[commentId].totalSubcommentCount ? 'block' : 'none' }}>

                                                    {/* expend button */}
                                                    <Button variant='text' sx={{ display: restrictedCommentComprehensiveWithMemberInfoDict[commentId].isExpended ? 'none' : 'block' }} onClick={async () => handleExpendSubcomments(commentId)} >{langConfigs.expendSubcomments[preferenceStates.lang]}</Button>

                                                    {/* subcomment stack (conditional rendering)*/}
                                                    <Stack id={`stack-${commentId}`} marginTop={{ xs: 1.5, sm: 2 }} paddingLeft={3} sx={{ display: restrictedCommentComprehensiveWithMemberInfoDict[commentId].isExpended ? 'block' : 'none' }}>
                                                        {restrictedSubcommentComprehensiveDict.hasOwnProperty(commentId) && Object.keys(restrictedSubcommentComprehensiveDict[commentId]).map(subcommentId => {
                                                            const { memberId, nickname, avatarImageUrl, createdTimeBySecond, content, totalLikedCount } = restrictedSubcommentComprehensiveDict[commentId][subcommentId];
                                                            return (
                                                                <Box key={subcommentId}>
                                                                    {/* member info */}
                                                                    <Stack direction={'row'}>
                                                                        <IconButton sx={{ padding: 0 }}>
                                                                            <Avatar sx={{ width: 38, height: 38, bgcolor: 'grey' }}>{verifyUrl(avatarImageUrl) ? avatarImageUrl : nickname[0]}</Avatar>
                                                                        </IconButton>
                                                                        <Box ml={1}>
                                                                            <TextButton color='inherit'>
                                                                                <Typography variant='body2' >
                                                                                    {nickname}
                                                                                </Typography>
                                                                                <Typography variant='body2' fontSize={{ xs: 12 }} >
                                                                                    {timeToString(createdTimeBySecond, preferenceStates.lang)}
                                                                                </Typography>
                                                                            </TextButton>
                                                                        </Box>
                                                                    </Stack>

                                                                    {/* comment content */}
                                                                    <Box sx={{ paddingTop: 1, paddingX: 1 / 2 }}>
                                                                        <Typography variant={'body2'} fontSize={{ sm: 16 }}>{content}</Typography>
                                                                    </Box>

                                                                    {/* member behaviours */}
                                                                    <Grid container>

                                                                        {/* like */}
                                                                        <Grid item sx={{ display: 'flex', flexDirection: 'row' }}>
                                                                            <IconButton aria-label='like' onClick={handleExpressAttitudeOnSubcomment(commentId, subcommentId, 1)}>
                                                                                <ThumbUpIcon color={1 === behaviourStates.attitudeOnComment[subcommentId] ? 'primary' : 'inherit'} fontSize='small' />
                                                                            </IconButton>
                                                                            <Typography variant='body2' sx={{ marginTop: 1 }}>{totalLikedCount}</Typography>
                                                                        </Grid>

                                                                        {/* dislike */}
                                                                        <Grid item sx={{ ml: 1 }}>
                                                                            <IconButton aria-label='dislike' onClick={handleExpressAttitudeOnSubcomment(commentId, subcommentId, -1)}>
                                                                                <ThumbDownIcon color={-1 === behaviourStates.attitudeOnComment[subcommentId] ? 'error' : 'inherit'} fontSize='small' />
                                                                            </IconButton>
                                                                        </Grid>

                                                                        {/* reply */}
                                                                        <Grid item sx={{ display: 'flex', flexDirection: 'row' }}>
                                                                            <Tooltip title={langConfigs.replyToComment[preferenceStates.lang](nickname)}>
                                                                                <IconButton aria-label='comment' onClick={handleEditorOpen(commentId, memberId, nickname)}>
                                                                                    <ReplyIcon fontSize='small' />
                                                                                </IconButton>
                                                                            </Tooltip>
                                                                        </Grid>

                                                                        {/* blank space */}
                                                                        <Grid item flexGrow={1} />
                                                                        <Grid item>
                                                                            <IconButton ><MoreVertIcon fontSize='small' /></IconButton>
                                                                            {/* FIXME: put the option of "edit post" in the hidden menu */}
                                                                        </Grid>
                                                                    </Grid>
                                                                </Box>
                                                            )
                                                        })}
                                                    </Stack>

                                                    {/* undo expend button */}
                                                    <Button variant='text' sx={{ display: restrictedCommentComprehensiveWithMemberInfoDict[commentId].isExpended ? 'block' : 'none' }} onClick={handleUndoExpendSubcomments(commentId)} >{langConfigs.undoExpendSubcomments[preferenceStates.lang]}</Button>

                                                </Box>

                                            </Box>
                                        </Box>
                                    )
                                })
                            }

                        </Stack>
                    </Grid>

                    {/* //// right column //// */}
                    <Grid item xs={0} sm={1} md={4} >

                        {/* right card-stack */}
                        <Stack spacing={1} sx={{ ml: 2, maxWidth: 320, display: { xs: 'none', sm: 'none', md: 'block', lg: 'block' } }} >

                            {/* member info card */}
                            <ResponsiveCard sx={{ paddingY: 2 }}>
                                <Stack>

                                    {/* avatar */}
                                    <CenterlizedBox mt={1}>
                                        <Avatar src={avatarImageUrl} sx={{ width: 56, height: 56, bgcolor: 'grey' }}>{nickname?.charAt(0).toUpperCase()}</Avatar>
                                    </CenterlizedBox>

                                    {/* nickname */}
                                    <CenterlizedBox mt={1}><Typography variant='body1'>{nickname}</Typography></CenterlizedBox>


                                    <CenterlizedBox >
                                        <Tooltip title={behaviourStates.followed ? langConfigs.undoFollow[preferenceStates.lang] : langConfigs.follow[preferenceStates.lang]}>
                                            <Button variant='text' color={behaviourStates.followed ? 'inherit' : 'info'} sx={{ paddingY: 0.1, borderRadius: 4, fontSize: 13 }} onClick={handleFollow}>{behaviourStates.followed ? langConfigs.followed[preferenceStates.lang] : langConfigs.follow[preferenceStates.lang]}</Button>
                                        </Tooltip>
                                    </CenterlizedBox>

                                    <Box mt={1}><Divider /></Box>

                                    {/* info */}
                                    <CenterlizedBox mt={2} >

                                        {/* info left column */}
                                        <Box>
                                            <CenterlizedBox><Typography variant='body1'>{langConfigs.creations[preferenceStates.lang]}</Typography></CenterlizedBox>
                                            <CenterlizedBox><Typography variant='body1'>{authorStatisticsState.totalCreationCount}</Typography></CenterlizedBox>
                                        </Box>

                                        {/* info middle column */}
                                        <Box marginX={4}>
                                            <CenterlizedBox><Typography variant='body1' >{langConfigs.followedBy[preferenceStates.lang]}</Typography></CenterlizedBox>
                                            <CenterlizedBox><Typography variant='body1'>{authorStatisticsState.totalFollowedByCount}</Typography></CenterlizedBox>
                                        </Box>

                                        {/* info right column */}
                                        <Box>
                                            <CenterlizedBox><Typography variant='body1'>{langConfigs.liked[preferenceStates.lang]}</Typography></CenterlizedBox>
                                            <CenterlizedBox><Typography variant='body1'>{authorStatisticsState.totalCreationLikedCount}</Typography></CenterlizedBox>
                                        </Box>
                                    </CenterlizedBox>
                                </Stack>
                            </ResponsiveCard>

                            {/* other post recommend in this channel */}
                            <ResponsiveCard sx={{ padding: 3 }}>
                                <Box>
                                    <Typography>{nickname} {langConfigs.hotPostRecommend[preferenceStates.lang]}</Typography>
                                </Box>
                                <Stack mt={2} spacing={1}>
                                    {0 !== conciseCreationInfoArrState.length && conciseCreationInfoArrState.map(creation =>
                                        <Grid container key={creation.postId}>
                                            <Grid item>
                                                <Box sx={{ width: 48, height: 48, backgroundImage: `url(${creation.imageUrlsArr[0]})`, backgroundSize: 'cover' }}></Box>
                                            </Grid>
                                            <Grid item flexGrow={1}>
                                                <Box ml={1}>
                                                    <TextButton color='inherit' onClick={handleRedirectToPost(creation.postId)}>
                                                        <Typography variant='body1' marginTop={0.1} textOverflow={'ellipsis'} noWrap maxWidth={200}>{creation.title}</Typography>
                                                        <Stack direction={'row'}>
                                                            <Typography variant='body2' fontSize={{ xs: 12 }}>{`${creation.totalHitCount} ${langConfigs.viewed[preferenceStates.lang]}`}</Typography>
                                                            <Typography ml={1} variant='body2' fontSize={{ xs: 12 }}>{`${creation.totalLikedCount} ${langConfigs.liked[preferenceStates.lang]}`}</Typography>
                                                        </Stack>
                                                    </TextButton>
                                                </Box>
                                            </Grid>
                                        </Grid>)}
                                </Stack>
                            </ResponsiveCard>
                        </Stack>
                    </Grid>

                </Grid>
            </Container >

            {/* pop up comment editor */}
            < Popover
                open={processStates.displayEditor}
                anchorReference='anchorPosition'
                onClose={handleEditorClose}
                anchorPosition={{ top: 1000, left: 1000 }}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center', }}
            >
                <Box sx={{ minWidth: 340, maxWidth: 360, minHeight: 200, borderRadius: 2, padding: 2 }}>
                    <Typography>{langConfigs.createComment[preferenceStates.lang]}</Typography>
                    {/* content input */}
                    <TextField
                        id="outlined-basic"
                        variant="outlined"
                        rows={4}
                        multiline
                        fullWidth
                        placeholder={langConfigs.editorPlaceholder[preferenceStates.lang](editorStates.parentId, editorStates.nickname)}
                        onChange={handleEditorInput}
                        value={editorStates.content}
                        // onChange={handlePostStatesChange('content')}
                        // disabled={processStates.submitting}
                        sx={{ marginTop: 1 }}
                    />
                    {/* blank content alert */}
                    <Box mt={1} sx={{ display: editorStates.displayAlert ? 'block' : 'none' }}>
                        <Alert severity='error'>{editorStates.alertContent}</Alert>
                    </Box>
                    {/* cue & submit button */}
                    <Grid container mt={2} mb={1}>
                        <Grid item>
                            <IconButton onClick={handleCueHelperOpenAndClose}>
                                <Typography variant='body1' sx={{ minWidth: 24 }}>@</Typography>
                            </IconButton>
                        </Grid>
                        <Grid item flexGrow={1}></Grid>
                        <Grid item>
                            <Box display={'flex'} justifyContent={'end'}>
                                <Button variant='contained' onClick={async () => { await handleSubmitComment() }} >{langConfigs.submitComment[preferenceStates.lang]}</Button>
                            </Box>

                        </Grid>
                    </Grid>
                    <Divider sx={{ display: editorStates.displayCueHelper ? 'block' : 'none' }}></Divider>
                    {/* no followed member alert */}
                    <Box mt={2} sx={{ display: editorStates.displayCueHelper && editorStates.displayNoFollowedMemberAlert ? 'flex' : 'none', justifyContent: 'center' }}>
                        <Typography color={'text.disabled'}>{langConfigs.noFollowedMember[preferenceStates.lang]}</Typography>
                    </Box>
                    {/* followed member array */}
                    <Box mt={1} sx={{ display: editorStates.displayCueHelper ? 'block' : 'none' }}>
                        <Stack direction={'row'} sx={{ padding: 1, overflow: 'auto', }} >
                            {viewerInfoStates.followedMemberInfoArr.map(memberInfo => {
                                return (
                                    <Button key={getRandomHexStr()} size={'small'} sx={{ minWidth: 72, minHeight: 86 }} onClick={handleCue(memberInfo)}>
                                        <Stack sx={{}}>
                                            <Grid container>
                                                <Grid item flexGrow={1}></Grid>
                                                <Grid item>
                                                    <Avatar src={avatarImageUrl} sx={{ width: 34, height: 34, bgcolor: 'grey' }}>{nickname?.charAt(0).toUpperCase()}</Avatar>
                                                </Grid>
                                                <Grid item flexGrow={1}></Grid>
                                            </Grid>
                                            <Typography mt={1} sx={{ minHeight: 33, fontSize: 11, color: editorStates.cuedMemberInfoDict.hasOwnProperty(memberInfo.memberId) ? 'inherit' : 'text.secondary' }}>{getNicknameBrief(memberInfo.nickname)}</Typography>
                                        </Stack>

                                    </Button>
                                )
                            })}
                        </Stack>
                    </Box>
                </Box>
            </Popover >

            {/* backdrop - full screen image viewer */}
            <Backdrop
                sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
                open={processStates.displayBackdrop}
                onClick={handleBackdropClose}
            >
                <Box>
                    {processStates.backdropOnDisplayImageUrl && <Box component={'img'} src={processStates.backdropOnDisplayImageUrl} maxWidth={window.innerWidth}></Box>}
                </Box>
            </Backdrop>
            <Copyright sx={{ mt: { xs: 8, sm: 8 }, mb: 4 }} />
        </>
    )
}

export default Post