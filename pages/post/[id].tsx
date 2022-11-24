import * as React from 'react';
// import 
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { useSession } from 'next-auth/react'

import FormControl from '@mui/material/FormControl';
import AddIcon from '@mui/icons-material/Add';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';

import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import StarIcon from '@mui/icons-material/Star';
import ReplyIcon from '@mui/icons-material/Reply';


import { ResponsiveCard, CenterlizedBox, TextButton } from '../../ui/Styled';

import Popover from '@mui/material/Popover';

import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper";
import "swiper/css";
import "swiper/css/pagination";

import Navbar from '../../ui/Navbar';

import { ProcessStates, ChannelDictionary, ChannelInfo, LangConfigs, PostInfo, MemberInfo } from '../../lib/types';
import { getRandomHexStr, getRandomLongStr, timeStampToString } from '../../lib/utils';
import Divider from '@mui/material/Divider';
import Container from '@mui/material/Container';


import Chip from '@mui/material/Chip';

import { NextPageContext } from 'next/types';
import { useRouter } from 'next/router';
import { Awaitable } from 'next-auth';


type PostPageProps = {
    postInfo_serverSide?: PostInfo;
    channelInfo_serverSide?: ChannelInfo;
    memberInfo_serverSide?: MemberInfo;
}

interface PostPageProcessStates extends ProcessStates {
    displayEditor: boolean;
    editorEnchorElement: any;
}

type MemberBehaviourStates = {
    liked: boolean;
    disliked: boolean;
    saved: boolean;
}

type CommentState = {

    displayCommentEditor: boolean;
    commentEditorAnchorElement: any
}

const domain = process.env.NEXT_PUBLIC_APP_DOMAIN;
const lang = process.env.NEXT_PUBLIC_APP_LANG ?? 'ch';
const langConfigs: LangConfigs = {
    title: { ch: '撰写新主题', en: 'Create a new post' },
    editPost: { ch: '编辑帖子', en: '' },
    follow: { ch: '关注', en: 'Follow' },
    hotPostRecommend: { ch: '的热门帖子', en: '' }
}

// get post info server-side
export async function getServerSideProps(context: NextPageContext): Promise<{ props: PostPageProps }> {
    try {
        const { id } = context.query;
        if ('string' !== typeof id) {
            throw new Error('Improper post id');
        }
        const postInfo_resp = await fetch(`${domain}/api/post/info/${id}`); // fetch post info
        if (200 !== postInfo_resp.status) {
            return {
                props: {}
            }
        }
        const postInfo = await postInfo_resp.json();
        const channelInfo_resp = await fetch(`${domain}/api/channel/info/${postInfo.channelId}`); // fetch channel info
        if (200 !== channelInfo_resp.status) {
            return {
                props: {
                    postInfo_serverSide: postInfo
                }
            }
        }
        const channelInfo = await channelInfo_resp.json();
        const memberInfo_resp = await fetch(`${domain}/api/member/info/${postInfo.memberId}`); // fetch member info
        if (200 !== memberInfo_resp.status) {
            return {
                props: {
                    postInfo_serverSide: postInfo,
                    channelInfo_serverSide: channelInfo
                }
            }
        }
        const memberInfo = await memberInfo_resp.json();
        return {
            props: {
                postInfo_serverSide: postInfo,
                channelInfo_serverSide: channelInfo,
                memberInfo_serverSide: memberInfo,
            }
        }
    } catch (e) {
        console.log(`Was trying retrieving info. ${e}`);
        return {
            props: {}
        }
    }
}


