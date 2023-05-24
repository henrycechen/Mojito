import * as React from 'react';
import { NextPageContext } from 'next';
import { useRouter } from 'next/router';
import { signIn, useSession } from 'next-auth/react';
import useTheme from '@mui/material/styles/useTheme';

import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Backdrop from '@mui/material/Backdrop';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import Grid from '@mui/material/Grid';
import Input from '@mui/material/Input';
import InputLabel from '@mui/material/InputLabel';
import Link from '@mui/material/Link';
import Modal from '@mui/material/Modal';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import MenuList from '@mui/material/MenuList/MenuList';
import MenuItem from '@mui/material/MenuItem';
import ListItemText from '@mui/material/ListItemText';

import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import AddIcon from '@mui/icons-material/Add';
import AlternateEmailIcon from '@mui/icons-material/AlternateEmail';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import CheckIcon from '@mui/icons-material/Check';
import CreateIcon from '@mui/icons-material/Create';
import EmailIcon from '@mui/icons-material/Email';
import IconButton from '@mui/material/IconButton';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import ListItemIcon from '@mui/material/ListItemIcon';
import SvgIcon from '@mui/material/SvgIcon';
import TagIcon from '@mui/icons-material/Tag';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import ReorderIcon from '@mui/icons-material/Reorder';
import SettingsIcon from '@mui/icons-material/Settings';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import StarIcon from '@mui/icons-material/Star';

import { DragDropContext } from 'react-beautiful-dnd';
import { Droppable, Draggable } from 'react-beautiful-dnd';

import axios from 'axios';
import 'jimp';

import { IConciseTopicComprehensive, ITopicInfo } from '../lib/interfaces/topic';
import { LangConfigs, TPreferenceStates } from '../lib/types';
import { IMemberInfo } from '../lib/interfaces/member';
import { IChannelInfoStates, IChannelInfoDictionary } from '../lib/interfaces/channel';
import { getNicknameBrief, provideAvatarImageUrl, } from '../lib/utils/for/member';
import { createId, getRandomHexStr } from '../lib/utils/create';
import { restoreFromLocalStorage } from '../lib/utils/general';
import { contentToParagraphsArray, cuedMemberInfoDictionaryToArray } from '../lib/utils/for/post';

import Navbar from '../ui/Navbar';
import SideMenu from '../ui/SideMenu';
import Copyright from '../ui/Copyright';
import Terms from '../ui/Terms';
import { ColorModeContext } from '../ui/Theme';
import Guidelines from '../ui/Guidelines';

const storageName0 = 'PreferenceStates';
const restorePreferenceStatesFromCache = restoreFromLocalStorage(storageName0);

type TCreatePostPageProps = {
    channelInfoDict_ss: IChannelInfoDictionary;
    redirect500: boolean;
};

