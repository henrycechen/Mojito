import * as React from 'react';

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
import MenuItem from '@mui/material/MenuItem';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';

import SvgIcon from '@mui/material/SvgIcon';

import Modal from '@mui/material/Modal';

import { DragDropContext } from 'react-beautiful-dnd';
import { Droppable, Draggable } from 'react-beautiful-dnd';

import axios from 'axios';
import Alert from '@mui/material/Alert';
import CheckIcon from '@mui/icons-material/Check';
import CircularProgress from '@mui/material/CircularProgress';

import Navbar from '../../ui/Navbar';
import Copyright from '../../ui/Copyright';

import { useRouter } from 'next/router';
import { IConciseTopicComprehensive } from '../../lib/interfaces';
import { LangConfigs, TChannelInfoStates, TChannelInfoDictionary } from '../../lib/types';

import Input from '@mui/material/Input';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import MenuList from '@mui/material/MenuList/MenuList';
import { CenterlizedBox } from '../../ui/Styled';
import { IConciseMemberInfo, IPostComprehensive } from '../../lib/interfaces';
import { NextPageContext } from 'next';
import { getNicknameBrief, getRandomHexStr } from '../../lib/utils';
import Avatar from '@mui/material/Avatar';

type TCreatePostPageProps = {
    channelInfoDict_ss: TChannelInfoDictionary
}

type Image = {
    url: string;
    whr: number; // width height ratio
}

type ProcessStates = {
    alertSeverity: 'error' | 'info' | 'success';
    alertContent: string;
    displayAlert: boolean;
    displayCueHelper: boolean;
    displayNoFollowedMemberAlert: boolean;
    disableAddButton: boolean;
    submitting: boolean;
}

type TPostInfoOnEdit = {
    title: string;
    imageUrlsArr: string[];
    content: string; // require converting to paragraphsArr on submit
    cuedMemberInfoDict: { [memberId: string]: IConciseMemberInfo }; // require converting to cuedMemberInfoArr on submit
    channelId: string;
    topicIdsArr: string[];
}

type TPostInfoOnSubmit = {
    title: string;
    imageUrlsArr: string[];
    paragraphsArr: string[];
    cuedMemberInfoArr: IConciseMemberInfo[];
    channelId: string;
    topicIdsArr: string[];
}

type TAuthorInfo = {
    followedMemberInfoArr: IConciseMemberInfo[];
}

