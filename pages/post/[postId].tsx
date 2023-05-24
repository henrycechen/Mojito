import * as React from 'react';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { NextPageContext } from 'next/types';

import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Backdrop from '@mui/material/Backdrop';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Popover from '@mui/material/Popover';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import IconButton from '@mui/material/IconButton';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import ReplyIcon from '@mui/icons-material/Reply';
import EditIcon from '@mui/icons-material/Edit';
import ForumIcon from '@mui/icons-material/Forum';
import BarChartIcon from '@mui/icons-material/BarChart';
import AlternateEmailIcon from '@mui/icons-material/AlternateEmail';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper';
import { Pagination } from 'swiper';
import 'swiper/css';
import 'swiper/css/pagination';

import Link from '@mui/material/Link';
import Tooltip from '@mui/material/Tooltip';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import BlockIcon from '@mui/icons-material/Block';
import FlagIcon from '@mui/icons-material/Flag';

import { ResponsiveCard, TextButton } from '../../ui/Styled';
import Navbar from '../../ui/Navbar';
import Copyright from '../../ui/Copyright';
import Terms from '../../ui/Terms';

import { IMemberInfo } from '../../lib/interfaces/member';
import { IRestrictedPostComprehensive, IConcisePostComprehensive } from '../../lib/interfaces/post';
import { IRestrictedCommentComprehensive } from '../../lib/interfaces/comment';
import { IChannelInfo } from '../../lib/interfaces/channel';

import { fakeConciseMemberInfo, provideAvatarImageUrl, getNicknameBrief, provideCuedMemberInfoArray, provideMemberInfoPageUrl, } from '../../lib/utils/for/member';
import { fakeRestrictedPostComprehensive, provideCoverImageUrl, provideImageUrl, } from '../../lib/utils/for/post';
import { fakeChannel, } from '../../lib/utils/for/channel';
import { getRandomHexStr, getTimeBySecond, } from '../../lib/utils/create';
import { logWithDate, restoreFromLocalStorage, timeToString } from '../../lib/utils/general';
import { verifyId } from '../../lib/utils/verify';
import { LangConfigs } from '../../lib/types';

const storageName0 = 'PreferenceStates';
const restorePreferenceStatesFromCache = restoreFromLocalStorage(storageName0);

type TPostPageProps = {
    restrictedPostComprehensive_ss: IRestrictedPostComprehensive;
    channelInfo_ss: IChannelInfo;
    authorInfo_ss: IMemberInfo;
    redirect404: boolean;
    redirect500: boolean;
};

interface IPostPageProcessStates {
    lang: string;
    displayEditor: boolean;
    editorEnchorElement: any;
    displayBackdrop: boolean;
    backdropOnDisplayImageUrl: string | undefined;
}

