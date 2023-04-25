import * as React from 'react';
import { NextPageContext } from 'next';

import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { signIn, signOut, useSession, } from 'next-auth/react';

import SvgIcon from '@mui/material/SvgIcon';

import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';

import AlternateEmailIcon from '@mui/icons-material/AlternateEmail';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LabelIcon from '@mui/icons-material/Label';
import LockIcon from '@mui/icons-material/Lock';
import OpacityIcon from '@mui/icons-material/Opacity';
import BubbleChartIcon from '@mui/icons-material/BubbleChart';
import InterestsIcon from '@mui/icons-material/Interests';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import CreateIcon from '@mui/icons-material/Create';
import StarIcon from '@mui/icons-material/Star';
import DeleteIcon from '@mui/icons-material/Delete';
import HistoryIcon from '@mui/icons-material/History';
import CakeIcon from '@mui/icons-material/Cake';
import InfoIcon from '@mui/icons-material/Info';
import BlockIcon from '@mui/icons-material/Block';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import EditIcon from '@mui/icons-material/Edit';



import { Global } from '@emotion/react';
import CssBaseline from '@mui/material/CssBaseline';
import { grey } from '@mui/material/colors';
import Skeleton from '@mui/material/Skeleton';
import SwipeableDrawer from '@mui/material/SwipeableDrawer';


import Masonry from '@mui/lab/Masonry';

import dayjs, { Dayjs } from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { MobileDatePicker } from '@mui/x-date-pickers/MobileDatePicker';

import FormControlLabel from '@mui/material/FormControlLabel';
import InputAdornment from '@mui/material/InputAdornment';
import OutlinedInput from '@mui/material/OutlinedInput';
import Paper from '@mui/material/Paper';
import Select, { SelectChangeEvent } from '@mui/material/Select';

import Divider from '@mui/material/Divider';
import Container from '@mui/material/Container';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';


import { useRouter } from 'next/router';

import Navbar from '../../../ui/Navbar';

import { IMemberInfo, IConciseMemberStatistics, IRestrictedMemberComprehensive } from '../../../lib/interfaces/member';
import { IConcisePostComprehensive } from '../../../lib/interfaces/post';
import { INoticeInfoWithMemberInfo } from '../../../lib/interfaces/notification';
import { IChannelInfoStates, IChannelInfoDictionary } from '../../../lib/interfaces/channel';

import { TBrowsingHelper, LangConfigs, TPreferenceStates } from '../../../lib/types';

import { timeToString, getContentBrief, updateLocalStorage, provideLocalStorage, restoreFromLocalStorage, logWithDate } from '../../../lib/utils/general';
import { verifyId, verifyNoticeId, verifyPassword } from '../../../lib/utils/verify';
import { provideAvatarImageUrl, getNicknameBrief, fakeConciseMemberInfo, fakeConciseMemberStatistics, fakeRestrictedMemberInfo } from '../../../lib/utils/for/member';
import { noticeIdToUrl, noticeInfoToString } from '../../../lib/utils/for/notification';

import { CentralizedBox, ResponsiveCard, StyledSwitch, TextButton } from '../../../ui/Styled';

import FormGroup from '@mui/material/FormGroup';
import Switch from '@mui/material/Switch';
import Checkbox from '@mui/material/Checkbox';
import Link from '@mui/material/Link';

import DoneIcon from '@mui/icons-material/Done';

import axios, { AxiosError, AxiosResponse } from 'axios';
import Copyright from '../../../ui/Copyright';
import Terms from '../../../ui/Terms';
import Table from '@mui/material/Table/Table';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';

import Tooltip from '@mui/material/Tooltip';


import { createTheme, responsiveFontSizes, styled, ThemeProvider } from '@mui/material/styles';
import { provideCoverImageUrl } from '../../../lib/utils/for/post';
import { getRandomHexStr } from '../../../lib/utils/create';

const storageName0 = 'PreferenceStates';
const updatePreferenceStatesCache = updateLocalStorage(storageName0);
const restorePreferenceStatesFromCache = restoreFromLocalStorage(storageName0);

const storageName1 = 'MemberPageProcessStates';
const updateProcessStatesCache = updateLocalStorage(storageName1);
const restoreProcessStatesFromCache = restoreFromLocalStorage(storageName1);

const storageName2 = 'MemberPagePostsLayoutStates';
const updatePostsLayoutStatesCache = updateLocalStorage(storageName2);
const restorePostsLayoutStatesFromCache = restoreFromLocalStorage(storageName2);

type TMemberPageProps = {
    channelInfoDict_ss: IChannelInfoDictionary;
    memberInfo_ss: IRestrictedMemberComprehensive;
    memberStatistics_ss: IConciseMemberStatistics;
    redirect404: boolean;
    redirect500: boolean;
};


