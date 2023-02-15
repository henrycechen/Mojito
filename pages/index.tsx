import * as React from 'react';
import { NextPageContext } from 'next/types';

import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { useSession } from 'next-auth/react'

import SvgIcon from '@mui/material/SvgIcon';

import IconButton from '@mui/material/IconButton';

import EmailIcon from '@mui/icons-material/Email';
import BubbleChartIcon from '@mui/icons-material/BubbleChart';
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

import { useTheme } from '@emotion/react';
import { useRouter } from 'next/router';

import { TBrowsingHelper, LangConfigs } from '../lib/types';
import { updateLocalStorage, restoreFromLocalStorage, getNicknameBrief } from '../lib/utils';
import { CenterlizedBox, ResponsiveCard, StyledSwitch, TextButton } from '../ui/Styled';
import Navbar from '../ui/Navbar';
import { IConcisePostComprehensive, IConcisePostComprehensiveWithMemberInfo, IProcessStates } from '../lib/interfaces';
import { IChannelInfoStates, IChannelInfoDictionary } from '../lib/interfaces/channel';
import Copyright from '../ui/Copyright';

const storageName = 'HomePageProcessStates';
const updateProcessStatesCache = updateLocalStorage(storageName);
const restoreProcessStatesFromCache = restoreFromLocalStorage(storageName);

type THomePageProps = {
    channelInfoDict_ss: IChannelInfoDictionary;
    redirect404: boolean;
}

interface IHomePageProcessStates extends IProcessStates {
    lang: string;
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
}