const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? '';
const imageDomain = process.env.NEXT_PUBLIC_IMAGE_DOMAIN ?? '';
const defaultLang = process.env.NEXT_PUBLIC_APP_LANG ?? 'tw';
const langConfigs: LangConfigs = {
    // Left column
    posts: {
        tw: '文章',
        cn: '文章',
        en: 'Posts'
    },
    followedMembers: {
        tw: '關注',
        cn: '关注',
        en: 'Followed'
    },
    messages: {
        tw: '訊息',
        cn: '消息',
        en: 'Messages'
    },
    unread: {
        tw: `未讀`,
        cn: `未读`,
        en: `Unread`
    },
    member: {
        tw: '主頁',
        cn: '主页',
        en: 'Member'
    },
    settings: {
        tw: '設定',
        cn: '设定',
        en: 'Settings'
    },
    create: {
        tw: '創作',
        cn: '创作',
        en: 'Create'
    },

    title: {
        tw: '創作新文章',
        cn: '创作新文章',
        en: 'Create a new post'
    },
    titlePlaceholder: {
        tw: '題目',
        cn: '标题',
        en: 'Title'
    },
    contentPlaceholder: {
        tw: '正文',
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
    duplicateTopicAlert: {
        tw: '這個話題已經添加過了',
        cn: '这个话题已经添加过了',
        en: 'This topic has been added'
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
        tw: '您還未曾關注其他用戶',
        cn: '您还没有关注其他用户',
        en: 'You have not followed any member'
    },

    query: {
        tw: '搜尋',
        cn: '搜索',
        en: 'Query'
    },
    add: {
        tw: '添加',
        cn: '添加',
        en: 'Add'
    },
    uploadImage: {
        tw: '添加相片',
        cn: '添加图片',
        en: 'Add photos'
    },
    postChannel: {
        tw: '頻道',
        cn: '频道',
        en: 'Choose a channel'
    },
    choosePostChannel: {
        tw: '選擇一個頻道',
        cn: '选择一个频道',
        en: 'Choose a channel'
    },
    submit: {
        tw: '发布',
        cn: '发布',
        en: 'Publish'
    },
    savingPost: {
        tw: '正在保存文章😉請勿關閉或離開頁面',
        cn: '正在保存文章😉请勿关闭或离开页面',
        en: 'Saving post😉 Please do not close or leave this page'
    },
    initateSuccess: {
        tw: '文章保存成功😄正在製作封面相片並上傳',
        cn: '文章保存成功😄正在制作封面图片并上传',
        en: 'Post content saved😄 Creating and uploading cover image'
    },
    uploadingImages: {
        tw: '封面相片上傳成功😉正在上傳其餘的相片',
        cn: '封面图片上传成功😉正在上传其余的图片',
        en: 'Cover image uploaded😉 Uploading other images'
    },
    imagesUploadSuccess: {
        tw: '相片上傳完成😄正在跳轉到文章頁面',
        cn: '图片上传完成😄正在跳转到文章页面',
        en: 'Photo upload complete😄 Publishing your post'
    },
    imagesUploadFailed: {
        tw: '相片上傳失敗😟請嘗試重新發布文章',
        cn: '图片上传失败😟请尝试重新发布文章',
        en: 'Photo upload failed😟 Please try to re-publish your post'
    },
    postPublishSuccess: {
        tw: '文章發布成功😄正在跳轉到頁面',
        cn: '文章发布成功😄正在跳转到页面',
        en: 'Publishing succeeded😄 Redirecting'
    },
    postPublishFailed: {
        tw: '文章發布失敗😟請嘗試重新發布',
        cn: '文章发布失败😟请尝试重新发布',
        en: 'Publishing failed😟 Please try to re-publish your post'
    },
    noPermissionAlert: {
        tw: '您的賬號被限制因而不能創作新文章',
        cn: '您的账户被限制因而不能创作新文章',
        en: 'Unable to create post due to restricted member'
    },
    permissionCheckError: {
        tw: '無法獲得您的賬戶資料，請刷新頁面以重試或聯絡管理員',
        cn: '无法获得您的账户资料，请刷新页面以重试或联络管理员',
        en: 'Unable to obtain your account information, please refresh the page to try again or contact the WebMaster'
    },

};

export async function getServerSideProps(context: NextPageContext): Promise<{ props: TCreatePostPageProps; }> {
    let channelInfoDict_ss: IChannelInfoDictionary;
    try {
        const resp = await fetch(`${appDomain}/api/channel/info/dictionary`);
        if (200 !== resp.status) {
            throw new Error('Attempt to GET channel info dictionary');
        }
        channelInfoDict_ss = await resp.json();
    } catch (e: any) {
        if (e instanceof SyntaxError) {
            console.log(`Attempt to parse channel info dictionary (JSON string) from resp. ${e}`);
        } else {
            console.log(e?.msg);
        }
        return {
            props: {
                channelInfoDict_ss: {},
                redirect500: true
            }
        };
    }
    return {
        props: {
            channelInfoDict_ss,
            redirect500: false
        }
    };
}

const CreatePost = ({ channelInfoDict_ss, redirect500 }: TCreatePostPageProps) => {
    const router = useRouter();
    const { data: session, status } = useSession({ required: true, onUnauthenticated() { signIn(); } });

    React.useEffect(() => {
        if (redirect500) {
            router.push('/500');
        }
    }, [router]);

    //////////////////////////////////////// INFO ////////////////////////////////////////

    React.useEffect(() => {
        if ('authenticated' === status) {
            const authorSession: any = { ...session };
            verifyMemberStatus(authorSession?.user?.id);
            setAuthorInfoStates({ ...authorInfoStates, memberId: authorSession?.user?.id });
            restorePreferenceStatesFromCache(setPreferenceStates);
        }
    }, [status]);

    const verifyMemberStatus = async (memberId: string) => {
        const resp = await fetch(`/api/member/info/${memberId}`);
        if (200 !== resp.status) {
            setProcessStates({
                ...processStates,
                disableEditor: true,
                alertSeverity: 'error',
                alertContent: langConfigs.noPermissionAlert[preferenceStates.lang],
                displayAlert: true
            });
            return;
        }
        try {
            const { status, allowPosting } = await resp.json();
            if (!(0 < status && allowPosting)) {
                setProcessStates({
                    ...processStates,
                    disableEditor: true,
                    alertSeverity: 'error',
                    alertContent: langConfigs.noPermissionAlert[preferenceStates.lang],
                    displayAlert: true
                });
            }
        } catch (e) {
            console.error(`Attemp to parse member status obj (JSON string) from response of verifyMemberStatus request. ${e}`);
            setProcessStates({
                ...processStates,
                disableEditor: true,
                alertSeverity: 'error',
                alertContent: langConfigs.permissionCheckError[preferenceStates.lang],
                displayAlert: true
            });
        }
    };

    // States - preference ////////
    const [preferenceStates, setPreferenceStates] = React.useState<TPreferenceStates>({
        lang: defaultLang,
        mode: 'light'
    });

    //////////////////////////////////////// PROCESS ////////////////////////////////////////

    type TProcessStates = {
        disableEditor: boolean;
        alertSeverity: 'error' | 'info' | 'success';
        alertContent: string;
        displayAlert: boolean;
        displayCueHelper: boolean;
        displayNoFollowedMemberAlert: boolean;
        displayBackdrop: boolean;
        backdropOnDisplayImageUrl: string;
        disableAddButton: boolean;
        submitting: boolean;
        interruptedByImageUpload: boolean;
    };

    // States - process ////////
    const [processStates, setProcessStates] = React.useState<TProcessStates>({
        disableEditor: false,
        alertSeverity: 'info',
        alertContent: '',
        displayAlert: false,
        displayCueHelper: false,
        displayNoFollowedMemberAlert: false,
        displayBackdrop: false,
        backdropOnDisplayImageUrl: '',
        disableAddButton: false,
        submitting: false,
        interruptedByImageUpload: false
    });

    const handleCueHelperOpenAndClose = () => {
        setProcessStates({ ...processStates, displayCueHelper: !processStates.displayCueHelper });
    };

    const handleBackdropClose = () => {
        setProcessStates({ ...processStates, displayBackdrop: false, backdropOnDisplayImageUrl: '' });

    };

    //////////////////////////////////////// CHANNEL ////////////////////////////////////////

    // States - channel ////////
    const [channelInfoStates, setChannelInfoStates] = React.useState<IChannelInfoStates>({
        channelIdSequence: [],
    });

    React.useEffect(() => { updateChannelIdSequence(); }, []);

    const updateChannelIdSequence = async () => {
        const resp = await fetch(`/api/channel/id/sequence`);
        if (200 !== resp.status) {
            console.error(`Attemp to GET channel id array. Using sequence from channel info dictionary instead`);
            setChannelInfoStates({
                ...channelInfoStates,
                channelIdSequence: Object.keys(channelInfoDict_ss)
            });
        } else {
            try {
                const idArr = await resp.json();
                setChannelInfoStates({
                    ...channelInfoStates,
                    channelIdSequence: [...idArr]
                });
            } catch (e) {
                console.error(`Attemp to parese channel id array from response of updateChannelIdSequence request. ${e}`);
            }
        }
    };

    //////////////////////////////////////// POST INFO ////////////////////////////////////////

    type TPostInfoOnEdit = {
        postId: string;
        title: string;
        content: string; // require converting to paragraphsArr on submit
        cuedMemberInfoDict: { [memberId: string]: IMemberInfo; }; // require converting to cuedMemberInfoArr on submit
        channelId: string;
        topicInfoArr: ITopicInfo[];
    };

    // States - post ////////
    const [postInfoStates, setPostInfoStates] = React.useState<TPostInfoOnEdit>({
        postId: '',
        title: '',
        content: '', // require converting to paragraphsArr on submit
        cuedMemberInfoDict: {}, // require converting to cuedMemberInfoArr on submit
        channelId: '',
        topicInfoArr: []
    });

    const handlePostStatesChange = (prop: keyof TPostInfoOnEdit) => (event: React.ChangeEvent<HTMLInputElement>) => {
        setPostInfoStates({ ...postInfoStates, [prop]: event.target.value });
    };

    //////////////////////////////////////// AUTHOR INFO ////////////////////////////////////////

    type TAuthorInfo = {
        memberId: string;
        followedMemberInfoArr: IMemberInfo[];
    };

    // States - author info ////////
    const [authorInfoStates, setAuthorInfoStates] = React.useState<TAuthorInfo>({
        memberId: '',
        followedMemberInfoArr: []
    });

    React.useEffect(() => { if ('' !== authorInfoStates.memberId) { updateAuthorInfoStates(); } }, [authorInfoStates.memberId]);

    const updateAuthorInfoStates = async () => {
        // get followed member info
        const resp = await fetch(`/api/member/followedbyme/${authorInfoStates.memberId}`);
        if (200 === resp.status) {
            try {
                const memberInfoArr = await resp.json();
                setAuthorInfoStates({ ...authorInfoStates, followedMemberInfoArr: [...memberInfoArr] });
                if (0 === memberInfoArr.length) {
                    setProcessStates({ ...processStates, displayNoFollowedMemberAlert: true });
                }
            } catch (e) {
                console.error(`Attempt to parese followed member info array (JSON string) from response of updateAuthorInfoStates request. ${e}`);
            }
        } else {
            console.error(`Attempt to GET following restricted member info array.`);
        }
    };

    const handleCue = (memberInfo: IMemberInfo) => (event: React.MouseEvent<HTMLButtonElement>) => {
        if (postInfoStates.cuedMemberInfoDict.hasOwnProperty(memberInfo.memberId)) {
            const update = { ...postInfoStates.cuedMemberInfoDict };
            delete update[memberInfo.memberId];
            const content = postInfoStates.content.split(`@${memberInfo.nickname}`).join('');
            setPostInfoStates({
                ...postInfoStates,
                content: content,
                cuedMemberInfoDict: { ...update }
            });
            return;
        } else {
            setPostInfoStates({
                ...postInfoStates,
                content: `${postInfoStates.content}@${memberInfo.nickname}`,
                cuedMemberInfoDict: {
                    ...postInfoStates.cuedMemberInfoDict,
                    [memberInfo.memberId]: memberInfo
                }
            });
        }
    };

    //////////////////////////////////////// TOPIC ////////////////////////////////////////

    type TTopicHelper = {
        display: boolean;
        topic: string;
        conciseTopicComprehensiveArr: IConciseTopicComprehensive[];
        displayAlert: boolean;
        alertContent: '';
        displayNotFoundAlert: boolean;
    };

    // States - topic helper ////////
    const [topicHelperStates, setTopicHelperStates] = React.useState<TTopicHelper>({
        display: false,
        topic: '',
        conciseTopicComprehensiveArr: [],
        displayAlert: false,
        alertContent: '',
        displayNotFoundAlert: false,
    });

    const handleTopicHelperOpen = () => {
        setTopicHelperStates({ display: true, topic: '', conciseTopicComprehensiveArr: [], displayAlert: false, alertContent: '', displayNotFoundAlert: false });
    };

    const handleTopicHelperClose = () => {
        setTopicHelperStates({ ...topicHelperStates, display: false, topic: '', conciseTopicComprehensiveArr: [] });
    };

    const handleTopicInput = (event: React.ChangeEvent<HTMLInputElement>) => {
        setTopicHelperStates({ ...topicHelperStates, topic: event.target.value, displayAlert: false });
    };

    const handleTopicQuery = async () => {
        await updateTopicInfoArrayByFragment();
    };

    const updateTopicInfoArrayByFragment = async () => {
        const resp = await fetch(`/api/topic/query/by/fragment/${Buffer.from(topicHelperStates.topic).toString('base64')}`);
        if (200 === resp.status) {
            try {
                const update = await resp.json();
                if (!(Array.isArray(update) && 0 !== update.length)) {
                    setTopicHelperStates({ ...topicHelperStates, conciseTopicComprehensiveArr: [], displayNotFoundAlert: true });
                    return;
                }
                setTopicHelperStates({
                    ...topicHelperStates,
                    conciseTopicComprehensiveArr: [...update],
                    displayNotFoundAlert: false
                });
            } catch (e) {
                setTopicHelperStates({ ...topicHelperStates, conciseTopicComprehensiveArr: [], displayNotFoundAlert: true });
                console.error(`Attempt to GET concise topic comprehensive array by fragment. ${e}`);
            }
        }
    };

    const handleAddATopicManually = () => {
        if ('' === topicHelperStates.topic) {
            setTopicHelperStates({ ...topicHelperStates, displayAlert: true, alertContent: langConfigs.blankTopicAlert[preferenceStates.lang] });
            return;
        }
        const name = topicHelperStates.topic;
        const topicId = Buffer.from(name).toString('base64');

        if (postInfoStates.topicInfoArr.map(t => t.topicId).includes(topicId)) {
            setTopicHelperStates({ ...topicHelperStates, displayAlert: true, alertContent: langConfigs.duplicateTopicAlert[preferenceStates.lang] });
            return;
        }

        setTopicHelperStates({ display: false, topic: '', conciseTopicComprehensiveArr: [], displayAlert: false, alertContent: '', displayNotFoundAlert: false });
        setPostInfoStates({
            ...postInfoStates,
            topicInfoArr: [...postInfoStates.topicInfoArr, { topicId, content: name }]
        });

    };

    const handleAddATopicById = (topicId: string, name: string) => (event: React.MouseEvent<any>) => {
        if (postInfoStates.topicInfoArr.map(t => t.topicId).includes(topicId)) {
            setTopicHelperStates({ ...topicHelperStates, displayAlert: true, alertContent: langConfigs.duplicateTopicAlert[preferenceStates.lang] });
            return;
        }
        setPostInfoStates({
            ...postInfoStates,
            topicInfoArr: [...postInfoStates.topicInfoArr, { topicId, content: name }]
        });
        setTopicHelperStates({ display: false, topic: '', conciseTopicComprehensiveArr: [], displayAlert: false, alertContent: '', displayNotFoundAlert: false });
    };

    const handleDeleteTopic = (topicId: string) => (event: React.MouseEvent<any>) => {
        let update = postInfoStates.topicInfoArr.filter(t => topicId !== t.topicId);
        setPostInfoStates({
            ...postInfoStates,
            topicInfoArr: [...update]
        });
    };

    //////////////////////////////////////// IMAGES ////////////////////////////////////////

    type TImage = {
        url: string;
        isUploaded: boolean;
        fullname: string;
    };

    // States - images array ////////
    const [imagesArr, setImagesArr] = React.useState<TImage[]>([]);

    // Handle image states change
    const handleAddImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (10 < imagesArr.length) {
            return;
        }
        if (event.target.files?.length !== 0 && event.target.files !== null) {
            let newImageList: TImage[] = [];
            for (let i = 0; i < event.target.files?.length && i < 10 - imagesArr.length; i++) {
                const url = URL.createObjectURL(event.target.files[i]);
                const imageProcess = (url: string) => new Promise<TImage>((resolve, reject) => {
                    const img = new Image();
                    img.src = url;
                    img.onload = () => {
                        resolve({ url, isUploaded: false, fullname: '' });
                    };
                    img.onerror = (e) => {
                        reject(e);
                    };
                });
                newImageList.push(await imageProcess(url) as TImage);
            }
            setImagesArr([...imagesArr, ...newImageList]);
        }
        event.target.files = null;
    };

    const handleClick = (imageUrl: string) => () => {
        if (processStates.submitting) {
            return;
        }
        setProcessStates({ ...processStates, displayBackdrop: true, backdropOnDisplayImageUrl: imageUrl });
    };

    const handleRemove = (imageIndex: number) => (event: React.MouseEvent) => {
        event.stopPropagation();
        if (!processStates.submitting) {
            const imgList = [...imagesArr];
            imgList.splice(imageIndex, 1);
            setImagesArr(imgList);
        }
    };

    const handleDragStart = () => {
        setProcessStates({ ...processStates, disableAddButton: true });
    };

    const handleDragEnd = (result: any) => {
        setProcessStates({ ...processStates, disableAddButton: false });
        const list = Array.from(imagesArr);
        const [movedImage] = list.splice(result?.source?.index, 1);
        list.splice(result?.destination.index, 0, movedImage);
        setImagesArr(list);
    };

    //////////////////////////////////////// SUBMIT ////////////////////////////////////////

    type UploadStates = {
        // imageUrlOnUpload: string;
        uploadPrecent: number;
        currentIndex: number;
    };

    // States - upload process ////////
    const [uploadStates, setUploadStates] = React.useState<UploadStates>({
        uploadPrecent: 0,
        currentIndex: -1,
    });

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        // #1 Check requied fileds
        if ('' === postInfoStates.title || '' === postInfoStates.channelId) {
            return;
        }

        setProcessStates({
            ...processStates,
            alertSeverity: 'info',
            alertContent: langConfigs.savingPost[preferenceStates.lang],
            displayAlert: true,
            displayCueHelper: false,
            submitting: true
        });

        // (Only for interrupted by image upload)
        let postId = postInfoStates.postId;

        // #2 Save post info (initate)
        if (!processStates.interruptedByImageUpload) {
            type TPostInfoOnInitiate = {
                title: string;
                paragraphsArr: string[];
                cuedMemberInfoArr: IMemberInfo[];
                channelId: string;
                topicInfoArr: ITopicInfo[];
                hasImages: boolean;
            };

            // #2.1 Initate (upload post info except for images)
            const post: TPostInfoOnInitiate = {
                title: postInfoStates.title,
                paragraphsArr: contentToParagraphsArray(postInfoStates.content),
                cuedMemberInfoArr: cuedMemberInfoDictionaryToArray(postInfoStates.cuedMemberInfoDict),
                channelId: postInfoStates.channelId,
                topicInfoArr: postInfoStates.topicInfoArr,
                hasImages: imagesArr.length !== 0
            };

            const respInit = await fetch('/api/create/initiate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(post)
            });

            if (200 !== respInit.status) {
                setProcessStates({
                    ...processStates,
                    alertSeverity: 'error',
                    alertContent: langConfigs.postPublishFailed[preferenceStates.lang],
                    displayAlert: true
                });
                return;
            }

            // #2.2 retrieve post id
            postId = await respInit.text();

            // Case [No images], display 'save success' alert
            if (imagesArr.length === 0) {
                setProcessStates({
                    ...processStates,
                    alertSeverity: 'success',
                    alertContent: langConfigs.postPublishSuccess[preferenceStates.lang],
                    displayAlert: true
                });

                // Jump
                setTimeout(() => {
                    router.push(`/post/${postId}`);
                }, 800);
                return;
            }

            // Case [Has images], save post id
            setPostInfoStates({
                ...postInfoStates,
                postId
            });

            setProcessStates({
                ...processStates,
                alertSeverity: 'info',
                alertContent: langConfigs.initateSuccess[preferenceStates.lang],
                displayAlert: true,
                submitting: true
            });
        }

        // #3 Upload images (optional)
        const uploadQueue: TImage[] = [...imagesArr];
        setUploadStates({ uploadPrecent: 0, currentIndex: -1 });

        // #3.1 Request for an upload token
        const resptkn = await fetch(`/api/upload/image/${postId}/request`);
        if (200 !== resptkn.status) {
            console.log(`Attempt to request for upload token.`);
            setProcessStates({
                ...processStates,
                alertSeverity: 'error',
                alertContent: langConfigs.imagesUploadFailed[preferenceStates.lang],
                displayAlert: true,
                interruptedByImageUpload: true
            });
            return;
        }
        let tkn = await resptkn.text();

        // #3.1 Upload cover image
        console.log(`Uploading cover image`);
        try {
            // Get the 1st image
            const img = uploadQueue[0];

            // Create form data
            let formData = new FormData();
            const config = {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (event: any) => {
                    console.log(`Cover image upload progress:`, Math.round((event.loaded * 100) / event.total));
                }
            };

            const imgRp = await fetch(img.url);
            const imgbuf = Buffer.concat([new Uint8Array(await imgRp.arrayBuffer())]);
            const Jimp = (window as any).Jimp;
            const imgf = await Jimp.read(imgbuf);

            // Verify image size and handle oversized image
            let bl = imgbuf.byteLength;
            while (bl > 102400) {
                imgf.scale(0.5);
                const b = await imgf.getBufferAsync(Jimp.MIME_JPEG);
                bl = b.byteLength;
            };

            // Get processed image in PNG
            const bbf = await imgf.getBufferAsync(Jimp.MIME_JPEG);

            // Append image data
            formData.append('image', new Blob([new Uint8Array(bbf)], { type: Jimp.MIME_JPEG }));
            const resp = await axios.post(`/api/upload/cover/${postId}?requestInfo=${tkn}`, formData, config);
            tkn = resp.data?.updatedRequestInfoToken;

        } catch (e: any) {
            console.log(`Attempt to upload cover image. ${e}`);
            setProcessStates({
                ...processStates,
                alertSeverity: 'error',
                alertContent: langConfigs.imagesUploadFailed[preferenceStates.lang],
                displayAlert: true,
                interruptedByImageUpload: true
            });
            return;
        }

        // Display uploading image alert
        setProcessStates({
            ...processStates,
            alertSeverity: 'info',
            alertContent: langConfigs.uploadingImages[preferenceStates.lang],
            displayAlert: true,
            submitting: true
        });

        // #3.2 Upload images 1 by 1
        for (let i = 0; i < uploadQueue.length; i++) {
            // Continue if uploaded
            if (uploadQueue[i].isUploaded) {
                continue;
            }

            // Prepare img for uploading
            const img = uploadQueue[i];
            console.log(`Uploading image: ${img.url}`);

            if (img !== null && img.url) {

                // Create form data
                let formData = new FormData();
                const config = {
                    headers: { 'Content-Type': 'multipart/form-data' },
                    onUploadProgress: (event: any) => {
                        setUploadStates({
                            ...uploadStates,
                            uploadPrecent: Math.round((event.loaded * 100) / event.total),
                            currentIndex: i,
                        });
                        console.log(`Image upload progress:`, Math.round((event.loaded * 100) / event.total));
                    }
                };

                // Prepare image data
                try {
                    const imgRp = await fetch(img.url);
                    const imgbuf = Buffer.concat([new Uint8Array(await imgRp.arrayBuffer())]);
                    const Jimp = (window as any).Jimp;
                    const imgf = await Jimp.read(imgbuf);

                    // Get image mime info
                    let mme = imgf.getMIME();

                    // Shirnk the image size
                    if (960 < imgf.bitmap.width) {
                        imgf.resize(960, Jimp.AUTO);
                    }

                    if (1200 < imgf.bitmap.width) {
                        imgf.resize(Jimp.AUTO, 1600);
                    }

                    // Image quality control
                    imgf.quality(768000 > imgbuf.byteLength ? 95 : 85); // threshold 750 KB

                    const bbf = await imgf.getBufferAsync(mme);
                    if (!['image/png', 'image/jpeg'].includes(mme)) {
                        mme = Jimp.MIME_JPEG;
                    }

                    // Append image data
                    formData.append('image', new Blob([new Uint8Array(bbf)], { type: mme }));
                    const uploadResp = await axios.post(`/api/upload/image/${postId}?requestInfo=${tkn}`, formData, config);

                    const { imageFullname, updatedRequestInfoToken } = uploadResp.data;

                    // Renew upload image token
                    tkn = updatedRequestInfoToken;

                    // Update the fullname (property) of the corresponding TImage object
                    uploadQueue[i].isUploaded = true;
                    uploadQueue[i].fullname = imageFullname;

                } catch (e) {
                    console.error(`Attempt to upload the ${i} image of the queue, url: ${img.url}. ${e}`);
                    // Save the current image upload progress
                    setImagesArr([...uploadQueue]);
                    setProcessStates({
                        ...processStates,
                        alertSeverity: 'error',
                        alertContent: langConfigs.imagesUploadFailed[preferenceStates.lang],
                        displayAlert: true,
                        interruptedByImageUpload: true
                    });
                    return;
                }
            }
        }

        // #4 Update image fullnames array
        const respUpdate = await fetch('/api/create/updateimagefullnamesarray', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                postId,
                imageFullnamesArr: uploadQueue.map(img => img.fullname)
            })
        });

        if (200 !== respUpdate.status) {
            setProcessStates({
                ...processStates,
                alertSeverity: 'error',
                alertContent: langConfigs.postPublishFailed[preferenceStates.lang],
                displayAlert: true,
                interruptedByImageUpload: true,
                submitting: false
            });
        } else {
            setProcessStates({
                ...processStates,
                alertSeverity: 'success',
                alertContent: langConfigs.imagesUploadSuccess[preferenceStates.lang],
                displayAlert: true,
                submitting: true
            });
            // Jump
            setTimeout(() => {
                router.push(`/post/${postId}`);
            }, 800);
            return;
        }
    };
    //////////////////////////////////////// BEHAVIOURS ////////////////////////////////////////

    const handleProceedToFollowedMember = () => {
        router.push(`/follow`);
    };

    const handleProceedToMessage = () => {
        router.push(`/message`);
    };

    const handleProceedToMemberPage = () => {
        router.push(`/me/${authorInfoStates.memberId}`);
    };

    const handleProceedToSettingsPage = () => {
        router.push(`/settings`);
    };

    const handleProceedToCreatePage = () => {
        router.push(`/create`);
    };
    //////////////////////////////////////// THEME ////////////////////////////////////////
    const colorMode = React.useContext(ColorModeContext);

    const handleColorModeSelect = () => {
        const preferredColorMode = colorMode.mode === 'dark' ? 'light' : 'dark';
        colorMode.setMode(preferredColorMode);
        document.cookie = `PreferredColorMode=${preferredColorMode}`;
    };

    const theme = useTheme();

    return (
        <>
            <Navbar lang={preferenceStates.lang} />
            <Grid container>
                {/* left */}
                <Grid item xs={0} sm={0} md={3} lg={3} xl={4} >
                    <Box sx={{ display: { xs: 'none', sm: 'none', md: 'flex' }, flexDirection: 'row-reverse', position: 'sticky', top: 0, left: 0, }}>
                        <SideMenu lang={preferenceStates.lang} />
                    </Box>
                </Grid>

                {/* middle */}
                <Grid item xs={12} sm={12} md={9} lg={6} xl={4} >
                    {/* post editor */}
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <Box component={'form'} sx={{ maxWidth: 600, flexGrow: 1, padding: 2, borderRadius: 1, boxShadow: { xs: 0, sm: 1 }, backgroundColor: 'background' }} onSubmit={handleSubmit}>
                            <Stack spacing={2}>
                                <Typography>{langConfigs.title[preferenceStates.lang]}</Typography>

                                {/* (T) title */}
                                <TextField
                                    // id='standard-basic'
                                    variant='standard'
                                    multiline
                                    placeholder={langConfigs.titlePlaceholder[preferenceStates.lang]}
                                    value={postInfoStates.title}
                                    onChange={handlePostStatesChange('title')}
                                    required
                                    disabled={processStates.submitting || processStates.disableEditor}
                                />

                                {/* (P) content */}
                                <TextField
                                    // id='outlined-basic'
                                    variant='outlined'
                                    rows={5}
                                    multiline
                                    fullWidth
                                    placeholder={langConfigs.contentPlaceholder[preferenceStates.lang]}
                                    value={postInfoStates.content}
                                    onChange={handlePostStatesChange('content')}
                                    disabled={processStates.submitting || processStates.disableEditor}
                                />

                                {/* (#) topic info array */}
                                {0 !== postInfoStates.topicInfoArr.length && <Grid container columnSpacing={1} rowSpacing={1}>
                                    {postInfoStates.topicInfoArr.map(t => <Grid item key={getRandomHexStr()} ><Chip label={t.content} onDelete={handleDeleteTopic(t.topicId)} /></Grid>)}
                                </Grid>}

                                {/* cue (@) & topic (#) button */}
                                <Stack direction={'row'} spacing={1}>
                                    <IconButton onClick={handleCueHelperOpenAndClose} disabled={processStates.submitting || processStates.disableEditor}><AlternateEmailIcon /></IconButton>
                                    <IconButton onClick={handleTopicHelperOpen} disabled={processStates.submitting || processStates.disableEditor}><TagIcon /></IconButton>
                                </Stack>

                                {/* no followed member alert */}
                                <Box mt={2} sx={{ display: processStates.displayCueHelper && processStates.displayNoFollowedMemberAlert ? 'flex' : 'none', justifyContent: 'center' }}>
                                    <Typography color={'text.disabled'}>{langConfigs.noFollowedMember[preferenceStates.lang]}</Typography>
                                </Box>

                                {/* followed member array */}
                                <Box mt={1} sx={{ display: processStates.displayCueHelper ? 'block' : 'none' }}>
                                    <Stack direction={'row'} sx={{ padding: 1, overflow: 'auto', }} >
                                        {authorInfoStates.followedMemberInfoArr.map(m => {
                                            return (
                                                <Button key={getRandomHexStr()} size={'small'} sx={{ minWidth: 72, minHeight: 86 }} onClick={handleCue(m)}>
                                                    <Stack sx={{}}>
                                                        <Grid container>
                                                            <Grid item flexGrow={1}></Grid>
                                                            <Grid item>
                                                                <Avatar src={provideAvatarImageUrl(m.memberId, imageDomain)} sx={{ width: 34, height: 34, bgcolor: 'grey' }}>{m.nickname?.charAt(0).toUpperCase()}</Avatar>
                                                            </Grid>
                                                            <Grid item flexGrow={1}></Grid>
                                                        </Grid>
                                                        <Typography mt={1} sx={{ minHeight: 33, fontSize: 11, color: postInfoStates.cuedMemberInfoDict.hasOwnProperty(m.memberId) ? 'inherit' : 'text.secondary' }}>{getNicknameBrief(m.nickname)}</Typography>
                                                    </Stack>
                                                </Button>
                                            );
                                        })}
                                    </Stack>
                                </Box>

                                {/* image upload */}
                                <Typography>{langConfigs.uploadImage[preferenceStates.lang]}</Typography>
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
                                                    {imagesArr.length !== 0 && (imagesArr.map((img, index) => {
                                                        return (
                                                            <Draggable key={img.url} draggableId={img.url} index={index}>
                                                                {(provided) =>
                                                                    <Grid item {...provided.draggableProps} {...provided.dragHandleProps} ref={provided.innerRef}>
                                                                        {/* image wrapper */}
                                                                        <Box
                                                                            sx={{
                                                                                width: 100,
                                                                                height: 100,
                                                                                borderRadius: '10px',
                                                                                backgroundSize: 'cover',
                                                                                backgroundPosition: 'center',
                                                                                backgroundImage: `url(${img.url})`,
                                                                                backdropFilter: 'blur(14px)',
                                                                            }}
                                                                            onClick={handleClick(img.url)}
                                                                        >
                                                                            {/* remove icon */}
                                                                            <Box sx={{ display: processStates.submitting ? 'none' : 'flex' }}>
                                                                                <IconButton
                                                                                    sx={{
                                                                                        backgroundColor: 'white',
                                                                                        '&:hover': { backgroundColor: 'white' },
                                                                                    }}
                                                                                    size='small'
                                                                                    color='primary'
                                                                                    onClick={handleRemove(index)}
                                                                                    disabled={processStates.submitting || processStates.disableEditor}
                                                                                >
                                                                                    <HighlightOffIcon />
                                                                                </IconButton>
                                                                            </Box>

                                                                            {/* progress circular indeterminate */}
                                                                            <Box sx={{ display: processStates.submitting && index > uploadStates.currentIndex ? 'flex' : 'none', paddingTop: 3.8, paddingLeft: 3.8 }}>
                                                                                <CircularProgress />
                                                                            </Box>

                                                                            {/* progress complete sign */}
                                                                            <Box sx={{ display: processStates.submitting && index <= uploadStates.currentIndex ? 'flex' : 'none', paddingTop: 3, paddingLeft: 3 }}>
                                                                                <Box sx={{ width: '52px', height: '52px', backgroundColor: 'white', borderRadius: '50%', padding: 1 }}>
                                                                                    <CheckIcon fontSize='large' color='success' />
                                                                                </Box>
                                                                            </Box>
                                                                        </Box>
                                                                    </Grid>
                                                                }
                                                            </Draggable>
                                                        );
                                                    }))}

                                                    {/* the 'add' button */}
                                                    {!processStates.disableAddButton && !processStates.submitting && 10 > imagesArr.length && <IconButton
                                                        sx={{
                                                            width: 100,
                                                            height: 100,
                                                            borderRadius: '10px',
                                                            border: 1,
                                                            borderColor: 'grey.300',
                                                        }}
                                                        aria-label='upload picture' component='label'
                                                        disabled={processStates.submitting || processStates.disableEditor}
                                                    >
                                                        <Input sx={{ display: 'none' }} inputProps={{ accept: 'image/*', type: 'file', multiple: true }} onChange={handleAddImage} disabled={processStates.submitting} />
                                                        <AddIcon fontSize='large' />
                                                    </IconButton>}
                                                    {provided.placeholder}
                                                </Stack>
                                            }
                                        </Droppable>
                                    </DragDropContext >
                                </Box>

                                {/* channel */}
                                <Typography>{langConfigs.choosePostChannel[preferenceStates.lang]}</Typography>
                                <FormControl fullWidth disabled={processStates.submitting} required>
                                    <InputLabel id='channel'>{langConfigs.postChannel[preferenceStates.lang]}</InputLabel>
                                    <Select
                                        labelId='channel'
                                        value={postInfoStates.channelId}
                                        label={langConfigs.postChannel[preferenceStates.lang]}
                                        onChange={(event: SelectChangeEvent) => { setPostInfoStates({ ...postInfoStates, channelId: event.target.value as string }); }}
                                        SelectDisplayProps={{ style: { display: 'flex', alignItems: 'center' } }}
                                        MenuProps={{ style: { maxHeight: 240 } }}
                                        disabled={processStates.submitting || processStates.disableEditor}
                                    >
                                        {channelInfoStates.channelIdSequence.map(channelId => {
                                            const channel = channelInfoDict_ss[channelId];
                                            return (
                                                <MenuItem value={channel.channelId} key={channel.channelId} >
                                                    <ListItemIcon sx={{ minWidth: '36px' }}>
                                                        <SvgIcon>
                                                            <path d={channel.svgIconPath} />
                                                        </SvgIcon>
                                                    </ListItemIcon>
                                                    <ListItemText >
                                                        <Typography sx={{ marginTop: '1px' }}>
                                                            {channel.name[preferenceStates.lang]}
                                                        </Typography>
                                                    </ListItemText>
                                                </MenuItem>
                                            );
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
                                    <Button type={'submit'} fullWidth variant='contained' disabled={processStates.submitting || processStates.disableEditor}>
                                        <Typography sx={{ display: !processStates.submitting ? 'block' : 'none' }}>
                                            {langConfigs.submit[preferenceStates.lang]}
                                        </Typography>
                                        <CircularProgress sx={{ color: 'white', display: processStates.submitting ? 'block' : 'none' }} />
                                    </Button>
                                </Box>
                            </Stack>
                            <Copyright sx={{ mt: 8 }} lang={preferenceStates.lang} />
                            <Terms sx={{ mb: 4 }} lang={preferenceStates.lang} />
                        </Box>
                    </Box>
                </Grid>

                {/* right */}
                <Grid item xs={0} sm={0} md={0} lg={3} xl={4}>
                    <Box sx={{ display: { xs: 'none', sm: 'none', md: 'block' } }}>
                        <Stack spacing={2} sx={{ width: 300, paddingX: 3, paddingTop: 18, }} >
                            {/* copyright */}
                            <Box>
                                <Copyright lang={preferenceStates.lang} />
                                <Guidelines lang={preferenceStates.lang} />
                                <Terms lang={preferenceStates.lang} />
                            </Box>

                            {/* theme mode switch */}
                            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                <IconButton onClick={handleColorModeSelect}>
                                    {theme.palette.mode === 'dark' ? <Brightness4Icon /> : <Brightness7Icon />}
                                </IconButton>
                            </Box>
                        </Stack>
                    </Box>
                </Grid>
            </Grid>



            {/* topic helper */}
            <Modal
                open={topicHelperStates.display}
                onClose={handleTopicHelperClose}
                aria-labelledby='modal-modal-title'
                aria-describedby='modal-modal-description'
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
                    <Typography>{langConfigs.addTopic[preferenceStates.lang]}</Typography>
                    <Box mt={1} sx={{ display: topicHelperStates.displayAlert ? 'block' : 'none' }}>
                        <Alert severity='error'>{topicHelperStates.alertContent}</Alert>
                    </Box>

                    {/* 'add' button */}
                    <FormControl fullWidth >
                        <Grid container columnSpacing={1}>
                            <Grid item >
                                <TextField
                                    variant={'standard'}
                                    multiline
                                    placeholder={langConfigs.enterOrQueryATopic[preferenceStates.lang]}
                                    value={topicHelperStates.topic}
                                    onChange={handleTopicInput}
                                />
                            </Grid>
                            <Grid item flexGrow={1}>
                            </Grid>
                            {'' !== topicHelperStates.topic && <Grid item>
                                <Button variant='contained' onClick={async () => { await handleTopicQuery(); }}>{langConfigs.query[preferenceStates.lang]}</Button>
                            </Grid>}
                            <Grid item>
                                <Button variant='contained' onClick={handleAddATopicManually}>{langConfigs.add[preferenceStates.lang]}</Button>
                            </Grid>
                        </Grid>

                        {/* existed topic list */}
                        <Box mt={2}>
                            {topicHelperStates.displayNotFoundAlert && <Box pt={3}>
                                <Typography color={'text.disabled'} align={'center'}>{langConfigs.relatedTopicNotFound[preferenceStates.lang]}</Typography>
                            </Box>}
                            <MenuList sx={{ display: 'block' }}>
                                {0 !== topicHelperStates.conciseTopicComprehensiveArr.length && topicHelperStates.conciseTopicComprehensiveArr.map(topic => {
                                    return (
                                        <MenuItem key={topic.topicId} sx={{ paddingLeft: 2 }} onClick={handleAddATopicById(topic.topicId, topic.content)}>
                                            <ListItemText>#{Buffer.from(topic.topicId, 'base64').toString()} {topic.totalPostCount}{langConfigs.posts[preferenceStates.lang]}</ListItemText>
                                        </MenuItem>
                                    );
                                })}
                            </MenuList>
                        </Box>
                    </FormControl>
                </Stack>
            </Modal>

            {/* backdrop - full screen image viewer */}
            <Backdrop
                sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
                open={processStates.displayBackdrop}
                onClick={handleBackdropClose}
            >
                <Box>
                    {processStates.backdropOnDisplayImageUrl && <Box component={'img'} src={processStates.backdropOnDisplayImageUrl} maxWidth={window.innerWidth}></Box>}
                </Box>
            </Backdrop>
        </>
    );
};

export default CreatePost;