const domain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? '';
const defaultLang = process.env.NEXT_PUBLIC_APP_LANG ?? 'tw';
const langConfigs: LangConfigs = {


    //// UI contents ////
    editProfile: {
        tw: '資料設定',
        cn: '更改信息',
        en: 'Edit profile',
    },
    followAuthor: {
        tw: '關注作者',
        cn: '关注作者',
        en: 'Follow author',
    },
    follow: {
        tw: '關注',
        cn: '关注',
        en: 'Follow',
    },

    noFollowing: {
        tw: '还没有會員關注作者',
        cn: '位会员正在关注作者',
        en: 'members are following the author',
    },
    authorsTotalFollowing: {
        tw: '位會員正在關注作者',
        cn: '位会员正在关注作者',
        en: 'members are following the author',
    },
    noCreations: {
        tw: '作者还未发布主题帖',
        cn: '作者还未发布主题帖',
        en: 'members are following the author',
    },
    authorsTotalCreationsP1: {
        tw: '作者发布了',
        cn: '位会员正在关注作者',
        en: 'members are following the author',
    },
    authorsTotalCreationsP2: {
        tw: ' 篇主题帖',
        cn: '',
        en: 'members are following the author',
    },
    authorsTotalLikesP1: {
        tw: '获得了',
        cn: '获得了',
        en: 'Gained ',
    },
    authorsTotalLikesP2: {
        tw: '次喜欢',
        cn: '次喜欢',
        en: ' likes',
    },
    authorsTotalSavesP2: {
        tw: '次收藏',
        cn: '次喜欢',
        en: 'likes',
    },



    myCreations: {
        tw: '我的作品',
        cn: '我的作品',
        en: 'likes',
    },
    authorsCreations: {
        tw: '作者的作品',
        cn: '作者的作品',
        en: 'Author\'s creations',
    },
    mySavedPosts: {
        tw: '我的收藏',
        cn: '我的收藏',
        en: 'likes',
    },
    authorsSavedPosts: {
        tw: '作者的收藏',
        cn: '作者的收藏',
        en: 'Author\'s saved posts',
    },
    browsingHistory: {
        tw: '瀏覽記錄',
        cn: '浏览记录',
        en: 'Browsing history',
    },

    allPosts: {
        tw: '全部',
        cn: '全部',
        en: 'All',
    },



    //// Alert contents ////
    noCreationsRecord: {
        tw: '您還未發表任何作品',
        cn: '您还未发表任何作品',
        en: 'No records of creations'
    },
    authorNoCreationsRecord: {
        tw: '作者還未發表任何作品',
        cn: '作者还未发表任何作品',
        en: 'No records of creations'
    },
    noSavedPostsRecord: {
        tw: '您還未收藏任何作品',
        cn: '您还未收藏任何作品',
        en: 'No records of saved posts'
    },
    authorNoSavedPostsRecord: {
        tw: '作者還未收藏任何作品',
        cn: '作者还未收藏任何作品',
        en: 'No records of saved posts'
    },
    noBrowsingHistoryRecord: {
        tw: '暫時沒有您的瀏覽記錄',
        cn: '暂时没有您的浏览记录',
        en: 'No records of browsing history'
    },


    //// Member info editing ////
    cancel: {
        tw: '取消',
        cn: '取消',
        en: 'Cancel'
    },
    update: {
        tw: '更新',
        cn: '更新',
        en: 'Update'
    },



    //// Avatar setting ////
    avatar: {
        tw: '相片',
        cn: '头像',
        en: 'Avatar'
    },
    chooseImageToUpload: {
        tw: '選擇相片以上傳',
        cn: '选择照片以上传',
        en: 'Choose image to upload'
    },
    avatarImageRequirement: {
        tw: '*请选择 2 MB 以内的相片文件',
        cn: '*请选择 2 MB 以内的照片文件',
        en: '*Please limit the image file size to 2MB'
    },
    uploading: {
        tw: '上傳中...',
        cn: '上传中...',
        en: 'Uploading...'
    },
    uploadSucceeded: {
        tw: '上傳成功',
        cn: '上传成功',
        en: 'Upload succeeded'
    },
    uploadFailed: {
        tw: '上傳失敗，點擊以重試',
        cn: '上传失败，点击以重试',
        en: 'Upload failed, click to re-try'
    },

    //// Nickname setting ////
    nickname: {
        tw: '暱稱',
        cn: '昵称',
        en: 'Nickname'
    },
    updatinging: {
        tw: '更新中...',
        cn: '更新中...',
        en: 'Updating...'
    },
    nicknameRequirement: {
        tw: '*請使用符合規則的暱稱並且長度不超過13個字符',
        cn: '*请使用符合规则的昵称并且长度不超过13个字符',
        en: '*Please use a nickname that complies with the rules and the length does not exceed 13 characters'
    },
    referToCommunityGuidelines: {
        tw: '詳情請參見我們的社区準則',
        cn: '详情请参见我们的社区规范',
        en: 'Please refer to our Community Guidelines'
    },
    invalidNicknameOrConflict: {
        tw: '暱稱被佔用或不符合社區規範，請修改後重試',
        cn: '昵称被占用或不符合社区规范，请修改后重试',
        en: 'Nickname invalid or already taken'
    },
    updateSucceeded: {
        tw: '更新成功',
        cn: '更新成功',
        en: 'Update succeeded'
    },
    updateFailed: {
        tw: '更新失敗，點擊以重試',
        cn: '更新失败，点击以重试',
        en: 'Update failed, click to re-try'
    },
    newNickname: {
        tw: '新昵稱',
        cn: '新昵称',
        en: 'New nickname'
    },

    //// Bried intro setting ////
    briefIntro: {
        tw: '簡介',
        cn: '简介',
        en: 'Brief intro'
    },
    brieflyIntrodueYourself: {
        tw: '撰寫您的簡介',
        cn: '添加您的简介',
        en: 'Write something about yourself'
    },
    briefIntroRequirement: {
        tw: '*請添加符合規則的簡介並且長度不超過150個字符',
        cn: '*请添加符合规则的简介并且长度不超过150个字符',
        en: '*Please add a brief intro that complies with the rules and the length does not exceed 150 characters'
    },
    invalidBriefIntro: {
        tw: '簡介長度超過150個字符或不符合社區規範，請重試',
        cn: '简介长度超过150个字符或不符合社区规范，请重试',
        en: 'Brief intro length exceeds limit or invalid'
    },

};

//// Get multiple member info server-side ////
export async function getServerSideProps(context: NextPageContext): Promise<{ props: TMemberPageProps; }> {
    const { memberId } = context.query;
    const { isValid, category } = verifyId(memberId);

    // Verify member id
    if (!(isValid && 'member' === category)) {
        return {
            props: {
                channelInfoDict_ss: {},
                memberInfo_ss: fakeRestrictedMemberInfo(),
                memberStatistics_ss: fakeConciseMemberStatistics(),
                redirect404: true,
                redirect500: false,
            }
        };
    }

    try {
        // GET channel info by id
        const dictionary_resp = await fetch(`${domain}/api/channel/info/dictionary`);
        if (200 !== dictionary_resp.status) {
            throw new Error('Attempt to GET channel info dictionary');
        }
        const channelInfoDict_ss = await dictionary_resp.json();

        // GET member info by id
        const info_resp = await fetch(`${domain}/api/member/info/${memberId}`);
        if (200 !== info_resp.status) {
            throw new Error('Attempt to GET member info');
        }
        const memberInfo_ss = await info_resp.json();

        // GET member statistics by id
        const statistics_resp = await fetch(`${domain}/api/member/statistics/${memberId}`);
        if (200 !== statistics_resp.status) {
            throw new Error('Attempt to GET member statistics');
        }
        const memberStatistics_ss = await statistics_resp.json();

        return {
            props: {
                channelInfoDict_ss,
                memberInfo_ss,
                memberStatistics_ss,
                redirect404: false,
                redirect500: false
            }
        };
    } catch (e: any) {
        logWithDate(e?.msg, '/pages/me/[memberId].getServerSideProps', e);
        return {
            props: {
                channelInfoDict_ss: {},
                memberInfo_ss: fakeRestrictedMemberInfo(),
                memberStatistics_ss: fakeConciseMemberStatistics(),
                redirect404: false,
                redirect500: true,
            }
        };
    }
}

