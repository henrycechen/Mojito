import * as React from 'react';
import { NextPageContext } from 'next';
import { useRouter } from 'next/router';
import { signIn, useSession } from 'next-auth/react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';

import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';

import IconButton from '@mui/material/IconButton';
import AddIcon from '@mui/icons-material/Add';
import SvgIcon from '@mui/material/SvgIcon';
import AlternateEmailIcon from '@mui/icons-material/AlternateEmail';
import TagIcon from '@mui/icons-material/Tag';
import ListItemIcon from '@mui/material/ListItemIcon';
import CheckIcon from '@mui/icons-material/Check';

import Alert from '@mui/material/Alert';
import Input from '@mui/material/Input';
import Modal from '@mui/material/Modal';
import ListItemText from '@mui/material/ListItemText';
import MenuList from '@mui/material/MenuList/MenuList';
import CircularProgress from '@mui/material/CircularProgress';
import Backdrop from '@mui/material/Backdrop';


import { DragDropContext } from 'react-beautiful-dnd';
import { Droppable, Draggable } from 'react-beautiful-dnd';

import axios from 'axios';
// import Jimp from 'jimp';
import 'jimp';
let Jimp: any;

import { IConciseTopicComprehensive, ITopicInfo } from '../../../lib/interfaces/topic';
import { LangConfigs, TPreferenceStates } from '../../../lib/types';
import { IMemberInfo } from '../../../lib/interfaces/member';
import { IChannelInfoStates, IChannelInfoDictionary } from '../../../lib/interfaces/channel';
import { getNicknameBrief, provideAvatarImageUrl, } from '../../../lib/utils/for/member';
import { createId, getRandomHexStr } from '../../../lib/utils/create';
import { restoreFromLocalStorage } from '../../../lib/utils/general';
import { contentToParagraphsArray, cuedMemberInfoDictionaryToArray, fakeRestrictedPostComprehensive, provideImageUrl } from '../../../lib/utils/for/post';

import Navbar from '../../../ui/Navbar';
import Copyright from '../../../ui/Copyright';
import Terms from '../../../ui/Terms';
import { IPostComprehensive, IRestrictedPostComprehensive } from '../../../lib/interfaces/post';
import { TextButton } from '../../../ui/Styled';


const storageName0 = 'PreferenceStates';
const restorePreferenceStatesFromCache = restoreFromLocalStorage(storageName0);

type TCreatePostPageProps = {
    restrictedPostComprehensive_ss: IRestrictedPostComprehensive;
    channelInfoDict_ss: IChannelInfoDictionary;
    redirect404: boolean;
    redirect500: boolean;
};

