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
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import FaceIcon from '@mui/icons-material/Face';
import StarIcon from '@mui/icons-material/Star';
import ReplyIcon from '@mui/icons-material/Reply';

import Masonry from '@mui/lab/Masonry';

import { CenterlizedBox, ResponsiveCard, TextButton, StyledSwitch } from '../ui/Styled';

import Popover from '@mui/material/Popover';

import Paper from '@mui/material/Paper';

import { FormControlLabel, styled } from '@mui/material';
import Switch from '@mui/material/Switch';

import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper";
import "swiper/css";
import "swiper/css/pagination";



import Navbar from '../ui/Navbar';

import { ChannelDictionary, ChannelInfo } from '../lib/types';
import { getRandomLongStr } from '../lib/utils';
import Divider from '@mui/material/Divider';
import Link from '@mui/material/Link';
import Container from '@mui/material/Container';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';

type ProcessStates = {
    selectedChannelId: string;
    selectedHotPosts: boolean;
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

    // Declare process states
    const [processStates, setProcessStates] = React.useState<ProcessStates>({
        selectedChannelId: '',
        selectedHotPosts: false,
    })

    // Decalre & initialize channel states
    const [channelInfoList, setChannelInfoList] = React.useState<ChannelInfo[]>([]);
    React.useEffect(() => {
        getPostChannelList();
    }, []);
    const getPostChannelList = async () => {
        const channelDict = await fetch('/api/channel/getdictionary').then(resp => resp.json());
        const referenceList = await fetch('/api/channel/getindex').then(resp => resp.json());
        const channelList: ChannelInfo[] = [];
        referenceList.forEach((channel: keyof ChannelDictionary) => {
            channelList.push(channelDict[channel])
        });
        setChannelInfoList(channelList.filter(channel => !!channel));
    }

    // Handle channel select
    const handleSelectChannel = (channelId: string) => (event: React.MouseEvent<HTMLButtonElement> | React.SyntheticEvent) => {
        setProcessStates({ ...processStates, selectedChannelId: channelId })
    }

    // Handle hotest / newest posts switch
    const handleSwitchChange = () => {
        setProcessStates({ ...processStates, selectedHotPosts: !processStates.selectedHotPosts });
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

    // Decalre member behaviour? like-post dislike-comment follow-member save-post ...
    // 
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

                {/* left column */}
                <Grid item xs={0} sm={0} md={2}>
                    <Stack spacing={1} sx={{ marginX: 1, display: { xs: 'none', sm: 'none', md: 'block' } }} >
                        {/* the channel menu (desktop mode) */}
                        <ResponsiveCard sx={{ padding: 1 }}>
                            <MenuList>
                                {/* the "all" menu item */}
                                <MenuItem
                                    onClick={handleSelectChannel('all')}
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
                                {channelInfoList.map(channel => {
                                    return (
                                        <MenuItem key={channel.id}
                                            onClick={handleSelectChannel(channel.id)}
                                            selected={processStates.selectedChannelId === channel.id}
                                        >
                                            <ListItemIcon >
                                                <SvgIcon>
                                                    <path d={channel.svgIconPath} />
                                                </SvgIcon>
                                            </ListItemIcon>
                                            <ListItemText>
                                                <Typography sx={{ marginTop: '1px' }}>
                                                    {channel.name[lang]}
                                                </Typography>
                                            </ListItemText>
                                        </MenuItem>
                                    )
                                })}
                            </MenuList>
                        </ResponsiveCard>
                        {/* hotest / newest switch */}
                        <ResponsiveCard >
                            <FormControlLabel
                                control={<StyledSwitch sx={{ ml: 1 }} checked={processStates.selectedHotPosts} />}
                                label={processStates.selectedHotPosts ? '最热' : '最新'}
                                onChange={handleSwitchChange}
                            />
                        </ResponsiveCard>
                    </Stack>
                </Grid>

                {/* middle column */}
                <Grid item xs={12} sm >
                    {/* #1 the channel bar (mobile mode) */}
                    <Stack direction={'row'}
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
                        <Button variant={'all' === processStates.selectedChannelId ? 'contained' : 'text'} size='small' onClick={handleSelectChannel('all')}>
                            <Typography variant='body2' color={'all' === processStates.selectedChannelId ? 'white' : "text.secondary"} sx={{ backgroundColor: 'primary' }}>
                                {'全部'}
                            </Typography>
                        </Button>
                        {/* other channels */}
                        {channelInfoList.map(channel => {
                            return (
                                <Button variant={channel.id === processStates.selectedChannelId ? 'contained' : 'text'} key={channel.id} size='small' onClick={handleSelectChannel(channel.id)}>
                                    <Typography variant="body2" color={channel.id === processStates.selectedChannelId ? 'white' : "text.secondary"} sx={{ backgroundColor: 'primary' }}>
                                        {channel.name[lang]}
                                    </Typography>
                                </Button>
                            )
                        })}
                    </Stack>

                    {/* #2 the post mansoy */}
                    <Box ml={1}>
                        <Masonry columns={{ xs: 2, sm: 3, md: 3, lg: 3, xl: 4 }}>
                            {postList.length !== 0 && postList.map(post => {
                                return (
                                    <Paper key={post.id} sx={{ maxWidth: 300 }}>
                                        <Stack>
                                            {/* image */}
                                            {/* <Box sx={{
                                                minHeight: 100,
                                                backgroundImage: `url(${post.imgUrl})`
                                            }}></Box> */}
                                            <Box component={'img'} src={post.imgUrl}></Box>
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
                                )
                            })}
                        </Masonry>
                    </Box>
                </Grid>

                {/* right column */}
                <Grid item xs={0} sm={0} md={3} lg={3} xl={3}>
                    <Stack spacing={1} sx={{ marginX: 1, display: { xs: 'none', sm: 'none', md: 'flex' } }} >
                        {/* member info card */}
                        <ResponsiveCard sx={{ paddingY: 3 }}>
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
                        <ResponsiveCard sx={{ paddingY: 3 }}>
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
                        <ResponsiveCard sx={{ padding: 3 }}>
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
                                                <Typography variant='body1' marginTop={0.1} textOverflow={'ellipsis'} maxWidth={180} noWrap>{po.title}</Typography>
                                                <Typography variant='body2' fontSize={{ xs: 12 }}>
                                                    {'100 浏览'}
                                                </Typography>
                                            </Box>
                                        </Grid>
                                    </Grid>
                                )}
                            </Stack>
                        </ResponsiveCard>
                        {/* 7 days hot */}
                        <ResponsiveCard sx={{ padding: 3 }}>
                            <Box>
                                <Typography>{'本周热帖'}</Typography>
                            </Box>
                            <Stack mt={1} spacing={1}>
                                {true && [{ title: '第一次海淘，寻求建议', imgUrl: '#D6D5B3' }, { title: '送女友家人，有红酒推荐吗', imgUrl: '#F92A82' }, { title: '大家平时都喝什么咖啡？', imgUrl: '#806443' }].map(po =>
                                    <Grid container key={po.title}>
                                        <Grid item display={{ md: 'none', lg: 'block' }}>
                                            <Box sx={{ width: 48, height: 48, backgroundColor: po.imgUrl }}></Box>
                                        </Grid>
                                        <Grid item flexGrow={1}>
                                            <Box ml={1}>
                                                <TextButton>

                                                    <Typography variant='body1' marginTop={0.1} textOverflow={'ellipsis'} maxWidth={180} noWrap>{po.title}</Typography>
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

            </Grid>
        </>
    )
}

export default Home