const Post = ({ postInfo_serverSide, channelInfo_serverSide, memberInfo_serverSide }: PostPageProps) => {
    const router = useRouter();
    const { data: session, status } = useSession();
    // - 'unauthenticated'
    // - 'authenticated'

    React.useEffect(() => {
        if (!postInfo_serverSide) {
            router.push('/404');
        }
    }, [])

    const [expanded, setExpanded] = React.useState<boolean>(false);
    const handleChange = () => {
        setExpanded(!expanded)
    }


    //////// Declare swipper dimensions ////////
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

    //////// Declare process states ////////
    const [processStates, setProcessStates] = React.useState<ProcessStates>({
        displayEditor: false,
        editorEnchorElement: null
    })
    const handleEditorOpen = () => {
        setProcessStates({ ...processStates, displayEditor: true })
    }
    const handleEditorClose = () => {
        setProcessStates({ ...processStates, displayEditor: false })
    }

    //////// Declare post info states ////////
    const [postInfo, setPostInfo] = React.useState<PostInfo>(postInfo_serverSide ?? {
        title: '',
        content: '',
        imageUrlList: []
    });
    const handlePostStatesChange = () => (event: React.ChangeEvent<HTMLInputElement>) => {

    };

    //////// Decalre member info state ////////
    const [memberInfo, setMemberInfo] = React.useState<MemberInfo>({ ...memberInfo_serverSide, avatarImageUrl: session?.user?.image ?? '' });


    // Decalre member behaviour? like-post dislike-comment follow-member save-post ...
    // 
    const [memberBehaviour, handleMemberBehaviour] = React.useState<MemberBehaviourStates>({
        liked: false, // liked coment / subcomment id list
        disliked: false,
        saved: false
    });

    // Handle member behaviour
    // like, dislike, save ...
    const handleBehaviourOnPost = () => {

    }

    //////// Handle member behaviours ////////
    const handleEditPost = () => {
        router.push(`/me/editpost/${postInfo.id}`);
    }

    // Declare comment info
    const [commentInfo, setCommentInfo] = React.useState();
    const [commentList, setCommentList] = React.useState<any>([
        {
            id: '1',
            memberId: '55',
            content: 'hahaha',
            likedTimes: 12,
            dislikedTimes: 3,
        }
    ]);

    // Declare subcomment info
    //

    // Handle post states change
    React.useEffect(() => {
        getMemberInfo()
    }, [])
    const getPostInfo = async () => {

    }

    const getMemberBehaviour = async () => {

    }

    const getCommentInfo = async () => {

    }

    const getMemberInfo = async () => {
        const resp = await fetch(`/api/member/info/${memberInfo_serverSide?.id}?p=nickname+gender+birthday`);
    }

    const getSubcommentInfo = async () => {

    }



    return (
        <>
            <Navbar />
            {/* post component */}
            <Container disableGutters >
                <Grid container >

                    {/* left column (placeholder) */}
                    <Grid item xs={0} sm={1} md={1} />

                    {/* middle column */}
                    <Grid item xs={12} sm={10} md={7} >

                        {/* middle card-stack */}
                        <Stack maxWidth={800} spacing={{ xs: 1, sm: 2 }}>
                            {/* the post */}
                            <ResponsiveCard sx={{ padding: { sm: 4 }, boxShadow: { sm: 1 } }}>
                                {/* post-title: desktop style */}
                                <Box display={{ xs: 'none', sm: 'block' }}>
                                    {/* channel name */}
                                    {channelInfo_serverSide && <Typography variant={'subtitle1'} fontWeight={400} color={'grey'}>{channelInfo_serverSide.name[lang]}</Typography>}
                                    {/* title */}
                                    <Typography variant={'h6'} fontWeight={700}>{postInfo.title}</Typography>
                                    {/* member info & timestamp */}
                                    <TextButton color='inherit' sx={{ flexDirection: 'row', marginTop: 1 }}>
                                        <Typography variant='body2'>{`${memberInfo.nickname} ${timeStampToString(postInfo.timeStamp)}`}</Typography>
                                    </TextButton>
                                </Box>
                                {/* post-title: mobile style */}
                                <Stack mt={0.5} direction={'row'} sx={{ display: { xs: 'flex', sm: 'none' } }}>
                                    <IconButton sx={{ padding: 0 }}>
                                        <Avatar sx={{ width: 38, height: 38, bgcolor: 'grey' }}>{memberInfo.nickname?.charAt(0).toUpperCase()}</Avatar>
                                    </IconButton>
                                    <Grid container ml={1}>
                                        <Grid item >
                                            <TextButton color='inherit'>
                                                <Typography variant='body2' >
                                                    {memberInfo.nickname}
                                                </Typography>
                                                <Typography variant='body2' fontSize={{ xs: 12 }} >
                                                    {timeStampToString(postInfo.timeStamp)}
                                                </Typography>
                                            </TextButton>
                                        </Grid>
                                        <Grid item flexGrow={1}></Grid>
                                        <Grid item>
                                            <Chip label={langConfigs.follow[lang]} sx={{ paddingX: 1 }} color={true ? 'primary' : 'default'} onClick={() => { }} />
                                        </Grid>
                                    </Grid>
                                </Stack>

                                {/* image list (conditional rendering)*/}
                                {true && <Box id='image-swiper-wrapper' mt={{ xs: 1.5, sm: 2 }} >
                                    <Swiper modules={[Pagination]} pagination={true} >
                                        {postInfo.imageUrlList.map(imgUrl =>
                                            <SwiperSlide key={getRandomHexStr(true)}>
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
                                    <Typography variant={'subtitle1'} fontWeight={700}>{postInfo.title}</Typography>
                                </Box>
                                {/* content (conditional rendering)*/}
                                {0 !== postInfo.contentParagraphsArray?.length && <Box mt={{ xs: 1, sm: 2 }}>
                                    {postInfo.contentParagraphsArray?.map(p => <Typography variant={'body1'} mt={1} key={getRandomHexStr(true)}>{p}</Typography>)}
                                </Box>}

                                {/* member behaviours */}
                                <Grid container mt={1}>
                                    {/* like */}
                                    <Grid item sx={{ display: 'flex', flexDirection: 'row' }}>
                                        <IconButton aria-label='like' onClick={handleBehaviourOnPost}>
                                            <ThumbUpIcon color={memberBehaviour.liked ? 'primary' : 'inherit'} fontSize='small' />
                                        </IconButton>
                                        <Typography variant='body2' sx={{ marginTop: 1.1 }}>{postInfo.likedTimes}</Typography>
                                    </Grid>
                                    {/* dislike */}
                                    <Grid item sx={{ ml: 1 }}>
                                        <IconButton aria-label='dislike' onClick={handleBehaviourOnPost}>
                                            <ThumbDownIcon color={memberBehaviour.disliked ? 'error' : 'inherit'} fontSize='small' />
                                        </IconButton>
                                    </Grid>
                                    {/* save */}
                                    <Grid item sx={{ display: 'flex', flexDirection: 'row' }}>
                                        <IconButton aria-label='save' onClick={handleBehaviourOnPost}>
                                            <StarIcon color={memberBehaviour.saved ? 'warning' : 'inherit'} fontSize='small' />
                                        </IconButton>
                                        <Typography variant='body2' sx={{ marginTop: 1.1 }}>{16}</Typography>
                                    </Grid>
                                    {/* comment */}
                                    <Grid item sx={{ display: 'flex', flexDirection: 'row' }}>
                                        <IconButton aria-label='comment' onClick={handleEditorOpen}>
                                            <ChatBubbleIcon fontSize='small' />
                                        </IconButton>
                                        <Typography variant='body2' sx={{ marginTop: 1.1 }}>{3}</Typography>
                                    </Grid>
                                    <Grid item flexGrow={1}></Grid>
                                    <Grid item sx={{ display: 'flex', flexDirection: 'row' }}>
                                        {postInfo.memberId === memberInfo.id && <Button variant='text' sx={{ ml: 1, padding: 0 }} onClick={handleEditPost}>{langConfigs.editPost[lang]}</Button>}
                                    </Grid>
                                </Grid>
                            </ResponsiveCard>


                            {/* the comments (conditional rendering)*/}
                            {true &&
                                [0, 1, 2, 3].map(comment => {
                                    return (
                                        <Box key={comment}>
                                            <Divider sx={{ display: { xs: 'block', sm: 'none' } }} />
                                            <Box sx={{ padding: { xs: 2, sm: 4 }, borderRadius: 1, boxShadow: { xs: 0, sm: 1 } }}>
                                                {/* member info */}
                                                <Stack direction={'row'}>
                                                    <IconButton sx={{ padding: 0 }}>
                                                        <Avatar sx={{ width: 38, height: 38, bgcolor: 'grey' }}>{'W'}</Avatar>
                                                    </IconButton>
                                                    <Box ml={1}>
                                                        <TextButton color='inherit'>
                                                            <Typography variant='body2' >
                                                                {'WebMaster'}
                                                            </Typography>
                                                            <Typography variant='body2' fontSize={{ xs: 12 }} >
                                                                {'2 分钟前'}
                                                            </Typography>
                                                        </TextButton>
                                                    </Box>
                                                </Stack>
                                                {/* comment content */}
                                                <Box paddingTop={{ xs: 1, sm: 1.5 }} paddingX={0.5}>
                                                    <Typography variant={'body1'} >{'随风天气提供全球实况格点天气和个性化场景天气，根据天气影响比较多的行业、职业、风土人情等结合出来的方式（上班族，钓鱼，旅游旅行等）。'}</Typography>
                                                </Box>
                                                {/* member behaviours */}
                                                <Grid container mt={{ xs: 0.5, sm: 1 }}>
                                                    {/* like */}
                                                    <Grid item sx={{ display: 'flex', flexDirection: 'row' }}>
                                                        <IconButton aria-label='like' onClick={handleBehaviourOnPost}>
                                                            <ThumbUpIcon color={memberBehaviour.liked ? 'primary' : 'inherit'} fontSize='small' />
                                                        </IconButton>
                                                        <Typography variant='body2' sx={{ marginTop: 1.1 }}>{postInfo.likedTimes}</Typography>
                                                    </Grid>
                                                    {/* dislike */}
                                                    <Grid item sx={{ ml: 1 }}>
                                                        <IconButton aria-label='dislike' onClick={handleBehaviourOnPost}>
                                                            <ThumbDownIcon color={memberBehaviour.disliked ? 'error' : 'inherit'} fontSize='small' />
                                                        </IconButton>
                                                    </Grid>
                                                    {/* comment */}
                                                    <Grid item sx={{ display: 'flex', flexDirection: 'row' }}>
                                                        <IconButton aria-label='comment' onClick={handleEditorOpen}>
                                                            <ReplyIcon fontSize='small' />
                                                        </IconButton>
                                                        <Typography variant='body2' sx={{ marginTop: 1.1 }}>{3}</Typography>
                                                    </Grid>
                                                </Grid>


                                                <Button variant='text' sx={{ display: expanded ? 'none' : 'block' }} onClick={handleChange} >{'展开评论'}</Button>

                                                {/* subcomment stack (conditional rendering)*/}
                                                <Stack marginTop={{ xs: 1.5, sm: 2 }} paddingLeft={3} sx={{ display: expanded ? 'block' : 'none' }}>
                                                    {/* subcomment */}
                                                    <Box>
                                                        {/* member info */}
                                                        <Stack direction={'row'}>
                                                            <IconButton sx={{ padding: 0 }}>
                                                                <Avatar sx={{ width: 38, height: 38, bgcolor: 'grey' }}>{'W'}</Avatar>
                                                            </IconButton>
                                                            <Box ml={1}>
                                                                <TextButton color='inherit'>
                                                                    <Typography variant='body2' >
                                                                        {'WebMaster'}
                                                                    </Typography>
                                                                    <Typography variant='body2' fontSize={{ xs: 12 }} >
                                                                        {'2 分钟前'}
                                                                    </Typography>
                                                                </TextButton>
                                                            </Box>
                                                        </Stack>
                                                        {/* comment content */}
                                                        <Box sx={{ paddingTop: 1, paddingX: 1 / 2 }}>
                                                            <Typography variant={'body2'} fontSize={{ sm: 16 }}>{'@WebMaster 随风天气提供全球实况格点天气和个性化场景天气，根据天气影响比较多的行业、职业、风土人情等结合出来的方式（上班族，钓鱼，旅游旅行等）。'}</Typography>
                                                        </Box>
                                                        {/* member behaviours */}
                                                        <Grid container>
                                                            {/* like */}
                                                            <Grid item sx={{ display: 'flex', flexDirection: 'row' }}>
                                                                <IconButton aria-label='like' onClick={handleBehaviourOnPost}>
                                                                    <ThumbUpIcon color={memberBehaviour.liked ? 'primary' : 'inherit'} fontSize='small' />
                                                                </IconButton>
                                                                <Typography variant='body2' sx={{ marginTop: 1.1 }}>{postInfo.likedTimes}</Typography>
                                                            </Grid>
                                                            {/* dislike */}
                                                            <Grid item sx={{ ml: 1 }}>
                                                                <IconButton aria-label='dislike' onClick={handleBehaviourOnPost}>
                                                                    <ThumbDownIcon color={memberBehaviour.disliked ? 'error' : 'inherit'} fontSize='small' />
                                                                </IconButton>
                                                            </Grid>
                                                            {/* reply */}
                                                            <Grid item sx={{ display: 'flex', flexDirection: 'row' }}>
                                                                <IconButton aria-label='comment' onClick={handleEditorOpen}>
                                                                    <ReplyIcon fontSize='small' />
                                                                </IconButton>
                                                            </Grid>
                                                        </Grid>
                                                    </Box>
                                                    <Button variant='text' onClick={handleChange} >{'折叠评论'}</Button>
                                                </Stack>
                                            </Box>
                                        </Box>
                                    )
                                })
                            }

                        </Stack>
                    </Grid>

                    {/* right column*/}
                    <Grid item xs={0} sm={1} md={4} >
                        {/* right card-stack */}
                        <Stack spacing={1} sx={{ ml: 2, maxWidth: 320, display: { xs: 'none', sm: 'none', md: 'block', lg: 'block' } }} >
                            {/* member info card */}
                            <ResponsiveCard sx={{ paddingY: 2 }}>
                                <Stack>
                                    {/* avatar */}
                                    <CenterlizedBox mt={1}>
                                        <Avatar sx={{ width: 48, height: 48, bgcolor: 'grey' }}>{memberInfo.nickname?.charAt(0).toUpperCase()}</Avatar>
                                    </CenterlizedBox>
                                    {/* nickname */}
                                    <CenterlizedBox mt={1}><Typography variant='body1'>{memberInfo.nickname}</Typography></CenterlizedBox>


                                    <CenterlizedBox >
                                        <Button variant='text' sx={{ paddingY: 0.1, borderRadius: 4, fontSize: 13 }} disabled={true}>{true ? '已关注' : '关注'}</Button>
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
                            {/* other post recommend in this channel */}
                            <ResponsiveCard sx={{ padding: 3 }}>
                                <Box>
                                    <Typography>{memberInfo.nickname} {langConfigs.hotPostRecommend[lang]}</Typography>
                                </Box>
                                <Stack mt={1} spacing={1}>
                                    {true && [{ title: '#初秋专属氛围感#', imgUrl: 'pink' }, { title: '今天就需要衛衣加持', imgUrl: '#1976d2' }, { title: '星期一的咖啡時光～', imgUrl: 'darkorange' }].map(po =>
                                        <Grid container key={po.imgUrl}>
                                            <Grid item>
                                                <Box sx={{ width: 48, height: 48, backgroundColor: po.imgUrl }}></Box>
                                            </Grid>
                                            <Grid item flexGrow={1}>
                                                <Box ml={1}>
                                                    <TextButton color='inherit'>
                                                        <Typography variant='body1' marginTop={0.1} textOverflow={'ellipsis'} noWrap maxWidth={200}>{po.title}</Typography>
                                                        <Typography variant='body2' fontSize={{ xs: 12 }}>
                                                            {'100 浏览'}
                                                        </Typography>
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
            {/* pop up editor */}
            < Popover
                open={processStates.displayEditor}
                anchorReference='anchorPosition'
                onClose={handleEditorClose}
                anchorPosition={{ top: 1000, left: 1000 }}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'center',
                }}
            >
                <Box sx={{
                    minWidth: 350,
                    minHeight: 200,
                    borderRadius: 2,
                    padding: 2

                }}>

                    <Typography>{'回复 @WebMaster'}</Typography>
                    <TextField

                        id="outlined-basic"
                        variant="outlined"
                        rows={4}
                        multiline
                        fullWidth
                        placeholder={'@WebMaster'}
                        // value={'@WebMaster'}
                        // onChange={handlePostStatesChange('content')}
                        // disabled={processStates.submitting}
                        sx={{ marginTop: 1 }}
                    />
                    <Box mt={2} display={'flex'} justifyContent={'end'}>
                        <Button variant='contained'>{'提交'}</Button>
                    </Box>
                </Box>
            </Popover >
        </>
    )
}

export default Post