const Member = ({ channelInfoDict_ss, memberInfo_ss: memberComprehensive_ss, memberStatistics_ss, redirect404, redirect500 }: TMemberPageProps) => {

    const router = useRouter();
    React.useEffect(() => {
        if (redirect404) {
            router.push('/404');
        }
        if (redirect500) {
            router.push('/500');
        }
    }, [router]);

    const { data: session, status } = useSession();

    React.useEffect(() => {
        if ('authenticated' === status) {
            const viewerSession: any = { ...session };
            setProcessStates({ ...processStates, viewerId: viewerSession?.user?.id });
            restorePreferenceStatesFromCache(setPreferenceStates);
        }
    }, [session]);

    //////// REF - masonry ////////
    const masonryWrapper = React.useRef<any>();
    const [width, setWidth] = React.useState(375); // default 636, now use the width of iphonse se3

    //////// INFO - member (author) ////////
    const { memberId: authorId } = memberComprehensive_ss;

    type TMemberInfoStates = {
        avatarImageUrl: string;
        nickname: string;
        briefIntro: string;
        gender: number;
        birthdayBySecond: number;
    };

    //////// STATES - memberInfo ////////
    const [memberInfoStates, setMemberInfoStates] = React.useState<TMemberInfoStates>({
        avatarImageUrl: provideAvatarImageUrl(authorId, domain),
        nickname: memberComprehensive_ss.nickname,
        briefIntro: memberComprehensive_ss.briefIntro,
        gender: memberComprehensive_ss.gender,
        birthdayBySecond: memberComprehensive_ss.birthdayBySecond,
    });

    //////// STATES - preference ////////
    const [preferenceStates, setPreferenceStates] = React.useState<TPreferenceStates>({
        lang: defaultLang,
        mode: 'light'
    });

    type TProcessStates = {
        viewerId: string;
        selectedCategory: 'mycreations' | 'savedposts' | 'browsinghistory';
        selectedHotPosts: boolean;
        selectedChannelId: string;
        memorizeChannelBarPositionX: number | undefined;
        memorizeViewPortPositionY: number | undefined;
        memorizeLastViewedPostId: string | undefined;
        wasRedirected: boolean;
    };

    //////// STATES - process ////////
    const [processStates, setProcessStates] = React.useState<TProcessStates>({
        viewerId: '',
        selectedCategory: 'mycreations', // 'mycreations' | 'savedposts' | 'browsinghistory'
        selectedHotPosts: false, // default
        selectedChannelId: 'all', // default
        memorizeChannelBarPositionX: undefined,
        memorizeViewPortPositionY: undefined,
        memorizeLastViewedPostId: undefined,
        wasRedirected: false,
    });

    React.useEffect(() => {
        restoreProcessStatesFromCache(setProcessStates);
        restorePostsLayoutStatesFromCache(setPostLayoutStates);
    }, []);

    // Reset masonry width
    React.useEffect(() => { setWidth(masonryWrapper?.current?.offsetWidth); }, []);


    const handleFollowOrUndoFollow = async () => {

    };


    type TPostsLayoutStates = {
        selectedCategory: 'mycreations' | 'savedposts' | 'browsinghistory';
        selectedHotPosts: boolean;
        selectedChannelId: string;
        memorizeChannelBarPositionX: number | undefined;
        memorizeViewPortPositionY: number | undefined;
        memorizeLastViewedPostId: string | undefined;
        wasRedirected: boolean;
    };

    //////// STATES - post layout ////////
    const [postLayoutStates, setPostLayoutStates] = React.useState<TPostsLayoutStates>({
        selectedCategory: 'mycreations', // 'mycreations' | 'savedposts' | 'browsinghistory'
        selectedHotPosts: false, // default
        selectedChannelId: 'all', // default
        memorizeChannelBarPositionX: undefined,
        memorizeViewPortPositionY: undefined,
        memorizeLastViewedPostId: undefined,
        wasRedirected: false,
    });

    const handleSelectPostCategory = (categoryId: 'mycreations' | 'savedposts' | 'browsinghistory') => (event: React.MouseEvent<HTMLButtonElement> | React.SyntheticEvent) => {
        let states: TPostsLayoutStates = { ...postLayoutStates, selectedCategory: categoryId };
        // #1 update post layout states
        setPostLayoutStates(states);
        // #2 update post layout states cache
        updatePostsLayoutStatesCache(states);
        // #3 reset helper
        setBrowsingHelper({ ...browsingHelper, memorizeViewPortPositionY: undefined });
    };

    //////// STATES - browsing helper ////////
    const [browsingHelper, setBrowsingHelper] = React.useState<TBrowsingHelper>({
        memorizeViewPortPositionY: undefined, // reset scroll-help on handleChannelSelect, handleSwitchChange, ~~handlePostCardClick~~
    });

    ///////// STATES - channel /////////
    const [channelInfoStates, setChannelInfoStates] = React.useState<IChannelInfoStates>({
        channelIdSequence: [],
    });

    React.useEffect(() => { updateChannelIdSequence(); }, []);

    const updateChannelIdSequence = async () => {
        const resp = await fetch(`/api/channel/id/sequence`);
        if (200 !== resp.status) {
            setChannelInfoStates({ ...channelInfoStates, channelIdSequence: Object.keys(channelInfoDict_ss) });
            console.log(`Attemp to GET channel id array. Using sequence from channel info dictionary instead`);
            return;
        }
        try {
            const idArr = await resp.json();
            setChannelInfoStates({ ...channelInfoStates, channelIdSequence: [...idArr] });
        } catch (e) {
            console.log(`Attemp to parese channel id array. ${e}`);
        } finally {
            setChannelInfoStates({ ...channelInfoStates, channelIdSequence: Object.keys(channelInfoDict_ss) });
        }
    };

    // Handle channel bar restore on refresh
    React.useEffect(() => {
        if (undefined !== postLayoutStates.memorizeChannelBarPositionX) {
            document.getElementById('channel-bar')?.scrollBy(postLayoutStates.memorizeChannelBarPositionX ?? 0, 0);
        }
    }, [channelInfoStates.channelIdSequence]);

    const handleChannelSelect = (channelId: string) => (event: React.MouseEvent<HTMLButtonElement> | React.SyntheticEvent) => {
        let states: TPostsLayoutStates = { ...postLayoutStates };
        states.selectedChannelId = channelId;
        states.memorizeChannelBarPositionX = document.getElementById('channel-bar')?.scrollLeft;
        // #1 update post layout states
        setPostLayoutStates(states);
        // #2 update post layout states cache
        updatePostsLayoutStatesCache(states);
        // #3 reset helper
        setBrowsingHelper({ ...browsingHelper, memorizeViewPortPositionY: undefined });
    };

    const handleSwitchChange = () => {
        let states: TPostsLayoutStates = { ...postLayoutStates, selectedHotPosts: !postLayoutStates.selectedHotPosts };
        // #1 update post layout states
        setPostLayoutStates(states);
        // #2 update post layout states cache
        updatePostsLayoutStatesCache(states);
        // #3 reset helper
        setBrowsingHelper({ ...browsingHelper, memorizeViewPortPositionY: undefined });
    };

    //////// STATES - (masonry) post info array ////////
    const [masonryPostInfoArr, setMasonryPostInfoArr] = React.useState<IConcisePostComprehensive[]>([]);

    React.useEffect(() => { updatePostsArr(); }, [postLayoutStates.selectedHotPosts, postLayoutStates.selectedChannelId, postLayoutStates.selectedCategory]);

    const updatePostsArr = async () => {
        let url = '';

        if ('mycreations' === postLayoutStates.selectedCategory) {
            url = `/api/creation/s/of/${authorId}`;
        }
        if ('savedposts' === postLayoutStates.selectedCategory) {
            url = `/api/member/savedposts/${authorId}`;
        }
        if ('browsinghistory' === postLayoutStates.selectedCategory) {
            url = `/api/member/browsinghistory/${authorId}`;
        }

        const resp = await fetch(`${url}?channelId=${postLayoutStates.selectedChannelId}&sort=${postLayoutStates.selectedHotPosts ? 'hot' : 'new'}`);
        if (200 === resp.status) {
            try {
                setMasonryPostInfoArr(await resp.json());
            } catch (e) {
                console.log(`Attempt to GET posts of ${postLayoutStates.selectedHotPosts ? '24 hours hot' : 'new'}. ${e}`);
            }
        }
    };

    // Handle restore browsing position after reload
    React.useEffect(() => {
        if (postLayoutStates.wasRedirected) {
            const postId = postLayoutStates.memorizeLastViewedPostId;
            // #1 restore browsing position
            if (!postId) {
                return;
            } else if (600 > window.innerWidth) { // 0 ~ 599
                setBrowsingHelper({ ...browsingHelper, memorizeViewPortPositionY: (document.getElementById(postId)?.offsetTop ?? 0) / 2 - 200 });
            } else { // 600 ~ ∞
                setBrowsingHelper({ ...browsingHelper, memorizeViewPortPositionY: postLayoutStates.memorizeViewPortPositionY });
            }
            // #2 update process states and cache
            let states1: TProcessStates = { ...processStates };
            setProcessStates({ ...states1 });
            updateProcessStatesCache(states1);
            let states2: TPostsLayoutStates = { ...postLayoutStates, memorizeLastViewedPostId: undefined, memorizeViewPortPositionY: undefined, wasRedirected: false };
            // #3 update post layout states and cache
            setPostLayoutStates({ ...states2 });
            updatePostsLayoutStatesCache(states2);
        }
    }, [masonryPostInfoArr]);

    if (!!browsingHelper.memorizeViewPortPositionY) {
        window.scrollTo(0, browsingHelper.memorizeViewPortPositionY ?? 0);
    }

    const handleClickOnPost = (postId: string) => (event: React.MouseEvent) => {
        // #1 update process states and post layout cache
        updateProcessStatesCache({ ...processStates, wasRedirected: true });
        updatePostsLayoutStatesCache({ ...postLayoutStates, memorizeLastViewedPostId: postId, memorizeViewPortPositionY: window.scrollY });
        // #2 jump
        router.push(`/post/${postId}`);
    };

    const handleClickOnMemberInfo = (memberId: string, postId: string) => (event: React.MouseEvent) => {
        // #1 update process states and post layout cache
        updateProcessStatesCache({ ...processStates, wasRedirected: true });
        updatePostsLayoutStatesCache({ ...postLayoutStates, memorizeLastViewedPostId: postId, memorizeViewPortPositionY: window.scrollY });
        // #2 jump
        router.push(`/me/id/${memberId}`);
    };

    ///////// STATES - behaviour /////////
    const [undoSavedPostArr, setUndoSavedPostArr] = React.useState<string[]>([]);

    // Handle click on bottom-right icon button
    const handleMultiProposeButtonClick = async (categoryId: string, postId: string) => {
        // edit post 
        if ('mycreations' === categoryId) {
            router.push(`/me/editpost/${postId}`);
            return;
        }

        // undo save post
        if ('savedposts' === categoryId) {
            // #1 mark post of chice as 'undo-saved'
            if (undoSavedPostArr.includes(postId)) {
                const update = undoSavedPostArr.filter(id => postId !== id);
                setUndoSavedPostArr([...update]);
            } else {
                setUndoSavedPostArr([...undoSavedPostArr, postId]);
            }
            // #2 request to delete record
            const resp = await fetch(``);
            if (200 !== resp.status) {
                console.log('Attempt to undo/do save post');
            }
        }

        // delete browsing history
        if ('browsinghistory' === categoryId) {
            // #1 remove post card
            const update = masonryPostInfoArr.filter(po => po.postId !== postId);
            setMasonryPostInfoArr([...update]);
            // #2 request to delete record
            const resp = await fetch(`/api/member/browsinghistory/${authorId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ postId })
            });
            if (200 !== resp.status) {
                console.log('Attempt to delete browsing history record');
            }
        }
    };

    //////////////////////////////////////// FUNCTIONS ////////////////////////////////////////

    const makeBriefIntro = (briefIntro: any) => {
        if ('string' !== typeof briefIntro) {
            return (<></>);
        }
        return (
            <>
                {briefIntro.split('\n').map(t =>
                    <Typography key={getRandomHexStr()} variant='body1' fontSize={{ md: 18 }} color={'text.disabled'}>{t}</Typography>
                )}
            </>
        );
    };





    const StyledBox = styled(Box)(({ theme }) => ({
        backgroundColor: theme.palette.mode === 'light' ? '#fff' : grey[800],
    }));

    const Puller = styled(Box)(({ theme }) => ({
        width: 30,
        height: 6,
        backgroundColor: theme.palette.mode === 'light' ? grey[300] : grey[900],
        borderRadius: 3,
        position: 'absolute',
        top: 8,
        left: 'calc(50% - 15px)',
    }));

    //// STATES - info editor ////
    const [authorInfoEditorStates, setAuthorInfoEditorStates] = React.useState<TEditorStates>({
        open: true
    });

    const handleToggleEditor = (open: boolean) => () => {
        setAuthorInfoEditorStates({ ...authorInfoEditorStates, open });
    };

    type TAuthorInfoSettingStates = {
        // displayEditor: boolean;
        alternativeImageUrl: string | undefined;
        alternativeName: string;
        alternativeIntro: string;
        disableButton: boolean;
        displayError: boolean;
        progressStatus: 0 | 100 | 300 | 400;
    };
    //// STATES - author info ////

    const [authorInfoSettingStates, setAuthorInfoSettingStates] = React.useState<TAuthorInfoSettingStates>({
        // displayEditor: false,
        alternativeImageUrl: provideAvatarImageUrl('authorId', domain),
        alternativeName: memberInfoStates.nickname,
        alternativeIntro: memberInfoStates.briefIntro,
        disableButton: true,
        displayError: false,
        progressStatus: 0
    });

    type TEditorStates = {
        open: boolean;
    };



    // Edit avatar image
    const handleOpenFile = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files?.length !== 0 && event.target.files !== null) {
            const url = URL.createObjectURL(event.target.files[0]);
            setAuthorInfoSettingStates({ ...authorInfoSettingStates, alternativeImageUrl: url, disableButton: false, progressStatus: 100 });
        }
    };

    const handleUploadAvatarImage = async () => {
        if (!(undefined !== authorInfoSettingStates.alternativeImageUrl && '' !== authorInfoSettingStates.alternativeImageUrl)) {
            return;
        }

        // Prepare to upload avatar image
        setAuthorInfoSettingStates({ ...authorInfoSettingStates, disableButton: true, progressStatus: 300 });
        let formData = new FormData();
        const config = {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: (event: any) => {
                console.log(`Upload progress:`, Math.round((event.loaded * 100) / event.total));
            }
        };

        // Retrieve file and measure the size
        const bb = await fetch(authorInfoSettingStates.alternativeImageUrl).then(r => r.blob());
        if ((await bb.arrayBuffer()).byteLength > 2097152) { // new image file no larger than 2 MB
            setAuthorInfoSettingStates({ ...authorInfoSettingStates, disableButton: false, progressStatus: 400 });
            return;
        }

        // Post avatar image file
        formData.append('image', bb);
        await axios.post(`/api/avatar/upload/${authorId}`, formData, config)
            .then((response: AxiosResponse) => {
                setMemberInfoStates({ ...memberInfoStates, avatarImageUrl: provideAvatarImageUrl(authorId, domain, true) });
            })
            .catch((error: AxiosError) => {
                setAuthorInfoSettingStates({ ...authorInfoSettingStates, disableButton: true, progressStatus: 400 });
                console.log(`Attempt to upload avatar image. ${error}`);
            });
    };

    type TNicknameSetting = {
        alternativeName: string;
        displayError: boolean;
        disableButton: boolean;
        progressStatus: 100 | 200 | 300 | 422 | 500;
    };

    const [nicknameSettingStates, setNicknameSettingStates] = React.useState<TNicknameSetting>({
        alternativeName: memberComprehensive_ss.nickname,
        displayError: false,
        disableButton: true,
        progressStatus: 100
    });

    const handleNicknameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (13 < `${event.target.value}`.length) {
            setNicknameSettingStates({ ...nicknameSettingStates, displayError: true });
        } else {
            if (memberInfoStates.nickname === event.target.value) {
                setNicknameSettingStates({ ...nicknameSettingStates, disableButton: true, alternativeName: event.target.value });
            } else {
                setNicknameSettingStates({ ...nicknameSettingStates, disableButton: false, alternativeName: event.target.value });
            }
        }
    };

    type TBriefIntroSetting = {
        alternativeIntro: string;
        displayError: boolean;
        disableButton: boolean;
        progressStatus: 100 | 200 | 300 | 422 | 500;
    };

    const [briefIntroSettingStates, setBriefIntroSettingStates] = React.useState<TBriefIntroSetting>({
        alternativeIntro: memberInfoStates.briefIntro,
        displayError: false,
        disableButton: true,
        progressStatus: 100
    });

    const handleBriefIntroChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (21 < `${event.target.value}`.length) {
            setBriefIntroSettingStates({ ...briefIntroSettingStates, displayError: true, disableButton: true, alternativeIntro: event.target.value });
        } else {
            if (memberInfoStates.briefIntro === event.target.value) {
                setBriefIntroSettingStates({ ...briefIntroSettingStates, displayError: false, disableButton: true, alternativeIntro: event.target.value });
            } else {
                setBriefIntroSettingStates({ ...briefIntroSettingStates, displayError: false, disableButton: false, alternativeIntro: event.target.value });
            }

        }
    };

    ///////// COMPONENT - member page /////////
    return (
        <>
            <Global
                styles={{
                    '@media (max-width: 600px)': {

                        '.MuiDrawer-root > .MuiPaper-root': {
                            height: `calc(80%)`,
                            borderTopLeftRadius: 8,
                            borderTopRightRadius: 8,
                            // overflow: 'visible',
                        },
                    },
                    '@media (min-width: 600px)': {

                        '.MuiDrawer-root > .MuiPaper-root': {
                            height: `calc(70%)`,
                            borderTopLeftRadius: 8,
                            borderTopRightRadius: 8,
                            maxWidth: 500,
                            left: `calc(50% - 250px);`,
                        },
                    },
                    '@media (min-width: 900px)': {

                        '.MuiDrawer-root > .MuiPaper-root': {
                            height: `calc(70%)`,
                            borderTopLeftRadius: 8,
                            borderTopRightRadius: 8,
                            maxWidth: 600,
                            left: `calc(50% - 300px);`,
                        },
                    }
                }}
            />

            <Navbar avatarImageUrl={memberInfoStates.avatarImageUrl} />

            {/* //// first layer - member info //// */}
            <Grid container >

                {/* placeholder - left */}
                <Grid item xs={0} sm={1} md={2} lg={3} xl={3}></Grid>

                {/* middle column */}
                <Grid item xs={12} sm={10} md={8} lg={6} xl={6}>
                    <Box sx={{ minHeight: { xs: 160, md: 200 }, px: { xs: 2, sm: 0 } }}>

                        {/* 1st row - avatar */}
                        <Grid container sx={{ mt: { xs: 4, sm: 5 } }}>

                            {/* avatar image */}
                            <Grid item flexGrow={1}>
                                <Avatar src={memberInfoStates.avatarImageUrl} sx={{ height: { xs: 64, sm: 90 }, width: { xs: 64, sm: 90 } }}>{memberInfoStates.nickname?.charAt(0).toUpperCase()}</Avatar>
                            </Grid>

                            {/* 'edit' button */}
                            {'authenticated' === status && processStates.viewerId === authorId && <Grid item pt={2}>
                                <Tooltip title={langConfigs.editProfile[preferenceStates.lang]}>
                                    <IconButton onClick={handleToggleEditor(true)}><EditIcon sx={{ height: { xs: 20, sm: 24 }, width: { xs: 20, sm: 24 }, }} /></IconButton>
                                </Tooltip>
                            </Grid>}

                            {/* 'follow' button */}
                            {processStates.viewerId !== authorId && <Grid item sx={{ mt: 2 }} pl={1}>
                                <Tooltip title={langConfigs.followAuthor[preferenceStates.lang]}>
                                    <Button variant={'contained'} color={'info'} sx={{ padding: { xs: 0.5, sm: 3 / 4 }, borderRadius: 4 }} onClick={async () => { await handleFollowOrUndoFollow(); }}>{langConfigs.follow[preferenceStates.lang]}</Button>
                                </Tooltip>
                            </Grid>}
                        </Grid>

                        {/* 2nd row - nickname */}
                        <Box pt={{ xs: 2, sm: 2, md: 4 }}>
                            <Typography variant='body1' fontSize={{ xs: 22, sm: 24, md: 27 }} fontWeight={600} >{memberInfoStates.nickname}</Typography>
                        </Box>

                        {/* brief intro */}
                        <Box pt={1} maxWidth={600}>
                            {makeBriefIntro(memberInfoStates.briefIntro)}
                        </Box>

                        {/* statistics - follow */}
                        <Box pt={4} sx={{ display: 'flex', flexDirection: 'row' }} >
                            {0 === memberStatistics_ss.totalFollowedByCount && <>
                                <Typography fontSize={{ md: 17 }} color={'text.disabled'} >{langConfigs.noFollowing[preferenceStates.lang]}</Typography>
                            </>}
                            {0 !== memberStatistics_ss.totalFollowedByCount && <>
                                <Typography fontSize={{ md: 17 }} fontWeight={700} color={'grey.700'} >{memberStatistics_ss.totalFollowedByCount}</Typography>
                                <Typography fontSize={{ md: 17 }} color={'text.disabled'}>{langConfigs.authorsTotalFollowing[preferenceStates.lang]}</Typography>
                            </>}
                        </Box>

                        {/* statistics - creations */}
                        <Box pt={{ xs: 0, sm: 1 / 2 }} sx={{ display: 'flex', flexDirection: 'row' }}>
                            {0 === memberStatistics_ss.totalFollowedByCount && <>
                                <Typography fontSize={{ md: 17 }} color={'text.disabled'}>{langConfigs.noCreations[preferenceStates.lang]}</Typography>
                            </>}
                            {0 !== memberStatistics_ss.totalFollowedByCount && <>
                                <Typography fontSize={{ md: 17 }} color={'text.disabled'}>{langConfigs.authorsTotalCreationsP1[preferenceStates.lang]}</Typography>
                                <Typography fontSize={{ md: 17 }} fontWeight={700} color={'grey.700'} >{memberStatistics_ss.totalCreationsCount}</Typography>
                                <Typography fontSize={{ md: 17 }} color={'text.disabled'}>{langConfigs.authorsTotalCreationsP2[preferenceStates.lang]}</Typography>
                            </>}
                        </Box>

                        {/* statistics - likes & saves */}
                        <Box pt={{ xs: 0, sm: 1 / 2 }} sx={{ display: 'flex', flexDirection: 'row' }}>
                            {0 !== memberStatistics_ss.totalFollowedByCount && <>
                                {0 !== memberStatistics_ss.totalFollowedByCount && <>
                                    <Typography fontSize={{ md: 17 }} color={'text.disabled'}>{langConfigs.authorsTotalLikesP1[preferenceStates.lang]}</Typography>
                                    <Typography fontSize={{ md: 17 }} fontWeight={700} color={'grey.700'} >{memberStatistics_ss.totalFollowedByCount}</Typography>
                                    <Typography fontSize={{ md: 17 }} color={'text.disabled'}>{langConfigs.authorsTotalLikesP2[preferenceStates.lang]}</Typography>
                                </>}
                                {0 !== memberStatistics_ss.totalFollowedByCount && 0 !== memberStatistics_ss.totalFollowedByCount && <>
                                    <Typography fontSize={{ md: 17 }} fontWeight={700} color={'grey.700'} >{memberStatistics_ss.totalFollowedByCount}</Typography>
                                    <Typography fontSize={{ md: 17 }} color={'text.disabled'}>{langConfigs.authorsTotalSavesP2[preferenceStates.lang]}</Typography>

                                </>}
                            </>}

                        </Box>

                        {/* divider */}
                        <Box py={{ xs: 2, sm: 2, md: 4 }}><Divider /></Box>
                    </Box>
                </Grid>

                {/* placeholder - right */}
                <Grid item xs={0} sm={1} md={2} lg={3} xl={3}></Grid>
            </Grid>

            {/* //// second layer - multi-display */}
            <Grid container >

                {/* //// placeholder left //// */}
                <Grid item xs={0} sm={1} md={2} lg={2} xl={1}></Grid>

                {/* //// left column //// */}
                <Grid item xs={0} sm={0} md={2} lg={2} xl={2} sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'right' }}>
                    <Stack spacing={0} sx={{ pr: 1, display: { xs: 'none', sm: 'none', md: 'block' } }} >

                        {/* my posts / saved posts / browsing history switch */}
                        <ResponsiveCard sx={{ padding: 1 }}>
                            <MenuList>

                                {/* creations list item */}
                                <MenuItem onClick={handleSelectPostCategory('mycreations')} selected={'mycreations' === postLayoutStates.selectedCategory}>
                                    <ListItemIcon ><CreateIcon /></ListItemIcon>
                                    <ListItemText>
                                        <Typography>{authorId === processStates.viewerId ? langConfigs.myCreations[preferenceStates.lang] : langConfigs.authorsCreations[preferenceStates.lang]}</Typography>
                                    </ListItemText>
                                </MenuItem>

                                {/* saved post list item */}
                                <MenuItem onClick={handleSelectPostCategory('savedposts')} selected={'savedposts' === postLayoutStates.selectedCategory}>
                                    <ListItemIcon ><StarIcon /></ListItemIcon>
                                    <ListItemText>
                                        <Typography>{authorId === processStates.viewerId ? langConfigs.mySavedPosts[preferenceStates.lang] : langConfigs.authorsSavedPosts[preferenceStates.lang]}</Typography>
                                    </ListItemText>
                                </MenuItem>

                                {/* browsing history list item */}
                                {'authenticated' === status && authorId === processStates.viewerId && <MenuItem onClick={handleSelectPostCategory('browsinghistory')} selected={'browsinghistory' === postLayoutStates.selectedCategory}>
                                    <ListItemIcon >
                                        <HistoryIcon />
                                    </ListItemIcon>
                                    <ListItemText>
                                        <Typography>{langConfigs.browsingHistory[preferenceStates.lang]}</Typography>
                                    </ListItemText>
                                </MenuItem>}
                            </MenuList>
                        </ResponsiveCard>

                        {/* the channel menu (desktop mode) */}
                        <ResponsiveCard sx={{ padding: 1 }}>
                            <MenuList>
                                {/* the 'all' menu item */}
                                <MenuItem onClick={handleChannelSelect('all')} selected={postLayoutStates.selectedChannelId === 'all'}>
                                    <ListItemIcon >
                                        <BubbleChartIcon />
                                    </ListItemIcon>
                                    <ListItemText>
                                        <Typography>{langConfigs.allPosts[preferenceStates.lang]}</Typography>
                                    </ListItemText>
                                </MenuItem>

                                {/* other channels */}
                                {channelInfoStates.channelIdSequence.map(id => {
                                    const { channelId, name, svgIconPath } = channelInfoDict_ss[id];
                                    return (
                                        <MenuItem key={`item-${channelId}`}
                                            onClick={handleChannelSelect(channelId)}
                                            selected={channelId === postLayoutStates.selectedChannelId}
                                        >
                                            <ListItemIcon >
                                                <SvgIcon><path d={svgIconPath} /></SvgIcon>
                                            </ListItemIcon>
                                            <ListItemText>
                                                <Typography>{name[preferenceStates.lang]}</Typography>
                                            </ListItemText>
                                        </MenuItem>
                                    );
                                })}
                            </MenuList>
                        </ResponsiveCard>

                        {/* hotest / newest switch (*disabled since 24/02/2023) */}
                        {/* <ResponsiveCard sx={{ padding: 0, paddingY: 2, paddingLeft: 2 }}>
                            <FormControlLabel
                                control={<StyledSwitch sx={{ ml: 1 }} checked={postLayoutStates.selectedHotPosts} />}
                                label={postLayoutStates.selectedHotPosts ? langConfigs.hotPosts[preferenceStates.lang] : langConfigs.newPosts[preferenceStates.lang]}
                                onChange={handleSwitchChange}
                                sx={{ marginRight: 0 }}
                            />
                        </ResponsiveCard> */}
                    </Stack>
                </Grid>

                {/* //// right column //// */}
                <Grid item xs={12} sm={10} md={6} lg={6} xl={7}>

                    {/* channel bar (mobile mode) */}
                    <Stack id={'channel-bar'} direction={'row'} spacing={1} sx={{ display: { sm: 'flex', md: 'none' }, padding: 1, overflow: 'auto' }}>

                        {/* creations button */}
                        <Button variant={'mycreations' === postLayoutStates.selectedCategory ? 'contained' : 'outlined'} size='small' sx={{ minWidth: 'max-content' }} onClick={handleSelectPostCategory('mycreations')}>
                            <Typography variant='body2'>{authorId === processStates.viewerId ? langConfigs.myCreations[preferenceStates.lang] : langConfigs.authorsCreations[preferenceStates.lang]}</Typography>
                        </Button>

                        {/*  saved post button */}
                        <Button variant={'savedposts' === postLayoutStates.selectedCategory ? 'contained' : 'outlined'} size='small' sx={{ minWidth: 'max-content' }} onClick={handleSelectPostCategory('savedposts')}>
                            <Typography variant='body2'>{langConfigs.mySavedPosts[preferenceStates.lang]}</Typography>
                        </Button>

                        {/* browsing history button */}
                        {('authenticated' === status && authorId === processStates.viewerId) && <Button variant={'browsinghistory' === postLayoutStates.selectedCategory ? 'contained' : 'outlined'} size='small' sx={{ minWidth: 'max-content' }} onClick={handleSelectPostCategory('browsinghistory')}>
                            <Typography variant='body2'>{langConfigs.browsingHistory[preferenceStates.lang]}</Typography>
                        </Button>}

                        {/* the 'all' button */}
                        <Button variant={'all' === postLayoutStates.selectedChannelId ? 'contained' : 'text'} size='small' onClick={handleChannelSelect('all')} >
                            <Typography variant={'body2'} color={'all' === postLayoutStates.selectedChannelId ? 'white' : 'text.secondary'} sx={{ backgroundColor: 'primary' }}>
                                {langConfigs.allPosts[preferenceStates.lang]}
                            </Typography>
                        </Button>

                        {/* other channels */}
                        {channelInfoStates.channelIdSequence.map(id =>
                            <Button
                                key={`button-${channelInfoDict_ss[id].channelId}`}
                                variant={channelInfoDict_ss[id].channelId === postLayoutStates.selectedChannelId ? 'contained' : 'text'}
                                size='small'
                                sx={{ minWidth: 'en' === preferenceStates.lang ? 'max-content' : 64 }}
                                onClick={handleChannelSelect(channelInfoDict_ss[id].channelId)}
                            >
                                <Typography
                                    variant={'body2'}
                                    color={channelInfoDict_ss[id].channelId === postLayoutStates.selectedChannelId ? 'white' : 'text.secondary'}
                                    sx={{ backgroundColor: 'primary' }}
                                >
                                    {channelInfoDict_ss[id].name[preferenceStates.lang]}
                                </Typography>
                            </Button>

                        )}
                    </Stack>

                    {0 === masonryPostInfoArr.length &&
                        <Box minHeight={200} mt={10}>
                            {/* "mycreations" | "savedposts" | "browsinghistory" */}
                            {'mycreations' === postLayoutStates.selectedCategory && <Typography color={'text.secondary'} align={'center'}>
                                {authorId === processStates.viewerId ? langConfigs.noCreationsRecord[preferenceStates.lang] : langConfigs.authorNoCreationsRecord[preferenceStates.lang]}
                            </Typography>}
                            {'savedposts' === postLayoutStates.selectedCategory && <Typography color={'text.secondary'} align={'center'}>
                                {authorId === processStates.viewerId ? langConfigs.noSavedPostsRecord[preferenceStates.lang] : langConfigs.authorNoSavedPostsRecord[preferenceStates.lang]}
                            </Typography>}
                            {'browsinghistory' === postLayoutStates.selectedCategory && <Typography color={'text.secondary'} align={'center'}>
                                {langConfigs.noBrowsingHistoryRecord[preferenceStates.lang]}
                            </Typography>}
                        </Box>
                    }

                    {/* mansoy */}
                    <Box ml={1} ref={masonryWrapper}>
                        <Masonry columns={{ xs: 2, sm: 3, md: 2, lg: 3, xl: 4 }}>

                            {/* posts */}
                            {0 !== masonryPostInfoArr.length && masonryPostInfoArr.map(info =>
                                <Paper key={info.postId} id={info.postId} sx={{ maxWidth: 300, '&:hover': { cursor: 'pointer' } }}>
                                    <Stack>
                                        {/* image */}
                                        <Box
                                            component={'img'}
                                            src={provideCoverImageUrl(info.postId, domain)}
                                            sx={{
                                                maxWidth: { xs: width / 2, sm: 300 },
                                                maxHeight: 'max-content',
                                                borderTopLeftRadius: 4,
                                                borderTopRightRadius: 4
                                            }}
                                            onClick={handleClickOnPost(info.postId)}
                                        />

                                        {/* title */}
                                        <Box paddingTop={2} paddingX={2} onClick={handleClickOnPost(info.postId)}>
                                            <Typography variant={'body1'}>{info.title}</Typography>
                                        </Box>

                                        {/* member info & member behaviour */}
                                        <Box paddingTop={1} >
                                            <Grid container>

                                                {/* member info */}
                                                <Grid item flexGrow={1}>
                                                    <Box display={'flex'} flexDirection={'row'}>
                                                        <Button variant={'text'} color={'inherit'} sx={{ textTransform: 'none' }} onClick={handleClickOnMemberInfo(info.memberId, info.postId)}>
                                                            <Avatar src={provideAvatarImageUrl(authorId, domain)} sx={{ width: { xs: 24, sm: 32 }, height: { xs: 24, sm: 32 }, bgcolor: 'grey' }}>{info.nickname?.charAt(0).toUpperCase()}</Avatar>
                                                            <Box ml={1}>

                                                                {/* nickname */}
                                                                <Typography fontSize={14}>{getNicknameBrief(info.nickname)}</Typography>

                                                                {/* created time */}
                                                                <Typography fontSize={12} align={'left'}>{timeToString(info.createdTimeBySecond, preferenceStates.lang)}</Typography>
                                                            </Box>
                                                        </Button>
                                                    </Box>
                                                </Grid>

                                                {/* member behaviour / placeholder */}
                                                {('authenticated' === status && authorId === processStates.viewerId) && <Grid item>
                                                    <IconButton sx={{ mt: 1 }} onClick={async () => { await handleMultiProposeButtonClick(postLayoutStates.selectedCategory, info.postId); }}>
                                                        {'mycreations' === postLayoutStates.selectedCategory && <CreateIcon color={'inherit'} sx={{ fontSize: { xs: 20, sm: 24 } }} />}
                                                        {'savedposts' === postLayoutStates.selectedCategory && <StarIcon color={undoSavedPostArr.includes(info.postId) ? 'inherit' : 'warning'} sx={{ fontSize: { xs: 20, sm: 24 } }} />}
                                                        {'browsinghistory' === postLayoutStates.selectedCategory && <DeleteIcon color={'inherit'} sx={{ fontSize: { xs: 20, sm: 24 } }} />}
                                                    </IconButton>
                                                </Grid>}
                                            </Grid>
                                        </Box>
                                    </Stack>
                                </Paper>
                            )}
                        </Masonry>
                    </Box>

                </Grid>

                {/* //// placeholder - right //// */}
                <Grid item xs={0} sm={1} md={2} lg={2} xl={1}></Grid>
            </Grid>

            <Copyright sx={{ mt: 16 }} lang={preferenceStates.lang} />
            <Terms sx={{ mb: 8 }} lang={preferenceStates.lang} />

            {/* info editor */}
            <SwipeableDrawer
                anchor="bottom"
                open={authorInfoEditorStates.open}
                onClose={handleToggleEditor(false)}
                onOpen={handleToggleEditor(true)}
                swipeAreaWidth={50}
                disableSwipeToOpen={false}
                ModalProps={{
                    keepMounted: true,
                }}

            >
                <StyledBox sx={{ px: { xs: 2, sm: 2, md: 4 }, pt: { xs: 2, sm: 2, md: 4 }, height: '100%', overflow: 'auto', }}>

                    {/* puller (for mobile) */}
                    <Puller />

                    {/* buttons */}
                    <Grid container>

                        {/* 'cancel' button */}
                        <Grid item ><Button variant='text' onClick={handleToggleEditor(false)}>{langConfigs.cancel[preferenceStates.lang]}</Button></Grid>

                        {/* placeholder */}
                        <Grid item flexGrow={1}></Grid>

                        {/* 'update' button */}
                        <Grid item><Button variant='contained'>{langConfigs.update[preferenceStates.lang]}</Button></Grid>

                    </Grid>

                    {/* avatar image */}
                    <CentralizedBox sx={{ pt: 2 }}>
                        <Avatar src={authorInfoSettingStates.alternativeImageUrl} sx={{ width: { xs: 96, md: 128 }, height: { xs: 96, md: 128 }, }}></Avatar>
                    </CentralizedBox>

                    {/* 'open file' button */}
                    <CentralizedBox mt={1}>
                        <Box>
                            <IconButton color={'primary'} aria-label={'upload picture'} component={'label'} >
                                <input hidden accept={'image/*'} type={'file'} onChange={handleOpenFile} />
                                <PhotoCamera />
                            </IconButton>
                        </Box>
                    </CentralizedBox>

                    <CentralizedBox mt={0}>
                        <Typography color={'grey'} variant={'body2'} align={'center'}>{langConfigs.avatarImageRequirement[preferenceStates.lang]}</Typography>
                    </CentralizedBox>

                    {/* nickname */}
                    <CentralizedBox sx={{ pt: 1 }}>
                        <TextField
                            error={authorInfoSettingStates.displayError}
                            label={langConfigs.newNickname[preferenceStates.lang]}
                            value={authorInfoSettingStates.alternativeName}
                            onChange={handleNicknameChange}
                            size={'medium'}
                            fullWidth
                        />
                    </CentralizedBox>

                    <CentralizedBox mt={1}>
                        <Typography color={'grey'} variant={'body2'} align={'center'}>{langConfigs.nicknameRequirement[preferenceStates.lang]}</Typography>
                    </CentralizedBox>

                    {/* brief intro */}
                    <CentralizedBox sx={{ pt: 3 }}>
                        <TextField
                            error={authorInfoSettingStates.displayError}
                            label={langConfigs.briefIntro[preferenceStates.lang]}
                            multiline
                            rows={4}
                            value={authorInfoSettingStates.alternativeIntro}
                            placeholder={langConfigs.brieflyIntrodueYourself[preferenceStates.lang]}
                            onChange={handleBriefIntroChange}
                            size={'medium'}
                            fullWidth
                        />
                    </CentralizedBox>


                    {/* requirenment */}
                    <CentralizedBox mt={1}>
                        <Typography color={'grey'} variant={'body2'} align={'center'}>{langConfigs.briefIntroRequirement[preferenceStates.lang]}</Typography>
                    </CentralizedBox>

                    {/* requirenment */}
                    <CentralizedBox>
                        <Typography color={'grey'} variant={'body2'} align={'center'}>{langConfigs.referToCommunityGuidelines[preferenceStates.lang]}</Typography>
                    </CentralizedBox>
                </StyledBox>



            </SwipeableDrawer>

        </>

    );
};

export default Member;