const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? '';
const imageDomain = process.env.NEXT_PUBLIC_IMAGE_DOMAIN ?? '';
const defaultLang = process.env.NEXT_PUBLIC_APP_LANG ?? 'tw';
const langConfigs: LangConfigs = {
    title: {
        tw: '撰寫新文章',
        cn: '撰写新文章',
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
        tw: '您還未曾關注其他用戶',
        cn: '您还没有关注其他用户',
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
        tw: '的热门文章',
        cn: '的热门文章',
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
        tw: '發布評論',
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
    noPermissionAlert: {
        tw: '您的賬號被限制因而不能發布評論',
        cn: '您的账户被限制因而不能发布评论',
        en: 'Unable to submit comment due to restricted member'
    },

    authorsTotalFollowing: {
        tw: '位會員正在關注作者',
        cn: '位会员正在关注作者',
        en: 'members are following the author',
    },
    authorsTotalLikesP1: {
        tw: '获得了',
        cn: '获得了',
        en: 'Gained ',
    },
    authorsTotalLikesP2: {
        tw: '次喜欢',
        cn: '次喜欢',
        en: ' likes',
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
    },
    block: {
        tw: (nickname: string) => `屏蔽 ${nickname}`,
        cn: (nickname: string) => `屏蔽 ${nickname}`,
        en: (nickname: string) => `Block ${nickname}`,
    },
    report: {
        tw: '檢舉',
        cn: '举报',
        en: 'Report',
    },
};

//// get multiple info server-side ////
export async function getServerSideProps(context: NextPageContext): Promise<{ props: TPostPageProps; }> {
    const { postId: id } = context.query;
    const { isValid, category, id: postId } = verifyId(id);

    // Verify post id
    if (!(isValid && 'post' === category)) {
        return {
            props: {
                restrictedPostComprehensive_ss: fakeRestrictedPostComprehensive(),
                channelInfo_ss: fakeChannel(),
                authorInfo_ss: fakeConciseMemberInfo(),
                redirect404: true,
                redirect500: false
            }
        };
    }

    try {
        // GET restricted post comprehensive
        const restrictedPostComprehensive_resp = await fetch(`${appDomain}/api/post/id/${postId}`);
        if (200 !== restrictedPostComprehensive_resp.status) {
            throw new Error('Attempt to GET restricted post comprehensive');

        }
        const restrictedPostComprehensive_ss = await restrictedPostComprehensive_resp.json();

        // GET channel info by id
        const channelInfo_resp = await fetch(`${appDomain}/api/channel/info/by/id/${restrictedPostComprehensive_ss.channelId}`);
        if (200 !== channelInfo_resp.status) {
            throw new Error('Attempt to GET channel info by id');
        }
        const channelInfo_ss = await channelInfo_resp.json();

        // GET author info by id
        const authorInfo_resp = await fetch(`${appDomain}/api/member/info/${restrictedPostComprehensive_ss.memberId}`);
        if (200 !== authorInfo_resp.status) {
            throw new Error('Attempt to GET member (author) info');
        }
        const authorInfo_ss = await authorInfo_resp.json();

        return {
            props: {
                restrictedPostComprehensive_ss,
                channelInfo_ss,
                authorInfo_ss,
                redirect404: false,
                redirect500: false,
            }
        };
    } catch (e: any) {
        logWithDate(e?.msg, '/pages/post/[postId].getServerSideProps', e);
        return {
            props: {
                restrictedPostComprehensive_ss: fakeRestrictedPostComprehensive(),
                channelInfo_ss: fakeChannel(),
                authorInfo_ss: fakeConciseMemberInfo(),
                redirect404: false,
                redirect500: true
            }
        };
    }
}

const Post = ({ restrictedPostComprehensive_ss: postComprehensive_ss, channelInfo_ss, authorInfo_ss, redirect404, redirect500 }: TPostPageProps) => {

    const router = useRouter();
    React.useEffect(() => {
        if (redirect404) {
            router.push('/404');
        }
        if (redirect500) {
            router.push('/500');
        }
    }, []);

    const { data: session, status } = useSession();

    //////////////////////////////////////// INFO & STATISTICS ////////////////////////////////////////

    React.useEffect(() => {
        if ('authenticated' === status) {
            const viewerSession: any = { ...session };
            setViewerInfoStates({ ...viewerInfoStates, memberId: viewerSession?.user?.id ?? '' });
            restorePreferenceStatesFromCache(setPreferenceStates);
        }
    }, [status]);

    const { postId, memberId: authorId, } = postComprehensive_ss;

    // States - preference ////////
    const [preferenceStates, setPreferenceStates] = React.useState<any>({
        lang: defaultLang,
        mode: 'light'
    });

    // // States - swipper (dimensions)
    // // Logic:
    // // swiperWrapperHeight is designed for adjust Box (swiperslide wrapper) height
    // // Initial value set to 1 leads to Box-height having been set to 100% on initializing
    // // If there is ultra-high photo in the swiperslide array
    // // Then adujust all the Box-height to the swiper (top-level) wrapper height
    // // Which makes all the photo aligned center (horizontally)
    const [swiperWrapperDimensions, setSwiperWrapperDimensions] = React.useState({ width: 1, height: 1 });

    React.useEffect(() => {
        const wrapper: HTMLElement | null = document.getElementById('swiper-wrapper');

        // alert(wrapper?.offsetHeight);
        // alert(wrapper?.offsetWidth);

        setSwiperWrapperDimensions({
            width: wrapper?.offsetWidth ?? 1,
            height: wrapper?.offsetHeight ?? 500
        });
    }, []);

    type TCombinedStatistics = {
        // Member statistics
        totalCreationsCount: number;
        totalCreationLikedCount: number;
        totalFollowedByCount: number;
        // Post statistics
        totalLikedCount: number;
        totalDislikedCount: number;
        totalSavedCount: number;
        totalCommentCount: number;
    };

    // States - author statistics ////////
    const [combinedStatisticsState, setCombinedStatisticsState] = React.useState<TCombinedStatistics>({
        totalCreationsCount: 0,
        totalCreationLikedCount: 0,
        totalFollowedByCount: 0,
        totalLikedCount: postComprehensive_ss.totalLikedCount,
        totalDislikedCount: postComprehensive_ss.totalDislikedCount,
        totalSavedCount: postComprehensive_ss.totalSavedCount,
        totalCommentCount: postComprehensive_ss.totalCommentCount,
    });

    React.useEffect(() => { updateAuthorStatistics(); }, []);

    const updateAuthorStatistics = async () => {
        // get followed member info
        const resp = await fetch(`/api/member/statistics/${authorId}`);
        if (200 === resp.status) {
            try {
                const stat = await resp.json();
                setCombinedStatisticsState({
                    ...combinedStatisticsState,
                    totalCreationsCount: stat.totalCreationsCount,
                    totalCreationLikedCount: stat.totalCreationLikedCount,
                    totalFollowedByCount: stat.totalFollowedByCount,
                });
            } catch (e) {
                console.error(`Attempt to GET member (post author) statistics. ${e}`);
            }
        }
    };

    // States - (recommend) creation info array  ////////
    const [creationInfoArr, setCreationInfoArr] = React.useState<IConcisePostComprehensive[]>([]);

    React.useEffect(() => { updateCreationArr(); }, []);

    const updateCreationArr = async () => {
        const resp = await fetch(`/api/member/creations/${authorId}`);
        if (200 === resp.status) {
            try {
                const arr = await resp.json();
                setCreationInfoArr([...arr]);
            } catch (e) {
                console.error(`Attempt to GET new posts (creations) of post author (member id: ${authorId}). ${e}`);
            }
        }
    };

    const handleRedirectToPost = (postId: string) => (event: React.MouseEvent<any>) => {
        router.push(`/post/${postId}`);
    };

    // States - process ////////
    const [processStates, setProcessStates] = React.useState<IPostPageProcessStates>({
        lang: defaultLang,
        displayEditor: false,
        displayBackdrop: false,
        backdropOnDisplayImageUrl: undefined,
        editorEnchorElement: null
    });

    const handleBackdropOpen = (imageFullname: string) => (event: React.MouseEvent) => {
        setProcessStates({ ...processStates, displayBackdrop: true, backdropOnDisplayImageUrl: provideImageUrl(imageFullname, imageDomain) });
    };

    const handleBackdropClose = () => {
        setProcessStates({ ...processStates, displayBackdrop: false, backdropOnDisplayImageUrl: undefined });
    };

    //////////////////////////////////////// VIEWER INFO ////////////////////////////////////////

    type TViewerInfoStates = {
        memberId: string;
        nickname: string;
        allowCommenting: boolean;
        followedMemberInfoArr: IMemberInfo[],
        blockedMemberInfoArr: IMemberInfo[],
    };

    const [viewerInfoStates, setViewerInfoStates] = React.useState<TViewerInfoStates>({
        memberId: '',
        nickname: '',
        allowCommenting: true,
        followedMemberInfoArr: [],
        blockedMemberInfoArr: []
    });

    React.useEffect(() => { if ('' !== viewerInfoStates.memberId) { updateViewerInfoStates(); } }, [viewerInfoStates.memberId]);

    const updateViewerInfoStates = async () => {
        const infoResp = await fetch(`/api/member/info/${viewerInfoStates.memberId}`);
        if (200 !== infoResp.status) {
            console.error(`Attemp to GET viewer comprehensive`);
            return;
        }

        try {
            const { nickname, status: viewerStatus, allowCommenting } = await infoResp.json();
            if (0 > viewerStatus) {
                signOut();
            }

            const followResp = await fetch(`/api/member/followedbyme/${viewerInfoStates.memberId}`);
            let arr0: IMemberInfo[] = [];
            if (200 === followResp.status) {
                const _arr = await followResp.json();
                if (Array.isArray(_arr)) {
                    arr0.push(..._arr);
                }
            }

            const blockResp = await fetch(`/api/member/blockedbyme/${viewerInfoStates.memberId}`);
            let arr1: IMemberInfo[] = [];
            if (200 === blockResp.status) {
                const _arr = await blockResp.json();
                if (Array.isArray(_arr)) {
                    arr1.push(..._arr);
                }
            }

            setViewerInfoStates({
                ...viewerInfoStates,
                nickname: nickname,
                allowCommenting: allowCommenting,
                followedMemberInfoArr: [...arr0],
                blockedMemberInfoArr: [...arr1]
            });

            if (!allowCommenting) {
                setEditorStates({
                    ...editorStates,
                    alertContent: langConfigs.noPermissionAlert[preferenceStates.lang],
                    displayAlert: true,
                    disableEditor: true
                });
            }
        } catch (e) {
            console.error(`Attempt to GET following restricted member info array (viewer info). ${e}`);
        }
    };

    //////////////////////////////////////// VIEWER BEHAVIOURS ////////////////////////////////////////

    type MemberBehaviourStates = {
        attitudeOnPost: number;
        attitudeOnComment: { [commentId: string]: number; };
        saved: boolean;
        followed: boolean;
    };

    const [behaviourStates, setBehaviourStates] = React.useState<MemberBehaviourStates>({
        attitudeOnPost: 0,
        attitudeOnComment: {},
        saved: false,
        followed: false
    });

    React.useEffect(() => { if ('' !== viewerInfoStates.memberId) { initializeBehaviourStates(); } }, [viewerInfoStates.memberId]);

    const initializeBehaviourStates = async () => {
        let attitudeOnPost = 0;
        let attitudeOnComment: { [commentId: string]: number; } = {};
        let saved = false;
        let followed = false;

        try {
            //// GET attitude mapping ////
            const attitudeMapping = await fetch(`/api/attitude/on/${postId}`).then(resp => resp.json());
            if (null !== attitudeMapping) {
                if (attitudeMapping.hasOwnProperty('attitude')) {
                    attitudeOnPost = attitudeMapping.attitude;
                }
                if (attitudeMapping.hasOwnProperty('commentAttitudeMapping') && 0 !== Object.keys(attitudeMapping.commentAttitudeMapping).length) {
                    Object.keys(attitudeMapping.commentAttitudeMapping).forEach(commentId => {
                        attitudeOnComment[commentId] = attitudeMapping.commentAttitudeMapping[commentId];
                    });
                }
            }

            // Verify if saved
            const resp_saved = await fetch(`/api/save/${postId}`);
            if (200 === resp_saved.status) {
                try {
                    saved = await resp_saved.json();
                } catch (e) {
                    throw new Error('Attempt to parse ');
                }
            }

            // Verify if followed
            const resp_followed = await fetch(`/api/follow/${authorId}`);
            if (200 === resp_followed.status) {
                try {
                    followed = await resp_followed.json();
                } catch (e) {
                    console.error(`Attemp to verify if followed post author`);
                }
            }

            setCombinedStatisticsState({
                ...combinedStatisticsState,
                totalFollowedByCount: combinedStatisticsState.totalFollowedByCount - (followed ? 1 : 0),
                totalCreationLikedCount: combinedStatisticsState.totalCreationLikedCount - attitudeOnPost,
                totalLikedCount: postComprehensive_ss.totalLikedCount - attitudeOnPost, // handle offset
                totalSavedCount: postComprehensive_ss.totalSavedCount - (saved ? 1 : 0), // handle offset
            });

            setBehaviourStates({
                attitudeOnPost,
                attitudeOnComment: { ...attitudeOnComment },
                saved,
                followed
            });
        } catch (e: any) {
            console.error(`Attempt to initialize behaviour states. ${e}`);
        }
    };

    const handleExpressAttitudeOnPost = async (attitude: number) => {
        if ('authenticated' !== status) {
            router.push(`/signin`);
            return;
        }
        if (behaviourStates.attitudeOnPost === attitude) {
            setBehaviourStates({ ...behaviourStates, attitudeOnPost: 0 });
        } else {
            setBehaviourStates({ ...behaviourStates, attitudeOnPost: attitude });
        }

        const resp = await fetch(`/api/attitude/on/${postId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ attitude })
        });
        if (200 !== resp.status) {
            console.error(`Attemp to express attitude on post (post id: ${postId})`);
        }
    };

    const handleSaveOrUndoSave = async () => {
        if ('authenticated' !== status) {
            router.push(`/signin`);
            return;
        }
        setBehaviourStates({ ...behaviourStates, saved: !behaviourStates.saved });
        const resp = await fetch(`/api/save/${postId}`, { method: 'POST' });
        if (200 !== resp.status) {
            console.error(`Attemp to save post`);
        }
    };

    const handleFollowOrUndoFollow = async () => {
        if ('authenticated' !== status) {
            router.push(`/signin`);
            return;
        }
        setBehaviourStates({ ...behaviourStates, followed: !behaviourStates.followed });
        const resp = await fetch(`/api/follow/${authorId}`, { method: 'POST' });
        if (200 !== resp.status) {
            console.error(`Attemp to follow post author`);
        }
    };

    const handleClickOnAuthorNickname = (event: React.MouseEvent<any>) => {
        router.push(`/me/${authorId}`);
    };

    const handleClickOnPostCard = (postId: string) => (event: React.MouseEvent<any>) => {
        router.push(`/post/${postId}`);
    };

    const handleBlock = async (memberId: string) => {
        if ('authenticated' !== status) {
            router.push(`/signin`);
            return;
        }
        const resp = await fetch(`/api/block/${memberId}`, { method: 'POST' });
        if (200 !== resp.status) {
            console.error(`Attemp to block member (member id: ${memberId})`);
        }
    };

    const handleReport = () => {
        router.push(`/report?memberId=${popUpMenuStates.memberId}&referenceId=${popUpMenuStates.referenceId}`);
    };

    //////////////////////////////////////// COMMENT EDITOR ////////////////////////////////////////

    type TEditorStates = {
        parentId: string;
        memberId: string;
        nickname: string;
        content: string;
        cuedMemberInfoDict: { [memberId: string]: IMemberInfo; };
        alertContent: string;
        displayAlert: boolean;
        displayCueHelper: boolean;
        displayNoFollowedMemberAlert: boolean;
        disableEditor: boolean;
    };

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
        disableEditor: false,
    });

    const handleEditorOpen = (parentId: string, memberId: string, nickname: string) => (event: React.MouseEvent<any>) => {
        if ('authenticated' !== status) {
            router.push(`/signin`);
            return;
        }
        if (editorStates.parentId !== parentId) {
            setEditorStates({ ...editorStates, parentId, memberId, nickname, content: '' });
        }
        setProcessStates({ ...processStates, displayEditor: true });
    };

    const handleEditorInput = (event: React.ChangeEvent<HTMLInputElement>) => {
        setEditorStates({ ...editorStates, content: event.target.value });
    };

    const handleEditorClose = () => {
        setProcessStates({ ...processStates, displayEditor: false });
    };

    const handleCueHelperOpenAndClose = () => {
        if ('authenticated' !== status) {
            return;
        }
        if (0 !== viewerInfoStates.followedMemberInfoArr.length) {
            setEditorStates({ ...editorStates, displayCueHelper: !editorStates.displayCueHelper, displayNoFollowedMemberAlert: false });
        } else {
            setEditorStates({ ...editorStates, displayCueHelper: !editorStates.displayCueHelper, displayNoFollowedMemberAlert: true });
        }
    };

    const handleCue = (memberInfo: IMemberInfo) => (event: React.MouseEvent<HTMLButtonElement>) => {
        if (editorStates.cuedMemberInfoDict.hasOwnProperty(memberInfo.memberId)) {
            const update = { ...editorStates.cuedMemberInfoDict };
            delete update[memberInfo.memberId];
            const content = editorStates.content.split(`@${memberInfo.nickname}`).join('');
            setEditorStates({
                ...editorStates,
                content: content,
                cuedMemberInfoDict: { ...update }
            });
            return;
        } else {
            setEditorStates({
                ...editorStates,
                content: `${editorStates.content}@${memberInfo.nickname}`,
                cuedMemberInfoDict: {
                    ...editorStates.cuedMemberInfoDict,
                    [memberInfo.memberId]: memberInfo
                }
            });
        }
    };

    const handleSubmitComment = async () => {

        if ('authenticated' !== status) {
            return;
        }

        if (!viewerInfoStates.allowCommenting) {
            return;
        }

        const memberId = viewerInfoStates.memberId;
        const nickname = viewerInfoStates.nickname;

        if ('' === editorStates.content) {
            setEditorStates({ ...editorStates, displayAlert: true });
            return;
        } else {
            setEditorStates({ ...editorStates, displayAlert: false });
        }

        const resp = await fetch(`/api/comment/on/${editorStates.parentId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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
                const timeBySecond = getTimeBySecond();
                const update: IRestrictedCommentComprehensiveWithControl = {
                    commentId,
                    postId,
                    memberId: memberId,
                    nickname: nickname,
                    createdTimeBySecond: timeBySecond,
                    content,
                    cuedMemberInfoArr: provideCuedMemberInfoArray(cuedMemberInfoDict),
                    status: 200,
                    totalLikedCount: 0,
                    totalDislikedCount: 0,
                    totalSubcommentCount: 0,
                    editedTimeBySecond: timeBySecond,
                    isExpended: true
                };
                if (postId === parentId) {
                    // Publish a comment
                    setRestrictedCommentComprehensiveDict({ ...restrictedCommentComprehensiveDict, [commentId]: update });
                } else {
                    // Publish a subcomment
                    setRestrictedCommentComprehensiveDict({
                        ...restrictedCommentComprehensiveDict,
                        [parentId]: {
                            ...restrictedCommentComprehensiveDict[parentId],
                            totalSubcommentCount: restrictedCommentComprehensiveDict[parentId].totalSubcommentCount + 1,
                            isExpended: true
                        }
                    });
                    setRestrictedSubcommentComprehensiveDict({
                        ...restrictedSubcommentComprehensiveDict,
                        [parentId]: {
                            ...restrictedSubcommentComprehensiveDict[parentId],
                            [commentId]: update
                        }
                    });
                }
                setEditorStates({ ...editorStates, parentId: '', memberId: '', nickname: '', content: '', cuedMemberInfoDict: {}, alertContent: '' });
                setProcessStates({ ...processStates, displayEditor: false });
            } catch (e) {
                console.error(`Attempt to create comment on ${parentId}. ${e}`);
            }
        } else {
            setEditorStates({ ...editorStates, alertContent: langConfigs.emptyCommentAlert[preferenceStates.lang] });
            setProcessStates({ ...processStates, displayEditor: true });
        }
    };

    //////////////////////////////////////// COMMENTS ////////////////////////////////////////

    interface IRestrictedCommentComprehensiveWithControl extends IRestrictedCommentComprehensive {
        isExpended: boolean;
    }

    type TRestrictedCommentComprehensiveDict = {
        [commentId: string]: IRestrictedCommentComprehensiveWithControl;
    };

    const [restrictedCommentComprehensiveDict, setRestrictedCommentComprehensiveDict] = React.useState<TRestrictedCommentComprehensiveDict>({});

    React.useEffect(() => { updateRestrictedCommentComprehensiveDict(); }, []);

    const updateRestrictedCommentComprehensiveDict = async () => {

        const resp = await fetch(`/api/comment/s/of/${postId}`);
        if (200 !== resp.status) {
            console.error(`Attempt to GET comment comprehensive array`);
            return;
        }

        try {
            const restrictedCommentComprehensiveArr = await resp.json();
            const update: TRestrictedCommentComprehensiveDict = {};
            if (Array.isArray(restrictedCommentComprehensiveArr)) {
                restrictedCommentComprehensiveArr.forEach(restrictedCommentComprehensive => {
                    update[restrictedCommentComprehensive.commentId] = {
                        ...restrictedCommentComprehensive,
                        isExpended: false
                    };
                });
            }
            setRestrictedCommentComprehensiveDict({ ...restrictedCommentComprehensiveDict, ...update });
        } catch (e) {
            console.error(`Attemp to fetch comments. ${e}`);
        }
    };

    const handleExpressAttitudeOnComment = async (commentId: string, attitude: number) => {
        if ('authenticated' !== status) {
            router.push(`/signin`);
            return;
        }

        let behaviourStateUpdate = 0;
        let dictionaryStateUpdate = 0;

        const prevAttitude = behaviourStates.attitudeOnComment[commentId] ?? 0;

        // Revoke e.g., -1 => 0 (-1 === -1)
        if (prevAttitude === attitude) {
            behaviourStateUpdate = 0;
            dictionaryStateUpdate = 0 - attitude;
        }
        // Reverse e.g., 1 => -1 (0 > 1 * -1)
        else if (0 > prevAttitude * attitude) {
            behaviourStateUpdate = attitude;
            dictionaryStateUpdate = attitude * 2;
        }
        // Initiate e.g., 0 => 1
        else {
            behaviourStateUpdate = attitude;
            dictionaryStateUpdate = attitude;
        }

        setBehaviourStates({
            ...behaviourStates,
            attitudeOnComment: {
                ...behaviourStates.attitudeOnComment,
                [commentId]: behaviourStateUpdate
            }
        });

        setRestrictedCommentComprehensiveDict({
            ...restrictedCommentComprehensiveDict,
            [commentId]: {
                ...restrictedCommentComprehensiveDict[commentId],
                totalLikedCount: restrictedCommentComprehensiveDict[commentId].totalLikedCount + dictionaryStateUpdate,
            }
        });

        const resp = await fetch(`/api/attitude/on/${commentId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ attitude })
        });

        if (200 !== resp.status) {
            console.error(`Attemp to express attitude on a comment (comment id: ${commentId})`);
        }
    };

    const handleEditPost = () => {
        if (authorId === viewerInfoStates.memberId) {
            router.push(`/edit/${postId}`);
        }
    };

    const handleUndoExpendSubcomments = (commentId: string) => (event: React.MouseEvent<any>) => {
        setRestrictedCommentComprehensiveDict({
            ...restrictedCommentComprehensiveDict, [commentId]: {
                ...restrictedCommentComprehensiveDict[commentId],
                isExpended: !restrictedCommentComprehensiveDict[commentId].isExpended
            }
        });
    };

    const handleExpendSubcomments = async (commentId: string) => {
        setRestrictedCommentComprehensiveDict({
            ...restrictedCommentComprehensiveDict, [commentId]: {
                ...restrictedCommentComprehensiveDict[commentId],
                isExpended: !restrictedCommentComprehensiveDict[commentId].isExpended
            }
        });
        if (!restrictedSubcommentComprehensiveDict.hasOwnProperty(commentId)) {
            const resp = await fetch(`/api/comment/s/of/${commentId}`);
            if (200 === resp.status) {
                try {
                    const subcommentArr = await resp.json();
                    const update: { [key: string]: IRestrictedCommentComprehensive; } = {};
                    if (Array.isArray(subcommentArr)) {
                        subcommentArr.forEach(comment => {
                            update[comment.commentId] = { ...comment };
                        });
                    }
                    setRestrictedSubcommentComprehensiveDict({
                        ...restrictedSubcommentComprehensiveDict,
                        [commentId]: { ...update }
                    });
                } catch (e) {
                    console.error(`Attempt to GET subcomments of ${commentId}. ${e}`);
                }
            }
        }
    };

    type TRestrictedSubcommentComprehensiveDict = {
        [commentId: string]: {
            [commentId: string]: IRestrictedCommentComprehensive;
        };
    };

    const [restrictedSubcommentComprehensiveDict, setRestrictedSubcommentComprehensiveDict] = React.useState<TRestrictedSubcommentComprehensiveDict>({});

    const handleExpressAttitudeOnSubcomment = async (parentId: string, commentId: string, attitude: number) => {
        if ('authenticated' !== status) {
            router.push(`/signin`);
            return;
        }

        let behaviourStateUpdate = 0;
        let dictionaryStateUpdate = 0;

        const prevAttitude = behaviourStates.attitudeOnComment[commentId] ?? 0;

        // Revoke e.g., -1 => 0 (-1 === -1)
        if (prevAttitude === attitude) {
            behaviourStateUpdate = 0;
            dictionaryStateUpdate = 0 - attitude;
        }
        // Reverse e.g., 1 => -1 (0 > 1 * -1)
        else if (0 > prevAttitude * attitude) {
            behaviourStateUpdate = attitude;
            dictionaryStateUpdate = attitude * 2;
        }
        // Initiate e.g., 0 => 1
        else {
            behaviourStateUpdate = attitude;
            dictionaryStateUpdate = attitude;
        }

        setBehaviourStates({
            ...behaviourStates,
            attitudeOnComment: {
                ...behaviourStates.attitudeOnComment,
                [commentId]: behaviourStateUpdate
            }
        });

        setRestrictedSubcommentComprehensiveDict({
            ...restrictedSubcommentComprehensiveDict,
            [parentId]: {
                ...restrictedSubcommentComprehensiveDict[parentId],
                [commentId]: {
                    ...restrictedSubcommentComprehensiveDict[parentId][commentId],
                    totalLikedCount: restrictedSubcommentComprehensiveDict[parentId][commentId].totalLikedCount + dictionaryStateUpdate,
                }
            }
        });

        const resp = await fetch(`/api/attitude/on/${commentId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ attitude })
        });

        if (200 !== resp.status) {
            console.error(`Attemp to express attitude on a subcomment (subcomment id: ${commentId})`);
        }
    };

    //////////////////////////////////////// POP-UP MENU ////////////////////////////////////////

    type TPopUpMenuStates = {
        anchorEl: null | HTMLElement;
        memberId: string;
        nickname: string;
        referenceId: string;
    };

    const [popUpMenuStates, setPopUpMenuStates] = React.useState<TPopUpMenuStates>({
        anchorEl: null,
        memberId: '',
        nickname: '',
        referenceId: '',
    });

    const handleOpenPopUpMenu = (memberId: string, nickname: string, referenceId: string) => (event: React.MouseEvent<HTMLElement>) => {
        setPopUpMenuStates({ anchorEl: event.currentTarget, memberId, nickname, referenceId, });
    };

    const handleClosePopUpMenu = () => {
        setPopUpMenuStates({ ...popUpMenuStates, anchorEl: null });
    };

    //////////////////////////////////////// FUNCTIONS ////////////////////////////////////////

    const makeParagraph = (paragraph: string, cuedMemberInfoArr: IMemberInfo[]) => {
        // [!] empty cued array
        if (0 === cuedMemberInfoArr.length) {
            return (
                <Typography variant={'body1'} mt={1} key={getRandomHexStr()}>{paragraph}</Typography>
            );
        }
        // [!] no '@' in this paragraph
        if (-1 === paragraph.indexOf('@')) {
            return (<Typography variant={'body1'} mt={1} key={getRandomHexStr()}>{paragraph}</Typography>);
        }
        const elementArr: { text: string, type: string, memberId: string; }[] = [];
        paragraph.split('@').forEach((fragment, i) => {
            let idx = -1;
            for (let j = 0; j < cuedMemberInfoArr.length; j++) {
                const { memberId, nickname } = cuedMemberInfoArr[j];
                idx = fragment.indexOf(nickname);
                if (-1 !== idx) { // [!] matchs cued member nickname
                    // assemble @ + nickname
                    elementArr.push({
                        type: 'link',
                        text: `@${nickname}`,
                        memberId
                    });
                    // push the rest text of this fragment
                    elementArr.push({
                        type: 'text',
                        text: fragment.split(nickname)[1],
                        memberId: ''
                    });
                    return;
                }
            }
            if (-1 === idx) {
                elementArr.push({
                    type: 'text',
                    text: `${0 == i ? '' : '@'}${fragment}`,
                    memberId: ''
                });
            }
        });
        return (
            <Typography variant={'body1'} mt={1} key={getRandomHexStr()}>
                {elementArr.map(element => {
                    if ('text' === element.type) {
                        return element.text;
                    }
                    if ('link' === element.type) {
                        return (
                            <Link href={provideMemberInfoPageUrl(element.memberId, appDomain)} underline={'none'} key={getRandomHexStr()} >
                                {element.text}
                            </Link>
                        );
                    }
                })}
            </Typography>
        );
    };

    const makeTopic = (topicId: string, content: string) => {
        return (
            <Link href={`/query/${topicId}`} underline={'none'} key={getRandomHexStr()} >
                #{content}
            </Link>
        );
    };

    const makeBriefIntro = (briefIntro: any) => {
        if ('string' !== typeof briefIntro) {
            return (<></>);
        }
        return (
            <>
                {briefIntro.split('/n').map(t =>
                    <Typography key={getRandomHexStr()} variant='body1' color={'text.disabled'}>{t}</Typography>
                )}
            </>
        );
    };

    return (
        <>
            <Navbar lang={preferenceStates.lang} />
            {/* post component */}
            <Container disableGutters >
                <Grid container pt={1}>

                    {/* //// placeholder - left //// */}
                    <Grid item xs={0} sm={1} md={1} />

                    {/* //// middle column //// */}
                    <Grid item xs={12} sm={10} md={7} >

                        {/* middle card-stack */}
                        <Stack maxWidth={800} spacing={{ xs: 1, sm: 2 }}>

                            {/* *post */}
                            <ResponsiveCard sx={{ padding: { sm: 4 }, boxShadow: { sm: 1 } }}>

                                {/* post-title: desktop style */}
                                <Box display={{ xs: 'none', sm: 'block' }}>

                                    {/* channel name */}
                                    <Typography variant={'subtitle1'} fontWeight={400} color={'grey'}>{channelInfo_ss.name[preferenceStates.lang]}</Typography>

                                    {/* title */}
                                    <Typography variant={'h6'} fontWeight={700}>{postComprehensive_ss.title}</Typography>

                                    {/* member info & timestamp */}
                                    <TextButton color='inherit' sx={{ flexDirection: 'row', marginTop: 1 }}>
                                        <Typography variant='body2'>{`${authorInfo_ss.nickname} ${timeToString(postComprehensive_ss.createdTimeBySecond, preferenceStates.lang)}`}</Typography>
                                    </TextButton>
                                </Box>

                                {/* post-title: mobile style */}
                                <Stack mt={0.5} direction={'row'} sx={{ display: { xs: 'flex', sm: 'none' } }}>
                                    <IconButton sx={{ padding: 0 }}>
                                        <Avatar src={provideAvatarImageUrl(authorId, imageDomain)} sx={{ width: 38, height: 38, bgcolor: 'grey' }}>{authorInfo_ss.nickname?.charAt(0).toUpperCase()}</Avatar>
                                    </IconButton>
                                    <Grid container ml={1}>

                                        {/* nickname and created time */}
                                        <Grid item >
                                            <TextButton color='inherit' onClick={handleClickOnAuthorNickname}>
                                                <Typography variant='body2' >
                                                    {authorInfo_ss.nickname}
                                                </Typography>
                                                <Typography variant='body2' fontSize={{ xs: 12 }} >
                                                    {timeToString(postComprehensive_ss.createdTimeBySecond, preferenceStates.lang)}
                                                </Typography>
                                            </TextButton>
                                        </Grid>

                                        {/* placeholder */}
                                        <Grid item flexGrow={1}></Grid>

                                        {/* follow button */}
                                        {viewerInfoStates.memberId !== authorId &&
                                            <Grid item>
                                                <Chip label={behaviourStates.followed ? langConfigs.followed[preferenceStates.lang] : langConfigs.follow[preferenceStates.lang]} sx={{ paddingX: 1 }} color={behaviourStates.followed ? 'default' : 'primary'} onClick={async () => { await handleFollowOrUndoFollow(); }} />
                                            </Grid>
                                        }
                                    </Grid>
                                </Stack>

                                {/* image list (conditional rendering)*/}
                                {true && <Box id='swiper-wrapper' mt={{ xs: 1.5, sm: 2 }} >
                                    <Swiper modules={[Navigation, Pagination]} navigation={true} pagination={true} >
                                        {0 !== postComprehensive_ss.imageFullnamesArr.length && postComprehensive_ss.imageFullnamesArr.map(fullname =>
                                            <SwiperSlide key={getRandomHexStr()} onClick={handleBackdropOpen(fullname)}>
                                                {/* swiper slide wrapper */}
                                                <Box sx={{
                                                    display: 'flex', justifyContent: 'center', alignContent: 'center',
                                                    width: swiperWrapperDimensions.width,
                                                    height: swiperWrapperDimensions.height
                                                }} >
                                                    <Box component={'img'} src={provideImageUrl(fullname, imageDomain)}
                                                        width={1}
                                                        maxHeight={500}
                                                        sx={{ objectFit: 'contain' }}></Box>
                                                </Box>
                                            </SwiperSlide>
                                        )}
                                    </Swiper>
                                </Box>}

                                {/* title */}
                                <Box mt={2} display={{ xs: 'flex', sm: 'none' }}>
                                    <Typography variant={'subtitle1'} fontWeight={700}>{postComprehensive_ss.title}</Typography>
                                </Box>

                                {/* paragraphs (conditional rendering)*/}
                                {0 !== postComprehensive_ss.paragraphsArr?.length && <Box mt={{ xs: 1, sm: 2 }}>
                                    {postComprehensive_ss.paragraphsArr.map(p => makeParagraph(p, postComprehensive_ss.cuedMemberInfoArr))}
                                </Box>}

                                {/* topics (conditional rendering) */}
                                {0 !== postComprehensive_ss.topicInfoArr?.length && <Box mt={{ xs: 2, sm: 2 }}>
                                    <Typography variant={'body1'}>
                                        {postComprehensive_ss.topicInfoArr.map(t => makeTopic(t.topicId, t.content))}
                                    </Typography>
                                </Box>}

                                {/* member behaviours */}
                                <Grid container mt={1}>

                                    {/* like */}
                                    <Grid item sx={{ display: 'flex', flexDirection: 'row' }}>
                                        <IconButton aria-label='like' onClick={async () => { await handleExpressAttitudeOnPost(1); }}>
                                            <ThumbUpIcon color={1 === behaviourStates.attitudeOnPost ? 'primary' : 'inherit'} fontSize='small' />
                                        </IconButton>
                                        <Typography variant='body2' sx={{ marginTop: 1 }}>{combinedStatisticsState.totalLikedCount - combinedStatisticsState.totalDislikedCount + behaviourStates.attitudeOnPost}</Typography>
                                    </Grid>

                                    {/* dislike */}
                                    <Grid item sx={{ ml: 1 }}>
                                        <IconButton aria-label='dislike' onClick={async () => { await handleExpressAttitudeOnPost(-1); }}>
                                            <ThumbDownIcon color={-1 === behaviourStates.attitudeOnPost ? 'error' : 'inherit'} fontSize='small' />
                                        </IconButton>
                                    </Grid>

                                    {/* save */}
                                    <Grid item sx={{ display: 'flex', flexDirection: 'row' }}>
                                        <IconButton aria-label='save' onClick={async () => { handleSaveOrUndoSave(); }}>
                                            <BookmarkIcon color={behaviourStates.saved ? 'warning' : 'inherit'} fontSize='small' />
                                        </IconButton>
                                        <Typography variant='body2' sx={{ marginTop: 1 }}>{combinedStatisticsState.totalSavedCount + (behaviourStates.saved ? 1 : 0)}</Typography>
                                    </Grid>

                                    {/* comment */}
                                    <Grid item sx={{ display: 'flex', flexDirection: 'row' }}>
                                        <Tooltip title={langConfigs.createComment[preferenceStates.lang]}>
                                            <IconButton aria-label='comment' onClick={handleEditorOpen(postId, authorId, authorInfo_ss.nickname)}>
                                                <ReplyIcon fontSize='small' />
                                            </IconButton>
                                        </Tooltip>
                                        <Typography variant='body2' sx={{ marginTop: 1 }}>{combinedStatisticsState.totalCommentCount}</Typography>
                                    </Grid>

                                    {/* blank space */}
                                    <Grid item flexGrow={1} />
                                    <Grid item>
                                        <IconButton onClick={handleOpenPopUpMenu(authorId, authorInfo_ss.nickname, postId)} ><MoreVertIcon fontSize='small' /></IconButton>
                                    </Grid>
                                </Grid>

                            </ResponsiveCard>

                            {/* **comments */}
                            {Object.keys(restrictedCommentComprehensiveDict).length !== 0 &&
                                Object.keys(restrictedCommentComprehensiveDict).map(commentId => {
                                    const { memberId: commentAuthorId, nickname: commentAuthorNickname, createdTimeBySecond, content, cuedMemberInfoArr, totalLikedCount: commentTotalLikedCount, totalDislikedCount: commentTotalDislikedCount } = restrictedCommentComprehensiveDict[commentId];
                                    return (
                                        <Box key={commentId}>
                                            <Divider sx={{ display: { xs: 'block', sm: 'none' } }} />
                                            <Box sx={{ padding: { xs: 2, sm: 4 }, borderRadius: 1, boxShadow: { xs: 0, sm: 1 } }}>

                                                {/* member info */}
                                                <Stack direction={'row'}>
                                                    <IconButton sx={{ padding: 0 }}>
                                                        <Avatar src={provideAvatarImageUrl(commentAuthorId, imageDomain)} sx={{ width: 38, height: 38, bgcolor: 'grey' }}>{commentAuthorNickname?.charAt(0).toUpperCase()}</Avatar>
                                                    </IconButton>
                                                    <Box ml={1}>
                                                        <TextButton color='inherit'>
                                                            <Typography variant='body2' >{commentAuthorNickname}</Typography>
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
                                                        <IconButton aria-label='like' onClick={async () => { await handleExpressAttitudeOnComment(commentId, 1); }}>
                                                            <ThumbUpIcon color={1 === behaviourStates.attitudeOnComment[commentId] ? 'primary' : 'inherit'} fontSize='small' />
                                                        </IconButton>
                                                        <Typography variant='body2' sx={{ marginTop: 1 }}>{commentTotalLikedCount - commentTotalDislikedCount}</Typography>
                                                    </Grid>

                                                    {/* dislike */}
                                                    <Grid item sx={{ ml: 1 }}>
                                                        <IconButton aria-label='dislike' onClick={async () => { await handleExpressAttitudeOnComment(commentId, -1); }}>
                                                            <ThumbDownIcon color={-1 === behaviourStates.attitudeOnComment[commentId] ? 'error' : 'inherit'} fontSize='small' />
                                                        </IconButton>
                                                    </Grid>

                                                    {/* comment */}
                                                    <Grid item sx={{ display: 'flex', flexDirection: 'row' }}>
                                                        <Tooltip title={langConfigs.replyToComment[preferenceStates.lang](commentAuthorNickname)}>
                                                            <IconButton aria-label='comment' onClick={handleEditorOpen(commentId, commentAuthorId, commentAuthorNickname)}>
                                                                <ReplyIcon fontSize='small' />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Typography variant='body2' sx={{ marginTop: 1 }}>{restrictedCommentComprehensiveDict[commentId].totalSubcommentCount}</Typography>
                                                    </Grid>

                                                    {/* blank space */}
                                                    <Grid item flexGrow={1} />
                                                    {viewerInfoStates.memberId !== commentAuthorId && <Grid item>
                                                        <IconButton onClick={handleOpenPopUpMenu(commentAuthorId, commentAuthorNickname, commentId)} ><MoreVertIcon fontSize='small' /></IconButton>
                                                    </Grid>}
                                                </Grid>

                                                {/* ***subcomments */}
                                                <Box sx={{ display: 0 !== restrictedCommentComprehensiveDict[commentId].totalSubcommentCount ? 'block' : 'none' }}>

                                                    {/* expend button */}
                                                    <Button variant='text' sx={{ display: restrictedCommentComprehensiveDict[commentId].isExpended ? 'none' : 'block' }} onClick={async () => handleExpendSubcomments(commentId)} >{langConfigs.expendSubcomments[preferenceStates.lang]}</Button>

                                                    {/* subcomment stack (conditional rendering)*/}
                                                    <Stack id={`subcomment-stack-${commentId}`} spacing={1} marginTop={{ xs: 1.5, sm: 2 }} paddingLeft={3} sx={{ display: restrictedCommentComprehensiveDict[commentId].isExpended ? 'block' : 'none' }}>
                                                        {restrictedSubcommentComprehensiveDict.hasOwnProperty(commentId) && Object.keys(restrictedSubcommentComprehensiveDict[commentId]).map(subcommentId => {
                                                            const { memberId: subcommentAuthorId, nickname: subcommentAuthorNickname, createdTimeBySecond, content, cuedMemberInfoArr, totalLikedCount, totalDislikedCount } = restrictedSubcommentComprehensiveDict[commentId][subcommentId];
                                                            return (
                                                                <Box key={subcommentId}>
                                                                    {/* member info */}
                                                                    <Stack direction={'row'}>
                                                                        <IconButton sx={{ padding: 0 }}>
                                                                            <Avatar src={provideAvatarImageUrl(subcommentAuthorId, imageDomain)} sx={{ width: 38, height: 38, bgcolor: 'grey' }}>{subcommentAuthorNickname?.charAt(0).toUpperCase()}</Avatar>
                                                                        </IconButton>
                                                                        <Box ml={1}>
                                                                            <TextButton color='inherit'>
                                                                                <Typography variant='body2' >
                                                                                    {subcommentAuthorNickname}
                                                                                </Typography>
                                                                                <Typography variant='body2' fontSize={{ xs: 12 }} >
                                                                                    {timeToString(createdTimeBySecond, preferenceStates.lang)}
                                                                                </Typography>
                                                                            </TextButton>
                                                                        </Box>
                                                                    </Stack>

                                                                    {/* comment content */}
                                                                    <Box sx={{ paddingTop: 1, paddingX: 1 / 2 }}>
                                                                        {makeParagraph(content, cuedMemberInfoArr)}
                                                                    </Box>

                                                                    {/* behaviours */}
                                                                    <Grid container>

                                                                        {/* like */}
                                                                        <Grid item sx={{ display: 'flex', flexDirection: 'row' }}>
                                                                            <IconButton aria-label='like' onClick={async () => { await handleExpressAttitudeOnSubcomment(commentId, subcommentId, 1); }}>
                                                                                <ThumbUpIcon color={1 === behaviourStates.attitudeOnComment[subcommentId] ? 'primary' : 'inherit'} fontSize='small' />
                                                                            </IconButton>
                                                                            <Typography variant='body2' sx={{ marginTop: 1 }}>{totalLikedCount - totalDislikedCount}</Typography>
                                                                        </Grid>

                                                                        {/* dislike */}
                                                                        <Grid item sx={{ ml: 1 }}>
                                                                            <IconButton aria-label='dislike' onClick={async () => { await handleExpressAttitudeOnSubcomment(commentId, subcommentId, -1); }}>
                                                                                <ThumbDownIcon color={-1 === behaviourStates.attitudeOnComment[subcommentId] ? 'error' : 'inherit'} fontSize='small' />
                                                                            </IconButton>
                                                                        </Grid>

                                                                        {/* reply */}
                                                                        <Grid item sx={{ display: 'flex', flexDirection: 'row' }}>
                                                                            <Tooltip title={langConfigs.replyToComment[preferenceStates.lang](subcommentAuthorNickname)}>
                                                                                <IconButton aria-label='comment' onClick={handleEditorOpen(commentId, subcommentAuthorId, subcommentAuthorNickname)}>
                                                                                    <ReplyIcon fontSize='small' />
                                                                                </IconButton>
                                                                            </Tooltip>
                                                                        </Grid>

                                                                        {/* blank space */}
                                                                        <Grid item flexGrow={1} />
                                                                        {viewerInfoStates.memberId !== subcommentAuthorId && <Grid item>
                                                                            <IconButton onClick={handleOpenPopUpMenu(subcommentAuthorId, subcommentAuthorNickname, commentId)}><MoreVertIcon fontSize='small' /></IconButton>
                                                                        </Grid>}
                                                                    </Grid>
                                                                </Box>
                                                            );
                                                        })}
                                                    </Stack>

                                                    {/* undo expend button */}
                                                    <Button variant='text' sx={{ display: restrictedCommentComprehensiveDict[commentId].isExpended ? 'block' : 'none' }} onClick={handleUndoExpendSubcomments(commentId)} >{langConfigs.undoExpendSubcomments[preferenceStates.lang]}</Button>

                                                </Box>

                                            </Box>
                                        </Box>
                                    );
                                })
                            }

                        </Stack>
                    </Grid>

                    {/* //// right column //// */}
                    <Grid item xs={0} sm={1} md={4} >

                        {/* right card-stack */}
                        <Stack spacing={1} sx={{ ml: 2, maxWidth: 320, display: { xs: 'none', sm: 'none', md: 'block', lg: 'block' } }} >

                            {/* member info card */}
                            <ResponsiveCard sx={{ p: 4 }}>

                                {/* avatar row */}
                                <Box sx={{ display: 'flex', flexDirection: 'row' }}>
                                </Box>
                                <Grid container>

                                    {/* avatar image */}
                                    <Grid item flexGrow={1}>
                                        <Avatar src={provideAvatarImageUrl(authorId, imageDomain)} sx={{ width: 64, height: 64, bgcolor: 'grey' }}>{authorInfo_ss.nickname?.charAt(0).toUpperCase()}</Avatar>
                                    </Grid>

                                    {/* 'follow' button */}
                                    <Grid item sx={{ mt: 2 }} >
                                        {viewerInfoStates.memberId !== authorId &&
                                            <Tooltip title={behaviourStates.followed ? langConfigs.undoFollow[preferenceStates.lang] : langConfigs.follow[preferenceStates.lang]}>
                                                <Button
                                                    variant='contained'
                                                    sx={{ color: behaviourStates.followed ? 'inherit' : 'info', borderRadius: 4, }}
                                                    onClick={async () => { await handleFollowOrUndoFollow(); }}
                                                >
                                                    {behaviourStates.followed ? langConfigs.followed[preferenceStates.lang] : langConfigs.follow[preferenceStates.lang]}
                                                </Button>
                                            </Tooltip>
                                        }
                                    </Grid>
                                </Grid>

                                {/* nickname */}
                                <Box pt={3} sx={{ display: 'flex', flexDirection: 'row' }}>
                                    <Button variant={'text'} color={'inherit'} sx={{ pl: 0, textTransform: 'none' }} onClick={handleClickOnAuthorNickname}>
                                        <Typography sx={{ fontSize: 19 }} fontWeight={700}>{authorInfo_ss.nickname}</Typography>
                                    </Button>
                                </Box>

                                {/* brief intro */}
                                <Box pt={0} maxWidth={200}>
                                    {makeBriefIntro(authorInfo_ss.briefIntro)}
                                </Box>

                                {/* follow */}
                                <Box pt={4} sx={{ display: 'flex', flexDirection: 'row' }}>
                                    <Typography fontWeight={700}>{combinedStatisticsState.totalFollowedByCount + (behaviourStates.followed ? 1 : 0)}</Typography>
                                    <Typography color={'text.disabled'}>{langConfigs.authorsTotalFollowing[preferenceStates.lang]}</Typography>
                                </Box>

                                {/* like */}
                                <Box sx={{ display: 'flex', flexDirection: 'row', }}>
                                    <Typography color={'text.disabled'}> {langConfigs.authorsTotalLikesP1[preferenceStates.lang]}</Typography>
                                    <Typography fontWeight={700}>{(combinedStatisticsState.totalCreationLikedCount + behaviourStates.attitudeOnPost > 0) ? combinedStatisticsState.totalCreationLikedCount + behaviourStates.attitudeOnPost : 0}</Typography>
                                    <Typography color={'text.disabled'}>{langConfigs.authorsTotalLikesP2[preferenceStates.lang]}</Typography>
                                </Box>

                                {/* 'follow' button */}
                                {false && <Box pt={4} sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'center' }}>
                                    <Tooltip title={behaviourStates.followed ? langConfigs.undoFollow[preferenceStates.lang] : langConfigs.follow[preferenceStates.lang]}>
                                        <Button
                                            variant='contained'
                                            sx={{
                                                color: behaviourStates.followed ? 'inherit' : 'info',
                                                borderRadius: 4,
                                                paddingY: 0.5,
                                                paddingX: 5,
                                            }}
                                            onClick={async () => { await handleFollowOrUndoFollow(); }}
                                        >
                                            {behaviourStates.followed ? langConfigs.followed[preferenceStates.lang] : langConfigs.follow[preferenceStates.lang]}
                                        </Button>
                                    </Tooltip>
                                </Box>}

                            </ResponsiveCard>

                            {/* other post recommend in this channel */}
                            <ResponsiveCard sx={{ padding: 3 }}>

                                {/* title */}
                                <Typography>{authorInfo_ss.nickname} {langConfigs.hotPostRecommend[preferenceStates.lang]}</Typography>

                                {/* posts */}
                                <Stack mt={2} spacing={2}>
                                    {0 !== creationInfoArr.length && creationInfoArr.map(p =>
                                        postId !== p.postId && <TextButton key={getRandomHexStr()} sx={{ color: 'inherit', display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }} onClick={handleClickOnPostCard(p.postId)}>

                                            {/* title & statistics */}
                                            <Box pr={1}>
                                                <Typography variant='body1' align='left' >{p.title}</Typography>

                                                {/* post info & statistics */}
                                                <Box sx={{ display: 'flex', flexDirection: 'row' }} alignItems={'center'}>

                                                    {/* comment count icon */}
                                                    <ForumIcon fontSize={'small'} sx={{ color: 'text.disabled' }} />
                                                    <Typography mr={1} variant='body2' color={'text.disabled'} alignItems={'center'}>{p.totalCommentCount}</Typography>

                                                    {/* hit count icon */}
                                                    <BarChartIcon fontSize='small' sx={{ color: 'text.disabled' }} />
                                                    <Typography variant='body2' color={'text.disabled'} alignItems={'center'}>{p.totalHitCount}</Typography>
                                                </Box>
                                                <Box>
                                                    {/* <Typography mr={1} variant='body2' color={'text.disabled'} alignItems={'center'}>{channelInfo_ss.name}</Typography> */}

                                                </Box>
                                            </Box>

                                            {/* image */}
                                            <Box display={{ md: 'none', lg: 'block' }}>
                                                <Box sx={{ width: 100, height: 100, backgroundImage: `url(${provideCoverImageUrl(p.postId, imageDomain)})`, backgroundSize: 'cover' }}></Box>
                                            </Box>
                                        </TextButton>
                                    )}
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
                    <Typography color={editorStates.disableEditor ? 'text.disabled' : 'text.primary'}>{langConfigs.createComment[preferenceStates.lang]}</Typography>
                    {/* content input */}
                    <TextField
                        id='outlined-basic'
                        variant='outlined'
                        rows={4}
                        multiline
                        fullWidth
                        placeholder={langConfigs.editorPlaceholder[preferenceStates.lang](editorStates.parentId, editorStates.nickname)}
                        onChange={handleEditorInput}
                        value={editorStates.content}
                        // onChange={handlePostStatesChange('content')}
                        disabled={editorStates.disableEditor}
                        sx={{ marginTop: 1 }}
                    />
                    {/* blank content alert */}
                    <Box mt={1} sx={{ display: editorStates.displayAlert ? 'block' : 'none' }}>
                        <Alert severity='error'>{editorStates.alertContent}</Alert>
                    </Box>
                    {/* cue & submit button */}
                    <Grid container mt={2} mb={1}>
                        <Grid item>
                            <IconButton onClick={handleCueHelperOpenAndClose} disabled={editorStates.disableEditor}>
                                <AlternateEmailIcon />
                            </IconButton>
                        </Grid>
                        <Grid item flexGrow={1}></Grid>
                        <Grid item>
                            <Box display={'flex'} justifyContent={'end'}>
                                <Button variant='contained' onClick={async () => { await handleSubmitComment(); }} disabled={editorStates.disableEditor}>{langConfigs.submitComment[preferenceStates.lang]}</Button>
                            </Box>
                        </Grid>
                    </Grid>
                    {editorStates.displayCueHelper && <>
                        <Divider />
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
                                                        <Avatar src={provideAvatarImageUrl(memberInfo.memberId, imageDomain)} sx={{ width: 34, height: 34, bgcolor: 'grey' }}>{memberInfo.nickname?.charAt(0).toUpperCase()}</Avatar>
                                                    </Grid>
                                                    <Grid item flexGrow={1}></Grid>
                                                </Grid>
                                                <Typography mt={1} sx={{ minHeight: 33, fontSize: 11, color: editorStates.cuedMemberInfoDict.hasOwnProperty(memberInfo.memberId) ? 'inherit' : 'text.secondary' }}>{getNicknameBrief(memberInfo.nickname)}</Typography>
                                            </Stack>
                                        </Button>
                                    );
                                })}
                            </Stack>
                        </Box>
                    </>}
                </Box>
            </Popover >

            <Copyright sx={{ mt: 8 }} lang={preferenceStates.lang} />
            <Terms sx={{ mb: 4 }} lang={preferenceStates.lang} />

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

            {/* secondary menu */}
            <Menu
                sx={{ mt: '45px' }}
                anchorEl={popUpMenuStates.anchorEl}
                anchorOrigin={{ vertical: 'top', horizontal: 'right', }}
                keepMounted
                transformOrigin={{ vertical: 'top', horizontal: 'right', }}
                open={Boolean(popUpMenuStates.anchorEl)}
                onClose={handleClosePopUpMenu}
                MenuListProps={{}}
            >
                {/* block (identity required) */}
                {('authenticated' === status && viewerInfoStates.memberId !== popUpMenuStates.memberId) &&
                    <MenuItem >
                        <ListItemIcon><BlockIcon fontSize='small' /></ListItemIcon>
                        <ListItemText><Typography variant={'body2'}>{langConfigs.block[preferenceStates.lang](popUpMenuStates.nickname)}</Typography></ListItemText>
                    </MenuItem>}

                {/* report */}
                {viewerInfoStates.memberId !== popUpMenuStates.memberId &&
                    <MenuItem onClick={handleReport}>
                        <ListItemIcon><FlagIcon fontSize='small' /></ListItemIcon>
                        <ListItemText><Typography variant={'body2'}>{langConfigs.report[preferenceStates.lang]}</Typography></ListItemText>
                    </MenuItem>}

                {/* edit post (identity required & post author only) */}
                {('authenticated' === status && authorId === viewerInfoStates.memberId && postId === popUpMenuStates.referenceId) &&
                    <MenuItem onClick={handleEditPost}>
                        <ListItemIcon><EditIcon fontSize='small' /></ListItemIcon>
                        <ListItemText><Typography variant={'body2'}>{langConfigs.editPost[preferenceStates.lang]}</Typography></ListItemText>
                    </MenuItem>}

                {/* delete comment (identity required & comment author only) */}
            </Menu>
        </>
    );
};

export default Post;