type TTopicHelper = {
    display: boolean;
    topic: string;
    conciseTopicComprehensiveArr: IConciseTopicComprehensive[];
    displayAlert: boolean;
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

const domain = process.env.NEXT_PUBLIC_APP_DOMAIN;
const lang = process.env.NEXT_PUBLIC_APP_LANG ?? 'tw';
const langConfigs: LangConfigs = {
    title: {
        tw: '撰寫新主題帖',
        cn: '撰写新主题帖',
        en: 'Create a new post'
    },
    titlePlaceholder: {
        tw: '題目',
        cn: '标题',
        en: 'Title'
    },
    contentPlaceholder: {
        tw: '寫下你現在的想法吧',
        cn: '写点什么吧~',
        en: 'What\'s on your mind?'
    },
    addTopic: {
        tw: '添加話題',
        cn: '添加话题',
        en: 'Add a topic'
    },
    blankTopicAlert: {
        tw: '話題不能為空白哦',
        cn: '话题不能为空白哦',
        en: 'Cannot add a blank topic'
    },
    relatedTopicNotFound: {
        tw: '未找到相關話題',
        cn: '未找到相关话题',
        en: 'Related topic not found'
    },
    enterOrQueryATopic: {
        tw: '鍵入或搜尋一個話題',
        cn: '输入或搜索一个话题',
        en: 'Add or query a topic'
    },
    noFollowedMember: {
        tw: '您還未曾關注其他會員哦',
        cn: '您还没有关注其他会员',
        en: 'You have not followed any member'
    },
    posts: {
        tw: '篇帖子',
        cn: '篇帖子',
        en: 'Posts'
    },
    add: {
        tw: '添加',
        cn: '添加',
        en: 'Add'
    },
    uploadImage: {
        tw: '添加图片',
        cn: '添加图片',
        en: 'Add photos'
    },
    postChannel: {
        tw: '频道',
        cn: '频道',
        en: 'Choose a channel'
    },
    choosePostChannel: {
        tw: '选择一个频道',
        cn: '选择一个频道',
        en: 'Choose a channel'
    },
    submit: {
        tw: '发布',
        cn: '发布',
        en: 'Publish'
    },
    imagesUploading: {
        tw: '上传图片中，请勿关闭或离开页面😉',
        cn: '上传图片中，请勿关闭或离开页面😉',
        en: 'Uploading photos, please do not close or leave this page😉'
    },
    imagesUploadSuccess: {
        tw: '图片上传完成😄正在发布主题帖',
        cn: '图片上传完成😄正在发布主题帖',
        en: 'Photo upload complete😄 Publishing your post'
    },
    imagesUploadFailed: {
        tw: '图片上传失败😟请尝试重新发布主题帖',
        cn: '图片上传失败😟请尝试重新发布主题帖',
        en: 'Photo upload failed😟 Please try to re-publish your post'
    },
    postPublishSuccess: {
        tw: '发布成功😄正在跳转到主题帖页面',
        cn: '发布成功😄正在跳转到主题帖页面',
        en: 'Publishing success😄 Redirecting to your post page'
    },
    postPublishFailed: {
        tw: '主题帖发布失败😟请尝试重新发布主题帖',
        cn: '主题帖发布失败😟请尝试重新发布主题帖',
        en: 'Post publishing failed😟 Please try to re-publish your post'
    }

}

export async function getServerSideProps(context: NextPageContext): Promise<{ props: any }> {
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

const CreatePost = ({ channelInfoDict_ss }: TCreatePostPageProps) => {
    const router = useRouter();
    const { data: session } = useSession({ required: true, onUnauthenticated() { router.push('/signin') } });

    let authorId = '';
    const authorSession: any = { ...session };
    authorId = authorSession?.user?.id;

    //////// INFO - channel info dictionary ////////

    //////// STATES - process ////////
    const [processStates, setProcessStates] = React.useState<ProcessStates>({
        alertSeverity: 'info',
        alertContent: '',
        displayAlert: false,
        displayCueHelper: false,
        displayNoFollowedMemberAlert: false,
        disableAddButton: false,
        submitting: false
    })

    const handleCueHelperOpenAndClose = () => {
        setProcessStates({ ...processStates, displayCueHelper: !processStates.displayCueHelper });
    };

    //////// STATES - channel ////////
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

    //////// STATE - post ////////
    const [postInfoStates, setPostInfoStates] = React.useState<TPostInfoOnEdit>({
        title: '',
        imageUrlsArr: [],
        content: '', // require converting to paragraphsArr on submit
        cuedMemberInfoDict: {}, // require converting to cuedMemberInfoArr on submit
        channelId: '',
        topicIdsArr: []
    })

    const handlePostStatesChange = (prop: keyof TPostInfoOnEdit) => (event: React.ChangeEvent<HTMLInputElement>) => {
        setPostInfoStates({ ...postInfoStates, [prop]: event.target.value });
    };

    const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setPostInfoStates({
            ...postInfoStates,
            title: event.target.value
        });
    };
    const handleContentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setPostInfoStates({
            ...postInfoStates,
            content: event.target.value
        });
    };

    //////// STATE - author info ////////
    const [authorInfoStates, setAuthorInfoStates] = React.useState<TAuthorInfo>({
        followedMemberInfoArr: []
    });

    React.useEffect(() => { updateAuthorInfoStates() }, []);

    const updateAuthorInfoStates = async () => {
        // get followed member info
        const resp = await fetch(`/api/member/info/${authorId}/followed`);
        if (200 === resp.status) {
            try {
                const memberInfoArr = await resp.json();
                setAuthorInfoStates({ ...authorInfoStates, followedMemberInfoArr: [...memberInfoArr] });
                if (0 === memberInfoArr.length) {
                    setProcessStates({ ...processStates, displayNoFollowedMemberAlert: true });
                }
            } catch (e) {
                console.log(`Attempt to parese followed member info array (JSON). ${e}`);
            }
        } else {
            console.log(`Attempt to GET following restricted member info array.`);
        }
    }

    const handleCue = (memberInfo: IConciseMemberInfo) => (event: React.MouseEvent<HTMLButtonElement>) => {
        if (postInfoStates.cuedMemberInfoDict.hasOwnProperty(memberInfo.memberId)) {
            const update = { ...postInfoStates.cuedMemberInfoDict };
            delete update[memberInfo.memberId];
            const content = postInfoStates.content.split(`@${memberInfo.nickname}`).join('');
            setPostInfoStates({
                ...postInfoStates,
                content: content,
                cuedMemberInfoDict: { ...update }
            })
            return;
        } else {
            setPostInfoStates({
                ...postInfoStates,
                content: `${postInfoStates.content}@${memberInfo.nickname}`,
                cuedMemberInfoDict: {
                    ...postInfoStates.cuedMemberInfoDict,
                    [memberInfo.memberId]: memberInfo
                }
            })
        }
    }

    //////// STATE - topic helper ////////
    const [topicHelperState, setTopicHelperState] = React.useState<TTopicHelper>({
        display: false,
        topic: '',
        conciseTopicComprehensiveArr: [],
        displayAlert: false
    });

    const handleTopicHelperOpen = () => {
        setTopicHelperState({ display: true, topic: '', conciseTopicComprehensiveArr: [], displayAlert: false });
    };

    const handleTopicHelperClose = () => {
        setTopicHelperState({ display: false, topic: '', conciseTopicComprehensiveArr: [], displayAlert: false });
    };

    React.useEffect(() => { updateTopicInfoArrayByFragment() }, [topicHelperState.topic]);

    const updateTopicInfoArrayByFragment = async () => {
        const resp = await fetch(`/api/topic/query/by/fragment/${'idfragment'}`);
        if (200 === resp.status) {
            try {
                const infoArr = await resp.json();
                setTopicHelperState({
                    ...topicHelperState,
                    conciseTopicComprehensiveArr: [...infoArr]
                });
            } catch (e) {
                console.log(`Attempt to GET concise topic comprehensive array by fragment. ${e}`);
            }
        }
    }

    const handleTopicInput = (event: React.ChangeEvent<HTMLInputElement>) => {
        setTopicHelperState({ ...topicHelperState, topic: event.target.value, displayAlert: false });
    }

    const handleAddATopicManually = () => {
        if ('' === topicHelperState.topic) {
            setTopicHelperState({ ...topicHelperState, displayAlert: true });
            return;
        }
        const topicId = Buffer.from(topicHelperState.topic).toString('base64');
        setTopicHelperState({ display: false, topic: '', conciseTopicComprehensiveArr: [], displayAlert: false });
        setPostInfoStates({
            ...postInfoStates,
            content: `${postInfoStates.content}#${topicHelperState.topic}`,
            topicIdsArr: [...postInfoStates.topicIdsArr, topicId]
        })
    }

    const handleAddATopicById = (topicId: string) => (event: React.MouseEvent<any>) => {
        setTopicHelperState({ display: false, topic: '', conciseTopicComprehensiveArr: [], displayAlert: false });
        setPostInfoStates({
            ...postInfoStates,
            content: `${postInfoStates.content}#${Buffer.from(topicId, 'base64').toString()}`
        });
    }

    //////// STATES - image array ////////
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
        if (!processStates.submitting) {
            const imgList = [...imageList];
            imgList.splice(imageIndex, 1);
            setImageList(imgList);
        }
    }

    const handleDragStart = () => {
        setProcessStates({ ...processStates, disableAddButton: true })
    }

    const handleDragEnd = (result: any) => {
        setProcessStates({ ...processStates, disableAddButton: false })
        const list = Array.from(imageList);
        const [movedImage] = list.splice(result?.source?.index, 1);
        list.splice(result?.destination.index, 0, movedImage);
        setImageList(list);
    }

    //////// STATES - upload process ////////
    const [uploadStates, setUploadStates] = React.useState<UploadStates>({
        imageUrlOnUpload: '',
        uploadPrecent: 0
    });

    const [uploadedImageIndexList, setUploadedImageIndexList] = React.useState<number[]>([]);

    // Handle post form submit
    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        // Step #1 Check requied fileds
        if ('' === postInfoStates.title || '' === postInfoStates.channelId) {
            return;
        }
        // Step #2 Upload image
        const uploadList: Image[] = [...imageList];
        const imageUrlArr: string[] = [];
        if (uploadList.length !== 0) {
            setProcessStates({ ...processStates, alertSeverity: 'info', alertContent: langConfigs.imagesUploading[lang], displayAlert: true, submitting: true });
            for (let i = 0; i < imageList.length; i++) {
                const img = uploadList[0];
                console.log(`Uploading ${img.url}`);
                if (img !== null && img.url) {
                    setUploadStates({ ...uploadStates, imageUrlOnUpload: img?.url });
                    // Step #2.1 Create form data
                    let formData = new FormData();
                    const config = {
                        headers: { 'Content-Type': 'multipart/form-data' },
                        onUploadProgress: (event: any) => {
                            setUploadStates({ ...uploadStates, uploadPrecent: Math.round((event.loaded * 100) / event.total) });
                            console.log(`Upload progress:`, Math.round((event.loaded * 100) / event.total));
                        }
                    };
                    try {
                        formData.append('image', await fetch(img.url).then(r => r.blob()));
                        const uploadResp = await axios.post('/api/image', formData, config);
                        imageUrlArr.push(uploadResp.data);
                        const uploadedList = uploadedImageIndexList;
                        uploadedList.push(i)
                        setUploadedImageIndexList(uploadedList);
                    } catch (e) {
                        console.log(`Attempt to upload ${img.url}. ${e}`);
                        setProcessStates({ ...processStates, alertSeverity: 'error', alertContent: langConfigs.imagesUploadFailed[lang], displayAlert: true });
                        return;
                    }
                }
            }
        } else {
            setProcessStates({ ...processStates, displayAlert: false, submitting: true });
        }
        if (imageUrlArr.length !== 0 && imageList.length !== imageUrlArr.length) {
            setProcessStates({ ...processStates, alertSeverity: 'error', alertContent: langConfigs.imagesUploadFailed[lang], displayAlert: true });
            return;
        } else {
            setProcessStates({ ...processStates, alertSeverity: 'success', alertContent: langConfigs.imagesUploadSuccess[lang], displayAlert: true, submitting: true });
        }
        // Step #3 Publish post
        const post: TPostInfoOnSubmit = {
            title: postInfoStates.title,
            imageUrlsArr: [],
            paragraphsArr: [],
            cuedMemberInfoArr: [],
            channelId: postInfoStates.channelId,
            topicIdsArr: []
        }
        try {
            //// TODO: update required as new api rules appied
            const resp = await axios.post('/api/post/create', post);
            const { data: postId } = resp;
            if ('string' === typeof postId && '' !== postId) {
                setProcessStates({ ...processStates, alertSeverity: 'success', alertContent: langConfigs.postPublishSuccess[lang], displayAlert: true });
                setTimeout(() => router.push(`/post/${resp.data}`), 800);
            } else {
                setProcessStates({ ...processStates, alertSeverity: 'error', alertContent: langConfigs.postPublishFailed[lang], displayAlert: true });
            }
            return;
        } catch (e) {
            console.log(`Attempt to publish post. ${e}`);
            setProcessStates({ ...processStates, alertSeverity: 'error', alertContent: langConfigs.postPublishFailed[lang], displayAlert: true });
            return;
        }
    }

    return (
        <>
            <Navbar />

            {/* post editor */}
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Box component={'form'} sx={{ maxWidth: 600, flexGrow: 1, padding: 2, borderRadius: 1, boxShadow: { xs: 0, sm: 1 }, backgroundColor: 'background' }} onSubmit={handleSubmit}>
                    <Stack spacing={2}>
                        <Typography>{langConfigs.title[lang]}</Typography>

                        {/* title */}
                        <TextField
                            // id="standard-basic"
                            variant='standard'
                            multiline
                            placeholder={langConfigs.titlePlaceholder[lang]}
                            value={postInfoStates.title}
                            onChange={handlePostStatesChange('title')}
                            required
                            disabled={processStates.submitting}
                        />

                        {/* content */}
                        <TextField
                            // id="outlined-basic"
                            variant='outlined'
                            rows={5}
                            multiline
                            fullWidth
                            placeholder={langConfigs.contentPlaceholder[lang]}
                            value={postInfoStates.content}
                            onChange={handlePostStatesChange('content')}
                            disabled={processStates.submitting}
                        />

                        {/* topic & cue button */}
                        <Stack direction={'row'} spacing={1}>
                            <IconButton onClick={handleCueHelperOpenAndClose}><Typography variant='body1' sx={{ minWidth: 24 }}>@</Typography></IconButton>
                            <IconButton onClick={handleTopicHelperOpen}><Typography variant='body1' sx={{ minWidth: 24 }}>#</Typography></IconButton>
                        </Stack>

                        {/* no followed member alert */}
                        <Box mt={2} sx={{ display: processStates.displayCueHelper && processStates.displayNoFollowedMemberAlert ? 'flex' : 'none', justifyContent: 'center' }}>
                            <Typography color={'text.disabled'}>{langConfigs.noFollowedMember[lang]}</Typography>
                        </Box>

                        {/* followed member array */}
                        <Box mt={1} sx={{ display: processStates.displayCueHelper ? 'block' : 'none' }}>
                            <Stack direction={'row'} sx={{ padding: 1, overflow: 'auto', }} >
                                {authorInfoStates.followedMemberInfoArr.map(memberInfo => {
                                    return (
                                        <Button key={getRandomHexStr()} size={'small'} sx={{ minWidth: 72, minHeight: 86 }} onClick={handleCue(memberInfo)}>
                                            <Stack sx={{}}>
                                                <Grid container>
                                                    <Grid item flexGrow={1}></Grid>
                                                    <Grid item>
                                                        <Avatar src={memberInfo.avatarImageUrl} sx={{ width: 34, height: 34, bgcolor: 'grey' }}>{memberInfo.nickname?.charAt(0).toUpperCase()}</Avatar>
                                                    </Grid>
                                                    <Grid item flexGrow={1}></Grid>
                                                </Grid>
                                                <Typography mt={1} sx={{ minHeight: 33, fontSize: 11, color: postInfoStates.cuedMemberInfoDict.hasOwnProperty(memberInfo.memberId) ? 'inherit' : 'text.secondary' }}>{getNicknameBrief(memberInfo.nickname)}</Typography>
                                            </Stack>

                                        </Button>
                                    )
                                })}
                            </Stack>
                        </Box>

                        {/* image upload */}
                        <Typography>{langConfigs.uploadImage[lang]}</Typography>
                        <Box sx={{ padding: 1, border: 1, borderRadius: 1, borderColor: 'grey.300' }}>
                            <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                                <Droppable droppableId={'uploadImages'} direction='horizontal'>
                                    {(provided) =>
                                        <Stack
                                            spacing={1}
                                            direction={'row'}
                                            className='uploadImages'
                                            ref={provided.innerRef}
                                            sx={{ maxWidth: 'calc(100vw - 3rem)', overflow: 'scroll' }}
                                            {...provided.droppableProps}
                                        >
                                            {imageList.length !== 0 && (imageList.map((img, index) => {
                                                return (
                                                    <Draggable key={img.url} draggableId={img.url} index={index}>
                                                        {(provided) =>
                                                            <Grid item {...provided.draggableProps} {...provided.dragHandleProps} ref={provided.innerRef}>
                                                                {/* image wrapper */}
                                                                <Box
                                                                    sx={{
                                                                        width: imageStates.enlarge && imageStates.onEnlargeImageUrl === img.url ? 320 : 100,
                                                                        height: imageStates.enlarge && imageStates.onEnlargeImageUrl === img.url ? Math.floor(320 / img.whr) : 100,
                                                                        borderRadius: "10px",
                                                                        backgroundSize: "cover",
                                                                        backgroundPosition: "center",
                                                                        backgroundImage: `url(${img.url})`,
                                                                        backdropFilter: 'blur(14px)',
                                                                    }}
                                                                    onClick={handleClick(img.url)}
                                                                >
                                                                    {/* remove icon */}
                                                                    <Box sx={{ display: processStates.submitting ? 'none' : 'flex' }}>
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
                                                                    {/* progress circular indeterminate */}
                                                                    <Box sx={{ display: processStates.submitting && !uploadedImageIndexList.includes(index) ? 'flex' : 'none', paddingTop: 3.8, paddingLeft: 3.8 }}>
                                                                        <CircularProgress />
                                                                    </Box>
                                                                    {/* progress complete sign */}
                                                                    <Box sx={{ display: processStates.submitting && uploadedImageIndexList.includes(index) ? 'flex' : 'none', paddingTop: 3, paddingLeft: 3 }}>
                                                                        <Box sx={{ width: '52px', height: '52px', backgroundColor: 'white', borderRadius: '50%', padding: 1 }}>
                                                                            <CheckIcon fontSize='large' color='success' />
                                                                        </Box>
                                                                    </Box>
                                                                </Box>
                                                            </Grid>
                                                        }
                                                    </Draggable>
                                                )
                                            }))}

                                            {/* the 'add' button */}
                                            <Box display={processStates.disableAddButton || processStates.submitting ? 'none' : ''}>
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
                                            </Box>
                                            {provided.placeholder}
                                        </Stack>
                                    }
                                </Droppable>
                            </DragDropContext >
                        </Box>

                        {/* channel */}
                        <Typography>{langConfigs.choosePostChannel[lang]}</Typography>
                        <FormControl fullWidth disabled={processStates.submitting} required>
                            <InputLabel id='channel'>{langConfigs.postChannel[lang]}</InputLabel>
                            <Select
                                labelId='channel'
                                value={postInfoStates.channelId}
                                label={langConfigs.postChannel[lang]}
                                onChange={(event: SelectChangeEvent) => { setPostInfoStates({ ...postInfoStates, channelId: event.target.value as string }) }}
                                SelectDisplayProps={{ style: { display: 'flex', alignItems: 'center' } }}
                                MenuProps={{ style: { maxHeight: 240 } }}
                            >
                                {channelInfoStates.channelIdSequence.map(channelId => {
                                    const channel = channelInfoDict_ss[channelId]
                                    return (
                                        <MenuItem value={channel.channelId} key={channel.channelId} >
                                            <ListItemIcon sx={{ minWidth: '36px' }}>
                                                <SvgIcon>
                                                    <path d={channel.svgIconPath} />
                                                </SvgIcon>
                                            </ListItemIcon>
                                            <ListItemText >
                                                <Typography sx={{ marginTop: '1px' }}>
                                                    {channel.name[lang]}
                                                </Typography>
                                            </ListItemText>
                                        </MenuItem>
                                    )
                                })}
                            </Select>
                        </FormControl>
                        <Box display={processStates.displayAlert ? 'block' : 'none'}>
                            <Alert severity={processStates.alertSeverity}>
                                <Typography>{processStates.alertContent}</Typography>
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

            {/* topic query and selector */}
            <Modal
                open={topicHelperState.display}
                onClose={handleTopicHelperClose}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
            >
                <Stack spacing={1} sx={{
                    position: 'absolute' as 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 400,
                    bgcolor: 'background.paper',
                    borderRadius: 2,
                    boxShadow: 24,
                    p: 4,
                }}>
                    <Typography>{langConfigs.addTopic[lang]}</Typography>
                    <Box mt={1} sx={{ display: topicHelperState.displayAlert ? 'block' : 'none' }}>
                        <Alert severity='error'>{langConfigs.blankTopicAlert[lang]}</Alert>
                    </Box>

                    {/* 'add' button */}
                    <FormControl fullWidth >
                        <Grid container>
                            <Grid item >
                                <TextField
                                    variant={'standard'}
                                    multiline
                                    placeholder={langConfigs.enterOrQueryATopic[lang]}
                                    value={topicHelperState.topic}
                                    onChange={handleTopicInput}
                                />
                            </Grid>
                            <Grid item flexGrow={1}>
                            </Grid>
                            <Grid item>
                                <Button variant='contained' onClick={handleAddATopicManually}>{langConfigs.add[lang]}</Button>
                            </Grid>
                        </Grid>

                        {/* existed topic list */}
                        <Box mt={2}>
                            <CenterlizedBox sx={{ display: topicHelperState.display && topicHelperState.displayAlert ? 'flex' : 'none' }}>
                                <Typography color={'text.disabled'}>{langConfigs.relatedTopicNotFound[lang]}</Typography>
                            </CenterlizedBox>
                            <MenuList sx={{ display: 'block' }}>
                                {0 !== topicHelperState.conciseTopicComprehensiveArr.length && topicHelperState.conciseTopicComprehensiveArr.map(topic => {
                                    return (
                                        <MenuItem key={topic.topicId} sx={{ paddingLeft: 2 }} onClick={handleAddATopicById(topic.topicId)}>
                                            <ListItemText>#{Buffer.from(topic.topicId, 'base64').toString()} {topic.totalPostCount}{langConfigs.posts[lang]}</ListItemText>
                                        </MenuItem>
                                    )
                                })}
                            </MenuList>
                        </Box>
                    </FormControl>
                </Stack>
            </Modal>
        </>
    )
}

export default CreatePost