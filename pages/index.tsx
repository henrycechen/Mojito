import * as React from 'react';
import { WheelEvent } from 'react';

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
import Switch from '@mui/material/Switch';


import Divider from '@mui/material/Divider';
import Link from '@mui/material/Link';
import Container from '@mui/material/Container';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';

import { useTheme } from '@emotion/react';
import { useRouter } from 'next/router';

import { ProcessStates, Helper, ChannelDictionary, ChannelInfo, LangConfigs } from '../lib/types';
import { getRandomIdStrL20, updateLocalStorage, restoreFromLocalStorage } from '../lib/utils';
import { CenterlizedBox, ResponsiveCard, StyledSwitch, TextButton } from '../ui/Styled';
import Navbar from '../ui/Navbar';

const storageName = 'HomePageProcessStates';
const updateProcessStates = updateLocalStorage(storageName);
const restoreProcessStates = restoreFromLocalStorage(storageName);

// Decalre process state type of this page
interface HomePageProcessStates extends ProcessStates {
    selectedChannelId: string;
    selectedHotPosts: boolean;
    memorizeChannelBarPositionX: number | undefined;
    memorizeViewPortPositionY: number | undefined;
    memorizeLastViewedPostId: string | undefined;
    wasRedirected: boolean;
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

const lang = process.env.NEXT_PUBLIC_APP_LANG ?? 'ch';

const Home = () => {
    const { data: session, status } = useSession();
    // - 'unauthenticated'
    // - 'authenticated'
    const router = useRouter();

    //////// Declare masonry ref ////////
    const masonryWrapper = React.useRef<any>();
    const [width, setWidth] = React.useState(636);
    React.useEffect(() => {
        setWidth(masonryWrapper?.current?.offsetWidth)
    }, [])

    //////// Declare process states ////////
    const [processStates, setProcessStates] = React.useState<HomePageProcessStates>({
        selectedChannelId: '',
        selectedHotPosts: false,
        memorizeChannelBarPositionX: undefined,
        memorizeViewPortPositionY: undefined,
        memorizeLastViewedPostId: undefined,
        wasRedirected: false,
    });
    // Restore page process states on page re-load
    React.useEffect(() => {
        restoreProcessStates(setProcessStates);
    }, []);

    // Declare helper
    const [helper, setHelper] = React.useState<Helper>({
        memorizeViewPortPositionY: undefined, // reset scroll-help on handleChannelSelect, handleSwitchChange, ~~handlePostCardClick~~
    })

    // Decalre & initialize channel states
    const [channelInfoArr, setChannelInfoArr] = React.useState<ChannelInfo[]>([]);
    React.useEffect(() => {
        getPostChannelArr();
    }, []);
    const getPostChannelArr = async () => {
        const channelDict = await fetch('/api/channel/dictionary').then(resp => resp.json());
        const referenceArr = await fetch('/api/channel').then(resp => resp.json());
        const channelArr: ChannelInfo[] = [];
        referenceArr.forEach((channel: keyof ChannelDictionary) => {
            channelArr.push(channelDict[channel])
        });
        setChannelInfoArr(channelArr.filter(channel => !!channel));
    }
    // Restore channel bar position
    React.useEffect(() => {
        if (!!processStates.memorizeChannelBarPositionX) {
            document.getElementById('channel-bar')?.scrollBy(processStates.memorizeChannelBarPositionX ?? 0, 0);
        }
    }, [channelInfoArr]);

    // Handle channel select
    const handleChannelSelect = (channelId: string) => (event: React.MouseEvent<HTMLButtonElement> | React.SyntheticEvent) => {
        let states: HomePageProcessStates = { ...processStates };
        states.selectedChannelId = channelId;
        states.memorizeChannelBarPositionX = document.getElementById('channel-bar')?.scrollLeft;
        // Step #1 update process states
        setProcessStates(states);
        // Step #2 update process states cache
        updateProcessStates(states);
        // Step #3 reset helper
        setHelper({ ...helper, memorizeViewPortPositionY: undefined });
    }

    // Handle newest/hotest posts switch
    const handleSwitchChange = () => {
        let states: HomePageProcessStates = { ...processStates, selectedHotPosts: !processStates.selectedHotPosts }
        // Step #1 update process states
        setProcessStates(states);
        // Step #2 update process states cache
        updateProcessStates(states);
        // Step #3 reset helper
        setHelper({ ...helper, memorizeViewPortPositionY: undefined });
    }

    // Declare post info states
    const [postList, setPostList] = React.useState<PostInfo[]>([])
    // Initialize post list
    React.useEffect(() => {
        getPosts();
    }, [processStates])
    const getPosts = async () => {
        const resp = await fetch(`/api/post?ranking=${processStates.selectedHotPosts ? 'hotest' : 'newest'}`);
        const _postList = await resp.json();
        setPostList(_postList);
    }

    // Restore browsing after loading posts
    React.useEffect(() => {
        if (processStates.wasRedirected) {
            const postId = processStates.memorizeLastViewedPostId;
            // Step #1 restore browsing position
            if (!postId) {
                return;
            } else if (600 > window.innerWidth) { // 0 ~ 599
                setHelper({ ...helper, memorizeViewPortPositionY: (document.getElementById(postId)?.offsetTop ?? 0) / 2 - 200 });
            } else { // 600 ~ ∞
                setHelper({ ...helper, memorizeViewPortPositionY: processStates.memorizeViewPortPositionY });
            }
            let states: HomePageProcessStates = { ...processStates, memorizeLastViewedPostId: undefined, memorizeViewPortPositionY: undefined, wasRedirected: false };
            // Step #2 update process states
            setProcessStates(states);
            // Step #3 update process state cache
            updateProcessStates(states);
        }
    }, [postList]);
    if (!!helper.memorizeViewPortPositionY) {
        window.scrollTo(0, helper.memorizeViewPortPositionY ?? 0);
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
            {/* post component */}
            <Grid container>
                <Grid item xs={0} sm={0} md={0} lg={0} xl={1}></Grid>

                {/* left column */}
                <Grid item xs={0} sm={0} md={2} lg={2} xl={1}>
                    <Stack spacing={1} sx={{ marginX: 1, display: { xs: 'none', sm: 'none', md: 'block' } }} >
                        {/* the channel menu (desktop mode) */}
                        <ResponsiveCard sx={{ padding: 1 }}>
                            <MenuList>
                                {/* the "all" menu item */}
                                <MenuItem
                                    onClick={handleChannelSelect('all')}
                                    selected={processStates.selectedChannelId === 'all'}
                                >
                                    <ListItemIcon >
                                        <BubbleChartIcon />
                                    </ListItemIcon>
                                    <ListItemText>
                                        <Typography>
                                            {'全部'}
                                        </Typography>
                                    </ListItemText>
                                </MenuItem>
                                {/* other channels */}
                                {channelInfoArr.map(channel => {
                                    return (
                                        <MenuItem key={channel.id}
                                            onClick={handleChannelSelect(channel.id)}
                                            selected={processStates.selectedChannelId === channel.id}
                                        >
                                            <ListItemIcon >
                                                <SvgIcon>
                                                    <path d={channel.svgIconPath} />
                                                </SvgIcon>
                                            </ListItemIcon>
                                            <ListItemText>
                                                <Typography>
                                                    {channel.name[lang]}
                                                </Typography>
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
                                label={processStates.selectedHotPosts ? '最热' : '最新'}
                                onChange={handleSwitchChange}
                                sx={{ marginRight: 0 }}
                            />
                        </ResponsiveCard>
                    </Stack>
                </Grid>

                {/* middle column */}
                <Grid item xs={12} sm={12} md={7} lg={7} xl={7} >
                    {/* #1 the channel bar (mobile mode) */}
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
                                label={processStates.selectedHotPosts ? '最热' : '最新'}
                                onChange={handleSwitchChange}
                            />
                        </Box>
                        {/* the "all" button */}
                        <Button variant={'all' === processStates.selectedChannelId ? 'contained' : 'text'} size='small' onClick={handleChannelSelect('all')}>
                            <Typography variant='body2' color={'all' === processStates.selectedChannelId ? 'white' : "text.secondary"} sx={{ backgroundColor: 'primary' }}>
                                {'全部'}
                            </Typography>
                        </Button>
                        {/* other channels */}
                        {channelInfoArr.map(channel => {
                            return (
                                <Button variant={channel.id === processStates.selectedChannelId ? 'contained' : 'text'} key={channel.id} size='small' onClick={handleChannelSelect(channel.id)}>
                                    <Typography variant="body2" color={channel.id === processStates.selectedChannelId ? 'white' : "text.secondary"} sx={{ backgroundColor: 'primary' }}>
                                        {channel.name[lang]}
                                    </Typography>
                                </Button>
                            )
                        })}
                    </Stack>
                    {/* #2 the post mansoy */}
                    <Box ml={1} ref={masonryWrapper}>
                        <Masonry columns={{ xs: 2, sm: 3, md: 3, lg: 3, xl: 4 }}>
                            {postList.length !== 0 && postList.map(post =>
                                <Paper id={post.id} key={post.id} sx={{ maxWidth: 300, '&:hover': { cursor: 'pointer' } }} onClick={handlePostCardClick(post.id)}>
                                    <Stack>
                                        {/* image */}
                                        <Box component={'img'} src={post.imgUrl} maxWidth={{ xs: width / 2, sm: 300 }} height={'auto'} sx={{ borderTopLeftRadius: 4, borderTopRightRadius: 4 }}></Box>

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
                                                            <Avatar sx={{ bgcolor: 'grey', width: 25, height: 25, fontSize: 12 }}>
                                                                {'W'}
                                                            </Avatar>
                                                        </IconButton>
                                                        <Button variant='text' color='inherit' sx={{ textTransform: 'none' }}>
                                                            <Typography variant='body2'>{'WebMaster'}</Typography>
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
                            )}
                        </Masonry>
                    </Box>
                </Grid>

                {/* right column */}
                <Grid item xs={0} sm={0} md={3} lg={3} xl={2}>
                    <Stack spacing={1} sx={{ marginX: 1, display: { xs: 'none', sm: 'none', md: 'flex' } }} >
                        {/* member info card */}
                        <ResponsiveCard sx={{ paddingY: 2 }}>
                            <Stack>
                                {/* nickname */}
                                <CenterlizedBox mt={1} >
                                    <Typography variant='body1'>
                                        {'WebMaster'}
                                    </Typography>
                                </CenterlizedBox>
                                <Box mt={1}><Divider /></Box>
                                {/* info */}
                                <CenterlizedBox mt={2} >
                                    {/* left column */}
                                    <Box>
                                        <CenterlizedBox>
                                            <Typography variant='body1'>
                                                {'发帖'}
                                            </Typography>
                                        </CenterlizedBox>
                                        <CenterlizedBox>
                                            <Typography variant='body1'>
                                                {10}
                                            </Typography>
                                        </CenterlizedBox>
                                    </Box>
                                    {/* middle column */}
                                    <Box marginX={4}>
                                        <CenterlizedBox>
                                            <Typography variant='body1' >
                                                {'粉丝'}
                                            </Typography>
                                        </CenterlizedBox>
                                        <CenterlizedBox>
                                            <Typography variant='body1'>
                                                {10}
                                            </Typography>
                                        </CenterlizedBox>
                                    </Box>
                                    {/* right column */}
                                    <Box>
                                        <CenterlizedBox>
                                            <Typography variant='body1'>
                                                {'获赞'}
                                            </Typography>
                                        </CenterlizedBox>
                                        <CenterlizedBox>
                                            <Typography variant='body1'>
                                                {10}
                                            </Typography>
                                        </CenterlizedBox>
                                    </Box>



                                </CenterlizedBox>
                            </Stack>
                        </ResponsiveCard>
                        {/* unread message card */}
                        <ResponsiveCard sx={{ paddingY: 2 }}>
                            <CenterlizedBox>
                                <IconButton>
                                    <EmailIcon />
                                </IconButton>
                                <Button variant='text' color='inherit'>
                                    <Typography variant='body1' sx={{ marginTop: 0.1 }}>
                                        {'0 条未读提醒'}
                                    </Typography>
                                </Button>
                            </CenterlizedBox>

                        </ResponsiveCard>
                        {/* 24 hour hot */}
                        <ResponsiveCard sx={{ padding: { lg: 3, xl: 2 } }}>
                            <Box>
                                <Typography>{'24小时热帖'}</Typography>
                            </Box>
                            <Stack mt={1} spacing={1}>
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