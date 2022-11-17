import * as React from 'react';
// import 
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
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
import FaceIcon from '@mui/icons-material/Face';
import StarIcon from '@mui/icons-material/Star';
import ReplyIcon from '@mui/icons-material/Reply';


import { ResponsiveCard, CenterlizedBox } from '../../ui/Styled';

import Popover from '@mui/material/Popover';




import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper";
import "swiper/css";
import "swiper/css/pagination";



import Navbar from '../../ui/Navbar';

import { PostInfo } from '../../lib/types';
import { getRandomLongStr } from '../../lib/utils';
import Divider from '@mui/material/Divider';
import { Style } from '@mui/icons-material';
import Container from '@mui/material/Container';




import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Chip from '@mui/material/Chip';








type ProcessStates = {
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



const Post = () => {


    const [expanded, setExpanded] = React.useState<boolean>(false);

    const handleChange = () => {
        setExpanded(!expanded)
    }









    const { data: session, status } = useSession();
    // - 'unauthenticated'
    // - 'authenticated'

    // Declare process states
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

    const [imageUrlList, setImageUrlList] = React.useState<string[]>([
        'https://images.unsplash.com/photo-1551963831-b3b1ca40c98e',
        'https://images.unsplash.com/photo-1551782450-a2132b4ba21d',
        'https://images.unsplash.com/photo-1522770179533-24471fcdba45',
        'https://images.unsplash.com/photo-1444418776041-9c7e33cc5a9c',
        'https://images.unsplash.com/photo-1533827432537-70133748f5c8',
        'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62',
        'https://images.unsplash.com/photo-1516802273409-68526ee1bdd6',
    ]);

    // Declare post info states
    const [postInfo, setPostInfo] = React.useState<PostInfo>({
        title: '',
        content: '',
        imageUrlList: [],
        channel: '',
        likedTimes: 55,
        dislikedTimes: 0
    })
    // const handlePostStatesChange = (prop: keyof PostState) => (event: React.ChangeEvent<HTMLInputElement>) => {
    //     setPostStates({ ...postStates, [prop]: event.target.value });
    // };

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
        // initialize post
    }, [])
    const getPostInfo = async () => {

    }

    const getMemberBehaviour = async () => {

    }

    const getCommentInfo = async () => {

    }

    const getMemberInfo = async () => {

    }

    const getSubcommentInfo = async () => {

    }



    return (
        <>
            <Navbar />
            {/* post component */}
            <Container
                disableGutters
            >
                <Grid container >
                    {/* left column (placeholder) */}
                    <Grid item xs={0} sm={2} />

                    {/* middle column */}
                    <Grid item xs={12} sm={8} md={6} >

                        {/* middle card-stack */}
                        <Stack maxWidth={800} spacing={{ xs: 1, sm: 2 }}>
                            {/* the post */}
                            <ResponsiveCard sx={{ padding: { sm: 4 }, boxShadow: { sm: 1 } }}>
                                {/* post-title: desktop style */}
                                <Box display={{ xs: 'none', sm: 'block' }}>
                                    <Typography variant={'subtitle1'} fontWeight={400} color={'grey'}>
                                        {'兴趣'}
                                    </Typography>
                                    <Typography variant={'h6'} fontWeight={700}>
                                        {'做了一个简单壁纸小玩具，欢迎大家体验'}
                                    </Typography>
                                    <Stack mt={1} direction={'row'} spacing={1}>
                                        <Typography variant='body2'>
                                            WebMaster
                                        </Typography>
                                        <Typography variant='body2'>
                                            {2} 分钟前
                                        </Typography>
                                    </Stack>
                                </Box>

                                {/* post-title: mobile style */}
                                <Stack mt={0.5} direction={'row'} sx={{ display: { xs: 'flex', sm: 'none' } }}>
                                    <Avatar sx={{ width: 38, height: 38, bgcolor: 'grey' }}>{'W'}</Avatar>
                                    <Grid container ml={1}>
                                        <Grid item flexGrow={1}>

                                            <Typography variant='body2' marginTop={0.1}>
                                                {'WebMaster'}
                                            </Typography>
                                            <Typography variant='body2' fontSize={{ xs: 12 }}>
                                                {'2 分钟前'}
                                            </Typography>
                                        </Grid>
                                        <Grid item>
                                            <Chip label={'关注'} sx={{ paddingX: 1 }} color={true ? 'primary' : 'default'} onClick={() => { }} />
                                        </Grid>
                                    </Grid>
                                </Stack>


                                {/* image list (conditional rendering)*/}
                                {true && <Box mt={{ xs: 1.5, sm: 2 }} >
                                    <Swiper modules={[Pagination]} pagination={true}>
                                        {['pink', '#1976d2', 'darkorange', '#01ced1'].map(imgUrl =>
                                            <SwiperSlide>
                                                <Box sx={{ minHeight: 400, backgroundColor: imgUrl }}></Box>
                                            </SwiperSlide>
                                        )}
                                    </Swiper>
                                </Box>}


                                {/* title */}
                                <Box mt={2} display={{ xs: 'flex', sm: 'none' }}>
                                    <Typography variant={'subtitle1'} fontWeight={700}>
                                        {'做了一个简单壁纸小玩具，欢迎大家体验'}
                                    </Typography>
                                </Box>
                                {/* content (conditional rendering)*/}
                                {true && <Box mt={{ xs: 1, sm: 2 }}>
                                    <Typography variant={'body1'} >
                                        {'国庆节以来大修改了一次，主要体现天气场景功能。现在有上班族、钓鱼、旅游旅行场景，后续增加更多。如果你有兴趣可以试一下，有好的建议可以邮箱联系我（ xxxxxxxxxxxxx@163.com ）。另外寻找志同道合的设计师（跨平台设计，动画动效等），分享这个项目收益利润的百分之二十和其他，联系工作微信（ xxxxxxxx ）'}
                                    </Typography>
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
                                </Grid>
                            </ResponsiveCard>


                            {/* the comments (conditional rendering)*/}
                            {true &&
                                [0, 1, 2, 3].map(comment => {
                                    return (
                                        <>
                                            <Divider sx={{ display: { xs: 'block', sm: 'none' } }} />
                                            <Box sx={{ padding: { xs: 2, sm: 4 }, borderRadius: 1, boxShadow: { xs: 0, sm: 1 } }}>
                                                {/* member info */}
                                                <Stack direction={'row'}>
                                                    <Avatar sx={{ width: 38, height: 38, bgcolor: 'grey' }}>{'W'}</Avatar>
                                                    <Box ml={1}>
                                                        <Typography variant='body2' marginTop={0.1}>
                                                            WebMaster
                                                        </Typography>
                                                        <Typography variant='body2' fontSize={{ xs: 12 }}>
                                                            {2} 分钟前
                                                        </Typography>
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
                                                            <Avatar sx={{ width: 38, height: 38, bgcolor: 'grey' }}>{'W'}</Avatar>
                                                            <Box ml={1}>
                                                                <Typography variant='body2' marginTop={0.1}>
                                                                    WebMaster
                                                                </Typography>
                                                                <Typography variant='body2' fontSize={{ xs: 12 }}>
                                                                    {2} 分钟前
                                                                </Typography>
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
                                        </>
                                    )
                                })
                            }

                        </Stack>
                    </Grid>

                    {/* right column*/}
                    <Grid item xs={0} sm={2} md={4} >
                        {/* right card-stack */}
                        <Stack spacing={1} sx={{ ml: 2, maxWidth: 320, display: { xs: 'none', sm: 'none', md: 'block', lg: 'block' } }} >

                            {/* member info card */}
                            <ResponsiveCard sx={{ paddingY: 3 }}>
                                <Stack spacing={1}>

                                    {/* avatar */}
                                    <CenterlizedBox >
                                        <Avatar sx={{ width: 48, height: 48, bgcolor: 'grey' }}>{'W'}</Avatar>
                                    </CenterlizedBox>
                                    {/* nickname */}
                                    <CenterlizedBox  >
                                        <Typography variant='body1'>
                                            {'WebMaster'}
                                        </Typography>
                                    </CenterlizedBox>
                                    {/* follow button (conditional rendering) */}
                                    <CenterlizedBox >
                                        {/* logic: bgcolor='inherit' === followed */}
                                        <Chip label={'关注'} sx={{ paddingX: 1 }} color={true ? 'primary' : 'default'} onClick={() => { }} />
                                        {/* <Button variant='contained' sx={{ paddingY: 0, borderRadius: 4 }} disabled>{'已关注'}</Button> */}
                                    </CenterlizedBox>
                                    {/* info */}
                                    <CenterlizedBox  >
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
                                    <Typography>{'本区其他热帖'}</Typography>
                                </Box>
                                <Stack mt={1} spacing={1}>
                                    {true && [{ title: '#初秋专属氛围感#', imgUrl: 'pink' }, { title: '今天就需要衛衣加持', imgUrl: '#1976d2' }, { title: '星期一的咖啡時光～', imgUrl: 'darkorange' }].map(po => <Grid container>
                                        <Grid item>
                                            <Box sx={{ width: 48, height: 48, backgroundColor: po.imgUrl }}></Box>
                                        </Grid>
                                        <Grid item flexGrow={1}>
                                            <Box ml={1}>
                                                <Typography variant='body1' marginTop={0.1} textOverflow={'ellipsis'} noWrap maxWidth={200}>{po.title}</Typography>
                                                <Typography variant='body2' fontSize={{ xs: 12 }}>
                                                    {'100 浏览'}
                                                </Typography>
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