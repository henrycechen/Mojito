import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { useSession } from 'next-auth/react'

import FormControl from '@mui/material/FormControl';
import AddIcon from '@mui/icons-material/Add';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';

import SvgIcon from '@mui/material/SvgIcon';

import axios from 'axios';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import CircularProgress, { CircularProgressProps, } from '@mui/material/CircularProgress';


import Navbar from '../../ui/Navbar';
import Copyright from '../../ui/Copyright';

import { useRouter } from 'next/router';
import { LangConfigs, PostChannel } from '../../lib/types';
import Input from '@mui/material/Input';
import Icon from '@mui/material/Icon';
import ListItemText from '@mui/material/ListItemText';
import { Backdrop, ListItemIcon, makeStyles } from '@mui/material';
import { maxHeight } from '@mui/system';
import { grey } from '@mui/material/colors';

type Image = {
    url: string;
    whr: number; // width height ratio
}

type ChannelDict = {
    [key: string]: PostChannel
}

type PostState = {
    title: string;
    content: string;
    channel: string;
    tags?: string[];
}

type ImageStates = {
    enlarge: boolean;
    onEnlargeImageUrl: string;
    displayDeleteIcon: boolean;
}

type UploadStates = {
    imageUrlOnUpload: string;
    uploadPrecent: number;
}

const lang = process.env.NEXT_PUBLIC_APP_LANG ?? 'ch';
const langConfigs: LangConfigs = {
    title: {
        ch: '撰写新主题',
        en: 'Create a new post'
    },
    titlePlaceholder: {
        ch: '标题',
        en: 'Title'
    },
    contentPlaceholder: {
        ch: '写点什么吧~',
        en: 'What\'s on your mind?'
    },
    uploadImage: {
        ch: '添加图片',
        en: 'Add photos'
    },
    postChannel: {
        ch: '频道',
        en: 'Choose a channel'
    },
    choosePostChannel: {
        ch: '选择一个频道',
        en: 'Choose a channel'
    },
    submit: {
        ch: '发布',
        en: 'Publish'
    },
    imagesUploading:{
        ch: '上传图片中，请勿关闭或离开页面😉',
        en: 'Uploading photos, please do not close or leave this page😉'
    },
    imagesUploadSuccess:{
        ch: '图片上传完成😄正在发布主题帖',
        en: 'Photo upload complete😄 Publishing your post'
    },
    imagesUploadFailed:{
        ch: '图片上传失败😟请尝试重新发布主题帖',
        en: 'Photo upload failed😟 Please try to re-publish your post'
    },


}

