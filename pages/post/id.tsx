import * as React from 'react';
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
                {/* row */}
                <Grid container
                //  columns={{ xs: 1, sm: 3 }}

                spacing={0}

                // sx={{ maxWidth: 'md' }}
                >
                    {/* left column */}
                    <Grid item 
                    
                    xs={0} sm={2} md={2} lg={2}
                    
                    // display={{ xs: 'none', sm: 'block' }}
                    
                    ></Grid>

                    {/* middle column */}
                    <Grid item flexGrow={1} 
                    
                    xs={12} sm={7} md={7}
                    
                    > 
                        {/* stack */}

                        <Stack maxWidth={800}>
                            <Box sx={{ padding: { xs: 2, sm: 4 }, borderRadius: 1, boxShadow: { xs: 0, sm: 1 } }}>
                                <Typography variant="h5" component="div">
                                    {'title'}
                                </Typography>
                                <Typography variant="body2">
                                    {'contentProps.TextContent'}
                                </Typography>






                                {/* image list */}
                                <Box maxWidth={500}>
                                    <Swiper pagination={true} modules={[Pagination]} className="hello">
                                        <SwiperSlide>
                                            <Box sx={{ height: 400, backgroundColor: 'pink' }}>

                                            </Box>
                                        </SwiperSlide>
                                        <SwiperSlide>
                                            <Box sx={{ height: 400, backgroundColor: 'darkorange' }}>

                                            </Box>
                                        </SwiperSlide>


                                    </Swiper>
                                </Box>






                                <Box padding={1}>
                                    <Typography variant={'body2'} fontSize={{ sm: 16 }} >
                                        {'国庆节以来大修改了一次，主要体现天气场景功能。现在有上班族、钓鱼、旅游旅行场景，后续增加更多。如果你有兴趣可以试一下，有好的建议可以邮箱联系我（ 18873700176@163.com ）。另外寻找志同道合的设计师（跨平台设计，动画动效等），分享这个项目收益利润的百分之二十和其他，联系工作微信（ lzh2021hero ）。暂时只有 iOS 版本，Android 版本还没有开放（ flutter 跨平台）'}
                                    </Typography>
                                </Box>

                                {/* member behaviours */}
                                <Grid container sx={{ alignItems: 'start' }}>
                                    {/* like */}
                                    <Grid item sx={{ display: 'flex', flexDirection: 'row' }}>
                                        <IconButton aria-label='like' onClick={handleBehaviourOnPost}>
                                            <ThumbUpIcon color={memberBehaviour.liked ? 'primary' : 'inherit'} fontSize='small' />
                                        </IconButton>
                                        <Typography variant='body2' sx={{ marginTop: 1 }}>{postInfo.likedTimes}</Typography>
                                    </Grid>
                                    {/* dislike */}
                                    <Grid item sx={{ ml: 1 }}>
                                        <IconButton aria-label='dislike' onClick={handleBehaviourOnPost}>
                                            <ThumbDownIcon color={memberBehaviour.disliked ? 'error' : 'inherit'} fontSize='small' />
                                            {/* <Typography>{postInfo.dislikedTimes}</Typography> */}
                                        </IconButton>
                                    </Grid>
                                    {/* save */}
                                    <Grid item>
                                        <IconButton aria-label='save' onClick={handleBehaviourOnPost}>
                                            <StarIcon color={memberBehaviour.saved ? 'warning' : 'inherit'} fontSize='small' />
                                            <Typography>{postInfo.savedTimes}</Typography>
                                        </IconButton>
                                    </Grid>
                                    {/* comment */}
                                    <Grid item>
                                        <IconButton aria-label='comment' onClick={handleEditorOpen}>
                                            <ChatBubbleIcon fontSize='small' />
                                            {/* <Typography>{contentProps.Comment}</Typography> */}
                                        </IconButton>
                                    </Grid>



                                    {/* <IconButton aria-label='viewed times'>
                                    <FaceIcon />
                                    <Typography>{postInfo.viewedTimes}</Typography>
                                </IconButton> */}
                                </Grid>
                            </Box>
                        </Stack>

                    </Grid>
                    
                    {/* right column*/}
                    <Grid item 
                    
                    xs={0} sm={3} md={3}
                        sx={{
                            // ml: 2,
                            display: { xs: 'none', sm: 'none', md: 'none', lg: 'block' }
                        }}
                    >
                        <Stack spacing={1} minWidth={200}>
                            {/* membwe info card */}
                            <Box
                                sx={{
                                    // minWidth: '300',
                                    padding: 1,
                                    borderRadius: 1,
                                    boxShadow: { xs: 0, sm: 1 }
                                }}
                            >

                                <Typography variant="h5" component="div">
                                    {'title'}
                                </Typography>

                            </Box>
                        </Stack>

                    </Grid>
                </Grid>











            </Container>
            {/* pop up editor */}
            <Popover
                // id={id}
                open={processStates.displayEditor}
                anchorReference="anchorPosition"
                // anchorEl={processStates.editorEnchorElement}
                onClose={handleEditorClose}
                anchorPosition={{ top: 1000, left: 0 }}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'center',
                }}
            >
                <Box sx={{
                    minWidth: 370,
                    minHeight: 240
                }}>

                    <Typography sx={{ p: 2 }}>The content of the Popover.</Typography>
                    <TextField></TextField>
                </Box>
            </Popover>
        </>
    )
}
export default Post