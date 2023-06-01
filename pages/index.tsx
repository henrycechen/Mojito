import * as React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { signIn, useSession } from 'next-auth/react';
import useTheme from '@mui/material/styles/useTheme';
import useScrollTrigger from '@mui/material/useScrollTrigger';

import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Slide from '@mui/material/Slide';
import Typography from '@mui/material/Typography';

import Menu from '@mui/material/Menu';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';

import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import ArticleIcon from '@mui/icons-material/Article';
import BarChartIcon from '@mui/icons-material/BarChart';
import BlockIcon from '@mui/icons-material/Block';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import CreateIcon from '@mui/icons-material/Create';
import EditIcon from '@mui/icons-material/Edit';
import EmailIcon from '@mui/icons-material/Email';
import FlagIcon from '@mui/icons-material/Flag';
import IconButton from '@mui/material/IconButton';
import ListAltIcon from '@mui/icons-material/ListAlt';
import MarkEmailUnreadIcon from '@mui/icons-material/MarkEmailUnread';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import NotificationsIcon from '@mui/icons-material/Notifications';
import ReorderIcon from '@mui/icons-material/Reorder';
import SearchIcon from '@mui/icons-material/Search';
import SettingsIcon from '@mui/icons-material/Settings';
import SvgIcon from '@mui/material/SvgIcon';

import Masonry from '@mui/lab/Masonry';

import { StyledSwitch } from '../ui/Styled';
import { ColorModeContext } from '../ui/Theme';
import Copyright from '../ui/Copyright';
import Guidelines from '../ui/Guidelines';
import Navbar from '../ui/Navbar';
import Terms from '../ui/Terms';

import { TBrowsingHelper, LangConfigs, TPreferenceStates } from '../lib/types';
import { IConcisePostComprehensive } from '../lib/interfaces/post';
import { IConciseTopicComprehensive } from '../lib/interfaces/topic';
import { IChannelInfo, IChannelInfoDictionary } from '../lib/interfaces/channel';

import { updateLocalStorage, restoreFromLocalStorage } from '../lib/utils/general';
import { getNicknameBrief, provideAvatarImageUrl } from '../lib/utils/for/member';
import { provideCoverImageUrl } from '../lib/utils/for/post';
import { getRandomHexStr } from '../lib/utils/create';
import LangSwitch from '../ui/LangSwitch';

const storageName0 = 'PreferenceStates';
const restorePreferenceStatesFromCache = restoreFromLocalStorage(storageName0);

const storageName = 'HomePageProcessStates';
const updateProcessStatesCache = updateLocalStorage(storageName);
const restoreProcessStatesFromCache = restoreFromLocalStorage(storageName);

