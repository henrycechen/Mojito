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

import Masonry from '@mui/lab/Masonry';

import Paper from '@mui/material/Paper';

import { FormControlLabel, styled } from '@mui/material';


import Divider from '@mui/material/Divider';
import Link from '@mui/material/Link';
import Container from '@mui/material/Container';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';

import { useTheme } from '@emotion/react';
import { useRouter } from 'next/router';

import { ProcessStates, BrowsingHelper, LangConfigs, TChannelInfoStates, TChannelInfoDictionary } from '../lib/types';
import { updateLocalStorage, restoreFromLocalStorage } from '../lib/utils';
import { CenterlizedBox, ResponsiveCard, StyledSwitch, TextButton } from '../ui/Styled';
import Navbar from '../ui/Navbar';
import { IConcisePostComprehensive, IConcisePostComprehensiveWithMemberInfo } from '../lib/interfaces';

const storageName = 'HomePageProcessStates';
const updateProcessStates = updateLocalStorage(storageName);
const restoreProcessStates = restoreFromLocalStorage(storageName);

type THomePagePros = {
    channelInfoDict_ss: TChannelInfoDictionary
}

interface HomePageProcessStates extends ProcessStates {
    selectedChannelId: string;
    selectedHotPosts: boolean;
    memorizeChannelBarPositionX: number | undefined;
    memorizeViewPortPositionY: number | undefined;
    memorizeLastViewedPostId: string | undefined;
    wasRedirected: boolean;
}

type TViewerComprehensive = {
    totalCreationCount: number;
    totalCreationLikedCount: number;
    totalFollowingCount: number;

    reply: number;
}

type MemberBehaviourStates = {
    liked: boolean;
    disliked: boolean;
    saved: boolean;
}

type PostInfo = {
    id: string;
    memberId: string;
    title: string;
    imgUrl: string;
    timestamp: string;
}

const domain = process.env.NEXT_PUBLIC_APP_DOMAIN;
const lang = process.env.NEXT_PUBLIC_APP_LANG ?? 'tw';
const langConfigs: LangConfigs = {
    allPosts: {
        tw: '全部',
        cn: '全部',
        en: 'All posts'
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
        tw: '發文',
        cn: '发帖',
        en: 'Posts'
    },
    totalCreationLikedCount: {
        tw: '喜歡',
        cn: '点赞',
        en: 'Likes'
    },
    totalFollowingCount: {
        tw: '關注',
        cn: '粉丝',
        en: 'Followers'
    },
    unreadReplyNotice: {
        tw: (n: number) => `${n} 條未讀消息`,
        cn: (n: number) => `${n} 条未读提醒`,
        en: (n: number) => `${n} Unread reply`
    }
}

//// get multiple info server-side ////
export async function getServerSideProps(context: NextPageContext): Promise<{ props: THomePagePros }> {
    const resp = await fetch(`${domain}/api/channel/info/dictionary`);
    if (200 !== resp.status) {
        throw new Error('Attempt to GET channel info dictionary');
    }
    let channelInfoDict_ss: TChannelInfoDictionary;
    try {
        channelInfoDict_ss = await resp.json();
    } catch (e) {
        throw new Error(`Attempt to parse channel info dictionary (JSON). ${e}`);
    }
    return {
        props: {
            channelInfoDict_ss
        }
    }
}