const CreatePost = ({ }) => {
    // Handle session
    const router = useRouter();
    // const { data: session } = useSession({
    //     required: true,
    //     onUnauthenticated() {
    //         router.push('/signin');
    //     }
    // })

    // Decalre process states
    const [processStates, setProcessStates] = React.useState({
        errorContent: '',
        displayError: false,
        submitting: false
    })

    // Declare post channel state
    const [postChannelList, setPostChannelList] = React.useState<PostChannel[]>([]);
    React.useEffect(() => {
        getPostChannelList();
    }, []);
    const getPostChannelList = async () => {
        const respOfDict = await fetch('/api/post/channel/getdict');
        const respOfIndex = await fetch('/api/post/channel/getindex');
        const channelDict = await respOfDict.json();
        const channelList: PostChannel[] = [];
        const referenceList = await respOfIndex.json();
        referenceList.forEach((channel: keyof ChannelDict) => {
            channelList.push(channelDict[channel])
        });
        // setPostChannelList(await resp.json())
        setPostChannelList(channelList)
    }
    // Decalre post states
    const [postStates, setPostStates] = React.useState<PostState>({
        title: '123',
        content: '',
        channel: ''
        // tags: []

    })
    // Handle post states change
    const handlePostStatesChange = (prop: keyof PostState) => (event: React.ChangeEvent<HTMLInputElement>) => {
        setPostStates({ ...postStates, [prop]: event.target.value });
    };

    // Declare image states
    const [imageList, setImageList] = React.useState<Image[]>([]);
    const [imageStates, setImageStates] = React.useState<ImageStates>({
        enlarge: false,
        onEnlargeImageUrl: '',
        displayDeleteIcon: true,
    })
    // Handle image states change
    const handleAddImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files?.length !== 0 && event.target.files !== null) {
            let newImageList: Image[] = [];
            for (let i = 0; i < event.target.files?.length; i++) {
                const url = URL.createObjectURL(event.target.files[i]);
                const imageProcess = (url: string) => new Promise((resolve, reject) => {
                    const img = new Image();
                    img.src = url;
                    img.onload = () => {
                        console.log(url);
                        resolve({
                            url,
                            whr: img.width / img.height // width height ratio
                        });
                    }
                    img.onerror = (e) => {
                        reject(e);
                    }
                })
                newImageList.push(await imageProcess(url) as Image);
            }
            setImageList([...imageList, ...newImageList])
        }
        event.target.files = null;
    }
    const handleClick = (imageUrl: string) => () => {
        if (processStates.submitting) {
            return;
        }
        if (imageStates.onEnlargeImageUrl === imageUrl) {
            // Click on the same image
            setImageStates({ ...imageStates, enlarge: !imageStates.enlarge })
        } else {
            // Click on an other image
            setImageStates({ ...imageStates, onEnlargeImageUrl: imageUrl, enlarge: true })
        }
    }
    const handleRemove = (imageIndex: number) => (event: React.MouseEvent) => {
        const _urlList = [...imageList];
        _urlList.splice(imageIndex, 1);
        setImageList(_urlList);
    }
    // // Declare upload states
    const [uploadStates, setUploadStates] = React.useState<UploadStates>({
        imageUrlOnUpload: '',
        uploadPrecent: 0
    });
    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        // console.log(imageUrlList);

        // Step #1 Check requied fileds

        // Step #? Upload image
        const uploadList: Image[] = [...imageList];
        const imageUrlList: string[] = [];
        for (let i = 0; i < imageList.length; i++) {
            const img = uploadList[0];
            if (img !== null && img?.url) {
                setUploadStates({ ...uploadStates, imageUrlOnUpload: img?.url });
                // Step #2.1 Create form data
                let formData = new FormData();
                const config = {
                    headers: { 'Content-Type': 'multipart/form-data' },
                    onUploadProgress: (event: any) => { /////////////////////////
                        setUploadStates({ ...uploadStates, uploadPrecent: Math.round((event.loaded * 100) / event.total) });
                        console.log(`Current progress:`, Math.round((event.loaded * 100) / event.total));
                    },
                };
                formData.append('image', await fetch(img.url).then(r => r.blob()));
                formData.append('title', 'postingTitle');
                formData.append('content', 'postingContent');
                const uploadResp = await axios.post('/api/image', formData, config);
               
                // if (uploadResp.status === 200) {
                //     console.log(`success: ${img.url}`);

                //     imageUrlList.push(uploadResp.data);
                // } else {
                //     // handle upload error
                // }
            }
        }




        // setProcessStates({ ...processStates, displayCircularProgress: true, disableSubmitButton: true });
        setProcessStates({ ...processStates, submitting: true });

        // let formData = new FormData();
        // Step #1.1 upload images

        // Step #1.2 get iamge urls
        // Step #2 upload {title, content, tags, imageUrls}
    }


    return (
        <>
            <Navbar />
            {/* post composer */}
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Box
                    component={'form'}
                    sx={{
                        maxWidth: 600,
                        flexGrow: 1,
                        padding: 2,
                        borderRadius: 1,
                        boxShadow: { xs: 0, sm: 1 }
                    }}
                    onSubmit={handleSubmit}
                >
                    <Stack spacing={2}>
                        <Typography>{langConfigs.title[lang]}</Typography>
                        {/* title */}
                        <TextField
                            id="standard-basic"
                            variant="standard"
                            multiline
                            placeholder={langConfigs.titlePlaceholder[lang]}
                            value={postStates.title}
                            onChange={handlePostStatesChange('title')}
                            required
                            disabled={processStates.submitting}
                        />
                        {/* content */}
                        <TextField
                            id="outlined-basic"
                            variant="outlined"
                            rows={5}
                            multiline
                            fullWidth
                            placeholder={langConfigs.contentPlaceholder[lang]}
                            value={postStates.content}
                            onChange={handlePostStatesChange('content')}
                            disabled={processStates.submitting}

                        />
                        {/* image upload */}
                        <Typography>{langConfigs.uploadImage[lang]}</Typography>
                        <Box sx={{ border: 1, borderRadius: 1, borderColor: 'grey.300', minHeight: 120 }}>
                            <Grid container spacing={1} sx={{ width: 'inherit', padding: 1 }}>
                                {imageList.length !== 0 && (imageList.map((img, index) => {
                                    return (
                                        <Grid item key={img.url}>
                                            <Box
                                                sx={{
                                                    width: imageStates.enlarge && imageStates.onEnlargeImageUrl === img.url ? 320 : 100,
                                                    height: imageStates.enlarge && imageStates.onEnlargeImageUrl === img.url ? Math.floor(320 / img.whr) : 100,
                                                    borderRadius: "10px",
                                                    backgroundSize: "cover",
                                                    backgroundPosition: "center",
                                                    backgroundImage: `url(${img.url})`,
                                                    backdropFilter: 'blur(14px)',
                                                    // backgroundColor: 'grey.300'
                                                }}
                                                onClick={handleClick(img.url)}
                                            >
                                                <Box sx={{
                                                    // display: processStates.submitting ? 'none' : 'felx',
                                                    display: 'none'
                                                }}>
                                                    <IconButton
                                                        sx={{
                                                            display: imageStates.enlarge && imageStates.onEnlargeImageUrl === img.url ? 'none' : 'felx',
                                                            backgroundColor: 'white',
                                                            '&:hover': { backgroundColor: 'white' },
                                                        }}
                                                        size='small'
                                                        color='primary'
                                                        onClick={handleRemove(index)}
                                                    >
                                                        <HighlightOffIcon />
                                                    </IconButton>
                                                </Box>
                                                <Box
                                                    sx={{
                                                        // display: processStates.submitting ? 'felx' : 'none',
                                                        paddingTop: 3.8,
                                                        paddingLeft: 3.8
                                                    }}>
                                                    <CircularProgress />
                                                </Box>
                                            </Box>
                                        </Grid>
                                    )
                                }))}
                                {/* the 'add' button */}
                                <Grid item display={processStates.submitting ? 'none' : ''}>
                                    <IconButton
                                        sx={{
                                            width: 100,
                                            height: 100,
                                            borderRadius: '10px',
                                            border: 1,
                                            borderColor: 'grey.300',
                                        }}
                                        aria-label="upload picture" component="label"
                                    >
                                        <Input sx={{ display: 'none' }} inputProps={{ accept: 'image/*', type: 'file', multiple: true }} onChange={handleAddImage} disabled={processStates.submitting} />
                                        <AddIcon fontSize="large" />
                                    </IconButton>
                                </Grid>
                            </Grid>
                        </Box>
                        {/* channel */}
                        <Typography>{langConfigs.choosePostChannel[lang]}</Typography>
                        <FormControl fullWidth disabled={processStates.submitting} >
                            <InputLabel id='post-channel'>{langConfigs.postChannel[lang]}</InputLabel>
                            <Select
                                labelId='post-channel'
                                value={postStates.channel}
                                label={langConfigs.postChannel[lang]}
                                onChange={(event: SelectChangeEvent) => { setPostStates({ ...postStates, channel: event.target.value as string }) }}
                                SelectDisplayProps={{ style: { display: 'flex', alignItems: 'center' } }}
                                MenuProps={{ style: { maxHeight: 240 } }}
                            >
                                {postChannelList.map(channel => {
                                    return (
                                        <MenuItem value={channel.channelId} key={channel.channelId} >
                                            <ListItemIcon sx={{ minWidth: '36px' }}>
                                                <SvgIcon>
                                                    <path d={channel.svgIconPath} />
                                                </SvgIcon>
                                            </ListItemIcon>
                                            <ListItemText >
                                                <Typography sx={{ marginTop: '1px' }}>
                                                    {channel.channelName[lang]}
                                                </Typography>
                                            </ListItemText>
                                        </MenuItem>
                                    )
                                })}
                            </Select>
                        </FormControl>
                        <Box>
                            <Alert security='warning'>
                                <AlertTitle></AlertTitle>
                                <Typography></Typography>
                            </Alert>
                        </Box>
                        {/* submit button */}
                        <Box>
                            <Button type={'submit'} fullWidth variant='contained' disabled={processStates.submitting}>
                                <Typography sx={{ display: !processStates.submitting ? 'block' : 'none' }}>
                                    {langConfigs.submit[lang]}
                                </Typography>
                                <CircularProgress sx={{ color: 'white', display: processStates.submitting ? 'block' : 'none' }} />
                            </Button>
                        </Box>
                    </Stack>
                    <Copyright sx={{ mt: { xs: 8, sm: 8 }, mb: 4 }} />
                </Box>
            </Box>
        </>
    )
}

export default CreatePost