const imageDomain = process.env.NEXT_PUBLIC_IMAGE_DOMAIN ?? '';
const desc = process.env.NEXT_PUBLIC_APP_DESCRIPTION ?? '';
const lang = process.env.NEXT_PUBLIC_APP_LANG ?? 'tw';
const langConfigs: LangConfigs = {
    // Left column
    signIn: {
        tw: '登入',
        cn: '登入',
        en: 'Sign in'
    },
    posts: {
        tw: '文章',
        cn: '文章',
        en: 'Posts'
    },
    follow: {
        tw: '關注',
        cn: '关注',
        en: 'Followed'
    },
    query: {
        tw: '搜尋',
        cn: '搜索',
        en: 'Query'
    },
    messages: {
        tw: '訊息',
        cn: '消息',
        en: 'Messages'
    },
    unread: {
        tw: `未讀`,
        cn: `未读`,
        en: `Unread`
    },
    member: {
        tw: '主頁',
        cn: '主页',
        en: 'Member'
    },
    settings: {
        tw: '設定',
        cn: '设定',
        en: 'Settings'
    },
    create: {
        tw: '創作',
        cn: '创作',
        en: 'Create'
    },

    // Channel menu
    all: {
        tw: '全部',
        cn: '全部',
        en: 'All'
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
    noPosts: {
        tw: '還沒有作者在該頻道發佈過文章',
        cn: '还没有作者在该频道发布过文章',
        en: 'No articles in this channel'
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
        tw: '今日熱門文章',
        cn: '今日热门文章',
        en: 'Trending posts today'
    },
    thisWeeksTrendingPosts: {
        tw: '本周熱門文章',
        cn: '本周热门文章',
        en: 'Trending posts this week'
    },
    totalHitCount: {
        tw: '瀏覽',
        cn: '浏览',
        en: 'views'
    },
    edit: {
        tw: `編輯文章`,
        cn: `编辑文章`,
        en: `Edit post`,
    },
    block: {
        tw: `屏蔽`,
        cn: `屏蔽`,
        en: `Block`,
    },
    report: {
        tw: '檢舉',
        cn: '举报',
        en: 'Report',
    },
};

const Home = () => {

    const router = useRouter();

    const { data: session, status } = useSession();
    // status - 'unauthenticated' / 'authenticated'

    React.useEffect(() => {
        if ('authenticated' === status) {
            const viewerSession: any = { ...session };
            setProcessStates({ ...processStates, viewerId: viewerSession?.user?.id ?? '' });
            restorePreferenceStatesFromCache(setPreferenceStates);
        }
    }, [status]);

    // States - preference
    const [preferenceStates, setPreferenceStates] = React.useState<TPreferenceStates>({
        lang: lang,
        mode: 'light'
    });

    const setLang = () => {
        if ('tw' === preferenceStates.lang) { setPreferenceStates({ ...preferenceStates, lang: 'cn' }); }
        if ('cn' === preferenceStates.lang) { setPreferenceStates({ ...preferenceStates, lang: 'en' }); }
        if ('en' === preferenceStates.lang) { setPreferenceStates({ ...preferenceStates, lang: 'tw' }); }
    };

    type TProcessStates = {
        viewerId: string;
        selectedChannelId: string;
        selectedHotPosts: boolean;
        memorizeChannelBarPositionX: number | undefined;
        memorizeViewPortPositionY: number | undefined;
        memorizeLastViewedPostId: string | undefined;
        wasRedirected: boolean;
    };

    // States - process
    const [processStates, setProcessStates] = React.useState<TProcessStates>({
        viewerId: '',
        selectedChannelId: '',
        selectedHotPosts: false,
        memorizeChannelBarPositionX: undefined,
        memorizeViewPortPositionY: undefined,
        memorizeLastViewedPostId: undefined,
        wasRedirected: false,
    });

    React.useEffect(() => { restoreProcessStatesFromCache(setProcessStates); }, []);

    // States - notice statistics
    const [viewersNoticeStatistics, setViewersNoticeStatistics] = React.useState<number>(0);

    React.useEffect(() => { if ('' === processStates.viewerId) { updateNoticeStatistics(); } }, [processStates.viewerId]);

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

    // States - browsing helper
    const [browsingHelper, setBrowsingHelper] = React.useState<TBrowsingHelper>({
        memorizeViewPortPositionY: undefined, // reset scroll-help on handleChannelSelect, handleSwitchChange, ~~handlePostCardClick~~
    });

    type TChannelMenuStates = {
        anchorEl: null | HTMLElement;
        channelInfo: { [channelId: string]: IChannelInfo; };
    };

    // States - channel info 
    const [channeMenuStates, setChannelMenuStates] = React.useState<TChannelMenuStates>({
        anchorEl: null,
        channelInfo: {},
    });

    React.useEffect(() => {
        getChanneInfo();

        // Handle channel bar restore on refresh
        if (!!processStates.memorizeChannelBarPositionX) {
            document.getElementById('channel-bar')?.scrollBy(processStates.memorizeChannelBarPositionX ?? 0, 0);
        }
    }, []);

    const getChanneInfo = async () => {
        const resp = await fetch(`/api/channel/info`);
        if (200 !== resp.status) {
            console.error(`Attemp to GET channel info.`);
            return;
        }
        try {
            const info = await resp.json();
            setChannelMenuStates({
                ...channeMenuStates,
                channelInfo: { ...info }
            });
        } catch (e) {
            console.error(`Attemp to parese channel info (JSON) from response. ${e}`);
        }
    };

    const handleChannelMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setChannelMenuStates({ ...channeMenuStates, anchorEl: event.currentTarget });
    };

    const handleChannelMenuClose = () => {
        setChannelMenuStates({ ...channeMenuStates, anchorEl: null });
    };

    const handleChannelSelect = (channelId: string) => (event: React.MouseEvent<HTMLButtonElement> | React.SyntheticEvent) => {
        let states: TProcessStates = { ...processStates };
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
    const handleToggleSwitch = () => {
        let states: TProcessStates = { ...processStates, selectedHotPosts: !processStates.selectedHotPosts };
        // #1 update process states
        setProcessStates(states);
        // #2 presist process states to cache
        updateProcessStatesCache(states);
        // #3 reset browsing helper
        setBrowsingHelper({ ...browsingHelper, memorizeViewPortPositionY: undefined });
    };

    // States - posts (masonry)
    const [masonryPostInfoArr, setMasonryPostInfoArr] = React.useState<IConcisePostComprehensive[]>([]);

    React.useEffect(() => { updatePostsArr(); }, [processStates.selectedChannelId, processStates.selectedHotPosts]);

    const updatePostsArr = async () => {
        const resp = await fetch(`/api/post/s/${processStates.selectedHotPosts ? 'trend' : 'new'}?channelId=${processStates.selectedChannelId}`);
        if (200 === resp.status) {
            try {
                setMasonryPostInfoArr(await resp.json());
            } catch (e) {
                console.log(`Attempt to GET posts of ${processStates.selectedHotPosts ? 'trend' : 'new'}. ${e}`);
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
            let states: TProcessStates = { ...processStates, memorizeLastViewedPostId: undefined, memorizeViewPortPositionY: undefined, wasRedirected: false };
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
        updateProcessStatesCache({
            ...processStates,
            memorizeLastViewedPostId: postId,
            memorizeViewPortPositionY: window.scrollY,
            wasRedirected: true
        });
        router.push(`/post/${postId}`);
    };

    const handleClickOnMemberInfo = (memberId: string, postId: string) => (event: React.MouseEvent) => {
        updateProcessStatesCache({
            ...processStates, memorizeLastViewedPostId: postId,
            memorizeViewPortPositionY: window.scrollY,
            wasRedirected: true
        });
        router.push(`/me/${memberId}`);
    };

    const handleClickOnTopic = (topicId: string) => (event: React.MouseEvent) => {
        router.push(`/query?topicId=${topicId}`);
    };

    type TRightColumnStates = {
        topicInfoArr: IConciseTopicComprehensive[];
        todaysTrendPostInfoArr: IConcisePostComprehensive[];
        weeksTrendPostInfoArr: IConcisePostComprehensive[];
    };

    // States - right column
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

        const r0 = await fetch(`/api/topic/trend`);
        const r1 = await fetch(`/api/post/s/trend/24h`);
        const r2 = await fetch(`/api/post/s/trend/7d`);

        try {
            if (200 !== r0.status) {
                console.error(`Attempt to GET topic info array of trending`);
            }
            const _a0 = await r0.json();
            a0.push(..._a0);

            if (200 !== r1.status) {
                console.error(`Attempt to GET post info array of trending today`);
            }
            const _a1 = await r1.json();
            a1.push(..._a1);

            if (200 !== r2.status) {
                console.error(`Attempt to GET post info array of trending this week`);
            }
            const _a2 = await r2.json();
            a2.push(..._a2);
        } catch (e: any) {
            if (e instanceof SyntaxError) {
                console.error(`Attempt to parse info array (JSON string) from response. ${e}`);
            } else {
                console.error(e?.msg);
            }
        }
        setRightColumnStates({ topicInfoArr: [...a0], todaysTrendPostInfoArr: [...a1], weeksTrendPostInfoArr: [...a2] });
    };

    const handleSignIn = (event: React.MouseEvent<HTMLElement>) => {
        event.preventDefault();
        signIn();
    };

    const handleProceedToFollowedMember = () => {
        router.push(`/follow`);
    };

    const handleProceedToQuery = () => {
        router.push(`/query`);
    };

    const handleProceedToMessage = () => {
        router.push(`/message`);
    };

    const handleProceedToMemberPage = () => {
        router.push(`/me/${processStates.viewerId}`);
    };

    const handleProceedToSettingsPage = () => {
        router.push(`/settings`);
    };

    const handleProceedToCreatePage = () => {
        router.push(`/create`);
    };

    const handleEditPost = () => {
        const referenceId = popUpMenuStates.referenceId;
        setPopUpMenuStates({
            anchorEl: null,
            memberId: '',
            nickname: '',
            referenceId: '',
        });
        router.push(`/edit/${referenceId}`);
    };

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

    type TPopUpMenuStates = {
        anchorEl: null | HTMLElement;
        memberId: string;
        nickname: string;
        referenceId: string;
    };

    // States - pop up menu
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

    const colorMode = React.useContext(ColorModeContext);

    const handleColorModeSelect = () => {
        const preferredColorMode = colorMode.mode === 'dark' ? 'light' : 'dark';
        colorMode.setMode(preferredColorMode);
        document.cookie = `PreferredColorMode=${preferredColorMode}`;
    };

    const theme = useTheme();

    type TChannelBarProps = {
        children: React.ReactElement;
        sx?: any;
    };

    const HideOnScroll = (props: TChannelBarProps) => {
        const { children } = props;
        const trigger = useScrollTrigger();
        return (
            <Slide appear={false} direction="down" in={!trigger} {...props}>
                {children}
            </Slide>
        );
    };

    type TAnimationStates = {
        scrollYPixels: number;
        requireUpdate: boolean;
    };

    // States - animation
    const [animationStates, setAnimationStates] = React.useState<TAnimationStates>({
        scrollYPixels: 0,
        requireUpdate: false,
    });

    // Register animation listener
    React.useEffect(() => {
        const handleScroll = () => {

            if (0 > window.scrollY) {
                setAnimationStates({
                    ...animationStates,
                    scrollYPixels: window.scrollY,
                });
                if (Math.abs(window.scrollY) > 50) {

                    setAnimationStates({
                        ...animationStates,
                        requireUpdate: true
                    });

                    window.removeEventListener('scroll', handleScroll);

                    setTimeout(() => {
                        setAnimationStates({
                            ...animationStates,
                            requireUpdate: false
                        });

                        window.addEventListener('scroll', handleScroll);
                    }, 5000);
                }
            }

        };

        window.addEventListener('scroll', handleScroll);

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    React.useEffect(() => { refreshPostsArr(); }, [animationStates.requireUpdate]);

    const refreshPostsArr = async () => {
        const resp = await fetch(`/api/post/s/${processStates.selectedHotPosts ? 'trend' : 'new'}?channelId=${processStates.selectedChannelId}`);
        if (200 === resp.status) {
            try {
                setMasonryPostInfoArr(await resp.json());
                setAnimationStates({ scrollYPixels: 0, requireUpdate: false });
            } catch (e) {
                console.log(`Attempt to GET posts of ${processStates.selectedHotPosts ? 'trend' : 'new'}. ${e}`);
            }
        }
    };

    return (
        <>
            <Head>
                <title>
                    莫希托
                </title>
                <meta
                    name='description'
                    content={desc}
                    key='desc'
                />
            </Head>

            {/* pull-to-refresh */}
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    opacity: animationStates.requireUpdate ? 1 : Math.abs(animationStates.scrollYPixels) / 25
                }}>
                <CircularProgress
                    variant={animationStates.requireUpdate ? 'indeterminate' : 'determinate'}
                    size={Math.abs(animationStates.scrollYPixels) * 1.8 < 24 && !animationStates.requireUpdate ? Math.abs(animationStates.scrollYPixels) * 1.8 : 24}
                    value={Math.abs(animationStates.scrollYPixels) < 50 && !animationStates.requireUpdate ? Math.abs(animationStates.scrollYPixels) * 2 : 100} />
            </Box>

            <Navbar lang={preferenceStates.lang} />
            <Grid container>

                {/* left */}
                <Grid item xs={0} sm={0} md={3} lg={3} xl={4} >
                    <Box sx={{ display: { xs: 'none', sm: 'none', md: 'flex' }, flexDirection: 'row-reverse', position: 'sticky', top: 0, left: 0, }}>
                        <Stack spacing={1} sx={{ width: { md: 200, lg: 240 }, }} >

                            {/* logo */}
                            <Link href='/' pt={5} px={2}>
                                <Box component={'img'} src={`/logo${'dark' === theme.palette.mode ? '-dark' : '-blue'}.png`} sx={{ height: { md: '3rem', lg: '3.5rem' } }} />
                            </Link>

                            {/* unauthenticated - login*/}
                            {'authenticated' !== status && <Box p={3}>
                                <Button variant={'contained'} sx={{ width: { md: '7rem', lg: '8rem' }, borderRadius: 4 }} onClick={handleSignIn}>{langConfigs.signIn[preferenceStates.lang]}</Button>
                            </Box>}

                            {/* authenticated - member menu */}
                            {'authenticated' === status && <Box sx={{ padding: 1 }}>
                                <MenuList>

                                    {/* posts */}
                                    <MenuItem sx={{ height: 56 }} >
                                        <ListItemIcon>
                                            <ArticleIcon />
                                        </ListItemIcon>
                                        <ListItemText>
                                            {langConfigs.posts[preferenceStates.lang]}
                                        </ListItemText>
                                        <ListItemIcon onMouseEnter={handleChannelMenuOpen}>
                                            <MoreVertIcon />
                                        </ListItemIcon>
                                    </MenuItem>

                                    {/* followed members */}
                                    <MenuItem sx={{ height: 56 }} onClick={handleProceedToFollowedMember} >
                                        <ListItemIcon>
                                            <NotificationsIcon />
                                        </ListItemIcon>
                                        <ListItemText>
                                            {langConfigs.follow[preferenceStates.lang]}
                                        </ListItemText>
                                    </MenuItem>

                                    {/* query */}
                                    <MenuItem sx={{ height: 56 }} onClick={handleProceedToQuery} >
                                        <ListItemIcon>
                                            <SearchIcon />
                                        </ListItemIcon>
                                        <ListItemText>
                                            {langConfigs.query[lang]}
                                        </ListItemText>
                                    </MenuItem>

                                    {/* message */}
                                    <MenuItem sx={{ height: 56 }} onClick={handleProceedToMessage} >
                                        <ListItemIcon>
                                            {0 === viewersNoticeStatistics ? <EmailIcon /> : <MarkEmailUnreadIcon />}
                                        </ListItemIcon>
                                        <ListItemText>
                                            {
                                                0 === viewersNoticeStatistics ?
                                                    langConfigs.messages[preferenceStates.lang] :
                                                    `${langConfigs.messages[preferenceStates.lang]} (${viewersNoticeStatistics}${langConfigs.unread[preferenceStates.lang]})`
                                            }
                                        </ListItemText>
                                    </MenuItem>

                                    {/* member */}
                                    <MenuItem sx={{ height: 56 }} onClick={handleProceedToMemberPage}>
                                        <ListItemIcon>
                                            <AccountCircleIcon />
                                        </ListItemIcon>
                                        <ListItemText>
                                            {langConfigs.member[preferenceStates.lang]}
                                        </ListItemText>
                                    </MenuItem>

                                    {/* settings */}
                                    <MenuItem sx={{ height: 56 }} onClick={handleProceedToSettingsPage} >
                                        <ListItemIcon>
                                            <SettingsIcon />
                                        </ListItemIcon>
                                        <ListItemText>
                                            {langConfigs.settings[preferenceStates.lang]}
                                        </ListItemText>
                                    </MenuItem>

                                    <Divider />
                                    {/* create */}
                                    <MenuItem sx={{ height: 56 }} onClick={handleProceedToCreatePage} >
                                        <ListItemIcon>
                                            <CreateIcon />
                                        </ListItemIcon>
                                        <ListItemText>
                                            {langConfigs.create[preferenceStates.lang]}
                                        </ListItemText>
                                    </MenuItem>
                                </MenuList>
                            </Box>}
                        </Stack>
                    </Box>
                </Grid>

                {/* middle */}
                <Grid item xs={12} sm={12} md={9} lg={6} xl={4} >

                    {/* channel bar (mobile mode) */}
                    <HideOnScroll >
                        <Stack direction={'row'} id='channel-bar' sx={{ position: 'sticky', top: 0, zIndex: 9999, backgroundColor: 'dark' === colorMode.mode ? '#424242 ' : '#fff', display: { sm: 'flex', md: 'none' }, padding: 1, overflow: 'auto' }}>

                            {/* trend / new switch */}
                            <Box minWidth={110}>
                                <FormControlLabel
                                    control={<StyledSwitch sx={{ ml: 1 }} checked={processStates.selectedHotPosts} />}
                                    label={processStates.selectedHotPosts ? langConfigs.hotPosts[preferenceStates.lang] : langConfigs.newPosts[preferenceStates.lang]}
                                    onChange={handleToggleSwitch}
                                />
                            </Box>

                            {/* the 'all' button */}
                            <Button variant={'all' === processStates.selectedChannelId ? 'contained' : 'text'} size='small' onClick={handleChannelSelect('all')}>
                                <Typography variant='body2' color={'all' === processStates.selectedChannelId ? 'white' : 'text.secondary'} sx={{ backgroundColor: 'primary' }}>
                                    {langConfigs.all[preferenceStates.lang]}
                                </Typography>
                            </Button>

                            {/* other channels */}
                            {Object.keys(channeMenuStates.channelInfo).map(id => {
                                const { channelId, name } = channeMenuStates.channelInfo[id];
                                return (
                                    <Button
                                        variant={channelId === processStates.selectedChannelId ? 'contained' : 'text'}
                                        key={`button-${channelId}`}
                                        size='small'
                                        onClick={handleChannelSelect(channelId)}
                                    >
                                        <Typography
                                            variant={'body2'}
                                            color={channelId === processStates.selectedChannelId ? 'white' : 'text.secondary'}
                                            sx={{ backgroundColor: 'primary' }}
                                            noWrap
                                        >
                                            {name[preferenceStates.lang]}
                                        </Typography>
                                    </Button>
                                );
                            })}
                        </Stack>
                    </HideOnScroll>

                    {/* empty alert */}
                    {0 === masonryPostInfoArr.length &&
                        <Box minHeight={200} mt={10}>
                            <Typography color={'text.secondary'} align={'center'}>
                                {langConfigs.noPosts[preferenceStates.lang]}
                            </Typography>
                        </Box>
                    }

                    {/* mansoy */}
                    <Box maxWidth={{ md: 900, lg: 800 }}>
                        <Masonry columns={2} sx={{ margin: 0 }}>

                            {/* posts */}
                            {0 !== masonryPostInfoArr.length && masonryPostInfoArr.map(p => {
                                return (
                                    <Paper key={p.postId} id={p.postId} sx={{ maxWidth: 450, '&:hover': { cursor: 'pointer' } }} >
                                        <Stack>

                                            {/* image */}
                                            <Box
                                                component={'img'}
                                                loading='lazy'
                                                src={provideCoverImageUrl(p.postId, imageDomain)}
                                                sx={{
                                                    maxWidth: 1,
                                                    maxHeight: 1,
                                                    height: 'auto',
                                                    borderTopLeftRadius: 4,
                                                    borderTopRightRadius: 4
                                                }}
                                                onClick={handleClickOnPost(p.postId)}
                                            ></Box>

                                            {/* title */}
                                            <Box pt={2} px={2} onClick={handleClickOnPost(p.postId)}>
                                                <Typography variant={'body1'}>{p.title}</Typography>
                                            </Box>

                                            {/* member info & member behaviour */}
                                            <Box paddingTop={1} >
                                                <Grid container>

                                                    {/* member info */}
                                                    <Grid item flexGrow={1}>
                                                        <Box display={'flex'} flexDirection={'row'}>
                                                            <Button variant={'text'} color={'inherit'} sx={{ textTransform: 'none' }} onClick={handleClickOnMemberInfo(p.memberId, p.postId)}>
                                                                <Avatar src={provideAvatarImageUrl(p.memberId, imageDomain)} sx={{ width: { xs: 24, sm: 32 }, height: { xs: 24, sm: 32 }, bgcolor: 'grey' }}>{p.nickname?.charAt(0).toUpperCase()}</Avatar>
                                                                <Box ml={1}>
                                                                    <Typography variant='body2'>{getNicknameBrief(p.nickname)}</Typography>
                                                                </Box>
                                                            </Button>
                                                        </Box>
                                                    </Grid>

                                                    {/* member behaviour / placeholder */}
                                                    <Grid item >
                                                        <IconButton
                                                            sx={{ width: { xs: 34, sm: 34, md: 40 }, height: { xs: 34, sm: 34, md: 40 }, }}
                                                            onClick={handleOpenPopUpMenu(p.memberId, p.nickname ?? '', p.postId)}
                                                        >
                                                            <MoreVertIcon />
                                                        </IconButton>
                                                    </Grid>
                                                </Grid>
                                            </Box>
                                        </Stack>
                                    </Paper>
                                );
                            })}
                        </Masonry>
                    </Box>

                    {/* bottom space */}
                    <Box pb={{ xs: '10rem', sm: '10rem', md: 0 }} />

                </Grid>

                {/* right */}
                <Grid item xs={0} sm={0} md={0} lg={3} xl={4}>
                    <Box sx={{ display: { xs: 'none', sm: 'none', md: 'block' } }}>
                        <Stack spacing={2} sx={{ width: 300, px: 3, pt: 8, }} >

                            {/* title */}
                            <Box sx={{ paddingX: 2 }}>
                                <Typography variant='h6' >{langConfigs.tredingTopics[preferenceStates.lang]}</Typography>
                            </Box>

                            {/* topic list */}
                            <MenuList>

                                {/* topics */}
                                {0 !== rightColumnStates.topicInfoArr.length && rightColumnStates.topicInfoArr.map(t =>
                                    <MenuItem key={getRandomHexStr()} sx={{ height: 64 }} onClick={handleClickOnTopic(t.topicId)}>

                                        {/* channel icon */}
                                        <ListItemIcon>
                                            <Avatar variant='rounded'>
                                                <SvgIcon><path d={channeMenuStates.channelInfo[t.channelId].svgIconPath} /></SvgIcon>
                                            </Avatar>
                                        </ListItemIcon>

                                        {/* topic info & statistics */}
                                        <ListItemText sx={{ pl: 2 }}>
                                            <Typography variant='body1'>#{t.content}</Typography>
                                            <Stack direction={'row'} spacing={1}>
                                                <Typography mr={1} variant='body2' color={'text.disabled'} alignItems={'center'}>{channeMenuStates.channelInfo[t.channelId].name[preferenceStates.lang]}</Typography>

                                                {/* posts count icon */}
                                                <ArticleIcon fontSize='small' sx={{ color: 'text.disabled' }} />
                                                <Typography mr={1} variant='body2' color={'text.disabled'} alignItems={'center'}>{t.totalPostCount}</Typography>

                                                {/* hit count icon */}
                                                <BarChartIcon fontSize='small' sx={{ color: 'text.disabled' }} />
                                                <Typography variant='body2' color={'text.disabled'} alignItems={'center'}>{t.totalHitCount}</Typography>
                                            </Stack>
                                        </ListItemText>
                                    </MenuItem>
                                )}

                            </MenuList>

                            {/* copyright */}
                            <Box>
                                <Copyright lang={preferenceStates.lang} />
                                <Guidelines lang={preferenceStates.lang} />
                                <Terms lang={preferenceStates.lang} />
                            </Box>

                            {/* lang switch */}
                            <Box>
                                <LangSwitch setLang={setLang} />
                            </Box>

                            {/* theme mode switch */}
                            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                <IconButton onClick={handleColorModeSelect}>
                                    {theme.palette.mode === 'dark' ? <WbSunnyIcon /> : <DarkModeIcon />}
                                </IconButton>
                            </Box>

                        </Stack>
                    </Box>
                </Grid>

            </Grid>

            {/* channel memu */}
            <Menu
                sx={{ mt: '3rem' }}
                anchorEl={channeMenuStates.anchorEl}
                anchorOrigin={{ vertical: 'top', horizontal: 'right', }}
                keepMounted
                transformOrigin={{ vertical: 'top', horizontal: 'right', }}
                open={Boolean(channeMenuStates.anchorEl)}
                onClose={handleChannelMenuClose}
                MenuListProps={{
                    style: { minWidth: 100 }
                }}
            >
                <MenuList>
                    <MenuItem
                        onClick={handleChannelSelect('all')}
                        selected={processStates.selectedChannelId === 'all'}
                    >
                        <ListItemIcon>
                            <ArticleIcon />
                        </ListItemIcon>
                        <ListItemText>
                            <Typography>{langConfigs.all[preferenceStates.lang]}</Typography>
                        </ListItemText>
                    </MenuItem>
                    <Divider />

                    {/* other channels */}
                    {Object.keys(channeMenuStates.channelInfo).map(id => {
                        const { channelId, name, svgIconPath } = channeMenuStates.channelInfo[id];
                        return (
                            <MenuItem key={`item-${channelId}`}
                                onClick={handleChannelSelect(channelId)}
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
                    <Divider />

                    {/* new / trend switch */}
                    <MenuItem>
                        <FormControlLabel
                            control={<StyledSwitch sx={{ ml: 1 }} checked={processStates.selectedHotPosts} />}
                            label={processStates.selectedHotPosts ? langConfigs.hotPosts[preferenceStates.lang] : langConfigs.newPosts[preferenceStates.lang]}
                            onChange={handleToggleSwitch}
                            sx={{ marginRight: 0 }}
                        />
                    </MenuItem>
                </MenuList>
            </Menu>

            {/* pop-up memu */}
            <Menu
                sx={{ mt: '3rem' }}
                anchorEl={popUpMenuStates.anchorEl}
                anchorOrigin={{ vertical: 'top', horizontal: 'right', }}
                keepMounted
                transformOrigin={{ vertical: 'top', horizontal: 'right', }}
                open={Boolean(popUpMenuStates.anchorEl)}
                onClose={handleClosePopUpMenu}
                MenuListProps={{}}
            >
                {/* edit post */}
                {processStates.viewerId === popUpMenuStates.memberId &&
                    <MenuItem onClick={handleEditPost}>
                        <ListItemIcon><EditIcon fontSize='small' /></ListItemIcon>
                        <ListItemText><Typography variant={'body2'}>{langConfigs.edit[preferenceStates.lang]}</Typography></ListItemText>
                    </MenuItem>}

                {/* block (identity required) */}
                {('authenticated' === status && processStates.viewerId !== popUpMenuStates.memberId) &&
                    <MenuItem onClick={async () => { await handleBlock(); }}>
                        <ListItemIcon><BlockIcon fontSize='small' /></ListItemIcon>
                        <ListItemText><Typography variant={'body2'}>{`${langConfigs.block[preferenceStates.lang]} ${popUpMenuStates.nickname}`}</Typography></ListItemText>
                    </MenuItem>}

                {/* report */}
                {processStates.viewerId !== popUpMenuStates.memberId &&
                    <MenuItem onClick={handleReport}>
                        <ListItemIcon><FlagIcon fontSize='small' /></ListItemIcon>
                        <ListItemText><Typography variant={'body2'}>{langConfigs.report[preferenceStates.lang]}</Typography></ListItemText>
                    </MenuItem>}
            </Menu>
        </>
    );
};

export default Home;