const domain = process.env.NEXT_PUBLIC_APP_DOMAIN;
const defaultLang = process.env.NEXT_PUBLIC_APP_LANG ?? 'tw';
const langConfigs: LangConfigs = {
    allPosts: {
        tw: '全部',
        cn: '全部',
        en: 'All posts'
    },
    followedPosts: {
        tw: '关注',
        cn: '关注',
        en: 'Followed'
    },
    hotPosts: {
        tw: '熱帖',
        cn: '最热',
        en: 'Hotest'
    },
    newPosts: {
        tw: '新帖',
        cn: '最新',
        en: 'Newest'
    },
    totalCreationCount: {
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
    twentyFourHoursHot: {
        tw: '今日熱門帖子',
        cn: '24小时热帖',
        en: '24 hours hotest'
    },
    sevenDaysHot: {
        tw: '本周熱門帖子',
        cn: '本周热帖',
        en: '7 days hotest'
    },
    totalHitCount: {
        tw: '瀏覽',
        cn: '浏览',
        en: 'views'
    }
}

//// get multiple info server-side ////
export async function getServerSideProps(context: NextPageContext): Promise<{ props: THomePageProps }> {
    const resp = await fetch(`${domain}/api/channel/info/dictionary`);
    if (200 !== resp.status) {
        throw new Error('Attempt to GET channel info dictionary');
    }
    let channelInfoDict_ss: IChannelInfoDictionary;
    try {
        channelInfoDict_ss = await resp.json();
    } catch (e) {
        throw new Error(`Attempt to parse channel info dictionary (JSON). ${e}`);
    }
    return {
        props: {
            channelInfoDict_ss,
            redirect404: false
        }
    }
}

const Home = ({ channelInfoDict_ss }: THomePageProps) => {

    const router = useRouter();
    const { data: session, status } = useSession();
    // status - 'unauthenticated' / 'authenticated'

    let viewerId = '';
    if ('authenticated' === status) {
        const authorSession: any = { ...session };
        viewerId = authorSession?.user?.id;
    }

    //////// REF - masonry ////////
    const masonryWrapper = React.useRef<any>();
    const [width, setWidth] = React.useState(636);
    React.useEffect(() => { setWidth(masonryWrapper?.current?.offsetWidth) }, [])


    //////// STATES - process ////////
    const [processStates, setProcessStates] = React.useState<IHomePageProcessStates>({
        lang: defaultLang,
        selectedChannelId: '',
        selectedHotPosts: false,
        memorizeChannelBarPositionX: undefined,
        memorizeViewPortPositionY: undefined,
        memorizeLastViewedPostId: undefined,
        wasRedirected: false,
    });

    React.useEffect(() => { restoreProcessStatesFromCache(setProcessStates) }, []);

    //////// STATES - viewer comprehensive (statistics + notice) ////////
    const [viewerComprehensive, setViewerComprehensive] = React.useState<TViewerComprehensive>({
        totalFollowedByCount: 0,
        totalCreationSavedCount: 0,
        totalCreationLikedCount: 0,
        reply: 0
    })

    React.useEffect(() => { if ('authenticated' === status) { updateViewerComprehensive() } }, [status]);

    const updateViewerComprehensive = async () => {
        let update: TViewerComprehensive = {
            totalCreationSavedCount: 0,
            totalCreationLikedCount: 0,
            totalFollowedByCount: 0,
            reply: 0,
        };
        // Get member statistics by id
        const resp_statistics = await fetch(`/api/member/statistics/${viewerId}`);
        if (200 === resp_statistics.status) {
            try {
                const statistics = await resp_statistics.json();
                update.totalFollowedByCount = statistics.totalFollowedByCount;
                update.totalCreationSavedCount = statistics.totalCreationSavedCount;
                update.totalCreationLikedCount = statistics.totalCreationLikedCount;
            } catch (e) {
                console.log(`Attempt to GET member statistics. ${e}`);
            }
        }
        const resp_notice = await fetch(`/api/notice/statistics`);
        if (200 === resp_notice.status) {
            try {
                const notice = await resp_notice.json();
                update.reply = notice.reply;
            } catch (e) {
                console.log(`Attempt to GET notice statistics. ${e}`);
            }
        }
        setViewerComprehensive({ ...update });
    }


    //////// STATES - browsing helper ////////
    const [browsingHelper, setBrowsingHelper] = React.useState<TBrowsingHelper>({
        memorizeViewPortPositionY: undefined, // reset scroll-help on handleChannelSelect, handleSwitchChange, ~~handlePostCardClick~~
    })

    ///////// STATES - channel /////////
    const [channelInfoStates, setChannelInfoStates] = React.useState<IChannelInfoStates>({
        channelIdSequence: [],
    });

    React.useEffect(() => { updateChannelIdSequence() }, []);

    const updateChannelIdSequence = async () => {
        const resp = await fetch(`/api/channel/id/sequence`);
        if (200 !== resp.status) {
            setChannelInfoStates({ ...channelInfoStates, channelIdSequence: Object.keys(channelInfoDict_ss) });
            console.log(`Attemp to GET channel id array. Using sequence from channel info dictionary instead`);
            return;
        }
        try {
            const idArr = await resp.json();
            setChannelInfoStates({ ...channelInfoStates, channelIdSequence: [...idArr] })
        } catch (e) {
            console.log(`Attemp to parese channel id array. ${e}`);
        } finally {
            setChannelInfoStates({ ...channelInfoStates, channelIdSequence: Object.keys(channelInfoDict_ss) })
        }

    }

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
        // Step #1 update process states
        setProcessStates(states);
        // Step #2 presist process states to cache
        updateProcessStatesCache(states);
        // Step #3 reset browsing helper
        setBrowsingHelper({ ...browsingHelper, memorizeViewPortPositionY: undefined });
    }

    // Handle newest/hotest posts switch
    const handleSwitchChange = () => {
        let states: IHomePageProcessStates = { ...processStates, selectedHotPosts: !processStates.selectedHotPosts }
        // Step #1 update process states
        setProcessStates(states);
        // Step #2 presist process states to cache
        updateProcessStatesCache(states);
        // Step #3 reset browsing helper
        setBrowsingHelper({ ...browsingHelper, memorizeViewPortPositionY: undefined });
    }

    //////// STATE - posts (masonry) ////////
    const [masonryPostInfoArr, setMasonryPostInfoArr] = React.useState<IConcisePostComprehensiveWithMemberInfo[]>([]);

    React.useEffect(() => { updatePostsArr() }, [processStates.selectedChannelId, processStates.selectedHotPosts]);

    const updatePostsArr = async () => {
        const resp = await fetch(`/api/post/s/of${processStates.selectedHotPosts ? '/hot/24h' : '/new'}?channelId=${processStates.selectedChannelId}&withMemberInfo=true`);
        if (200 === resp.status) {
            try {
                setMasonryPostInfoArr(await resp.json());
            } catch (e) {
                console.log(`Attempt to GET posts of ${processStates.selectedHotPosts ? '24 hours hot' : 'new'}. ${e}`);
            }
        }
    }

    // Handle restore browsing position after reload
    React.useEffect(() => {
        if (processStates.wasRedirected) {
            const postId = processStates.memorizeLastViewedPostId;
            // Step #1 restore browsing position
            if (!postId) {
                return;
            } else if (600 > window.innerWidth) { // 0 ~ 599
                setBrowsingHelper({ ...browsingHelper, memorizeViewPortPositionY: (document.getElementById(postId)?.offsetTop ?? 0) / 2 - 200 });
            } else { // 600 ~ ∞
                setBrowsingHelper({ ...browsingHelper, memorizeViewPortPositionY: processStates.memorizeViewPortPositionY });
            }
            let states: IHomePageProcessStates = { ...processStates, memorizeLastViewedPostId: undefined, memorizeViewPortPositionY: undefined, wasRedirected: false };
            // Step #2 update process states
            setProcessStates(states);
            // Step #3 update process state cache
            updateProcessStatesCache(states);
        }
    }, [masonryPostInfoArr]);

    if (!!browsingHelper.memorizeViewPortPositionY) {
        window.scrollTo(0, browsingHelper.memorizeViewPortPositionY ?? 0);
    }

    const handleClickOnPost = (postId: string) => (event: React.MouseEvent) => {
        // Step #1 update process state cache
        updateProcessStatesCache({ ...processStates, memorizeLastViewedPostId: postId, memorizeViewPortPositionY: window.scrollY, wasRedirected: true });
        // Step #2 jump
        router.push(`/post/${postId}`);
    }

    const handleClickOnMemberInfo = (memberId: string, postId: string) => (event: React.MouseEvent) => {
        // Step #1 update process state cache
        updateProcessStatesCache({ ...processStates, memorizeLastViewedPostId: postId, memorizeViewPortPositionY: window.scrollY, wasRedirected: true });
        // Step #2 jump
        router.push(`/me/id/${memberId}`);
    }

    const handleClickOnNickname = () => {
        router.push(`/me/id/${viewerId}`);
    }

    const handleClickOnStatistics = () => {
        router.push(`/me/id/${viewerId}`);
    }

    const handleClickOnUnreadMessage = () => {
        router.push(`/me/id/${viewerId}`);
    }

    //////// STATES - post menu ////////
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const handleOpenMemberMenu = (event: React.MouseEvent<HTMLElement>) => { setAnchorEl(event.currentTarget) }
    const handleCloseMemberMenu = () => { setAnchorEl(null) }

    //////// STATE - posts (24 hours) ////////
    const [twentyFourHoursPostArr, setTtwentyFourHoursPostArr] = React.useState<IConcisePostComprehensive[]>([]);

    React.useEffect(() => { updateTwentyFourHoursPostArr() }, []);

    const updateTwentyFourHoursPostArr = async () => {
        const resp = await fetch(`/api/post/s/of/hot/24h?channelId=all&quantity=5`);
        if (200 === resp.status) {
            try {
                const arr = await resp.json();
                if (Array.isArray(arr) && 0 !== arr.length) {
                    setTtwentyFourHoursPostArr([...arr.slice(0, 5)]);
                } else {
                    throw new Error(`Getting invalid response or an empty array.`);
                }
            } catch (e) {
                console.log(`Attempt to GET (hotest) posts of 24 hours. ${e}`);
            }
        }
    }

    //////// STATE - posts (7 days) ////////
    const [sevenDaysPostsArr, setSevenDaysPostsArr] = React.useState<IConcisePostComprehensive[]>([]);

    React.useEffect(() => { updateSevenDaysPostsArr() }, []);

    const updateSevenDaysPostsArr = async () => {
        const resp = await fetch(`/api/post/s/of/hot/7d?channelId=all&quantity=5`);
        if (200 === resp.status) {
            try {
                const arr = await resp.json();
                if (Array.isArray(arr) && 0 !== arr.length) {
                    setSevenDaysPostsArr([...arr.slice(0, 5)]);
                } else {
                    throw new Error(`Getting invalid response or an empty array.`);
                }
            } catch (e) {
                console.log(`Attempt to GET (hotest) posts of 7 days. ${e}`);
            }
        }
    }

    return (
        <>
            <Navbar />
            <Grid container>

                {/* //// placeholder - left //// */}
                <Grid item xs={0} sm={0} md={0} lg={0} xl={1}></Grid>

                {/* //// left column //// */}
                <Grid item xs={0} sm={0} md={2} lg={2} xl={1}>
                    <Stack spacing={1} sx={{ marginX: 1, display: { xs: 'none', sm: 'none', md: 'block' } }} >

                        {/* channel menu (desktop mode) */}
                        <ResponsiveCard sx={{ padding: 1 }}>
                            <MenuList>

                                {/* the 'all' menu item */}
                                <MenuItem onClick={handleChannelSelect('all')} selected={processStates.selectedChannelId === 'all'}>
                                    <ListItemIcon>
                                        <BubbleChartIcon />
                                    </ListItemIcon>
                                    <ListItemText>
                                        <Typography>{langConfigs.allPosts[processStates.lang]}</Typography>
                                    </ListItemText>
                                </MenuItem>

                                {/* the 'following' menu item */}
                                <MenuItem onClick={handleChannelSelect('following')} selected={'following' === processStates.selectedChannelId}>
                                    <ListItemIcon>
                                        <CastIcon />
                                    </ListItemIcon>
                                    <ListItemText>
                                        <Typography>{langConfigs.followedPosts[processStates.lang]}</Typography>
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
                                                <Typography>{name[processStates.lang]}</Typography>
                                            </ListItemText>
                                        </MenuItem>
                                    )
                                })}
                            </MenuList>
                        </ResponsiveCard>

                        {/* hotest / newest switch */}
                        <ResponsiveCard sx={{ padding: 0, paddingY: 2, paddingLeft: 2 }}>
                            <FormControlLabel
                                control={<StyledSwitch sx={{ ml: 1 }} checked={processStates.selectedHotPosts} />}
                                label={processStates.selectedHotPosts ? langConfigs.hotPosts[processStates.lang] : langConfigs.newPosts[processStates.lang]}
                                onChange={handleSwitchChange}
                                sx={{ marginRight: 0 }}
                            />
                        </ResponsiveCard>
                    </Stack>
                </Grid>

                {/* //// middle column //// */}
                <Grid item xs={12} sm={12} md={7} lg={7} xl={7} >

                    {/* channel bar (mobile mode) */}
                    <Stack direction={'row'} id='channel-bar' sx={{ display: { sm: 'flex', md: 'none' }, padding: 1, overflow: 'auto' }}>

                        {/* hotest / newest switch */}
                        <Box minWidth={110}>
                            <FormControlLabel
                                control={<StyledSwitch sx={{ ml: 1 }} checked={processStates.selectedHotPosts} />}
                                label={processStates.selectedHotPosts ? langConfigs.hotPosts[processStates.lang] : langConfigs.newPosts[processStates.lang]}
                                onChange={handleSwitchChange}
                            />
                        </Box>

                        {/* the 'all' button */}
                        <Button variant={'all' === processStates.selectedChannelId ? 'contained' : 'text'} size='small' onClick={handleChannelSelect('all')}>
                            <Typography variant='body2' color={'all' === processStates.selectedChannelId ? 'white' : "text.secondary"} sx={{ backgroundColor: 'primary' }}>
                                {langConfigs.allPosts[processStates.lang]}
                            </Typography>
                        </Button>

                        {/* the 'following' button */}
                        <Button variant={'following' === processStates.selectedChannelId ? 'contained' : 'text'} size='small' onClick={handleChannelSelect('all')}>
                            <Typography variant='body2' color={'all' === processStates.selectedChannelId ? 'white' : "text.secondary"} sx={{ backgroundColor: 'primary' }}>
                                {langConfigs.allPosts[processStates.lang]}
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
                                        {name[processStates.lang]}
                                    </Typography>
                                </Button>
                            )
                        })}
                    </Stack>

                    {/* mansoy */}
                    <Box ml={1} ref={masonryWrapper}>
                        <Masonry columns={{ xs: 2, sm: 3, md: 3, lg: 3, xl: 4 }}>

                            {/* posts */}
                            {0 !== masonryPostInfoArr.length && masonryPostInfoArr.map(post => {
                                return (
                                    <Paper key={post.postId} id={post.postId} sx={{ maxWidth: 300, '&:hover': { cursor: 'pointer' } }} >
                                        <Stack>
                                            {/* image */}
                                            <Box
                                                component={'img'}
                                                src={post.imageUrlsArr[0]}
                                                sx={{ maxWidth: { xs: width / 2, sm: 300 }, height: 'auto', borderTopLeftRadius: 4, borderTopRightRadius: 4 }}
                                                onClick={handleClickOnPost(post.postId)}
                                            ></Box>

                                            {/* title */}
                                            <Box paddingTop={2} paddingX={2} onClick={handleClickOnPost(post.postId)}>
                                                <Typography variant={'body1'}>{post.title}</Typography>
                                            </Box>

                                            {/* member info & member behaviour */}
                                            <Box paddingTop={1} >
                                                <Grid container>

                                                    {/* member info */}
                                                    <Grid item flexGrow={1}>
                                                        <Box display={'flex'} flexDirection={'row'}>
                                                            <Button variant={'text'} color={'inherit'} sx={{ textTransform: 'none' }} onClick={handleClickOnMemberInfo(post.memberId, post.postId)}>
                                                                <Avatar src={post.avatarImageFullName} sx={{ width: 34, height: 34, bgcolor: 'grey' }}>{post.nickname?.charAt(0).toUpperCase()}</Avatar>
                                                                <Box ml={1}>
                                                                    <Typography variant='body2'>{getNicknameBrief(post.nickname)}</Typography>
                                                                </Box>
                                                            </Button>
                                                        </Box>
                                                    </Grid>

                                                    {/* member behaviour / placeholder */}
                                                    <Grid item >
                                                        <IconButton onClick={handleOpenMemberMenu}><MoreVertIcon /></IconButton>
                                                    </Grid>
                                                </Grid>
                                            </Box>
                                        </Stack>
                                    </Paper>
                                )
                            })}
                        </Masonry>
                    </Box>

                    <CenterlizedBox>
                        <Button variant='contained'>{'Load more'}</Button>
                    </CenterlizedBox>

                    {/* copyright */}
                    <Copyright sx={{ marginY: 8 }} />
                </Grid>

                {/* //// right column //// */}
                <Grid item xs={0} sm={0} md={3} lg={3} xl={2}>

                    {/* member (viewer) info stack */}
                    {'authenticated' === status && <Stack spacing={1} sx={{ marginX: 1, display: { xs: 'none', sm: 'none', md: 'flex' } }} >

                        {/* member info card */}
                        <ResponsiveCard sx={{ paddingY: 2 }}>
                            <Stack>

                                {/* nickname */}
                                <CenterlizedBox mt={{ md: 2, lg: 2, xl: 3 }} onClick={handleClickOnNickname} >
                                    <Button variant='text' color='inherit' sx={{ textTransform: 'none' }}>
                                        <Box sx={{ fontSize: 20, fontWeight: 100 }}>{session?.user?.name}</Box>
                                    </Button>
                                </CenterlizedBox>
                                <Box mt={{ md: 2, lg: 2, xl: 3 }}><Divider /></Box>

                                {/* info */}
                                <CenterlizedBox mt={3} mb={1} >
                                    <Button variant='text' color='inherit' onClick={handleClickOnStatistics}>
                                        <Box>
                                            <CenterlizedBox><Typography variant='body1' >{langConfigs.totalFollowedByCount[processStates.lang]}</Typography></CenterlizedBox>
                                            <CenterlizedBox><Typography variant='body1'>{viewerComprehensive.totalFollowedByCount}</Typography></CenterlizedBox>
                                        </Box>
                                        <Box marginX={4}>
                                            <CenterlizedBox><Typography variant='body1'>{langConfigs.totalCreationSavedCount[processStates.lang]}</Typography></CenterlizedBox>
                                            <CenterlizedBox><Typography variant='body1'>{viewerComprehensive.totalCreationSavedCount}</Typography></CenterlizedBox>
                                        </Box>
                                        <Box>
                                            <CenterlizedBox><Typography variant='body1'>{langConfigs.totalCreationLikedCount[processStates.lang]}</Typography></CenterlizedBox>
                                            <CenterlizedBox><Typography variant='body1'>{viewerComprehensive.totalCreationLikedCount}</Typography></CenterlizedBox>
                                        </Box>
                                    </Button>
                                </CenterlizedBox>
                            </Stack>
                        </ResponsiveCard>

                        {/* unread message card */}
                        <ResponsiveCard sx={{ paddingY: 2 }}>
                            <CenterlizedBox>
                                <Button variant='text' color='inherit' onClick={handleClickOnUnreadMessage}>
                                    <EmailIcon sx={{ color: 'grey' }} />
                                    <Typography variant='body1' sx={{ marginTop: 0.1, marginLeft: 1 }}>{viewerComprehensive.reply}{langConfigs.unreadReplyNotice[processStates.lang]}</Typography>
                                </Button>
                            </CenterlizedBox>
                        </ResponsiveCard>
                    </ Stack>}

                    {/* post rankings stack */}
                    <Stack spacing={1} sx={{ marginX: 1, display: { xs: 'none', sm: 'none', md: 'flex' } }} >

                        {/* 24 hours hot */}
                        <ResponsiveCard sx={{ padding: { lg: 3, xl: 2 } }} mt={2}>
                            <Box>
                                <Typography>{langConfigs.twentyFourHoursHot[processStates.lang]}</Typography>
                            </Box>

                            {/* post stack (24 hours hot) */}
                            <Stack mt={1} spacing={1}>
                                {0 !== twentyFourHoursPostArr.length && twentyFourHoursPostArr.map(po =>
                                    <Grid container key={po.title}>

                                        {/* image */}
                                        <Grid item display={{ md: 'none', lg: 'block' }}>
                                            <Box sx={{ width: 48, height: 48, backgroundImage: `url(${po.imageUrlsArr[0]})`, backgroundSize: 'cover' }}></Box>
                                        </Grid>

                                        {/* title & statistics */}
                                        <Grid item flexGrow={1}>
                                            <Box ml={1}>
                                                <TextButton sx={{ color: 'inherit' }}>
                                                    <Typography variant='body1' marginTop={0.1} textOverflow={'ellipsis'} maxWidth={{ md: 210, lg: 200, xl: 150 }} noWrap>{po.title}</Typography>
                                                    <Typography variant='body2' fontSize={{ xs: 12 }}>{po.totalHitCount} {langConfigs.totalHitCount[processStates.lang]}</Typography>
                                                </TextButton>
                                            </Box>
                                        </Grid>
                                    </Grid>
                                )}
                            </Stack>
                        </ResponsiveCard>

                        {/* 7 days hot */}
                        <ResponsiveCard sx={{ padding: { lg: 3, xl: 2 } }}>
                            <Box>
                                <Typography>{langConfigs.sevenDaysHot[processStates.lang]}</Typography>
                            </Box>

                            {/* post stack (7 days hot) */}
                            <Stack mt={1} spacing={1}>
                                {0 !== sevenDaysPostsArr.length && sevenDaysPostsArr.map(po =>
                                    <Grid container key={po.title}>

                                        {/* image */}
                                        <Grid item display={{ md: 'none', lg: 'block' }}>
                                            <Box sx={{ width: 48, height: 48, backgroundImage: `url(${po.imageUrlsArr[0]})`, backgroundSize: 'cover' }}></Box>
                                        </Grid>

                                        {/* title & statistics */}
                                        <Grid item flexGrow={1}>
                                            <Box ml={1}>
                                                <TextButton sx={{ color: 'inherit' }}>
                                                    <Typography variant='body1' marginTop={0.1} textOverflow={'ellipsis'} maxWidth={{ lg: 180, xl: 150 }} noWrap>{po.title}</Typography>
                                                    <Typography variant='body2' fontSize={{ xs: 12 }}>{po.totalHitCount} {langConfigs.totalHitCount[processStates.lang]}</Typography>
                                                </TextButton>
                                            </Box>
                                        </Grid>
                                    </Grid>
                                )}
                            </Stack>
                        </ResponsiveCard>
                    </Stack>
                </Grid>

                {/* //// placeholder - right //// */}
                <Grid item xs={0} sm={0} md={0} lg={0} xl={0}></Grid>
            </Grid>
            <Menu
                sx={{ mt: '45px' }}
                anchorEl={anchorEl}
                anchorOrigin={{ vertical: 'top', horizontal: 'right', }}
                keepMounted
                transformOrigin={{ vertical: 'top', horizontal: 'right', }}
                open={Boolean(anchorEl)}
                onClose={handleCloseMemberMenu}
                MenuListProps={{}}
            >
                <MenuItem >
                    <ListItemIcon><BlockIcon /></ListItemIcon>
                    <ListItemText>{'See less'}</ListItemText>
                </MenuItem>
            </Menu>

        </>
    )
}

export default Home