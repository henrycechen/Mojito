import * as React from 'react';
import { NextPageContext } from 'next/types';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import useTheme from '@mui/material/styles/useTheme';

import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

import Menu from '@mui/material/Menu';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';

import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import AddIcon from '@mui/icons-material/Add';
import ArticleIcon from '@mui/icons-material/Article';
import AppsIcon from '@mui/icons-material/Apps';
import BlockIcon from '@mui/icons-material/Block';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CreateIcon from '@mui/icons-material/Create';
import EditIcon from '@mui/icons-material/Edit';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import FlagIcon from '@mui/icons-material/Flag';
import ForumIcon from '@mui/icons-material/Forum';
import BarChartIcon from '@mui/icons-material/BarChart';
import IconButton from '@mui/material/IconButton';
import ListAltIcon from '@mui/icons-material/ListAlt';
import EmailIcon from '@mui/icons-material/Email';
import MarkEmailUnreadIcon from '@mui/icons-material/MarkEmailUnread';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import ReorderIcon from '@mui/icons-material/Reorder';
import SettingsIcon from '@mui/icons-material/Settings';
import SvgIcon from '@mui/material/SvgIcon';

import Masonry from '@mui/lab/Masonry';

import { CentralizedBox, ResponsiveCard, StyledSwitch, TextButton } from '../ui/Styled';
import Navbar from '../ui/Navbar';
import Copyright from '../ui/Copyright';
import Terms from '../ui/Terms';
import { ColorModeContext } from '../ui/Theme';


import { TBrowsingHelper, LangConfigs, TPreferenceStates } from '../lib/types';
import { IConcisePostComprehensive } from '../lib/interfaces/post';
import { IConciseTopicComprehensive } from '../lib/interfaces/topic';
import { IChannelInfoStates, IChannelInfoDictionary } from '../lib/interfaces/channel';

import { updateLocalStorage, restoreFromLocalStorage } from '../lib/utils/general';
import { getNicknameBrief, provideAvatarImageUrl } from '../lib/utils/for/member';
import { provideCoverImageUrl } from '../lib/utils/for/post';
import { getRandomHexStr } from '../lib/utils/create';
import Guidelines from '../ui/Guidelines';


const storageName0 = 'PreferenceStates';
const restorePreferenceStatesFromCache = restoreFromLocalStorage(storageName0);

const storageName = 'HomePageProcessStates';
const updateProcessStatesCache = updateLocalStorage(storageName);
const restoreProcessStatesFromCache = restoreFromLocalStorage(storageName);

type THomePageProps = {
    channelInfoDict_ss: IChannelInfoDictionary;
    redirect500: boolean;
};

interface IHomePageProcessStates {
    viewerId: string;
    selectedChannelId: string;
    selectedHotPosts: boolean;
    memorizeChannelBarPositionX: number | undefined;
    memorizeViewPortPositionY: number | undefined;
    memorizeLastViewedPostId: string | undefined;
    wasRedirected: boolean;
}