const Home = ({ channelInfoDict_ss }: THomePagePros) => {

    const router = useRouter();
    const { data: session, status } = useSession();
    // status - 'unauthenticated' / 'authenticated'

    let viewerId = '';
    const authorSession: any = { ...session };
    viewerId = authorSession?.user?.id;

    //////// REF - masonry ////////
    const masonryWrapper = React.useRef<any>();
    const [width, setWidth] = React.useState(636);
    React.useEffect(() => {
        setWidth(masonryWrapper?.current?.offsetWidth)
    }, [])


    //////// STATES - process ////////
    const [processStates, setProcessStates] = React.useState<HomePageProcessStates>({
        selectedChannelId: '',
        selectedHotPosts: false,
        memorizeChannelBarPositionX: undefined,
        memorizeViewPortPositionY: undefined,
        memorizeLastViewedPostId: undefined,
        wasRedirected: false,
    });

    React.useEffect(() => { restoreProcessStates(setProcessStates) }, []);


    //////// STATES - viewer comprehensive (statistics + notice) ////////
    const [viewerComprehensive, setViewerComprehensive] = React.useState<TViewerComprehensive>({
        totalCreationCount: 0,
        totalCreationLikedCount: 0,
        totalFollowingCount: 0,

        reply: 0
    })

    React.useEffect(() => { if ('authenticated' === status) { updateViewerComprehensive() } }, [status]);

    const updateViewerComprehensive = async () => {
        let update: TViewerComprehensive = {
            totalCreationCount: 0,
            totalCreationLikedCount: 0,
            totalFollowingCount: 0,
            reply: 0,
        };
        // Get member statistics by id
        const resp_statistics = await fetch(`/api/member/statistics/${viewerId}`);
        if (200 === resp_statistics.status) {
            try {
                const statistics = await resp_statistics.json();
                update.totalCreationCount = statistics.totalCreationCount;
                update.totalCreationLikedCount = statistics.totalCreationLikedCount;
                update.totalFollowingCount = statistics.totalFollowingCount;
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
    const [browsingHelper, setBrowsingHelper] = React.useState<BrowsingHelper>({
        memorizeViewPortPositionY: undefined, // reset scroll-help on handleChannelSelect, handleSwitchChange, ~~handlePostCardClick~~
    })

    ///////// STATES - channel /////////
    const [channelInfoStates, setChannelInfoStates] = React.useState<TChannelInfoStates>({
        channelIdSequence: [],
    });

    React.useEffect(() => { updateChannelIdSequence() }, []);

    const updateChannelIdSequence = async () => {
        const resp = await fetch(`/api/channel/id/sequence`);
        if (200 !== resp.status) {
            console.log(`Attemp to GET channel id array. Using sequence from channel info dictionary instead`);
            setChannelInfoStates({
                ...channelInfoStates,
                channelIdSequence: Object.keys(channelInfoDict_ss)
            })
        } else {
            try {
                const idArr = await resp.json();
                setChannelInfoStates({
                    ...channelInfoStates,
                    channelIdSequence: [...idArr]
                })
            } catch (e) {
                console.log(`Attemp to parese channel id array. ${e}`);
            }
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
        let states: HomePageProcessStates = { ...processStates };
        states.selectedChannelId = channelId;
        states.memorizeChannelBarPositionX = document.getElementById('channel-bar')?.scrollLeft;
        // Step #1 update process states
        setProcessStates(states);
        // Step #2 presist process states to cache
        updateProcessStates(states);
        // Step #3 reset browsing helper
        setBrowsingHelper({ ...browsingHelper, memorizeViewPortPositionY: undefined });
    }

    // Handle newest/hotest posts switch
    const handleSwitchChange = () => {
        let states: HomePageProcessStates = { ...processStates, selectedHotPosts: !processStates.selectedHotPosts }
        // Step #1 update process states
        setProcessStates(states);
        // Step #2 presist process states to cache
        updateProcessStates(states);
        // Step #3 reset browsing helper
        setBrowsingHelper({ ...browsingHelper, memorizeViewPortPositionY: undefined });
    }

    //////// STATE - post array ////////
    const [postsArr, setPostsArr] = React.useState<IConcisePostComprehensiveWithMemberInfo[]>([]);

    React.useEffect(() => { updatePostsArr() }, [processStates.selectedChannelId]);

    const updatePostsArr = async () => {
        const resp = await fetch(`/api/post/s/of${processStates.selectedHotPosts ? '/hot/24h' : '/new'}`);
        if (200 === resp.status) {
            try {
                setPostsArr(await resp.json());
            } catch (e) {
                console.log(`Attempt to GET posts. ${e}`);
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
            let states: HomePageProcessStates = { ...processStates, memorizeLastViewedPostId: undefined, memorizeViewPortPositionY: undefined, wasRedirected: false };
            // Step #2 update process states
            setProcessStates(states);
            // Step #3 update process state cache
            updateProcessStates(states);
        }
    }, [postsArr]);
    if (!!browsingHelper.memorizeViewPortPositionY) {
        window.scrollTo(0, browsingHelper.memorizeViewPortPositionY ?? 0);
    }

    // Handle click on post card
    const handlePostCardClick = (postId: string) => (event: React.MouseEvent) => {
        // Step #1 update process state cache
        updateProcessStates({ ...processStates, memorizeLastViewedPostId: postId, memorizeViewPortPositionY: window.scrollY, wasRedirected: true });
        // Step #2 jump
        router.push(`/post/${postId}`);
    }

    // Decalre member behaviour? like-post dislike-comment follow-member save-post ...
    const [memberBehaviour, handleMemberBehaviour] = React.useState<MemberBehaviourStates>({
        liked: false,
        disliked: false,
        saved: false
    });

    // Handle member behaviour
    // like, dislike, save ...
    const handleBehaviourOnPost = () => {

    }

    // Declare member info
    // 


    // Declare subcomment info
    //

    // Handle post states change
    React.useEffect(() => {
        // initialize post
    }, [])
    const getPostInfo = async () => {

    }

    const getMemberBehaviour = async () => {

    }

    const getMemberInfo = async () => {

    }

    return (
        <>
            <Navbar />
            <Grid container>

                {/* - placeholder - */}
                <Grid item xs={0} sm={0} md={0} lg={0} xl={1}></Grid>

                {/* - left column - */}
                <Grid item xs={0} sm={0} md={2} lg={2} xl={1}>
                    <Stack spacing={1} sx={{ marginX: 1, display: { xs: 'none', sm: 'none', md: 'block' } }} >

                        {/* channel menu (desktop mode) */}
                        <ResponsiveCard sx={{ padding: 1 }}>
                            <MenuList>

                                {/* 'all' menu item */}
                                <MenuItem
                                    onClick={handleChannelSelect('all')}
                                    selected={processStates.selectedChannelId === 'all'}
                                >
                                    <ListItemIcon>
                                        <BubbleChartIcon />
                                    </ListItemIcon>
                                    <ListItemText>
                                        <Typography>{langConfigs.allPosts[lang]}</Typography>
                                    </ListItemText>
                                </MenuItem>

                                {/* other channels */}
                                {channelInfoStates.channelIdSequence.map(id => {
                                    const { channelId, name, svgIconPath } = channelInfoDict_ss[id];
                                    return (
                                        <MenuItem key={channelId}
                                            onClick={handleChannelSelect(channelId)}
                                            selected={channelId === processStates.selectedChannelId}
                                        >
                                            <ListItemIcon >
                                                <SvgIcon><path d={svgIconPath} /></SvgIcon>
                                            </ListItemIcon>
                                            <ListItemText>
                                                <Typography>{name[lang]}</Typography>
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
                                label={processStates.selectedHotPosts ? langConfigs.hotPosts[lang] : langConfigs.newPosts[lang]}
                                onChange={handleSwitchChange}
                                sx={{ marginRight: 0 }}
                            />
                        </ResponsiveCard>
                    </Stack>
                </Grid>

                {/* - middle column - */}
                <Grid item xs={12} sm={12} md={7} lg={7} xl={7} >

                    {/* channel bar (mobile mode) */}
                    <Stack direction={'row'} id='channel-bar'
                        sx={{
                            padding: 1,
                            overflow: 'auto',
                            display: { sm: 'flex', md: 'none' }
                        }}
                    >

                        {/* hotest / newest switch */}
                        <Box minWidth={110}>
                            <FormControlLabel
                                control={<StyledSwitch sx={{ ml: 1 }} checked={processStates.selectedHotPosts} />}
                                label={processStates.selectedHotPosts ? langConfigs.hotPosts[lang] : langConfigs.newPosts[lang]}
                                onChange={handleSwitchChange}
                            />
                        </Box>

                        {/* 'all' button */}
                        <Button variant={'all' === processStates.selectedChannelId ? 'contained' : 'text'} size='small' onClick={handleChannelSelect('all')}>
                            <Typography variant='body2' color={'all' === processStates.selectedChannelId ? 'white' : "text.secondary"} sx={{ backgroundColor: 'primary' }}>
                                {langConfigs.allPosts[lang]}
                            </Typography>
                        </Button>

                        {/* other channels */}
                        {channelInfoStates.channelIdSequence.map(id => {
                            const { channelId, name } = channelInfoDict_ss[id];
                            return (
                                <Button variant={channelId === processStates.selectedChannelId ? 'contained' : 'text'} key={channelId} size='small' onClick={handleChannelSelect(channelId)}>
                                    <Typography
                                        variant={'body2'}
                                        color={channelId === processStates.selectedChannelId ? 'white' : 'text.secondary'}
                                        sx={{ backgroundColor: 'primary' }}>
                                        {name[lang]}
                                    </Typography>
                                </Button>
                            )
                        })}
                    </Stack>

                    {/* mansoy */}
                    <Box ml={1} ref={masonryWrapper}>
                        <Masonry columns={{ xs: 2, sm: 3, md: 3, lg: 3, xl: 4 }}>

                            {/* posts */}
                            {postsArr.length !== 0 && postsArr.map(post => {
                                return (
                                    <Paper id={post.postId} key={post.postId} sx={{ maxWidth: 300, '&:hover': { cursor: 'pointer' } }} onClick={handlePostCardClick(post.postId)}>
                                        <Stack>
                                            {/* image */}
                                            <Box component={'img'} src={post.imageUrlsArr[0]} maxWidth={{ xs: width / 2, sm: 300 }} height={'auto'} sx={{ borderTopLeftRadius: 4, borderTopRightRadius: 4 }}></Box>

                                            {/* title */}
                                            <Box paddingTop={2} paddingX={2}>
                                                <Typography variant='body1'>{post.title}</Typography>
                                            </Box>
                                            {/* member info & member behaviour */}
                                            <Box paddingTop={1}>
                                                <Grid container>
                                                    <Grid item flexGrow={1}>
                                                        <Box display={'flex'} flexDirection={'row'}>
                                                            <IconButton>
                                                                <Avatar src={post.avatarImageUrl} sx={{ width: 34, height: 34, bgcolor: 'grey' }}>{post.nickname?.charAt(0).toUpperCase()}</Avatar>
                                                            </IconButton>
                                                            <Button variant='text' color='inherit' sx={{ textTransform: 'none' }}>
                                                                <Typography variant='body2'>{post.nickname}</Typography>
                                                            </Button>
                                                        </Box>
                                                    </Grid>
                                                    <Grid item>
                                                        <IconButton aria-label='like' >
                                                            <ThumbUpIcon color={true ? 'primary' : 'inherit'} />
                                                        </IconButton>
                                                    </Grid>
                                                </Grid>
                                            </Box>
                                        </Stack>
                                    </Paper>
                                )
                            })}
                        </Masonry>
                    </Box>
                </Grid>

                {/* right column */}
                <Grid item xs={0} sm={0} md={3} lg={3} xl={2}>

                    {/* member (viewer) info stack */}
                    {'authenticated' === status && <Stack spacing={1} sx={{ marginX: 1, display: { xs: 'none', sm: 'none', md: 'flex' } }} >

                        {/* member info card */}
                        <ResponsiveCard sx={{ paddingY: 2 }}>
                            <Stack>
                                {/* nickname */}
                                <CenterlizedBox mt={3} >
                                    <Box sx={{ fontSize: 20, fontWeight: 100 }}>{session?.user?.name}</Box>
                                </CenterlizedBox>
                                <Box mt={3}><Divider /></Box>
                                {/* info */}
                                <CenterlizedBox mt={4} mb={1} >
                                    {/* left column */}
                                    <Box>
                                        <CenterlizedBox><Typography variant='body1'>{langConfigs.totalCreationCount[lang]}</Typography></CenterlizedBox>
                                        <CenterlizedBox><Typography variant='body1'>{viewerComprehensive.totalCreationCount}</Typography></CenterlizedBox>
                                    </Box>
                                    {/* middle column */}
                                    <Box marginX={4}>
                                        <CenterlizedBox><Typography variant='body1' >{langConfigs.totalFollowingCount[lang]}</Typography></CenterlizedBox>
                                        <CenterlizedBox><Typography variant='body1'>{viewerComprehensive.totalFollowingCount}</Typography></CenterlizedBox>
                                    </Box>
                                    {/* right column */}
                                    <Box>
                                        <CenterlizedBox><Typography variant='body1'>{langConfigs.totalCreationLikedCount[lang]}</Typography></CenterlizedBox>
                                        <CenterlizedBox><Typography variant='body1'>{viewerComprehensive.totalCreationLikedCount}</Typography></CenterlizedBox>
                                    </Box>
                                </CenterlizedBox>
                            </Stack>
                        </ResponsiveCard>

                        {/* unread message card */}
                        <ResponsiveCard sx={{ paddingY: 2 }}>
                            <CenterlizedBox>
                                <Button variant='text' color='inherit'>
                                    <EmailIcon sx={{ color: 'grey' }} />
                                    <Typography variant='body1' sx={{ marginTop: 0.1 }}>{langConfigs.unreadReplyNotice[lang](viewerComprehensive.reply)}</Typography>
                                </Button>
                            </CenterlizedBox>
                        </ResponsiveCard>
                    </ Stack>}

                    {/* post rankings stack */}
                    <Stack spacing={1} sx={{ marginX: 1, display: { xs: 'none', sm: 'none', md: 'flex' } }} >

                        {/* 24 hour hot */}
                        <ResponsiveCard sx={{ padding: { lg: 3, xl: 2 } }} mt={2}>
                            <Box>
                                <Typography>{'24小时热帖'}</Typography>
                            </Box>
                            <Stack spacing={1}>
                                {true && [{ title: '#初秋专属氛围感#', imgUrl: 'pink' }, { title: '今天就需要衛衣加持', imgUrl: '#1976d2' }, { title: '星期一的咖啡時光～', imgUrl: 'darkorange' }].map(po =>
                                    <Grid container key={po.title}>
                                        <Grid item display={{ md: 'none', lg: 'block' }}>
                                            <Box sx={{ width: 48, height: 48, backgroundColor: po.imgUrl }}></Box>
                                        </Grid>
                                        <Grid item flexGrow={1}>
                                            <Box ml={1}>
                                                <TextButton sx={{ color: 'inherit' }}>
                                                    <Typography variant='body1' marginTop={0.1} textOverflow={'ellipsis'} maxWidth={{ lg: 200, xl: 150 }} noWrap>{po.title}</Typography>
                                                    <Typography variant='body2' fontSize={{ xs: 12 }}>
                                                        {'100 浏览'}
                                                    </Typography>
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
                                <Typography>{'本周热帖'}</Typography>
                            </Box>
                            <Stack mt={1} spacing={1}>
                                {true && [{ title: '第一次海淘，寻求建议', imgUrl: '#D6D5B3' }, { title: '送女友家人，有红酒推荐吗', imgUrl: '#F92A82' }, { title: '大家平时都喝什么咖啡？', imgUrl: '#806443' }].map(po =>
                                    <Grid container key={po.title}>
                                        <Grid item display={{ md: 'none', lg: 'block' }}>
                                            <Box sx={{ width: 44, height: 44, backgroundColor: po.imgUrl }}></Box>
                                        </Grid>
                                        <Grid item flexGrow={1}>
                                            <Box ml={1}>
                                                <TextButton sx={{ color: 'inherit' }}>
                                                    <Typography variant='body1' marginTop={0.1} textOverflow={'ellipsis'} maxWidth={{ lg: 180, xl: 150 }} noWrap>{po.title}</Typography>
                                                    <Typography variant='body2' fontSize={{ xs: 12 }}>
                                                        {'100 浏览'}
                                                    </Typography>
                                                </TextButton>
                                            </Box>
                                        </Grid>
                                    </Grid>
                                )}
                            </Stack>
                        </ResponsiveCard>
                    </Stack>
                </Grid>

                <Grid item xs={0} sm={0} md={0} lg={0} xl={0}></Grid>
            </Grid>
        </>
    )
}



export default Home