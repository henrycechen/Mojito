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
import { LangConfigs, PostInfo, ChannelInfo, ChannelDictionary } from '../../lib/types';

import Input from '@mui/material/Input';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';

type Image = {
    url: string;
    whr: number; // width height ratio
}

type ProcessStates = {
    alertSeverity: 'error' | 'info' | 'success';
    alertContent: string;
    displayModal: boolean;
    displayAlert: boolean;
    disableAddButton: boolean;
    submitting: boolean;
}

type PostState = {
    title: string;
    content: string;
    channel: string;
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
    title: { ch: '撰写新主题', en: 'Create a new post' },
    titlePlaceholder: { ch: '标题', en: 'Title' },
    contentPlaceholder: { ch: '写点什么吧~', en: 'What\'s on your mind?' },
    addATopic: { ch: '添加一个话题 #', en: 'Add a topic #' },
    cueAMember: { ch: '提及一位会员 @', en: 'Cue a member @' },
    cueAMemberTitle: { ch: '选择你想 Cue 的会员', en: 'Choose a member' },
    cueAMemberSelect: { ch: '会员', en: 'Member' },
    addMember: { ch: '添加', en: 'Add' },
    uploadImage: { ch: '添加图片', en: 'Add photos' },
    postChannel: { ch: '频道', en: 'Choose a channel' },
    choosePostChannel: { ch: '选择一个频道', en: 'Choose a channel' },
    submit: { ch: '发布', en: 'Publish' },
    imagesUploading: {
        ch: '上传图片中，请勿关闭或离开页面😉',
        en: 'Uploading photos, please do not close or leave this page😉'
    },
    imagesUploadSuccess: {
        ch: '图片上传完成😄正在发布主题帖',
        en: 'Photo upload complete😄 Publishing your post'
    },
    imagesUploadFailed: {
        ch: '图片上传失败😟请尝试重新发布主题帖',
        en: 'Photo upload failed😟 Please try to re-publish your post'
    },
    postPublishSuccess: {
        ch: '发布成功😄正在跳转到主题帖页面',
        en: 'Publishing success😄 Redirecting to your post page'
    },
    postPublishFailed: {
        ch: '主题帖发布失败😟请尝试重新发布主题帖',
        en: 'Post publishing failed😟 Please try to re-publish your post'
    }

}