const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? '';
const imageDomain = process.env.NEXT_PUBLIC_IMAGE_DOMAIN ?? '';
const defaultLang = process.env.NEXT_PUBLIC_APP_LANG ?? 'tw';
const langConfigs: LangConfigs = {
    // Left column
    posts: {
        tw: '文章',
        cn: '文章',
        en: 'Posts'
    },
    followedMembers: {
        tw: '關注',
        cn: '关注',
        en: 'Followed'
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

//// get multiple info server-side ////
export async function getServerSideProps(context: NextPageContext): Promise<{ props: THomePageProps; }> {
    let channelInfoDict_ss: IChannelInfoDictionary;

    const resp = await fetch(`${appDomain}/api/channel/info/dictionary`);

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

    React.useEffect(() => {
        if ('authenticated' === status) {
            const authorSession: any = { ...session };
            setProcessStates({ ...processStates, viewerId: authorSession?.user?.id ?? '' });
            restorePreferenceStatesFromCache(setPreferenceStates);
        }
    }, [status]);

    // Ref - masonry
    const masonryWrapper = React.useRef<any>();
    const [width, setWidth] = React.useState(375); // default change from 636 to 375 (width of iPhone SE2)
    React.useEffect(() => { setWidth(masonryWrapper?.current?.offsetWidth); }, []);

    // States - preference
    const [preferenceStates, setPreferenceStates] = React.useState<TPreferenceStates>({
        lang: defaultLang,
        mode: 'light'
    });

    // States - process
    const [processStates, setProcessStates] = React.useState<IHomePageProcessStates>({
        viewerId: '',
        selectedChannelId: '',
        selectedHotPosts: false,
        memorizeChannelBarPositionX: undefined,
        memorizeViewPortPositionY: undefined,
        memorizeLastViewedPostId: undefined,
        wasRedirected: false,
    });

    React.useEffect(() => { restoreProcessStatesFromCache(setProcessStates); }, []);

    //////////////////////////////////////// VIEWING ////////////////////////////////////////

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

    const handleClickOnUnreadMessage = () => {
        router.push(`/message`);
    };

    // States - browsing helper
    const [browsingHelper, setBrowsingHelper] = React.useState<TBrowsingHelper>({
        memorizeViewPortPositionY: undefined, // reset scroll-help on handleChannelSelect, handleSwitchChange, ~~handlePostCardClick~~
    });

    //////////////////////////////////////// CHANNEL ////////////////////////////////////////

    type TChannelMenuStates = {
        anchorEl: null | HTMLElement;
        // channelIdSequence: string[];
    };

    // States - channel info 
    const [channelInfoStates, setChannelInfoStates] = React.useState<TChannelMenuStates>({
        anchorEl: null,
        // channelIdSequence: [],
    });

    const handleMouseEnter = (event: React.MouseEvent<HTMLElement>) => {
        setChannelInfoStates({ ...channelInfoStates, anchorEl: event.currentTarget });
    };

    const handleMouseLeave = () => {
        setChannelInfoStates({ ...channelInfoStates, anchorEl: null });
    };

    const handleCloseChannelMenu = () => {
        setChannelInfoStates({ ...channelInfoStates, anchorEl: null });
    };



    // Handle channel bar restore on refresh
    React.useEffect(() => {
        if (!!processStates.memorizeChannelBarPositionX) {
            document.getElementById('channel-bar')?.scrollBy(processStates.memorizeChannelBarPositionX ?? 0, 0);
        }
    }, []);

    // Handle channel select
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
    const handleToggleSwitch = () => {
        let states: IHomePageProcessStates = { ...processStates, selectedHotPosts: !processStates.selectedHotPosts };
        // #1 update process states
        setProcessStates(states);
        // #2 presist process states to cache
        updateProcessStatesCache(states);
        // #3 reset browsing helper
        setBrowsingHelper({ ...browsingHelper, memorizeViewPortPositionY: undefined });
    };

    //////////////////////////////////////// MASONRY (POSTS) ////////////////////////////////////////

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

    //////////////////////////////////////// RIGHT COLUMN ////////////////////////////////////////

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

    //////////////////////////////////////// BEHAVIOURS ////////////////////////////////////////

    const handleProceedToFollowedMember = () => {
        router.push(`/follow`);
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

    //////////////////////////////////////// POP-UP MENU ////////////////////////////////////////

    type TPopUpMenuStates = {
        anchorEl: null | HTMLElement;
        memberId: string;
        nickname: string;
        referenceId: string;
    };

    // States - pop up menu ////////
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

    //////////////////////////////////////// THEME ////////////////////////////////////////
    const colorMode = React.useContext(ColorModeContext);

    const handleColorModeSelect = () => {
        const preferredColorMode = colorMode.mode === 'dark' ? 'light' : 'dark';
        colorMode.setMode(preferredColorMode);
        document.cookie = `PreferredColorMode=${preferredColorMode}`;
    };

    const theme = useTheme();

    return (
        <>
            <Navbar lang={preferenceStates.lang} />
            <Grid container>

                {/* left */}
                <Grid item xs={0} sm={0} md={3} lg={3} xl={4} >
                    <Box sx={{ display: { xs: 'none', sm: 'none', md: 'flex' }, flexDirection: 'row-reverse', position: 'sticky', top: 0, left: 0, }}>
                        <Stack spacing={1} sx={{ width: { md: 200, lg: 240 }, }} >

                            {/* logo */}
                            <Link href='/' pt={5} px={2}>
                                <Box component={'img'} src={`${appDomain}/logo${'dark' === theme.palette.mode ? '-dark' : ''}.png`} sx={{ height: { md: '3rem', lg: '3.5rem' } }} />
                            </Link>
                            {/* FIXME:FIXME:FIXME:FIXME:FIXME:FIXME:FIXME: */}
                            {/* unauthenticated - login button */}
                            {false && <Box pt={4}>
                                <Button variant='contained' >Login</Button>
                            </Box>}

                            {/* FIXME:FIXME:FIXME:FIXME:FIXME:FIXME:FIXME: */}
                            {/* authenticated - member menu */}
                            {true && <Box sx={{ padding: 1 }}>
                                <MenuList>

                                    {/* posts */}
                                    <MenuItem sx={{ height: 56 }} >
                                        <ListItemIcon>
                                            <ReorderIcon />
                                        </ListItemIcon>
                                        <ListItemText>
                                            {langConfigs.posts[preferenceStates.lang]}
                                        </ListItemText>
                                        <ListItemIcon onMouseEnter={handleMouseEnter}>
                                            <MoreVertIcon />
                                        </ListItemIcon>
                                    </MenuItem>

                                    {/* followed members */}
                                    <MenuItem sx={{ height: 56 }} onClick={handleProceedToFollowedMember} >
                                        <ListItemIcon>
                                            <NotificationsActiveIcon />
                                        </ListItemIcon>
                                        <ListItemText>
                                            {langConfigs.followedMembers[preferenceStates.lang]}
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
                    <Stack direction={'row'} id='channel-bar' sx={{ display: { sm: 'flex', md: 'none' }, padding: 1, overflow: 'auto' }}>

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
                        {Object.keys(channelInfoDict_ss).map(id => {
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

                    {/* empty alert */}
                    {0 === masonryPostInfoArr.length &&
                        <Box minHeight={200} mt={10}>
                            <Typography color={'text.secondary'} align={'center'}>
                                {langConfigs.noPosts[preferenceStates.lang]}
                            </Typography>
                        </Box>
                    }

                    {/* mansoy */}
                    <Box ml={1} ref={masonryWrapper} maxWidth={{ md: 900, lg: 800 }}>
                        <Masonry columns={2}>

                            {/* posts */}
                            {0 !== masonryPostInfoArr.length && masonryPostInfoArr.map(p => {
                                return (
                                    <Paper key={p.postId} id={p.postId} sx={{ maxWidth: 450, '&:hover': { cursor: 'pointer' } }} >
                                        <Stack>
                                            {/* image */}
                                            <Box
                                                component={'img'}
                                                src={provideCoverImageUrl(p.postId, imageDomain)}
                                                sx={{ maxWidth: { xs: width / 2, sm: 450 }, height: 'auto', borderTopLeftRadius: 4, borderTopRightRadius: 4 }}
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
                                                                <Avatar src={provideAvatarImageUrl(p.memberId, imageDomain)} sx={{ width: { xs: 24, sm: 32 }, height: { xs: 24, sm: 32 }, bgcolor: 'grey' }}>{p.nickname?.charAt(0).toUpperCase()}</Avatar>
                                                                <Box ml={1}>
                                                                    <Typography variant='body2'>{getNicknameBrief(p.nickname)}</Typography>
                                                                </Box>
                                                            </Button>
                                                        </Box>
                                                    </Grid>

                                                    {/* member behaviour / placeholder */}
                                                    <Grid item >
                                                        <IconButton onClick={handleOpenPopUpMenu(p.memberId, p.nickname ?? '', p.postId)}><MoreVertIcon /></IconButton>
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

                {/* right */}
                <Grid item xs={0} sm={0} md={0} lg={3} xl={4}>
                    <Box sx={{ display: { xs: 'none', sm: 'none', md: 'block' } }}>
                        <Stack spacing={2} sx={{ width: 300, paddingX: 3, paddingTop: 8, }} >

                            {/* title */}
                            <Box sx={{ paddingX: 2 }}>
                                <Typography variant='h6' >{langConfigs.tredingTopics[preferenceStates.lang]}</Typography>
                            </Box>

                            {/* topic list */}
                            <MenuList>

                                {/* topics */}
                                {0 !== rightColumnStates.topicInfoArr.length && rightColumnStates.topicInfoArr.map(t =>
                                    <MenuItem key={getRandomHexStr()} sx={{ height: 64 }} >

                                        {/* channel icon */}
                                        <ListItemIcon>
                                            <Avatar variant='rounded'>
                                                <SvgIcon><path d={channelInfoDict_ss[t.channelId].svgIconPath} /></SvgIcon>
                                            </Avatar>
                                        </ListItemIcon>

                                        {/* topic info & statistics */}
                                        <ListItemText sx={{ pl: 2 }}>
                                            <Typography variant='body1'>#{t.content}</Typography>
                                            <Stack direction={'row'} spacing={1}>
                                                <Typography mr={1} variant='body2' color={'text.disabled'} alignItems={'center'}>{channelInfoDict_ss[t.channelId].name[preferenceStates.lang]}</Typography>

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

                            {/* theme mode switch */}
                            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                <IconButton onClick={handleColorModeSelect}>
                                    {theme.palette.mode === 'dark' ? <Brightness4Icon /> : <Brightness7Icon />}
                                </IconButton>
                            </Box>
                        </Stack>
                    </Box>
                </Grid>
            </Grid>

            {/* channel memu */}
            <Menu
                sx={{ mt: '3rem' }}
                anchorEl={channelInfoStates.anchorEl}
                anchorOrigin={{ vertical: 'top', horizontal: 'right', }}
                keepMounted
                transformOrigin={{ vertical: 'top', horizontal: 'right', }}
                open={Boolean(channelInfoStates.anchorEl)}
                onClose={handleCloseChannelMenu}
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
                            <ListAltIcon />
                        </ListItemIcon>
                        <ListItemText>
                            <Typography>全部</Typography>
                        </ListItemText>
                    </MenuItem>
                    <Divider />
                    {/* other channels */}
                    {Object.keys(channelInfoDict_ss).map(id => {
                        const { channelId, name, svgIconPath } = channelInfoDict_ss[id];
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