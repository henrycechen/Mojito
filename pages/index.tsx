import * as React from 'react';
import { NextPageContext } from 'next/types';

import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { useSession } from 'next-auth/react';

import SvgIcon from '@mui/material/SvgIcon';

import IconButton from '@mui/material/IconButton';

import EmailIcon from '@mui/icons-material/Email';
import BubbleChartIcon from '@mui/icons-material/BubbleChart';
import FormatAlignJustifyIcon from '@mui/icons-material/FormatAlignJustify';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import ReorderIcon from '@mui/icons-material/Reorder';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import CastIcon from '@mui/icons-material/Cast';

import Masonry from '@mui/lab/Masonry';

import Paper from '@mui/material/Paper';

import { FormControlLabel, Menu, styled } from '@mui/material';


import Divider from '@mui/material/Divider';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import BlockIcon from '@mui/icons-material/Block';
import FlagIcon from '@mui/icons-material/Flag';
import ArticleIcon from '@mui/icons-material/Article';
import BarChartIcon from '@mui/icons-material/BarChart';
import ForumIcon from '@mui/icons-material/Forum';

import { useTheme } from '@emotion/react';
import { useRouter } from 'next/router';

import { TBrowsingHelper, LangConfigs } from '../lib/types';
import { updateLocalStorage, restoreFromLocalStorage } from '../lib/utils/general';
import { getNicknameBrief, provideAvatarImageUrl } from '../lib/utils/for/member';
import { CentralizedBox, ResponsiveCard, StyledSwitch, TextButton } from '../ui/Styled';
import Navbar from '../ui/Navbar';
import { IConcisePostComprehensive } from '../lib/interfaces/post';
import { IChannelInfoStates, IChannelInfoDictionary } from '../lib/interfaces/channel';
import Copyright from '../ui/Copyright';
import { IConciseTopicComprehensive } from '../lib/interfaces/topic';
import { provideCoverImageUrl } from '../lib/utils/for/post';
import { getRandomHexStr } from '../lib/utils/create';
import Terms from '../ui/Terms';

const storageName0 = 'PreferenceStates';
// const updatePreferenceStatesCache = updateLocalStorage(storageName0);
const restorePreferenceStatesFromCache = restoreFromLocalStorage(storageName0);

const storageName = 'HomePageProcessStates';
const updateProcessStatesCache = updateLocalStorage(storageName);
const restoreProcessStatesFromCache = restoreFromLocalStorage(storageName);

type THomePageProps = {
    channelInfoDict_ss: IChannelInfoDictionary;
    redirect500: boolean;
};

interface IHomePageProcessStates {
    selectedChannelId: string;
    selectedHotPosts: boolean;
    memorizeChannelBarPositionX: number | undefined;
    memorizeViewPortPositionY: number | undefined;
    memorizeLastViewedPostId: string | undefined;
    wasRedirected: boolean;
}

type TViewerComprehensive = {
    totalFollowedByCount: number;
    totalCreationSavedCount: number;
    totalCreationLikedCount: number;
    reply: number;
};