const CreatePost = () => {
    // Handle session
    const router = useRouter();
    useSession({
        required: true,
        onUnauthenticated() {
            router.push('/signin');
        }
    })

    // Decalre process states
    const [processStates, setProcessStates] = React.useState<ProcessStates>({
        alertSeverity: 'info',
        alertContent: '',
        displayModal: false,
        displayAlert: false,
        disableAddButton: false,
        submitting: false
    })

    // Declare channel info state
    const [channelInfoList, setChannelInfoList] = React.useState<ChannelInfo[]>([]);
    React.useEffect(() => {
        getPostChannelList();
    }, []);

    // Initialize channel list
    const getPostChannelList = async () => {
        const channelDict = await fetch('/api/channel/getdictionary').then(resp => resp.json());
        const referenceList = await fetch('/api/channel/getindex').then(resp => resp.json());
        const channelList: ChannelInfo[] = [];
        referenceList.forEach((channel: keyof ChannelDictionary) => {
            channelList.push(channelDict[channel])
        });
        setChannelInfoList(channelList.filter(ch => !!ch));
    }

    // Decalre post info states
    const [postStates, setPostStates] = React.useState<PostState>({
        title: '',
        content: '',
        channel: ''
        // tags: [] // Not-in-use

    })

    // Handle post states change
    const handlePostStatesChange = (prop: keyof PostState) => (event: React.ChangeEvent<HTMLInputElement>) => {
        setPostStates({ ...postStates, [prop]: event.target.value });
    };

    // Define member info type
    type MemberInfo = {
        id: string;
        nickname: string;
        avatarImageUrl: string | undefined;
    }

    // Define cue-member-helper type
    type CueMemberHelper = {
        memberInfoList: MemberInfo[];
        selectedNicknameList: string[];
    }
    // Declare cue member helper
    const [cueMemberHelper, setCuedMemberHelper] = React.useState<CueMemberHelper>({
        memberInfoList: [],
        selectedNicknameList: []
    });
    React.useEffect(() => { getFollowingMembers() }, []);
    const getFollowingMembers = async () => {
        const resp = await fetch('/api/member/behaviour/followmember');
        const list = await resp.json();
        if ('object' === typeof list && 0 !== list.length) {
            setCuedMemberHelper({ ...cueMemberHelper, memberInfoList: list });
        }
    }

    // Handle modal open
    const handleModalOpen = async () => {
        if (0 === cueMemberHelper.memberInfoList.length) {
            return;
        }
        setProcessStates({ ...processStates, displayModal: true });
    };

    // Handle modal close
    const handleModalClose = () => {
        // Step #1 reset selectedNicknameList
        setCuedMemberHelper({ ...cueMemberHelper, selectedNicknameList: [] });
        // Step #2 close modal
        setProcessStates({ ...processStates, displayModal: false })
    };

    // Handle nickname select change
    const handleNicknameSelectChange = (event: SelectChangeEvent<typeof cueMemberHelper.selectedNicknameList>) => {
        const { target: { value } } = event;
        setCuedMemberHelper({
            ...cueMemberHelper,
            selectedNicknameList: typeof value === 'string' ? value.split(',') : value,
        });
    };

    // Handle nickname select submit
    const handleNicknameSelectSubmit = () => {
        // console.log(cueMemberHelper.selectedNicknameList);
        let nicknameStr = '';
        cueMemberHelper.selectedNicknameList.forEach(name => nicknameStr += `@${name} `);
        setPostStates({ ...postStates, content: `${postStates.content} ${nicknameStr}` })
        setProcessStates({ ...processStates, displayModal: false });
    }

    // Handle add a topic
    const handleAddTopic = () => {
        setPostStates({ ...postStates, content: `${postStates.content} #` });
    }

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

    // Handle click on the image box
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

    // Handle click on the remove icon
    const handleRemove = (imageIndex: number) => (event: React.MouseEvent) => {
        if (!processStates.submitting) {
            const imgList = [...imageList];
            imgList.splice(imageIndex, 1);
            setImageList(imgList);
        }
    }

    // Handle drag start
    const handleDragStart = () => {
        setProcessStates({ ...processStates, disableAddButton: true })
    }

    // Handle drag end
    const handleDragEnd = (result: any) => {
        setProcessStates({ ...processStates, disableAddButton: false })
        const list = Array.from(imageList);
        const [movedImage] = list.splice(result?.source?.index, 1);
        list.splice(result?.destination.index, 0, movedImage);
        setImageList(list);
    }

    // Declare upload states
    const [uploadStates, setUploadStates] = React.useState<UploadStates>({
        imageUrlOnUpload: '',
        uploadPrecent: 0
    });

    const [uploadedImageIndexList, setUploadedImageIndexList] = React.useState<number[]>([]);

    // Handle post form submit
    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        // Step #1 Check requied fileds
        if ('' === postStates.title || '' === postStates.channel) {
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
                        console.log(`Was tring uploading ${img.url}. ${e}`);
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
        const post: PostInfo = {
            title: postStates.title,
            content: postStates.content,
            channelId: postStates.channel,
            imageUrlArr: []
        }
        try {
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
            console.log(`Was tring publishing post. ${e}`);
            setProcessStates({ ...processStates, alertSeverity: 'error', alertContent: langConfigs.postPublishFailed[lang], displayAlert: true });
            return;
        }
    }

    return (
        <>
            <Navbar />
            {/* post composer */}
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Box component={'form'} sx={{ maxWidth: 600, flexGrow: 1, padding: 2, borderRadius: 1, boxShadow: { xs: 0, sm: 1 }, backgroundColor: 'background' }} onSubmit={handleSubmit}>
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
                        {/* topic & cue button */}
                        <Stack direction={'row'} spacing={1}>
                            <Button variant='contained' sx={{ padding: 0.2, paddingX: 1 }} onClick={handleAddTopic}><Typography variant='body2'>{langConfigs.addATopic[lang]}</Typography></Button>
                            <Button variant='contained' sx={{ padding: 0.2, paddingX: 1 }} onClick={handleModalOpen}><Typography variant='body2'>{langConfigs.cueAMember[lang]}</Typography></Button>
                        </Stack>
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
                        <FormControl
                            fullWidth
                            disabled={processStates.submitting}
                            required
                        >
                            <InputLabel id='channel'>{langConfigs.postChannel[lang]}</InputLabel>
                            <Select
                                labelId='channel'
                                value={postStates.channel}
                                label={langConfigs.postChannel[lang]}
                                onChange={(event: SelectChangeEvent) => { setPostStates({ ...postStates, channel: event.target.value as string }) }}
                                SelectDisplayProps={{ style: { display: 'flex', alignItems: 'center' } }}
                                MenuProps={{ style: { maxHeight: 240 } }}
                            >
                                {channelInfoList.map(channel => {
                                    return (
                                        <MenuItem value={channel.id} key={channel.id} >
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
            <Modal
                open={processStates.displayModal}
                onClose={handleModalClose}
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
                    <Typography>{langConfigs.cueAMemberTitle[lang]}</Typography>
                    <FormControl fullWidth >
                        <InputLabel id='member-info-list'>{langConfigs.cueAMemberSelect[lang]}</InputLabel>
                        <Select
                            labelId='member-info-list'
                            value={cueMemberHelper.selectedNicknameList}
                            label={langConfigs.postChannel[lang]}
                            onChange={handleNicknameSelectChange}
                            SelectDisplayProps={{ style: { display: 'flex', alignItems: 'center' } }}
                            MenuProps={{ style: { maxHeight: 240 } }}
                            multiple={true}
                        >
                            {cueMemberHelper.memberInfoList.map(member => {
                                return (
                                    <MenuItem value={member.nickname} key={member.id} >
                                        {member.nickname}
                                    </MenuItem>
                                )
                            })}
                        </Select>
                    </FormControl>
                    <Button variant='contained' onClick={handleNicknameSelectSubmit}>{langConfigs.addMember[lang]}</Button>
                </Stack>
            </Modal>
        </>
    )
}

export default CreatePost