const domain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? '';
const defaultLang = process.env.NEXT_PUBLIC_APP_LANG ?? 'tw';
const langConfigs: LangConfigs = {
    title: {
        tw: '编辑文章',
        cn: '编辑文章',
        en: 'Edit post'
    },
    delete: {
        tw: '刪除文章',
        cn: '删除文章',
        en: 'Delete post'
    },
    deletePost: {
        tw: '您確認要刪除本文嗎？',
        cn: '您确认要删除本文吗？',
        en: 'Are you sure you want to delete this post?'
    },
    confirmDelete: {
        tw: '確認',
        cn: '确认',
        en: 'Confirm'
    },
    cancelDelete: {
        tw: '取消',
        cn: '取消',
        en: 'Cancel'
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
    posts: {
        tw: '篇文章',
        cn: '篇文章',
        en: 'Posts'
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
        tw: '封面相片上傳成功😉正在上傳文章相片',
        cn: '封面图片上传成功😉正在上传文章图片',
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
    noPermissionAlert0: {
        tw: '您的賬號被限制因而不能编辑新文章',
        cn: '您的账户被限制因而不能编辑新文章',
        en: 'Unable to edit post due to restricted member'
    },
    noPermissionAlert1: {
        tw: '这篇文章被限制因而不能被编辑',
        cn: '这篇文章被限制因而不能被编辑',
        en: 'Unable to edit post due to restricted status'
    },

};

export async function getServerSideProps(context: NextPageContext): Promise<{ props: TCreatePostPageProps; }> {
    let restrictedPostComprehensive_ss: IRestrictedPostComprehensive;
    let channelInfoDict_ss: IChannelInfoDictionary;
    try {
        const { postId } = context.query;
        //// GET post comprehensive ////
        const resp0 = await fetch(`${domain}/api/post/id/${postId}`);
        if (200 !== resp0.status) {
            if (404 === resp0.status) {
                return {
                    props: {
                        restrictedPostComprehensive_ss: fakeRestrictedPostComprehensive(),
                        channelInfoDict_ss: {},
                        redirect404: true,
                        redirect500: false
                    }
                };
            }
            throw new Error('Attempt to GET post comprehensive');
        }
        restrictedPostComprehensive_ss = await resp0.json();
        //// GET channel info ////
        const resp1 = await fetch(`${domain}/api/channel/info/dictionary`);
        if (200 !== resp1.status) {
            throw new Error('Attempt to GET channel info dictionary');
        }
        channelInfoDict_ss = await resp1.json();
    } catch (e: any) {
        if (e instanceof SyntaxError) {
            console.log(`Attempt to parse channel info dictionary (JSON string) from resp. ${e}`);
        } else {
            console.log(e?.msg);
        }
        return {
            props: {
                restrictedPostComprehensive_ss: fakeRestrictedPostComprehensive(),
                channelInfoDict_ss: {},
                redirect404: false,
                redirect500: true
            }
        };
    }
    return {
        props: {
            restrictedPostComprehensive_ss,
            channelInfoDict_ss,
            redirect404: false,
            redirect500: false
        }
    };
}

const CreatePost = ({ restrictedPostComprehensive_ss, channelInfoDict_ss, redirect404, redirect500 }: TCreatePostPageProps) => {
    const router = useRouter();
    const { data: session, status } = useSession({ required: true, onUnauthenticated() { signIn(); } });

    React.useEffect(() => {
        if (redirect404) {
            router.push('/404');
        }
        if (redirect500) {
            router.push('/500');
        }

        Jimp = (window as any).Jimp;

    }, [router]);

    //////// INFO - author ////////
    React.useEffect(() => {
        if ('authenticated' === status) {
            const authorSession: any = { ...session };
            verifyPermissions(authorSession?.user?.id ?? '');
            setAuthorInfoStates({ ...authorInfoStates, memberId: authorSession?.user?.id ?? '' });
            restorePreferenceStatesFromCache(setPreferenceStates);
        }
    }, [status]);

    const verifyPermissions = async (memberId: string) => {
        //// Verify post status ////
        const { allowEditing } = restrictedPostComprehensive_ss;
        if (!allowEditing) {
            setProcessStates({
                ...processStates,
                disableEditor: true,
                alertSeverity: 'error',
                alertContent: langConfigs.noPermissionAlert1[preferenceStates.lang],
                displayAlert: true
            });
            return;
        }
        //// Verify member status ////
        const resp = await fetch(`/api/member/info/${memberId}`);
        if (200 !== resp.status) {
            setProcessStates({
                ...processStates,
                disableEditor: true,
                alertSeverity: 'error',
                alertContent: langConfigs.noPermissionAlert0[preferenceStates.lang],
                displayAlert: true
            });
            return;
        }
        const { status, allowPosting } = await resp.json();
        if (!(0 < status && allowPosting)) {
            setProcessStates({
                ...processStates,
                disableEditor: true,
                alertSeverity: 'error',
                alertContent: langConfigs.noPermissionAlert0[preferenceStates.lang],
                displayAlert: true
            });
        }
    };

    //////// STATES - preference ////////
    const [preferenceStates, setPreferenceStates] = React.useState<TPreferenceStates>({
        lang: defaultLang,
        mode: 'light'
    });

    //////////////////////////////////////// PROCESS ////////////////////////////////////////

    type ProcessStates = {
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

    //////// STATES - process ////////
    const [processStates, setProcessStates] = React.useState<ProcessStates>({
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

    //////// STATES - channel ////////
    const [channelInfoStates, setChannelInfoStates] = React.useState<IChannelInfoStates>({
        channelIdSequence: [],
    });

    React.useEffect(() => { updateChannelIdSequence(); }, []);

    const updateChannelIdSequence = async () => {
        const resp = await fetch(`/api/channel/id/sequence`);
        if (200 !== resp.status) {
            console.log(`Attemp to GET channel id array. Using sequence from channel info dictionary instead`);
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
                console.log(`Attemp to parese channel id array. ${e}`);
            }
        }
    };

    //////////////////////////////////////// POST INFO ////////////////////////////////////////

    type TPostInfoOnEdit = {
        postId: string;
        title: string;
        imageUrlsArr: string[];
        content: string; // require converting to paragraphsArr on submit
        cuedMemberInfoDict: { [memberId: string]: IMemberInfo; }; // require converting to cuedMemberInfoArr on submit
        channelId: string;
        topicInfoArr: ITopicInfo[];
    };

    //////// STATE - post ////////
    const [postInfoStates, setPostInfoStates] = React.useState<TPostInfoOnEdit>({
        postId: '',
        title: '',
        imageUrlsArr: [],
        content: '', // require converting to paragraphsArr on submit
        cuedMemberInfoDict: {}, // require converting to cuedMemberInfoArr on submit
        channelId: '',
        topicInfoArr: []
    });

    const handlePostStatesChange = (prop: keyof TPostInfoOnEdit) => (event: React.ChangeEvent<HTMLInputElement>) => {
        setPostInfoStates({ ...postInfoStates, [prop]: event.target.value });
    };

    React.useEffect(() => {
        const dict: { [memberId: string]: IMemberInfo; } = {};
        if (0 !== restrictedPostComprehensive_ss.cuedMemberInfoArr.length) {
            restrictedPostComprehensive_ss.cuedMemberInfoArr.forEach(m => {
                dict[m.memberId] = { ...m };
            });
        }
        setPostInfoStates({
            ...postInfoStates,
            postId: restrictedPostComprehensive_ss.postId,
            title: restrictedPostComprehensive_ss.title,
            content: restrictedPostComprehensive_ss.paragraphsArr.join(''),
            cuedMemberInfoDict: dict,
            channelId: restrictedPostComprehensive_ss.channelId,
            topicInfoArr: [...restrictedPostComprehensive_ss.topicInfoArr]
        });
    }, []);

    //////////////////////////////////////// MEMBER INFO ////////////////////////////////////////

    type TAuthorInfo = {
        memberId: string,
        followedMemberInfoArr: IMemberInfo[];
    };

    //////// STATE - author info ////////
    const [authorInfoStates, setAuthorInfoStates] = React.useState<TAuthorInfo>({
        memberId: '',
        followedMemberInfoArr: []
    });

    React.useEffect(() => { if ('' === authorInfoStates.memberId) { updateAuthorInfoStates(); } }, [authorInfoStates.memberId]);

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

    //////// STATE - topic helper ////////
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
                console.log(`Attempt to GET concise topic comprehensive array by fragment. ${e}`);
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
        fullname: string;
        isUploaded: boolean;
    };

    //////// STATES - images array ////////
    const [imagesArr, setImagesArr] = React.useState<TImage[]>([]);

    React.useEffect(() => {
        if (0 !== restrictedPostComprehensive_ss.imageFullnamesArr.length) {
            setImagesArr(restrictedPostComprehensive_ss.imageFullnamesArr.map(fullname => { return { url: provideImageUrl(fullname, domain), fullname, isUploaded: true }; }));
        }
    }, []);

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
                        resolve({
                            url,
                            fullname: '',
                            isUploaded: false
                        });
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

    //////// STATES - upload process ////////
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

            // #2.1 Update (upload post info except for images)
            const post: TPostInfoOnInitiate = {
                title: postInfoStates.title,
                paragraphsArr: contentToParagraphsArray(postInfoStates.content),
                cuedMemberInfoArr: cuedMemberInfoDictionaryToArray(postInfoStates.cuedMemberInfoDict),
                channelId: postInfoStates.channelId,
                topicInfoArr: postInfoStates.topicInfoArr,
                hasImages: imagesArr.length !== 0
            };

            const respInit = await fetch(`/api/creation/id/${postId}`, {
                method: 'PUT',
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

            if (imagesArr.length === 0) {
                // Case [No images], display 'save success' alert
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
        const resptkn = await fetch(`/api/image/request/${postId}`);
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
            const resp = await axios.post(`/api/coverimage/upload/${postId}?requestInfo=${tkn}`, formData, config);
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

        setProcessStates({
            ...processStates,
            alertSeverity: 'info',
            alertContent: langConfigs.uploadingImages[preferenceStates.lang],
            displayAlert: true,
            submitting: true
        });

        // #3.2 Upload images one by one
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
                    const imgf = await Jimp.read(imgbuf);

                    // Get image mime info
                    let mme = imgf.getMIME();

                    // Verify image size and handle oversized image
                    let bl = imgbuf.byteLength;
                    do {
                        imgf.scale(0.5);
                        const b = await imgf.getBufferAsync(mme);
                        bl = b.byteLength;
                    } while (bl > 1048576);


                    const bbf = await imgf.getBufferAsync(mme);
                    if (!['image/png', 'image/jpeg'].includes(mme)) {
                        mme = Jimp.MIME_JPEG;
                    }

                    // Append image data
                    formData.append('image', new Blob([new Uint8Array(bbf)], { type: mme }));
                    const uploadResp = await axios.post(`/api/image/upload/${postId}?requestInfo=${tkn}`, formData, config);

                    const { imageFullname, updatedRequestInfoToken } = uploadResp.data;

                    // Renew upload image token
                    tkn = updatedRequestInfoToken;

                    // Update the fullname (property) of the corresponding TImage object
                    uploadQueue[i].isUploaded = true;
                    uploadQueue[i].fullname = imageFullname;

                } catch (e) {
                    console.log(`Attempt to upload the ${i} image of the queue, url: ${img.url}. ${e}`);
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
        const respUpdate = await fetch(`/api/creation/id/${postId}/updateimagefullnamesarray`, {
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

    //////////////////////////////////////// DELETE ////////////////////////////////////////
    type TDeleteSaver = {
        display: boolean;
    };

    //////// STATE - topic helper ////////
    const [deleteSaverStates, setDeleteSaverState] = React.useState<TDeleteSaver>({
        display: false,
    });

    const handleDeletePost = async () => {
        await fetch(`/api/creation/id/${postInfoStates.postId}`, { method: 'DELETE' });
        // Jump to member info page (author's post layout)
        router.push(`/me/id/${authorInfoStates.memberId}`);
    };

    const handleDeleteSaverOpen = () => {
        setDeleteSaverState({ display: true });
    };
    const handleDeleteSaverClose = () => {
        setDeleteSaverState({ display: false });
    };

    return (
        <>
            <Navbar lang={preferenceStates.lang} />

            {/* post editor */}
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Box component={'form'} sx={{ maxWidth: 600, flexGrow: 1, padding: 2, borderRadius: 1, boxShadow: { xs: 0, sm: 1 }, backgroundColor: 'background' }} onSubmit={handleSubmit}>
                    <Stack spacing={2}>
                        <Grid container>
                            <Grid item flexGrow={1}>
                                <Typography>{langConfigs.title[preferenceStates.lang]}</Typography>
                            </Grid>
                            <Grid item>
                                <Button sx={{ py: 0 }} onClick={handleDeleteSaverOpen}>
                                    <Typography variant='body2'>{langConfigs.delete[preferenceStates.lang]}</Typography>
                                </Button>
                            </Grid>
                        </Grid>

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
                                                        <Avatar src={provideAvatarImageUrl(m.memberId, domain)} sx={{ width: 34, height: 34, bgcolor: 'grey' }}>{m.nickname?.charAt(0).toUpperCase()}</Avatar>
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

            {/* delete saver */}
            <Modal
                open={deleteSaverStates.display}
                onClose={handleDeleteSaverClose}
                aria-labelledby='modal-delete-saver-title'
                aria-describedby='modal-delete-saver-description'
            >
                <Box
                    sx={{
                        position: 'absolute' as 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: 330,
                        bgcolor: 'background.paper',
                        borderRadius: 2,
                        boxShadow: 24,
                        p: 4,
                    }}
                >
                    <Typography align='center'>{langConfigs.deletePost[preferenceStates.lang]}</Typography>
                    <Box pt={3} sx={{ display: 'flex', justifyContent: 'space-evenly' }}>
                        <Button variant='contained' color='inherit' onClick={async () => { await handleDeletePost(); }}>{langConfigs.confirmDelete[preferenceStates.lang]}</Button>
                        <Button variant='contained' onClick={handleDeleteSaverClose}>{langConfigs.cancelDelete[preferenceStates.lang]}</Button>
                    </Box>
                </Box>
            </Modal>

            {/* topic helper */}
            <Modal
                open={topicHelperStates.display}
                onClose={handleTopicHelperClose}
                aria-labelledby='modal-topic-helper-title'
                aria-describedby='modal-topic-helper-description'
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