const domain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? '';
const defaultLang = process.env.NEXT_PUBLIC_APP_LANG ?? 'tw';
const langConfigs: LangConfigs = {
    allPosts: {
        tw: '全部',
        cn: '全部',
        en: 'All posts'
    },
    following: {
        tw: '关注',
        cn: '关注',
        en: 'Followed'
    },
    hotPosts: {
        tw: '熱門',
        cn: '最热',
        en: 'Hotest'
    },
    newPosts: {
        tw: '最新',
        cn: '最新',
        en: 'Newest'
    },
    totalCreationsCount: {
        tw: '創作',
        cn: '发帖',
        en: 'Creations'
    },
    totalFollowedByCount: {
        tw: '訂閲',
        cn: '粉丝',
        en: 'Followers'
    },
    totalCreationSavedCount: {
        tw: '收藏',
        cn: '收藏',
        en: 'Saves'
    },
    totalCreationLikedCount: {
        tw: '喜歡',
        cn: '点赞',
        en: 'Likes'
    },
    unreadReplyNotice: {
        tw: `條未讀消息`,
        cn: `条未读提醒`,
        en: `Unread reply`
    },
    tredingTopics: {
        tw: '熱門話題',
        cn: '热门话题',
        en: 'Trending topics'
    },
    todaysTrendingPosts: {
        tw: '今日熱門',
        cn: '当日热帖',
        en: 'Trending posts today'
    },
    thisWeeksTrendingPosts: {
        tw: '本周熱門',
        cn: '本周热帖',
        en: 'Trending posts this week'
    },
    totalHitCount: {
        tw: '瀏覽',
        cn: '浏览',
        en: 'views'
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
export async function getServerSideProps(context: NextPageContext): Promise<{ props: THomePageProps; }> {
    let channelInfoDict_ss: IChannelInfoDictionary;

    const resp = await fetch(`${domain}/api/channel/info/dictionary`);
    console.log(resp.status);
    
    try {
        if (200 !== resp.status) {
            throw new Error();
        }
        channelInfoDict_ss = await resp.json();
    } catch (e) {
        if (e instanceof SyntaxError) {
            console.log(`Attempt to parse channel info dictionary (JSON) from resp. ${e}`);
        } else {
            console.log('Attempt to GET channel info dictionary');
        }
        return {
            props: {
                channelInfoDict_ss: {},
                redirect500: true
            }
        };
    }
    return {
        props: {
            channelInfoDict_ss,
            redirect500: false
        }
    };
}

const Home = ({ channelInfoDict_ss }: THomePageProps) => {

    const router = useRouter();
    const { data: session, status } = useSession();
    // status - 'unauthenticated' / 'authenticated'

    let viewerId = '';
    React.useEffect(() => {
        if ('authenticated' === status) {
            const authorSession: any = { ...session };
            viewerId = authorSession?.user?.id;
            restorePreferenceStatesFromCache(setPreferenceStates);
        }
    }, [session]);

    //////// REF - masonry ////////
    const masonryWrapper = React.useRef<any>();
    const [width, setWidth] = React.useState(375); // default change from 636 to 375 (width of iPhone se 2)
    React.useEffect(() => { setWidth(masonryWrapper?.current?.offsetWidth); }, []);

    //////// STATES - preference ////////
    const [preferenceStates, setPreferenceStates] = React.useState<any>({
        lang: defaultLang,
        mode: 'light'
    });

    //////// STATES - process ////////
    const [processStates, setProcessStates] = React.useState<IHomePageProcessStates>({
        selectedChannelId: '',
        selectedHotPosts: false,
        memorizeChannelBarPositionX: undefined,
        memorizeViewPortPositionY: undefined,
        memorizeLastViewedPostId: undefined,
        wasRedirected: false,
    });

    React.useEffect(() => { restoreProcessStatesFromCache(setProcessStates); }, []);

    //////////////////////////////////////// VIEWING ////////////////////////////////////////

    //////// STATES - viewer's notice statistics ////////
    const [viewersNoticeStatistics, setViewersNoticeStatistics] = React.useState<number>(0);

    React.useEffect(() => { if ('authenticated' === status) { updateNoticeStatistics(); } }, [status]);

    const updateNoticeStatistics = async () => {
        const resp = await fetch(`/api/notice/statistics`);
        if (200 === resp.status) {
            try {
                const { cue, reply } = await resp.json();
                setViewersNoticeStatistics(cue + reply);
            } catch (e) {
                console.log(`Attempt to GET notice statistics. ${e}`);
            }
        }
    };

    const handleClickOnUnreadMessage = () => {
        router.push(`/me/message`);
    };

    //////// STATES - browsing helper ////////
    const [browsingHelper, setBrowsingHelper] = React.useState<TBrowsingHelper>({
        memorizeViewPortPositionY: undefined, // reset scroll-help on handleChannelSelect, handleSwitchChange, ~~handlePostCardClick~~
    });

    ///////// STATES - channel /////////
    const [channelInfoStates, setChannelInfoStates] = React.useState<IChannelInfoStates>({
        channelIdSequence: [],
    });

    React.useEffect(() => { updateChannelIdSequence(); }, []);

    const updateChannelIdSequence = async () => {
        const resp = await fetch(`/api/channel/id/sequence`);
        if (200 !== resp.status) {
            setChannelInfoStates({ ...channelInfoStates, channelIdSequence: Object.keys(channelInfoDict_ss) });
            console.log(`Attemp to GET channel id array. Using sequence from channel info dictionary instead`);
            return;
        }
        try {
            const idArr = await resp.json();
            setChannelInfoStates({ ...channelInfoStates, channelIdSequence: [...idArr] });
        } catch (e) {
            console.log(`Attemp to parese channel id array. ${e}`);
        } finally {
            setChannelInfoStates({ ...channelInfoStates, channelIdSequence: Object.keys(channelInfoDict_ss) });
        }

    };

    // Handle channel bar restore on refresh
    React.useEffect(() => {
        if (!!processStates.memorizeChannelBarPositionX) {
            document.getElementById('channel-bar')?.scrollBy(processStates.memorizeChannelBarPositionX ?? 0, 0);
        }
    }, [channelInfoStates.channelIdSequence]);

    //// Handle channel select
    const handleChannelSelect = (channelId: string) => (event: React.MouseEvent<HTMLButtonElement> | React.SyntheticEvent) => {
        let states: IHomePageProcessStates = { ...processStates };
        states.selectedChannelId = channelId;
        states.memorizeChannelBarPositionX = document.getElementById('channel-bar')?.scrollLeft;
        // #1 update process states
        setProcessStates(states);
        // #2 presist process states to cache
        updateProcessStatesCache(states);
        // #3 reset browsing helper
        setBrowsingHelper({ ...browsingHelper, memorizeViewPortPositionY: undefined });
    };

    // Handle newest/hotest posts switch
    const handleSwitchChange = () => {
        let states: IHomePageProcessStates = { ...processStates, selectedHotPosts: !processStates.selectedHotPosts };
        // #1 update process states
        setProcessStates(states);
        // #2 presist process states to cache
        updateProcessStatesCache(states);
        // #3 reset browsing helper
        setBrowsingHelper({ ...browsingHelper, memorizeViewPortPositionY: undefined });
    };

    //////////////////////////////////////// MASONRY ////////////////////////////////////////

    //////// STATE - posts (masonry) ////////
    const [masonryPostInfoArr, setMasonryPostInfoArr] = React.useState<IConcisePostComprehensive[]>([]);

    React.useEffect(() => { updatePostsArr(); }, [processStates.selectedChannelId, processStates.selectedHotPosts]);

    const updatePostsArr = async () => {
        const resp = await fetch(`/api/post/s/of${processStates.selectedHotPosts ? '/trend/24h' : '/new'}?channelId=${processStates.selectedChannelId}`);
        if (200 === resp.status) {
            try {
                setMasonryPostInfoArr(await resp.json());
            } catch (e) {
                console.log(`Attempt to GET posts of ${processStates.selectedHotPosts ? '24 hours hot' : 'new'}. ${e}`);
            }
        }
    };

    // Handle restore browsing position after reload
    React.useEffect(() => {
        if (processStates.wasRedirected) {
            const postId = processStates.memorizeLastViewedPostId;
            // #1 restore browsing position
            if (!postId) {
                return;
            } else if (600 > window.innerWidth) { // 0 ~ 599
                setBrowsingHelper({ ...browsingHelper, memorizeViewPortPositionY: (document.getElementById(postId)?.offsetTop ?? 0) / 2 - 200 });
            } else { // 600 ~ ∞
                setBrowsingHelper({ ...browsingHelper, memorizeViewPortPositionY: processStates.memorizeViewPortPositionY });
            }
            let states: IHomePageProcessStates = { ...processStates, memorizeLastViewedPostId: undefined, memorizeViewPortPositionY: undefined, wasRedirected: false };
            // #2 update process states
            setProcessStates(states);
            // #3 update process state cache
            updateProcessStatesCache(states);
        }
    }, [masonryPostInfoArr]);

    if (!!browsingHelper.memorizeViewPortPositionY) {
        window.scrollTo(0, browsingHelper.memorizeViewPortPositionY ?? 0);
    }

    const handleClickOnPost = (postId: string) => (event: React.MouseEvent) => {
        // Update process state cache
        updateProcessStatesCache({ ...processStates, memorizeLastViewedPostId: postId, memorizeViewPortPositionY: window.scrollY, wasRedirected: true });
        // Jump
        router.push(`/post/${postId}`);
    };

    const handleClickOnMemberInfo = (memberId: string, postId: string) => (event: React.MouseEvent) => {
        // Update process state cache
        updateProcessStatesCache({ ...processStates, memorizeLastViewedPostId: postId, memorizeViewPortPositionY: window.scrollY, wasRedirected: true });
        // Jump
        router.push(`/me/id/${memberId}`);
    };


    //////////////////////////////////////// RIGHT COLUMN ////////////////////////////////////////
    type TRightColumnStates = {
        topicInfoArr: IConciseTopicComprehensive[];
        todaysTrendPostInfoArr: IConcisePostComprehensive[];
        weeksTrendPostInfoArr: IConcisePostComprehensive[];
    };

    const [rightColumnStates, setRightColumnStates] = React.useState<TRightColumnStates>({
        topicInfoArr: [],
        todaysTrendPostInfoArr: [],
        weeksTrendPostInfoArr: []
    });

    React.useEffect(() => { updateRightColumnStates(); }, []);

    const updateRightColumnStates = async () => {
        let a0: IConciseTopicComprehensive[] = [];
        let a1: IConcisePostComprehensive[] = [];
        let a2: IConcisePostComprehensive[] = [];
        const resp0 = await fetch(`/api/topic/s/of/trend`);
        const resp1 = await fetch(`/api/post/s/of/trend/24h?channelId=all`);
        const resp2 = await fetch(`/api/post/s/of/trend/7d?channelId=all`);
        try {
            if (200 !== resp0.status) {
                throw new Error(`Attempt to GET topic info array of trending`);
            }
            const _a0 = await resp0.json();
            a0.push(..._a0);
            if (200 !== resp1.status) {
                throw new Error(`Attempt to GET post info array of trending today`);
            }
            const _a1 = await resp1.json();
            a1.push(..._a1);
            if (200 !== resp2.status) {
                throw new Error(`Attempt to GET post info array of trending this week`);
            }
            const _a2 = await resp2.json();
            a2.push(..._a2);
        } catch (e: any) {
            if (e instanceof SyntaxError) {
                console.log(`Attempt to parse info array (JSON string) from resp. ${e}`);
            } else {
                console.log(e?.msg);
            }
        }
        setRightColumnStates({ topicInfoArr: [...a0], todaysTrendPostInfoArr: [...a1], weeksTrendPostInfoArr: [...a2] });
    };

    //////////////////////////////////////// VIEWER BEHAVIOURS ////////////////////////////////////////

    const handleBlock = async () => {
        const memberId = popUpMenuStates.memberId;

        setPopUpMenuStates({ anchorEl: null, memberId: '', nickname: '', referenceId: '', });

        if ('authenticated' !== status) {
            router.push(`/signin`);
            return;
        }
        const resp = await fetch(`/api/block/${memberId}`, { method: 'POST' });
        if (200 !== resp.status) {
            console.log(`Attemp to block member (member id: ${memberId})`);
        }
        const arr = masonryPostInfoArr.filter(p => p.memberId !== memberId);
        setMasonryPostInfoArr([...arr]);
    };

    const handleReport = () => {
        const memberId = popUpMenuStates.memberId;
        const referenceId = popUpMenuStates.referenceId;

        setPopUpMenuStates({ anchorEl: null, memberId: '', nickname: '', referenceId: '', });

        router.push(`/report?memberId=${memberId}&referenceId=${referenceId}`);
    };

    //////////////////////////////////////// POP-UP MENU ////////////////////////////////////////

    type TPopUpMenuStates = {
        anchorEl: null | HTMLElement;
        memberId: string;
        nickname: string;
        referenceId: string;
    };

    //////// STATES - pop up menu ////////
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


    return (
        <>
            <Navbar />
            <Grid container>

                {/* //// placeholder - left //// */}
                <Grid item xs={0} sm={0} md={0} lg={0} xl={2}></Grid>

                {/* //// left column //// */}
                <Grid item xs={0} sm={0} md={2} lg={2} xl={1}>
                    <Stack spacing={1} sx={{ marginX: 1, display: { xs: 'none', sm: 'none', md: 'block' } }} >

                        {/* channel menu (desktop mode) */}
                        <ResponsiveCard sx={{ padding: 1 }}>
                            <MenuList>

                                {/* the 'all' menu item */}
                                <MenuItem onClick={handleChannelSelect('all')} selected={processStates.selectedChannelId === 'all'}>
                                    <ListItemIcon>
                                        <ReorderIcon />
                                    </ListItemIcon>
                                    <ListItemText>
                                        <Typography>{langConfigs.allPosts[preferenceStates.lang]}</Typography>
                                    </ListItemText>
                                </MenuItem>

                                {/* the 'following' menu item */}
                                <MenuItem onClick={handleChannelSelect('following')} selected={'following' === processStates.selectedChannelId}>
                                    <ListItemIcon>
                                        <NotificationsActiveIcon />
                                    </ListItemIcon>
                                    <ListItemText>
                                        <Typography>{langConfigs.following[preferenceStates.lang]}</Typography>
                                    </ListItemText>
                                </MenuItem>

                                {/* other channels */}
                                {channelInfoStates.channelIdSequence.map(id => {
                                    const { channelId, name, svgIconPath } = channelInfoDict_ss[id];
                                    return (
                                        <MenuItem key={`item-${channelId}`}
                                            onClick={handleChannelSelect(channelId)}
                                            selected={channelId === processStates.selectedChannelId}
                                        >
                                            <ListItemIcon >
                                                <SvgIcon><path d={svgIconPath} /></SvgIcon>
                                            </ListItemIcon>
                                            <ListItemText>
                                                <Typography>{name[preferenceStates.lang]}</Typography>
                                            </ListItemText>
                                        </MenuItem>
                                    );
                                })}
                            </MenuList>
                        </ResponsiveCard>

                        {/* hotest / newest switch */}
                        <ResponsiveCard sx={{ padding: 0, paddingY: 2, paddingLeft: 2 }}>
                            <FormControlLabel
                                control={<StyledSwitch sx={{ ml: 1 }} checked={processStates.selectedHotPosts} />}
                                label={processStates.selectedHotPosts ? langConfigs.hotPosts[preferenceStates.lang] : langConfigs.newPosts[preferenceStates.lang]}
                                onChange={handleSwitchChange}
                                sx={{ marginRight: 0 }}
                            />
                        </ResponsiveCard>
                    </Stack>
                </Grid>

                {/* //// middle column //// */}
                <Grid item xs={12} sm={12} md={7} lg={7} xl={5} >

                    {/* channel bar (mobile mode) */}
                    <Stack direction={'row'} id='channel-bar' sx={{ display: { sm: 'flex', md: 'none' }, padding: 1, overflow: 'auto' }}>

                        {/* trend / new switch */}
                        <Box minWidth={110}>
                            <FormControlLabel
                                control={<StyledSwitch sx={{ ml: 1 }} checked={processStates.selectedHotPosts} />}
                                label={processStates.selectedHotPosts ? langConfigs.hotPosts[preferenceStates.lang] : langConfigs.newPosts[preferenceStates.lang]}
                                onChange={handleSwitchChange}
                            />
                        </Box>

                        {/* the 'all' button */}
                        <Button variant={'all' === processStates.selectedChannelId ? 'contained' : 'text'} size='small' onClick={handleChannelSelect('all')}>
                            <Typography variant='body2' color={'all' === processStates.selectedChannelId ? 'white' : "text.secondary"} sx={{ backgroundColor: 'primary' }}>
                                {langConfigs.allPosts[preferenceStates.lang]}
                            </Typography>
                        </Button>

                        {/* the 'following' button */}
                        <Button variant={'following' === processStates.selectedChannelId ? 'contained' : 'text'} size='small' onClick={handleChannelSelect('all')}>
                            <Typography variant='body2' color={'following' === processStates.selectedChannelId ? 'white' : "text.secondary"} sx={{ backgroundColor: 'primary' }}>
                                {langConfigs.following[preferenceStates.lang]}
                            </Typography>
                        </Button>

                        {/* other channels */}
                        {channelInfoStates.channelIdSequence.map(id => {
                            const { channelId, name } = channelInfoDict_ss[id];
                            return (
                                <Button variant={channelId === processStates.selectedChannelId ? 'contained' : 'text'} key={`button-${channelId}`} size='small' onClick={handleChannelSelect(channelId)}>
                                    <Typography
                                        variant={'body2'}
                                        color={channelId === processStates.selectedChannelId ? 'white' : 'text.secondary'}
                                        sx={{ backgroundColor: 'primary' }}>
                                        {name[preferenceStates.lang]}
                                    </Typography>
                                </Button>
                            );
                        })}
                    </Stack>

                    {/* mansoy */}
                    <Box ml={1} ref={masonryWrapper}>
                        <Masonry columns={{ xs: 2, sm: 3, md: 2, lg: 3, xl: 3 }}>

                            {/* posts */}
                            {0 !== masonryPostInfoArr.length && masonryPostInfoArr.map(p => {
                                return (
                                    <Paper key={p.postId} id={p.postId} sx={{ maxWidth: 300, '&:hover': { cursor: 'pointer' } }} >
                                        <Stack>
                                            {/* image */}
                                            <Box
                                                component={'img'}
                                                src={p.imageUrlsArr[0]} // FIXME:FIXME:FIXME:FIXME:FIXME:FIXME:FIXME:FIXME:FIXME:FIXME:FIXME:FIXME:FIXME:
                                                // src={provideCoverImageUrl(post.postId, domain)} FIXME:FIXME:FIXME:FIXME:FIXME:FIXME:
                                                sx={{ maxWidth: { xs: width / 2, sm: 300 }, height: 'auto', borderTopLeftRadius: 4, borderTopRightRadius: 4 }}
                                                onClick={handleClickOnPost(p.postId)}
                                            ></Box>

                                            {/* title */}
                                            <Box paddingTop={2} paddingX={2} onClick={handleClickOnPost(p.postId)}>
                                                <Typography variant={'body1'}>{p.title}</Typography>
                                            </Box>

                                            {/* member info & member behaviour */}
                                            <Box paddingTop={1} >
                                                <Grid container>

                                                    {/* member info */}
                                                    <Grid item flexGrow={1}>
                                                        <Box display={'flex'} flexDirection={'row'}>
                                                            <Button variant={'text'} color={'inherit'} sx={{ textTransform: 'none' }} onClick={handleClickOnMemberInfo(p.memberId, p.postId)}>
                                                                <Avatar src={provideAvatarImageUrl(p.memberId, domain)} sx={{ width: { xs: 24, sm: 32 }, height: { xs: 24, sm: 32 }, bgcolor: 'grey' }}>{p.nickname?.charAt(0).toUpperCase()}</Avatar>
                                                                <Box ml={1}>
                                                                    <Typography variant='body2'>{getNicknameBrief(p.nickname)}</Typography>
                                                                </Box>
                                                            </Button>
                                                        </Box>
                                                    </Grid>

                                                    {/* member behaviour / placeholder */}
                                                    <Grid item >
                                                        <IconButton onClick={handleOpenPopUpMenu(p.memberId, p.nickname, p.postId)}><MoreVertIcon /></IconButton>
                                                    </Grid>
                                                </Grid>
                                            </Box>
                                        </Stack>
                                    </Paper>
                                );
                            })}
                        </Masonry>
                    </Box>

                </Grid>

                {/* //// right column //// */}
                <Grid item xs={0} sm={0} md={3} lg={3} xl={2}>

                    {/* viewer info stack */}
                    {'authenticated' === status && <Stack spacing={1} sx={{ marginX: 1, display: { xs: 'none', sm: 'none', md: 'flex' } }} >

                        {/* unread message statistics */}
                        <ResponsiveCard sx={{ paddingY: 2 }}>
                            <CentralizedBox>
                                <Button variant='text' color='inherit' onClick={handleClickOnUnreadMessage}>
                                    <EmailIcon sx={{ color: 'grey' }} />
                                    <Typography variant='body1' sx={{ marginTop: 0.1, marginLeft: 1 }}>{viewersNoticeStatistics}{langConfigs.unreadReplyNotice[preferenceStates.lang]}</Typography>
                                </Button>
                            </CentralizedBox>
                        </ResponsiveCard>
                    </ Stack>}

                    {/* topics and posts stack */}
                    <Stack spacing={1} sx={{ marginX: 1, display: { xs: 'none', sm: 'none', md: 'flex' } }} >

                        {/* topic trending */}
                        <ResponsiveCard sx={{ padding: { lg: 3, xl: 2 } }} mt={2}>

                            {/* trending title */}
                            <Typography>{langConfigs.tredingTopics[preferenceStates.lang]}</Typography>
                            <Stack mt={1} spacing={2}>

                                {/* topics */}
                                {0 !== rightColumnStates.topicInfoArr.length && rightColumnStates.topicInfoArr.map(t =>
                                    <TextButton key={getRandomHexStr()} color={'inherit'} sx={{ textTransform: 'none' }} >

                                        {/* topic name */}
                                        <Typography variant='body1'>#{t.content}</Typography>

                                        {/* topic info & statistics */}
                                        <Box sx={{ display: 'flex', flexDirection: 'row' }} alignItems={'center'}>
                                            <Typography mr={1} variant='body2' color={'text.disabled'} alignItems={'center'}>{channelInfoDict_ss[t.channelId].name[preferenceStates.lang]}</Typography>

                                            {/* posts count icon */}
                                            <ArticleIcon fontSize='small' sx={{ color: 'text.disabled' }} />
                                            <Typography mr={1} variant='body2' color={'text.disabled'} alignItems={'center'}>{t.totalPostCount}</Typography>

                                            {/* hit count icon */}
                                            <BarChartIcon fontSize='small' sx={{ color: 'text.disabled' }} />
                                            <Typography variant='body2' color={'text.disabled'} alignItems={'center'}>{t.totalHitCount}</Typography>
                                        </Box>

                                    </TextButton>
                                )}
                            </Stack>
                        </ResponsiveCard>

                        {/* 24h trend */}
                        <ResponsiveCard sx={{ padding: { lg: 3, xl: 2 } }} mt={2}>

                            {/* trending title */}
                            <Typography>{langConfigs.todaysTrendingPosts[preferenceStates.lang]}</Typography>
                            <Stack mt={1} spacing={2}>

                                {/* posts */}
                                {0 !== rightColumnStates.todaysTrendPostInfoArr.length && rightColumnStates.todaysTrendPostInfoArr.map(p =>
                                    <TextButton key={getRandomHexStr()} sx={{ color: 'inherit', display: 'flex', flexDirection: 'row', justifyContent: 'flex-start' }}>

                                        {/* title & statistics */}
                                        <Box pr={1}>
                                            <Typography variant='body1' align='left'  >{p.title}</Typography>

                                            {/* post info & statistics */}
                                            <Box sx={{ display: 'flex', flexDirection: 'row' }} alignItems={'center'}>
                                                <Typography mr={1} variant='body2' color={'text.disabled'} alignItems={'center'}>{channelInfoDict_ss[p.channelId].name[preferenceStates.lang]}</Typography>

                                                {/* comment count icon */}
                                                <ForumIcon fontSize={'small'} sx={{ color: 'text.disabled' }} />
                                                <Typography mr={1} variant='body2' color={'text.disabled'} alignItems={'center'}>{p.totalCommentCount}</Typography>

                                                {/* hit count icon */}
                                                <BarChartIcon fontSize='small' sx={{ color: 'text.disabled' }} />
                                                <Typography variant='body2' color={'text.disabled'} alignItems={'center'}>{p.totalHitCount}</Typography>
                                            </Box>
                                        </Box>

                                        {/* image */}
                                        <Box display={{ md: 'none', lg: 'block' }}>
                                            <Box sx={{ width: 100, height: 100, backgroundImage: `url(${provideCoverImageUrl(p.postId, domain)})`, backgroundSize: 'cover' }}></Box>
                                        </Box>
                                    </TextButton>
                                )}
                            </Stack>
                        </ResponsiveCard>

                        {/* 7d trend */}
                        <ResponsiveCard sx={{ padding: { lg: 3, xl: 2 } }} mt={2}>

                            {/* trending title */}
                            <Typography>{langConfigs.thisWeeksTrendingPosts[preferenceStates.lang]}</Typography>
                            <Stack mt={1} spacing={2}>

                                {/* posts */}
                                {0 !== rightColumnStates.weeksTrendPostInfoArr.length && rightColumnStates.weeksTrendPostInfoArr.map(p =>
                                    <TextButton key={getRandomHexStr()} sx={{ color: 'inherit', display: 'flex', flexDirection: 'row', justifyContent: 'flex-start' }}>

                                        {/* title & statistics */}
                                        <Box pr={1}>
                                            <Typography variant='body1' align='left' >{p.title}</Typography>

                                            {/* post info & statistics */}
                                            <Box sx={{ display: 'flex', flexDirection: 'row' }} alignItems={'center'}>
                                                <Typography mr={1} variant='body2' color={'text.disabled'} alignItems={'center'}>{channelInfoDict_ss[p.channelId].name[preferenceStates.lang]}</Typography>

                                                {/* comment count icon */}
                                                <ForumIcon fontSize={'small'} sx={{ color: 'text.disabled' }} />
                                                <Typography mr={1} variant='body2' color={'text.disabled'} alignItems={'center'}>{p.totalCommentCount}</Typography>

                                                {/* hit count icon */}
                                                <BarChartIcon fontSize='small' sx={{ color: 'text.disabled' }} />
                                                <Typography variant='body2' color={'text.disabled'} alignItems={'center'}>{p.totalHitCount}</Typography>
                                            </Box>
                                        </Box>

                                        {/* image */}
                                        <Box display={{ md: 'none', lg: 'block' }}>
                                            <Box sx={{ width: 100, height: 100, backgroundImage: `url(${provideCoverImageUrl(p.postId, domain)})`, backgroundSize: 'cover' }}></Box>
                                        </Box>
                                    </TextButton>
                                )}
                            </Stack>
                        </ResponsiveCard>

                    </Stack>
                </Grid>

                {/* //// placeholder - right //// */}
                <Grid item xs={0} sm={0} md={0} lg={0} xl={1}></Grid>
            </Grid>

            {/* copyright */}
            <Copyright sx={{ mt: 8 }} lang={preferenceStates.lang} />
            <Terms sx={{ mb: 8 }} lang={preferenceStates.lang} />

            {/* pop-up memu */}
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
                {('authenticated' === status && viewerId !== popUpMenuStates.memberId) &&
                    <MenuItem onClick={async () => { await handleBlock(); }}>
                        <ListItemIcon><BlockIcon fontSize='small' /></ListItemIcon>
                        <ListItemText><Typography variant={'body2'}>{langConfigs.block[preferenceStates.lang](popUpMenuStates.nickname)}</Typography></ListItemText>
                    </MenuItem>}

                {/* report */}
                {viewerId !== popUpMenuStates.memberId &&
                    <MenuItem onClick={handleReport}>
                        <ListItemIcon><FlagIcon fontSize='small' /></ListItemIcon>
                        <ListItemText><Typography variant={'body2'}>{langConfigs.report[preferenceStates.lang]}</Typography></ListItemText>
                    </MenuItem>}
            </Menu>

        </>
    );
};

export default Home;