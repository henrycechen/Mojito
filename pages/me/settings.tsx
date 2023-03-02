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

import Navbar from '../../ui/Navbar';

import { IConciseMemberInfo, IConciseMemberStatistics, IRestrictedMemberComprehensive } from '../../lib/interfaces/member';
import { IConcisePostComprehensive } from '../../lib/interfaces/post';
import { INoticeInfoWithMemberInfo } from '../../lib/interfaces/notification';
import { IChannelInfoStates, IChannelInfoDictionary } from '../../lib/interfaces/channel';

import { TBrowsingHelper, LangConfigs, TPreferenceStates } from '../../lib/types';

import { timeToString, getContentBrief, updateLocalStorage, provideLocalStorage, restoreFromLocalStorage, logWithDate } from '../../lib/utils/general';
import { verifyId, verifyNoticeId, verifyPassword } from '../../lib/utils/verify';
import { provideAvatarImageUrl, getNicknameBrief, fakeConciseMemberInfo, fakeConciseMemberStatistics, fakeRestrictedMemberInfo } from '../../lib/utils/for/member';
import { noticeIdToUrl, noticeInfoToString } from '../../lib/utils/for/notification';

import { CentralizedBox, ResponsiveCard, StyledSwitch, TextButton } from '../../ui/Styled';

import FormGroup from '@mui/material/FormGroup';
import Switch from '@mui/material/Switch';
import Checkbox from '@mui/material/Checkbox';
import Link from '@mui/material/Link';

import DoneIcon from '@mui/icons-material/Done';

import axios, { AxiosError, AxiosResponse } from 'axios';
import Copyright from '../../ui/Copyright';
import Terms from '../../ui/Terms';
import Table from '@mui/material/Table/Table';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';

import { createTheme, responsiveFontSizes, styled, ThemeProvider } from '@mui/material/styles';
import { provideCoverImageUrl } from '../../lib/utils/for/post';

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

type TMemberPageProcessStates = {
    selectedLayout: 'messagelayout' | 'listlayout' | 'postlayout' | 'settinglayout';
};

const domain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? '';
const defaultLang = process.env.NEXT_PUBLIC_APP_LANG ?? 'tw';
const langConfigs: LangConfigs = {
    message: {
        tw: '訊息',
        cn: '消息',
        en: 'Message'
    },
    following: {
        tw: '訂閲',
        cn: '粉丝',
        en: 'Following'
    },
    myFollowing: {
        tw: '我的訂閲',
        cn: '我的关注',
        en: 'My following'
    },
    hisFollowing: {
        tw: '作者的訂閲',
        cn: '作者的关注和粉丝',
        en: `Author's following`
    },
    authorsFollowing: {
        tw: '作者的訂閲',
        cn: '作者的关注',
        en: `Author's following`
    },
    followedBy: {
        tw: '訂閲',
        cn: '粉丝',
        en: 'Followed'
    },
    myFollowedBy: {
        tw: '訂閲我的用戶',
        cn: '我的粉丝',
        en: 'My fans'
    },
    authorsFollowedBy: {
        tw: '訂閲作者的用戶',
        cn: '作者的粉丝',
        en: `Author's following`
    },
    undoFollow: {
        tw: '取消訂閲',
        cn: '取关',
        en: 'Undo'
    },
    posts: {
        tw: '帖子',
        cn: '帖子',
        en: 'Posts'
    },
    authorsPosts: {
        tw: '作者的創作和收藏',
        cn: '作者的发布和收藏',
        en: `Author's creations and saved posts`
    },
    creations: {
        tw: '創作',
        cn: '发布',
        en: 'Creations'
    },
    myCreations: {
        tw: '我的創作',
        cn: '我的发布',
        en: 'My creations'
    },
    authorsCreations: {
        tw: '作者的創作',
        cn: '作者的发布',
        en: `Author's creations`
    },
    saved: {
        tw: '收藏',
        cn: '收藏',
        en: 'Saved'
    },
    mySavedPosts: {
        tw: '我的收藏',
        cn: '我的收藏',
        en: 'Saved'
    },
    authorsSavedPosts: {
        tw: '作者的收藏',
        cn: '作者的收藏',
        en: `Author's saved posts`
    },
    allPosts: {
        tw: '全部',
        cn: '全部',
        en: 'All posts'
    },
    hotPosts: {
        tw: '熱帖',
        cn: '最热',
        en: 'Hotest'
    },
    newPosts: {
        tw: '新帖',
        cn: '最新',
        en: 'Newest'
    },
    like: {
        tw: '喜歡',
        cn: '获赞',
        en: 'Like'
    },
    liked: {
        tw: '喜歡',
        cn: '赞过',
        en: 'Liked'
    },
    replied: {
        tw: '回復',
        cn: '回复',
        en: 'Liked'
    },
    cued: {
        tw: '提及',
        cn: '提及',
        en: 'Cued'
    },
    history: {
        tw: '歷史',
        cn: '历史',
        en: 'History'
    },
    browsingHistory: {
        tw: '瀏覽歷史',
        cn: '历史记录',
        en: 'History'
    },
    settings: {
        tw: '設定',
        cn: '设置',
        en: 'Settings'
    },
    submit: {
        tw: '提交',
        cn: '提交',
        en: 'Submit'
    },
    noNotificationRecord: {
        tw: '暫時沒有本類別的訊息',
        cn: '暂时没有本类别的讯息',
        en: 'No records of notification'
    },
    noFollowingMemberInfoRecord: {
        tw: '您沒有訂閲其他用戶',
        cn: '您没有关注其他用户',
        en: 'You have not followed any members'
    },
    authorNoFollowingMemberInfoRecord: {
        tw: '作者沒有訂閲其他用戶',
        cn: '作者没有关注其他用户',
        en: 'Author has not followed any members'
    },
    noFollowedByMemberInfoRecord: {
        tw: '暫時沒有其他用戶訂閲您',
        cn: '暂时没有其他用户关注您',
        en: 'No records of following members'
    },
    authorNoFollowedByMemberInfoRecord: {
        tw: '暫時沒有其他用戶訂閲作者',
        cn: '暂时没有其他用户关注作者',
        en: 'No records of following members'
    },
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
    //// Avatar setting ////
    avatar: {
        tw: '相片',
        cn: '头像',
        en: 'Avatar'
    },
    upload: {
        tw: '上傳',
        cn: '上传',
        en: 'Upload'
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
    update: {
        tw: '更新',
        cn: '更新',
        en: 'Update'
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
        tw: '暱稱不合規或已被佔用，點擊以重試',
        cn: '昵称不合规或已被占用，点击以重试',
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
    //// Password setting ////
    password: {
        tw: '密碼',
        cn: '密码',
        en: 'Password'
    },
    currentPassword: {
        tw: '現有密碼',
        cn: '现有密码',
        en: 'Current password'
    },
    newPassword: {
        tw: '新密碼',
        cn: '新密码',
        en: 'New password'
    },
    repeatPassword: {
        tw: '重複鍵入新密碼',
        cn: '重复输入新密码',
        en: 'Repeat new password'
    },
    mismatchedPassword: {
        tw: '兩次輸入的密碼不相符，請重試',
        cn: '两次输入的密码不相符，请重试',
        en: 'Passwords do not match'
    },
    currentPasswordMismatched: {
        tw: '現有密碼與我們的記錄不符，請重試',
        cn: '现有密码与我们的记录不符，请重试',
        en: 'Password does not meet complexity requirements'
    },
    unsatisfiedPassword: {
        tw: '密碼不符合複雜性要求，請重試',
        cn: '密码不符合复杂性要求，请重试',
        en: 'Current password does not match the one on our records'
    },
    passwordLengthRequirement: {
        tw: '*密碼長度不得少於 8 個字符。',
        cn: '*密码长度不得少于 8 个字符。',
        en: '*Password must be at least 8 characters long'
    },
    passwordComplexityRequirement: {
        tw: '請包括大寫字母、小寫字母、數字和至少一個特殊字符。',
        cn: '请包括大写字母、小写字母、数字和至少一个特殊字符。',
        en: 'Please include uppercase, lowercase letters, digits and at least one special characters.'
    },
    forgotPassword: {
        tw: '我忘記密碼了...',
        cn: '我忘记密码了...',
        en: 'I forgot my password...'

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
        tw: '*請添加符合規則的簡介並且長度不超過21個字符',
        cn: '*请添加符合规则的简介并且长度不超过21个字符',
        en: '*Please add a brief intro that complies with the rules and the length does not exceed 21 characters'
    },
    invalidBriefIntro: {
        tw: '簡介長度超過21個字符或不合規，請重試',
        cn: '简介长度超过21个字符或不合规，请重试',
        en: 'Brief intro length exceeds limit or invalid'
    },
    //// Gender setting ////
    gender: {
        tw: '性別',
        cn: '性别',
        en: 'Gender'
    },
    female: {
        tw: '女',
        cn: '女',
        en: 'Female'
    },
    male: {
        tw: '男',
        cn: '男',
        en: 'Male'
    },
    keepAsSecret: {
        tw: '我選擇不透露',
        cn: '保密',
        en: 'Keep as secret'
    },
    //// Birthday setting ////
    birthday: {
        tw: '生日',
        cn: '生日',
        en: 'Birthday'
    },
    chooseYourBirthday: {
        tw: '選擇您的出生日期',
        cn: '选择您的生日',
        en: 'Choose your birthday'
    },
    //// Privacy setting ////
    privacySettings: {
        tw: '設定',
        cn: '设置',
        en: 'Settings'
    },
    privacy: {
        tw: '隱私',
        cn: '隐私',
        en: 'Privacy'
    },
    language: {
        tw: '語言',
        cn: '语言',
        en: 'Language'
    },
    cancel: {
        tw: '注銷',
        cn: '注銷',
        en: 'Confirm'
    },
    cancelSucceeded: {
        tw: '注銷成功',
        cn: '注銷成功',
        en: 'Success'
    },
    cancelFailed: {
        tw: '注銷失敗，點擊以重試',
        cn: '注銷失败，点击以重试',
        en: 'Cancel membership failed, click to re-try',
    },
    allowVisitingFollowedMembers: {
        tw: '允許他人查看您的訂閲',
        cn: '允许他人查看您的订阅',
        en: 'Allow other members visiting your followed members'
    },
    allowVisitingSavedPosts: {
        tw: '允許他人訪問您的收藏',
        cn: '允许他人访问您的收藏',
        en: 'Allow other members visiting your saved posts'
    },
    clickXTimesToCancelMemberShip: {
        tw: (t: number) => 0 !== t ? `繼續點擊${t}次以注銷賬號` : `繼續點擊以注銷賬號`,
        cn: (t: number) => 0 !== t ? `继续点击${t}次以注销账户` : `继续点击以注销账户`,
        en: (t: number) => 0 !== t ? `Keep taping ${t} times to cancel membershipt` : `Keep taping to cancel membershipt`,
    },
    allowKeepingBrowsingHistory: {
        tw: '保存您的瀏覽記錄',
        cn: '保存您的浏览记录',
        en: 'Save browsing history'

    },
    hidePostsAndCommentsOfBlockedMember: {
        tw: '隱藏屏蔽的用戶的作品和評論',
        cn: '隐藏屏蔽的用户的作品与评论',
        en: 'Hide posts and comments from blocked member'

    },
    wishToCancelMembership: {
        tw: '我希望注銷我的賬號',
        cn: '我希望注销我的账户',
        en: 'I wish to cancel my membership'
    },
    //// Black list ////
    blacklist: {
        tw: '黑名單',
        cn: '黑名单',
        en: 'Blacklist'
    },
    noRecordOfBlacklist: {
        tw: '您還沒有屏蔽任何用戶',
        cn: '您还没有屏蔽任何用户',
        en: 'You have not blocked any members'
    },
    undoBlock: {
        tw: '移除',
        cn: '移除',
        en: 'Undo'
    },
    //// Member info ////
    info: {
        tw: '資訊',
        cn: '信息',
        en: 'Info'
    },
    memberInfo: {
        tw: '賬號資訊',
        cn: '账户信息',
        en: 'Member info'
    },
    memberId: {
        tw: '賬號 ID',
        cn: '账户 ID',
        en: 'Member ID'
    },
    emailAddress: {
        tw: '郵件地址',
        cn: '电子邮箱',
        en: 'Email'
    },
    registeredDate: {
        tw: '注冊日期',
        cn: '注册日期',
        en: 'Register date'
    },
    verifiedDate: {
        tw: '驗證日期',
        cn: '验证日期',
        en: 'Verified date'
    },
    memberStatus: {
        tw: '賬號狀況',
        cn: '账户状态',
        en: 'Member status'
    },
    normalStatus: {
        tw: '正常',
        cn: '正常',
        en: 'normal'
    },
    restrictedStatus: {
        tw: '受限',
        cn: '受限',
        en: 'restricted'
    },
    memberStatistics: {
        tw: '統計數據',
        cn: '统计数据',
        en: 'Member statistics'
    },
    totalCreationCount: {
        tw: '創作',
        cn: '发布',
        en: 'Total creations'
    },
    totalCreationHitCount: {
        tw: '觀看',
        cn: '浏览',
        en: 'Total creation viewed'
    },
    totalCreationLikedCount: {
        tw: '喜歡',
        cn: '点赞',
        en: 'Total creation liked'
    },
    totalCreationSavedCount: {
        tw: '收藏',
        cn: '收藏',
        en: 'Total creation saved'
    },
    totalFollowedByCount: {
        tw: '訂閲',
        cn: '粉丝',
        en: 'Followers'
    },
};

let theme = createTheme({
    typography: {
        body2: {
            fontSize: 14, // Default font size
            '@media (min-width:600px)': { // Font size when screen width is >= 600px
                fontSize: 16,
            },
        }
    }
});

theme = responsiveFontSizes(theme);

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

const Member = () => {

    const router = useRouter();

    const { data: session, status } = useSession();

    let memberId = '';

    React.useEffect(() => {

        if ('unauthenticated' === status) {
            signIn();
        }
        if ('authenticated' === status) {
            const viewerSession: any = { ...session };
            memberId = viewerSession?.user?.id;
            restorePreferenceStatesFromCache(setPreferenceStates);
        }
    }, [session]);


    type TMemberInfoStates = {
        avatarImageUrl: string;
        nickname: string;
        briefIntro: string;
        gender: number;
        birthdayBySecond: number;
    };

    //////// STATES - memberInfo ////////
    const [memberInfoStates, setMemberInfoStates] = React.useState<TMemberInfoStates>({
        avatarImageUrl: provideAvatarImageUrl(memberId, domain),
        nickname: '',
        briefIntro: '',
        gender: -1,
        birthdayBySecond: 0,
    });

    //////// STATES - preference ////////
    const [preferenceStates, setPreferenceStates] = React.useState<TPreferenceStates>({
        lang: defaultLang,
        mode: 'light'
    });


    //////// STATES - process ////////
    const [processStates, setProcessStates] = React.useState<TMemberPageProcessStates>({
        selectedLayout: 'postlayout', // default
    });



  
    ////////////////////////   Post Layout   ////////////////////////
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
        // Step #1 update post layout states
        setPostLayoutStates(states);
        // Step #2 update post layout states cache
        updatePostsLayoutStatesCache(states);
        // Step #3 reset helper
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
        // Step #1 update post layout states
        setPostLayoutStates(states);
        // Step #2 update post layout states cache
        updatePostsLayoutStatesCache(states);
        // Step #3 reset helper
        setBrowsingHelper({ ...browsingHelper, memorizeViewPortPositionY: undefined });
    };

    const handleSwitchChange = () => {
        let states: TPostsLayoutStates = { ...postLayoutStates, selectedHotPosts: !postLayoutStates.selectedHotPosts };
        // Step #1 update post layout states
        setPostLayoutStates(states);
        // Step #2 update post layout states cache
        updatePostsLayoutStatesCache(states);
        // Step #3 reset helper
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
        if (processStates.selectedLayout === 'postlayout' && postLayoutStates.wasRedirected) {
            const postId = postLayoutStates.memorizeLastViewedPostId;
            // Step #1 restore browsing position
            if (!postId) {
                return;
            } else if (600 > window.innerWidth) { // 0 ~ 599
                setBrowsingHelper({ ...browsingHelper, memorizeViewPortPositionY: (document.getElementById(postId)?.offsetTop ?? 0) / 2 - 200 });
            } else { // 600 ~ ∞
                setBrowsingHelper({ ...browsingHelper, memorizeViewPortPositionY: postLayoutStates.memorizeViewPortPositionY });
            }
            // Step #2 update process states and cache
            let states1: TMemberPageProcessStates = { ...processStates };
            setProcessStates({ ...states1 });
            updateProcessStatesCache(states1);
            let states2: TPostsLayoutStates = { ...postLayoutStates, memorizeLastViewedPostId: undefined, memorizeViewPortPositionY: undefined, wasRedirected: false };
            // Step #3 update post layout states and cache
            setPostLayoutStates({ ...states2 });
            updatePostsLayoutStatesCache(states2);
        }
    }, [masonryPostInfoArr]);

    if (!!browsingHelper.memorizeViewPortPositionY) {
        window.scrollTo(0, browsingHelper.memorizeViewPortPositionY ?? 0);
    }

    const handleClickOnPost = (postId: string) => (event: React.MouseEvent) => {
        // Step #1 update process states and post layout cache
        updateProcessStatesCache({ ...processStates, wasRedirected: true });
        updatePostsLayoutStatesCache({ ...postLayoutStates, memorizeLastViewedPostId: postId, memorizeViewPortPositionY: window.scrollY });
        // Step #2 jump
        router.push(`/post/${postId}`);
    };

    const handleClickOnMemberInfo = (memberId: string, postId: string) => (event: React.MouseEvent) => {
        // Step #1 update process states and post layout cache
        updateProcessStatesCache({ ...processStates, wasRedirected: true });
        updatePostsLayoutStatesCache({ ...postLayoutStates, memorizeLastViewedPostId: postId, memorizeViewPortPositionY: window.scrollY });
        // Step #2 jump
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
            // Step #1 mark post of chice as 'undo-saved'
            if (undoSavedPostArr.includes(postId)) {
                const update = undoSavedPostArr.filter(id => postId !== id);
                setUndoSavedPostArr([...update]);
            } else {
                setUndoSavedPostArr([...undoSavedPostArr, postId]);
            }
            // Step #2 request to delete record
            const resp = await fetch(``);
            if (200 !== resp.status) {
                console.log('Attempt to undo/do save post');
            }
        }

        // delete browsing history
        if ('browsinghistory' === categoryId) {
            // Step #1 remove post card
            const update = masonryPostInfoArr.filter(po => po.postId !== postId);
            setMasonryPostInfoArr([...update]);
            // Step #2 request to delete record
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

    //////////////////////// Setting Layout ////////////////////////

    type TSettingLayoutStates = {
        selectedSettingId: number;
        blacklist: IConciseMemberInfo[];
    };

    //////// STATES - setting layout ////////
    const [settinglayoutStates, setSettingLayoutStates] = React.useState<TSettingLayoutStates>({
        selectedSettingId: 0,
        blacklist: [],
    });

    React.useEffect(() => { updateSettingslayoutStates(); }, [settinglayoutStates.selectedSettingId]);

    const updateSettingslayoutStates = async () => {
        // TODO: 1 ~ 6 have not satistied
        if (7 === settinglayoutStates.selectedSettingId) {
            const resp = await fetch(`/api/member/blockedbyme/${authorId}`);
            if (200 !== resp.status) {
                console.log(`Attempt to GET blocked member info array`);
                return;
            }
            try {
                const arr = await resp.json();
                setSettingLayoutStates({ ...settinglayoutStates, blacklist: [...arr] });
            } catch (e) {
                console.log(`Attempt to get blocked member info array of from resp. ${e}`);
            }
        }
    };

    const handleSettingSelect = (settingId: number) => (event: React.SyntheticEvent) => {
        setSettingLayoutStates({ ...settinglayoutStates, selectedSettingId: settingId });
    };

    //////// COMPONENT - setting layout ////////
    const SettingLayout = () => {

        //// Avatar Image ////
        const AvatarImageSetting = () => {
            type TAvatarImageSettingStates = {
                alternativeImageUrl: string | undefined;
                disableButton: boolean;
                progressStatus: 0 | 100 | 300 | 400;
            };

            const [avatarImageSettingStates, setAvatarImageSettingStates] = React.useState<TAvatarImageSettingStates>({
                alternativeImageUrl: provideAvatarImageUrl(authorId, domain),
                disableButton: true,
                progressStatus: 0
            });

            const handleOpenFile = (event: React.ChangeEvent<HTMLInputElement>) => {
                if (event.target.files?.length !== 0 && event.target.files !== null) {
                    const url = URL.createObjectURL(event.target.files[0]);
                    setAvatarImageSettingStates({ ...avatarImageSettingStates, alternativeImageUrl: url, disableButton: false, progressStatus: 100 });
                }
            };

            const handleUploadAvatarImage = async () => {
                if (!(undefined !== avatarImageSettingStates.alternativeImageUrl && '' !== avatarImageSettingStates.alternativeImageUrl)) {
                    return;
                }

                // Prepare to upload avatar image
                setAvatarImageSettingStates({ ...avatarImageSettingStates, disableButton: true, progressStatus: 300 });
                let formData = new FormData();
                const config = {
                    headers: { 'Content-Type': 'multipart/form-data' },
                    onUploadProgress: (event: any) => {
                        console.log(`Upload progress:`, Math.round((event.loaded * 100) / event.total));
                    }
                };

                // Retrieve file and measure the size
                const bb = await fetch(avatarImageSettingStates.alternativeImageUrl).then(r => r.blob());
                if ((await bb.arrayBuffer()).byteLength > 2097152) { // new image file no larger than 2 MB
                    setAvatarImageSettingStates({ ...avatarImageSettingStates, disableButton: false, progressStatus: 400 });
                    return;
                }

                // Post avatar image file
                formData.append('image', bb);
                await axios.post(`/api/avatar/upload/${authorId}`, formData, config)
                    .then((response: AxiosResponse) => {
                        setMemberInfoStates({ ...memberInfoStates, avatarImageUrl: provideAvatarImageUrl(authorId, domain, true) });
                    })
                    .catch((error: AxiosError) => {
                        setAvatarImageSettingStates({ ...avatarImageSettingStates, disableButton: true, progressStatus: 400 });
                        console.log(`Attempt to upload avatar image. ${error}`);
                    });
            };

            return (
                <Box sx={{ paddingTop: 6 }}>

                    {/* image */}
                    <CentralizedBox>
                        <Avatar src={avatarImageSettingStates.alternativeImageUrl} sx={{ width: { xs: 96, md: 128 }, height: { xs: 96, md: 128 }, }}></Avatar>
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

                    {/* 'upload' button */}
                    <CentralizedBox mt={1}>
                        <Button variant='contained' color={400 !== avatarImageSettingStates.progressStatus ? 'primary' : 'error'} size={'small'} onClick={async () => { await handleUploadAvatarImage(); }} disabled={avatarImageSettingStates.disableButton}>
                            {/* button: disabled, result: 0 (no-file) */}
                            {0 === avatarImageSettingStates.progressStatus && <Typography variant={'body2'}>{langConfigs.chooseImageToUpload[preferenceStates.lang]}</Typography>}
                            {/* button: enabled, result: 100 (ready) */}
                            {100 === avatarImageSettingStates.progressStatus && <Typography variant={'body2'}>{langConfigs.upload[preferenceStates.lang]}</Typography>}
                            {/* button: disabled, result: 300 (ongoing) */}
                            {300 === avatarImageSettingStates.progressStatus && <Typography variant={'body2'}>{langConfigs.uploading[preferenceStates.lang]}</Typography>}
                            {/* button: enabled, result: 400 (failed) */}
                            {400 === avatarImageSettingStates.progressStatus && <Typography variant={'body2'}>{langConfigs.uploadFailed[preferenceStates.lang]}</Typography>}
                        </Button>
                    </CentralizedBox>

                    {/* requirenment */}
                    <CentralizedBox mt={2}>
                        <Typography color={'grey'} variant={'body2'} align={'center'}>{langConfigs.avatarImageRequirement[preferenceStates.lang]}</Typography>
                    </CentralizedBox>
                </Box>
            );
        };

        //// Nickname ////
        const NicknameSetting = () => {
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

            const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
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

            const handleSubmit = async () => {
                if ('' === nicknameSettingStates.alternativeName) {
                    return;
                }

                // Prepare to update nickname
                setNicknameSettingStates({ ...nicknameSettingStates, disableButton: true, progressStatus: 300 });
                const resp = await fetch(`/api/member/info/${authorId}/nickname`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ alternativeName: nicknameSettingStates.alternativeName })
                });

                if (200 === resp.status) {
                    setMemberInfoStates({ ...memberInfoStates, nickname: nicknameSettingStates.alternativeName });
                    setNicknameSettingStates({ ...nicknameSettingStates, disableButton: true, progressStatus: 200 });
                    setTimeout(() => {
                        setNicknameSettingStates({ ...nicknameSettingStates, progressStatus: 100 });
                    }, 2000);
                } else if (422 === resp.status) {
                    setNicknameSettingStates({ ...nicknameSettingStates, disableButton: false, progressStatus: 422 });
                } else {
                    setNicknameSettingStates({ ...nicknameSettingStates, disableButton: false, progressStatus: 500 });
                }

            };

            return (
                <Box sx={{ pt: { xs: 6, sm: 16 }, px: 2 }}>

                    {/* nickname input */}
                    <CentralizedBox>
                        <TextField
                            error={nicknameSettingStates.displayError}
                            label={langConfigs.newNickname[preferenceStates.lang]}
                            value={nicknameSettingStates.alternativeName}
                            onChange={handleChange}
                            size={'small'}
                        />
                    </CentralizedBox>

                    {/* 'update' button */}
                    <CentralizedBox sx={{ mt: 2 }}>
                        <Button variant='contained' color={![422, 500].includes(nicknameSettingStates.progressStatus) ? 'primary' : 'error'} size='small' onClick={async () => { await handleSubmit(); }} disabled={nicknameSettingStates.disableButton || '' === nicknameSettingStates.alternativeName}>
                            {/* button: enabled, result: 100 (ready) */}
                            {100 === nicknameSettingStates.progressStatus && <Typography variant={'body2'}>{langConfigs.update[preferenceStates.lang]}</Typography>}
                            {/* button: disabled/enabled, result: 200 (succeeded) */}
                            {200 === nicknameSettingStates.progressStatus && <Typography variant={'body2'}>{langConfigs.updateSucceeded[preferenceStates.lang]}</Typography>}
                            {/* button: disabled, result: 300 (ongoing) */}
                            {300 === nicknameSettingStates.progressStatus && <Typography variant={'body2'}>{langConfigs.updatinging[preferenceStates.lang]}</Typography>}
                            {/* button: enabled, result: 422 (confliect) */}
                            {422 === nicknameSettingStates.progressStatus && <Typography variant={'body2'}>{langConfigs.invalidNicknameOrConflict[preferenceStates.lang]}</Typography>}
                            {/* button: enabled, result: 500 (failed) */}
                            {500 === nicknameSettingStates.progressStatus && <Typography variant={'body2'}>{langConfigs.updateFailed[preferenceStates.lang]}</Typography>}
                        </Button>
                    </CentralizedBox>

                    {/* requirenment */}
                    <CentralizedBox mt={2}>
                        <Typography color={'grey'} variant={'body2'} align={'center'}>{langConfigs.nicknameRequirement[preferenceStates.lang]}</Typography>
                    </CentralizedBox>

                    {/* requirenment */}
                    <CentralizedBox>
                        <Typography color={'grey'} variant={'body2'} align={'center'}>{langConfigs.referToCommunityGuidelines[preferenceStates.lang]}</Typography>
                    </CentralizedBox>
                </Box>
            );
        };

        //// Password ////
        const PasswordeSetting = () => {

            type TPasswordSetting = {
                currentPassword: string;
                newPassword: string;
                repeatPassword: string;
                showPassword: boolean;
                disableButton: boolean;
                displayError0: boolean;
                displayError1: boolean;
                progressStatus: 0 | 100 | 200 | 300 | 400 | 422 | 500;
            };

            const [passwordSettingStates, setPasswordSettingStates] = React.useState<TPasswordSetting>({
                currentPassword: '',
                newPassword: '',
                repeatPassword: '',
                showPassword: false,
                disableButton: false,
                displayError0: false,
                displayError1: false,
                progressStatus: 100
            });

            const handleShowPassword = () => {
                setPasswordSettingStates({ ...passwordSettingStates, showPassword: !passwordSettingStates.showPassword });
            };

            const handleChange = (prop: keyof TPasswordSetting) => (event: React.ChangeEvent<HTMLInputElement>) => {
                if ('newPassword' === `${prop}` && passwordSettingStates.repeatPassword === event.target.value) {
                    setPasswordSettingStates({ ...passwordSettingStates, [prop]: event.target.value, displayError1: false });
                    return;
                }
                if ('repeatPassword' === `${prop}` && passwordSettingStates.newPassword === event.target.value) {
                    setPasswordSettingStates({ ...passwordSettingStates, [prop]: event.target.value, displayError1: false });
                    return;
                }
                setPasswordSettingStates({ ...passwordSettingStates, [prop]: event.target.value });
            };

            const handleSubmit = async () => {
                if (!('' !== passwordSettingStates.currentPassword && '' !== passwordSettingStates.newPassword && '' !== passwordSettingStates.repeatPassword)) {
                    return;
                }

                if (passwordSettingStates.newPassword !== passwordSettingStates.repeatPassword) {
                    setPasswordSettingStates({ ...passwordSettingStates, displayError1: true, progressStatus: 0 });
                    return;
                }

                if (!verifyPassword(passwordSettingStates.newPassword)) {
                    setPasswordSettingStates({ ...passwordSettingStates, displayError1: true, progressStatus: 422 });
                    return;
                }

                // Prepare to update password
                setPasswordSettingStates({ ...passwordSettingStates, displayError0: false, displayError1: false, disableButton: true, progressStatus: 300 });

                const resp = await fetch(`/api/member/info/${authorId}/password`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ currentPassword: passwordSettingStates.currentPassword, newPassword: passwordSettingStates.newPassword })
                });

                if (200 === resp.status) {
                    setPasswordSettingStates({ ...passwordSettingStates, displayError0: false, displayError1: false, disableButton: true, progressStatus: 200 });
                    setTimeout(() => {
                        setPasswordSettingStates({ ...passwordSettingStates, currentPassword: '', newPassword: '', repeatPassword: '', displayError0: false, displayError1: false, disableButton: false, progressStatus: 100 });
                    }, 2000);
                } else if (400 === resp.status) {
                    setPasswordSettingStates({ ...passwordSettingStates, displayError0: true, displayError1: false, disableButton: false, progressStatus: 400 });
                } else if (422 === resp.status) {
                    setPasswordSettingStates({ ...passwordSettingStates, displayError0: false, displayError1: true, disableButton: false, progressStatus: 422 });
                } else {
                    setPasswordSettingStates({ ...passwordSettingStates, displayError0: false, displayError1: false, disableButton: false, progressStatus: 500 });
                }
            };

            return (
                <Box sx={{ pt: 6, px: 2 }}>

                    {/* current password */}
                    <CentralizedBox>
                        <FormControl variant={'outlined'} size={'small'}>
                            <InputLabel htmlFor={'setting-password-current'}>{langConfigs.currentPassword[preferenceStates.lang]}</InputLabel>
                            <OutlinedInput
                                id={'setting-password-current'}
                                label={langConfigs.currentPassword[preferenceStates.lang]}
                                type={passwordSettingStates.showPassword ? 'text' : 'password'}
                                value={passwordSettingStates.currentPassword}
                                onChange={handleChange('currentPassword')}
                                endAdornment={
                                    <InputAdornment position={'end'}>
                                        <IconButton aria-label={'toggle password visibility'} onClick={handleShowPassword} edge={'end'}>
                                            {passwordSettingStates.showPassword ? <VisibilityIcon /> : <VisibilityOffIcon />}
                                        </IconButton>
                                    </InputAdornment>
                                }
                                error={passwordSettingStates.displayError0}
                            />
                        </FormControl>
                    </CentralizedBox>

                    {/* new password */}
                    <CentralizedBox sx={{ mt: 2 }}>
                        <FormControl variant='outlined' size='small'>
                            <InputLabel htmlFor='setting-password-new'>{langConfigs.newPassword[preferenceStates.lang]}</InputLabel>
                            <OutlinedInput
                                id={'setting-password-new'}
                                label={langConfigs.newPassword[preferenceStates.lang]}
                                type={passwordSettingStates.showPassword ? 'text' : 'password'}
                                value={passwordSettingStates.newPassword}
                                onChange={handleChange('newPassword')}
                                endAdornment={
                                    <InputAdornment position={'end'}>
                                        <IconButton aria-label={'toggle password visibility'} onClick={handleShowPassword} edge={'end'}>
                                            {passwordSettingStates.showPassword ? <VisibilityIcon /> : <VisibilityOffIcon />}
                                        </IconButton>
                                    </InputAdornment>
                                }
                                error={passwordSettingStates.displayError1}
                            />
                        </FormControl>
                    </CentralizedBox>

                    {/* repear new password */}
                    <CentralizedBox sx={{ mt: 2 }}>
                        <FormControl variant='outlined' size='small'>
                            <InputLabel htmlFor='setting-password-repeat'>{langConfigs.repeatPassword[preferenceStates.lang]}</InputLabel>
                            <OutlinedInput
                                id={'setting-password-repeat'}
                                label={langConfigs.repeatPassword[preferenceStates.lang]}
                                type={passwordSettingStates.showPassword ? 'text' : 'password'}
                                value={passwordSettingStates.repeatPassword}
                                onChange={handleChange('repeatPassword')}
                                endAdornment={
                                    <InputAdornment position={'end'}>
                                        <IconButton aria-label={'toggle password visibility'} onClick={handleShowPassword} edge={'end'}>
                                            {passwordSettingStates.showPassword ? <VisibilityIcon /> : <VisibilityOffIcon />}
                                        </IconButton>
                                    </InputAdornment>
                                }
                                error={passwordSettingStates.displayError1}
                            />
                        </FormControl>
                    </CentralizedBox>

                    {/* 'update' button */}
                    <CentralizedBox sx={{ mt: 2 }}>
                        <Button variant='contained' color={![0, 400, 422, 500].includes(passwordSettingStates.progressStatus) ? 'primary' : 'error'} size='small' onClick={async () => { await handleSubmit(); }}
                            disabled={passwordSettingStates.disableButton || !('' !== passwordSettingStates.currentPassword && '' !== passwordSettingStates.newPassword && '' !== passwordSettingStates.repeatPassword)}
                        >
                            {/* button: enabled, result: 0 (mismatch) */}
                            {0 === passwordSettingStates.progressStatus && <Typography variant={'body2'}>{langConfigs.mismatchedPassword[preferenceStates.lang]}</Typography>}
                            {/* button: enabled, result: 100 (ready) */}
                            {100 === passwordSettingStates.progressStatus && <Typography variant={'body2'}>{langConfigs.update[preferenceStates.lang]}</Typography>}
                            {/* button: disabled/enabled, result: 200 (succeeded) */}
                            {200 === passwordSettingStates.progressStatus && <Typography variant={'body2'}>{langConfigs.updateSucceeded[preferenceStates.lang]}</Typography>}
                            {/* button: disabled, result: 300 (ongoing) */}
                            {300 === passwordSettingStates.progressStatus && <Typography variant={'body2'}>{langConfigs.updatinging[preferenceStates.lang]}</Typography>}
                            {/* button: enabled, result: 400 (unsatisfied) */}
                            {400 === passwordSettingStates.progressStatus && <Typography variant={'body2'}>{langConfigs.currentPasswordMismatched[preferenceStates.lang]}</Typography>}
                            {/* button: enabled, result: 422 (unsatisfied) */}
                            {422 === passwordSettingStates.progressStatus && <Typography variant={'body2'}>{langConfigs.unsatisfiedPassword[preferenceStates.lang]}</Typography>}
                            {/* button: enabled, result: 500 (failed) */}
                            {500 === passwordSettingStates.progressStatus && <Typography variant={'body2'}>{langConfigs.updateFailed[preferenceStates.lang]}</Typography>}
                        </Button>
                    </CentralizedBox>

                    {/* requirenment */}
                    <CentralizedBox mt={2}>
                        <Typography color={'grey'} variant={'body2'} align={'center'}>{langConfigs.passwordLengthRequirement[preferenceStates.lang]}</Typography>
                    </CentralizedBox>
                    <CentralizedBox>
                        <Typography color={'grey'} variant={'body2'} align={'center'}>{langConfigs.passwordComplexityRequirement[preferenceStates.lang]}</Typography>
                    </CentralizedBox>

                    {/* forgot password link */}
                    <Box sx={{ mt: 6, paddingX: 2, textAlign: 'right' }} >
                        <Link href='/forgot' variant={'body2'}>
                            {langConfigs.forgotPassword[preferenceStates.lang]}
                        </Link>
                    </Box>
                </Box>
            );
        };

        //// Brief Intro ////
        const BriefIntroSetting = () => {
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

            const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
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

            const handleSubmit = async () => {
                if ('' === briefIntroSettingStates.alternativeIntro) {
                    return;
                }

                // Prepare to update nickname
                setBriefIntroSettingStates({ ...briefIntroSettingStates, disableButton: true, progressStatus: 300 });
                const resp = await fetch(`/api/member/info/${authorId}/briefintro`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ alternativeIntro: briefIntroSettingStates.alternativeIntro })
                });

                if (200 === resp.status) {
                    setMemberInfoStates({ ...memberInfoStates, briefIntro: briefIntroSettingStates.alternativeIntro });
                    setBriefIntroSettingStates({ ...briefIntroSettingStates, disableButton: true, progressStatus: 200 });
                    setTimeout(() => {
                        setBriefIntroSettingStates({ ...briefIntroSettingStates, progressStatus: 100 });
                    }, 2000);
                } else if (422 === resp.status) {
                    setBriefIntroSettingStates({ ...briefIntroSettingStates, disableButton: false, progressStatus: 422 });
                } else {
                    setBriefIntroSettingStates({ ...briefIntroSettingStates, disableButton: false, progressStatus: 500 });
                }
            };

            return (
                <Box sx={{ pt: { xs: 6, sm: 12 }, px: 2 }}>

                    {/* brief intro input */}
                    <CentralizedBox>
                        <TextField
                            error={briefIntroSettingStates.displayError}
                            label={langConfigs.briefIntro[preferenceStates.lang]}
                            multiline
                            rows={3}
                            value={briefIntroSettingStates.alternativeIntro}
                            placeholder={langConfigs.brieflyIntrodueYourself[preferenceStates.lang]}
                            onChange={handleChange}
                            size={'small'}
                            fullWidth
                        />
                    </CentralizedBox>

                    <CentralizedBox sx={{ mt: 2 }}>
                        <Button variant='contained' color={![422, 500].includes(briefIntroSettingStates.progressStatus) ? 'primary' : 'error'} size='small' onClick={async () => { await handleSubmit(); }} disabled={briefIntroSettingStates.disableButton}>
                            {/* button: enabled, result: 100 (ready) */}
                            {100 === briefIntroSettingStates.progressStatus && <Typography variant={'body2'}>{langConfigs.update[preferenceStates.lang]}</Typography>}
                            {/* button: disabled/enabled, result: 200 (succeeded) */}
                            {200 === briefIntroSettingStates.progressStatus && <Typography variant={'body2'}>{langConfigs.updateSucceeded[preferenceStates.lang]}</Typography>}
                            {/* button: disabled, result: 300 (ongoing) */}
                            {300 === briefIntroSettingStates.progressStatus && <Typography variant={'body2'}>{langConfigs.updatinging[preferenceStates.lang]}</Typography>}
                            {/* button: disabled, result: 422 (ongoing) */}
                            {422 === briefIntroSettingStates.progressStatus && <Typography variant={'body2'}>{langConfigs.invalidBriefIntro[preferenceStates.lang]}</Typography>}
                            {/* button: enabled, result: 500 (failed) */}
                            {500 === briefIntroSettingStates.progressStatus && <Typography variant={'body2'}>{langConfigs.updateFailed[preferenceStates.lang]}</Typography>}
                        </Button>
                    </CentralizedBox>

                    {/* requirenment */}
                    <CentralizedBox mt={2}>
                        <Typography color={'grey'} variant={'body2'} align={'center'}>{langConfigs.briefIntroRequirement[preferenceStates.lang]}</Typography>
                    </CentralizedBox>

                    {/* requirenment */}
                    <CentralizedBox>
                        <Typography color={'grey'} variant={'body2'} align={'center'}>{langConfigs.referToCommunityGuidelines[preferenceStates.lang]}</Typography>
                    </CentralizedBox>
                </Box>
            );
        };

        //// Gender ////
        const GenderSetting = () => {
            type TGenderSettingStates = {
                gender: number;
                disableButton: boolean;
                progressStatus: 100 | 200 | 300 | 400;
            };

            const [genderSettingStates, setGenderSettingStates] = React.useState<TGenderSettingStates>({
                gender: memberInfoStates.gender,
                disableButton: true,
                progressStatus: 100,
            });

            const handleChange = (event: SelectChangeEvent) => {
                setGenderSettingStates({ ...genderSettingStates, gender: parseInt(event.target.value), disableButton: memberInfoStates.gender === parseInt(event.target.value) });
            };

            const handleSubmit = async () => {
                if (memberInfoStates.gender === genderSettingStates.gender) {
                    return;
                }

                // Prepare to update gender
                setGenderSettingStates({ ...genderSettingStates, disableButton: true, progressStatus: 300 });
                const resp = await fetch(`/api/member/info/${authorId}/gender`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ gender: genderSettingStates.gender })
                });

                if (200 === resp.status) {
                    setGenderSettingStates({ ...genderSettingStates, disableButton: true, progressStatus: 200 });
                    setMemberInfoStates({ ...memberInfoStates, gender: genderSettingStates.gender });
                    setTimeout(() => {
                        setGenderSettingStates({ ...genderSettingStates, progressStatus: 100 });
                    }, 2000);
                } else {
                    setGenderSettingStates({ ...genderSettingStates, disableButton: false, progressStatus: 400 });
                }
            };

            return (
                <Box sx={{ pt: { xs: 6, sm: 18 }, px: 2 }}>

                    {/* gender select */}
                    <CentralizedBox>
                        <FormControl sx={{ minWidth: 100 }}>
                            <InputLabel id={'setting-gender-select-label'}>{langConfigs.gender[preferenceStates.lang]}</InputLabel>
                            <Select
                                labelId={'setting-gender-select-label'}
                                value={`${genderSettingStates.gender}`}
                                label={langConfigs.gender[preferenceStates.lang]}
                                onChange={handleChange}
                                size={'small'}
                                sx={{ width: 144 }}
                            >
                                <MenuItem value={0}>{langConfigs.female[preferenceStates.lang]}</MenuItem>
                                <MenuItem value={1}>{langConfigs.male[preferenceStates.lang]}</MenuItem>
                                <MenuItem value={-1}>{langConfigs.keepAsSecret[preferenceStates.lang]}</MenuItem>
                            </Select>
                        </FormControl>
                    </CentralizedBox>

                    {/* 'update' button */}
                    <CentralizedBox sx={{ mt: 2 }}>
                        <Button variant={'contained'} color={400 !== genderSettingStates.progressStatus ? 'primary' : 'error'} size={'small'} onClick={async () => { await handleSubmit(); }} disabled={genderSettingStates.disableButton}>
                            {/* button: enabled, result: 100 (ready) */}
                            {100 === genderSettingStates.progressStatus && <Typography variant={'body2'}>{langConfigs.update[preferenceStates.lang]}</Typography>}
                            {/* button: disabled/enabled, result: 200 (succeeded) */}
                            {200 === genderSettingStates.progressStatus && <Typography variant={'body2'}>{langConfigs.updateSucceeded[preferenceStates.lang]}</Typography>}
                            {/* button: disabled, result: 300 (ongoing) */}
                            {300 === genderSettingStates.progressStatus && <Typography variant={'body2'}>{langConfigs.updatinging[preferenceStates.lang]}</Typography>}
                            {/* button: enabled, result: 400 (failed) */}
                            {400 === genderSettingStates.progressStatus && <Typography variant={'body2'}>{langConfigs.updateFailed[preferenceStates.lang]}</Typography>}
                        </Button>
                    </CentralizedBox>
                </Box>
            );
        };

        //// Birthday ////
        const BirthdaySetting = () => {
            type TBirthdaySettingStates = {
                date: Dayjs | null;
                disableButton: boolean;
                progressStatus: 100 | 200 | 300 | 400;
            };

            const [birthdaySettingStates, setBirthdaySettingStates] = React.useState<TBirthdaySettingStates>({
                date: dayjs(memberInfoStates.birthdayBySecond * 1000),
                disableButton: true,
                progressStatus: 100,
            });

            const handleChange = (value: Dayjs | null) => {
                if (null == value) {
                    return;
                }
                if (0 !== memberInfoStates.birthdayBySecond - Math.floor((birthdaySettingStates.date?.toDate().getTime() ?? 1000) / 1000)) {
                    setBirthdaySettingStates({ ...birthdaySettingStates, date: value, disableButton: true });
                } else {
                    setBirthdaySettingStates({ ...birthdaySettingStates, date: value, disableButton: false });
                }
            };

            const handleSubmit = async () => {
                console.log(birthdaySettingStates.date?.toDate().getTime());
                console.log(memberInfoStates.birthdayBySecond - Math.floor((birthdaySettingStates.date?.toDate().getTime() ?? 1000) / 1000));

                if (!(null !== birthdaySettingStates.date && 0 !== memberInfoStates.birthdayBySecond - Math.floor((birthdaySettingStates.date?.toDate().getTime() ?? 1000) / 1000))) {
                    return;
                }

                // Prepare to update birthday
                setBirthdaySettingStates({ ...birthdaySettingStates, disableButton: true, progressStatus: 300 });
                const date = Math.floor(birthdaySettingStates.date?.toDate().getTime() / 1000);
                const resp = await fetch(`/api/member/info/${authorId}/birthday`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ date })
                });

                if (200 === resp.status) {
                    setBirthdaySettingStates({ ...birthdaySettingStates, disableButton: true, progressStatus: 200 });
                    setTimeout(() => {
                        setBirthdaySettingStates({ ...birthdaySettingStates, progressStatus: 100 });
                    }, 2000);
                } else {
                    setBirthdaySettingStates({ ...birthdaySettingStates, disableButton: false, progressStatus: 400 });
                }
            };

            return (
                <Box sx={{ pt: { xs: 6, sm: 16 }, px: 2 }}>

                    {/* birthday select */}
                    <CentralizedBox>
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <MobileDatePicker
                                label={langConfigs.chooseYourBirthday[preferenceStates.lang]}
                                inputFormat='DD/MM/YYYY'
                                value={birthdaySettingStates.date}
                                onChange={handleChange}
                                renderInput={(params) => <TextField {...params} />}

                            />
                        </LocalizationProvider>
                    </CentralizedBox>

                    {/* 'update' button */}
                    <CentralizedBox sx={{ mt: 2 }}>
                        <Button variant={'contained'} color={400 !== birthdaySettingStates.progressStatus ? 'primary' : 'error'} size={'small'} onClick={async () => { await handleSubmit(); }} disabled={birthdaySettingStates.disableButton}>
                            {/* button: enabled, result: 100 (ready) */}
                            {100 === birthdaySettingStates.progressStatus && <Typography variant={'body2'}>{langConfigs.update[preferenceStates.lang]}</Typography>}
                            {/* button: disabled/enabled, result: 200 (succeeded) */}
                            {200 === birthdaySettingStates.progressStatus && <Typography variant={'body2'}>{langConfigs.updateSucceeded[preferenceStates.lang]}</Typography>}
                            {/* button: disabled, result: 300 (ongoing) */}
                            {300 === birthdaySettingStates.progressStatus && <Typography variant={'body2'}>{langConfigs.updatinging[preferenceStates.lang]}</Typography>}
                            {/* button: enabled, result: 400 (failed) */}
                            {400 === birthdaySettingStates.progressStatus && <Typography variant={'body2'}>{langConfigs.updateFailed[preferenceStates.lang]}</Typography>}
                        </Button>
                    </CentralizedBox>
                </Box>
            );
        };

        //// Privacy ////
        const PrivacySettings = () => {

            type TPrivacySettingsStates = {
                allowKeepingBrowsingHistory: boolean;
                allowVisitingFollowedMembers: boolean;
                allowVisitingSavedPosts: boolean;
                hidePostsAndCommentsOfBlockedMember: boolean;
            };

            const [previousSettingsStates, setPreviousSettingsStates] = React.useState<TPrivacySettingsStates>({
                allowKeepingBrowsingHistory: memberComprehensive_ss.allowKeepingBrowsingHistory,
                allowVisitingFollowedMembers: memberComprehensive_ss.allowVisitingFollowedMembers,
                allowVisitingSavedPosts: memberComprehensive_ss.allowVisitingSavedPosts,
                hidePostsAndCommentsOfBlockedMember: memberComprehensive_ss.hidePostsAndCommentsOfBlockedMember
            });

            const [privacySettingsStates, setPrivacySettingsStates] = React.useState<TPrivacySettingsStates>({ ...previousSettingsStates });

            type TPrivacySettingProcessStates = {
                countdown: number;
                displayUpdateButton: boolean;
                displayCancelButton: boolean;
                displayCountdown: boolean;
                disableButton: boolean;
                progressStatus: 100 | 200 | 300 | 400;
            };

            const [privacySettingsProcessStates, setPrivacySettingsProcessStates] = React.useState<TPrivacySettingProcessStates>({
                countdown: 5,
                displayUpdateButton: false,
                displayCancelButton: false,
                displayCountdown: false,
                disableButton: false,
                progressStatus: 100,
            });

            const handleSelectLang = (event: SelectChangeEvent<string>) => {
                setPreferenceStates({ ...preferenceStates, lang: event.target.value });
                updatePreferenceStatesCache({ ...preferenceStates, lang: event.target.value });
            };

            const handleToggle = (prop: keyof TPrivacySettingsStates) => (event: React.ChangeEvent<HTMLInputElement>) => {
                setPrivacySettingsStates({ ...privacySettingsStates, [prop]: !privacySettingsStates[prop] });
            };

            React.useEffect(() => {
                if (
                    !(
                        previousSettingsStates.allowKeepingBrowsingHistory === privacySettingsStates.allowKeepingBrowsingHistory
                        && previousSettingsStates.allowVisitingFollowedMembers === privacySettingsStates.allowVisitingFollowedMembers
                        && previousSettingsStates.allowVisitingSavedPosts === privacySettingsStates.allowVisitingSavedPosts
                        && previousSettingsStates.hidePostsAndCommentsOfBlockedMember === privacySettingsStates.hidePostsAndCommentsOfBlockedMember
                    )
                ) {
                    setPrivacySettingsProcessStates({ ...privacySettingsProcessStates, displayUpdateButton: true });
                } else {
                    setPrivacySettingsProcessStates({ ...privacySettingsProcessStates, displayUpdateButton: false });
                }
            }, [privacySettingsStates]);

            const handleCheck = () => {
                setPrivacySettingsProcessStates({
                    ...privacySettingsProcessStates,
                    displayCancelButton: !privacySettingsProcessStates.displayCancelButton,
                    countdown: 5,
                    displayCountdown: false,
                    progressStatus: 100
                });
            };

            const handleUpdate = async () => {
                if (
                    previousSettingsStates.allowKeepingBrowsingHistory === privacySettingsStates.allowKeepingBrowsingHistory
                    && previousSettingsStates.allowVisitingFollowedMembers === privacySettingsStates.allowVisitingFollowedMembers
                    && previousSettingsStates.allowVisitingSavedPosts === privacySettingsStates.allowVisitingSavedPosts
                    && previousSettingsStates.hidePostsAndCommentsOfBlockedMember === privacySettingsStates.hidePostsAndCommentsOfBlockedMember
                ) {
                    return;
                }

                // Prepare to update privacy setting
                setPrivacySettingsProcessStates({ ...privacySettingsProcessStates, displayCancelButton: false, disableButton: true, progressStatus: 300 });
                const resp = await fetch(`/api/member/info/${authorId}/privacysetting`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ settings: { ...privacySettingsStates } })
                });

                if (200 === resp.status) {
                    setPreviousSettingsStates({ ...privacySettingsStates });
                    setPrivacySettingsProcessStates({ ...privacySettingsProcessStates, displayCancelButton: false, disableButton: true, progressStatus: 200 });
                    setTimeout(() => {
                        setPrivacySettingsProcessStates({ ...privacySettingsProcessStates, displayUpdateButton: false, progressStatus: 100 });
                    }, 2000);
                } else {
                    setPrivacySettingsProcessStates({ ...privacySettingsProcessStates, disableButton: false, progressStatus: 400 });
                }
            };

            const handleCancel = async () => {
                if (privacySettingsProcessStates.countdown > 0) {
                    setPrivacySettingsProcessStates({ ...privacySettingsProcessStates, countdown: privacySettingsProcessStates.countdown - 1, displayCountdown: true });
                } else {
                    const resp = await fetch(`/api/member/info/${authorId}/cancel`, { method: 'DELETE' });
                    if (200 === resp.status) {
                        setPrivacySettingsProcessStates({ ...privacySettingsProcessStates, displayCountdown: false, progressStatus: 200 });
                        signOut();
                    } else {
                        setPrivacySettingsProcessStates({ ...privacySettingsProcessStates, displayCountdown: false, progressStatus: 400 });
                    }
                }
            };

            return (
                <Box sx={{ pt: 3, px: 2 }}>
                    <FormGroup>

                        {/* language */}
                        <Typography variant={'body2'} >{langConfigs.language[preferenceStates.lang]}</Typography>
                        <Box pl={{ xs: 0, sm: 2, md: 4 }} pt={1}>
                            <Select
                                value={preferenceStates.lang}
                                onChange={handleSelectLang}
                                size={'small'}
                                sx={{ width: 144 }}
                            >
                                <MenuItem value={'tw'}>{'繁体中文'}</MenuItem>
                                <MenuItem value={'cn'}>{'简体中文'}</MenuItem>
                                <MenuItem value={'en'}>{'English'}</MenuItem>
                            </Select>
                        </Box>

                        {/* privacy */}
                        <Typography variant={'body2'} mt={4}>{langConfigs.privacy[preferenceStates.lang]}</Typography>
                        <Stack pl={{ xs: 0, sm: 2, md: 4 }}>
                            <FormControlLabel control={<Switch checked={privacySettingsStates.allowKeepingBrowsingHistory} onChange={handleToggle('allowKeepingBrowsingHistory')} />} label={<Typography variant={'body2'} align={'left'}>{langConfigs.allowKeepingBrowsingHistory[preferenceStates.lang]}</Typography>} sx={{ fontSize: 14 }} />
                            <FormControlLabel control={<Switch checked={privacySettingsStates.allowVisitingFollowedMembers} onChange={handleToggle('allowVisitingFollowedMembers')} />} label={<Typography variant={'body2'} align={'left'}>{langConfigs.allowVisitingFollowedMembers[preferenceStates.lang]}</Typography>} sx={{ fontSize: 14 }} />
                            <FormControlLabel control={<Switch checked={privacySettingsStates.allowVisitingSavedPosts} onChange={handleToggle('allowVisitingSavedPosts')} />} label={<Typography variant={'body2'} align={'left'}>{langConfigs.allowVisitingSavedPosts[preferenceStates.lang]}</Typography>} sx={{ fontSize: 14 }} />
                            <FormControlLabel control={<Switch checked={privacySettingsStates.hidePostsAndCommentsOfBlockedMember} onChange={handleToggle('hidePostsAndCommentsOfBlockedMember')} />} label={<Typography variant={'body2'} align={'left'}>{langConfigs.hidePostsAndCommentsOfBlockedMember[preferenceStates.lang]}</Typography>} sx={{ fontSize: 14 }} />

                            {/* 'update' button */}
                            {privacySettingsProcessStates.displayUpdateButton && <Box mt={1} pl={{ xs: 0, sm: 3, md: 2 }}>
                                <Button variant={'contained'} color={400 !== privacySettingsProcessStates.progressStatus ? 'primary' : 'error'} size={'small'} onClick={async () => { await handleUpdate(); }} disabled={privacySettingsProcessStates.disableButton} fullWidth>
                                    {/* button: enabled, result: 100 (ready) */}
                                    {100 === privacySettingsProcessStates.progressStatus && <Typography variant={'body2'}>{langConfigs.update[preferenceStates.lang]}</Typography>}
                                    {/* button: disabled, result: 200 (succeeded) */}
                                    {200 === privacySettingsProcessStates.progressStatus && <Typography variant={'body2'}>{langConfigs.updateSucceeded[preferenceStates.lang]}</Typography>}
                                    {/* button: disabled, result: 300 (ongoing) */}
                                    {300 === privacySettingsProcessStates.progressStatus && <Typography variant={'body2'}>{langConfigs.updatinging[preferenceStates.lang]}</Typography>}
                                    {/* button: enabled, result: 400 (failed) */}
                                    {400 === privacySettingsProcessStates.progressStatus && <Typography variant={'body2'}>{langConfigs.updateFailed[preferenceStates.lang]}</Typography>}
                                </Button>
                            </Box>}
                        </Stack>

                        {/* cancel membership */}
                        <Typography variant={'body2'} sx={{ mt: 4 }}>{langConfigs.cancel[preferenceStates.lang]}</Typography>
                        <Box pl={{ xs: 0, sm: 2, md: 4 }}>
                            <FormControlLabel control={<Checkbox onChange={handleCheck} checked={privacySettingsProcessStates.displayCancelButton} />} label={langConfigs.wishToCancelMembership[preferenceStates.lang]} />
                        </Box>

                        {/* 'cancel' button */}
                        {privacySettingsProcessStates.displayCancelButton && <Box mb={4} pl={{ xs: 0, sm: 3, md: 6 }}>
                            <Button variant={'contained'} color={'error'} size={'small'} onClick={async () => { await handleCancel(); }} fullWidth>
                                {(!privacySettingsProcessStates.displayCountdown && 100 === privacySettingsProcessStates.progressStatus) && <Typography variant={'body2'}>{langConfigs.cancel[preferenceStates.lang]}</Typography>}
                                {(!privacySettingsProcessStates.displayCountdown && 200 === privacySettingsProcessStates.progressStatus) && <Typography variant={'body2'}>{langConfigs.cancelSucceeded[preferenceStates.lang]}</Typography>}
                                {(!privacySettingsProcessStates.displayCountdown && 400 === privacySettingsProcessStates.progressStatus) && <Typography variant={'body2'}>{langConfigs.cancelFailed[preferenceStates.lang]}</Typography>}
                                {privacySettingsProcessStates.displayCountdown && <Typography variant={'body2'}>{langConfigs.clickXTimesToCancelMemberShip[preferenceStates.lang](privacySettingsProcessStates.countdown)}</Typography>}
                            </Button>
                        </Box>}
                    </FormGroup>

                </Box >
            );
        };

        //// Blocked member list ////
        const BlacklistSettings = () => {

            const handleUndoBlock = async (blockedId: string) => {
                // delete element (member info) from the array
                const arr: IConciseMemberInfo[] = [...settinglayoutStates.blacklist];
                for (let i = 0; i < arr.length; i++) {
                    if (blockedId === arr[i].memberId) {
                        arr.splice(i, 1);
                        setSettingLayoutStates({ ...settinglayoutStates, blacklist: [...arr] });
                        break;
                    }
                }
                const resp = await fetch(`/api/block/${blockedId}`, { method: 'POST' });
                if (200 !== resp.status) {
                    console.log(`Attempt to undo block for ${blockedId}`);
                }
            };

            return (
                <Stack spacing={3} sx={{ px: 1 }}>
                    <Box mt={{ xs: 0, sm: 0 }}></Box>
                    {0 !== settinglayoutStates.blacklist.length && settinglayoutStates.blacklist.map(info =>

                        <Box key={info.memberId} sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }} >

                            {/* member info */}
                            <Stack direction={'row'} sx={{ maxHeight: 40 }}>
                                <IconButton sx={{ px: 0 }} onClick={handleClickOnInitiateInfo(info.memberId)}>
                                    <Avatar src={provideAvatarImageUrl(authorId, domain)} sx={{ width: 40, height: 40, bgcolor: 'grey' }}>{info.nickname?.charAt(0).toUpperCase()}</Avatar>
                                </IconButton>
                                <Box ml={1}>
                                    <TextButton color={'inherit'} onClick={handleClickOnInitiateInfo(info.memberId)}>

                                        {/* nickname */}
                                        <Typography variant={'body2'} align={'left'} fontSize={{ xs: 14, sm: 14 }}>{getNicknameBrief(info.nickname)}</Typography>

                                        {/* created time */}
                                        <Typography variant={'body2'} fontSize={{ xs: 12, align: 'right' }}>{timeToString(info.createdTimeBySecond, preferenceStates.lang)}</Typography>
                                    </TextButton>
                                </Box>
                            </Stack>

                            {/* undo follow button */}
                            <Button variant={'text'} color={'inherit'} onClick={async () => { await handleUndoBlock(info.memberId); }}>
                                <Typography variant={'body2'} align={'right'}>{langConfigs.undoBlock[preferenceStates.lang]}</Typography>
                            </Button>

                        </Box>
                    )}
                    {0 === settinglayoutStates.blacklist.length && <Box minHeight={200} mt={10}>
                        <Typography color={'text.secondary'} align={'center'}>{langConfigs.noRecordOfBlacklist[preferenceStates.lang]}</Typography>
                    </Box>}
                </Stack>
            );
        };

        //// Register Info ////
        const RegisterInfo = () => {

            let emailAddress = '';
            if ('authenticated' === status) {
                const viewerSession: any = { ...session };
                emailAddress = viewerSession?.user?.email;
            }


            return (
                // <Box sx={{ pt: 3, px: { xs: 1, sm: 1, md: 4 } }}>
                <Box sx={{ pt: 3, px: { xs: 2, sm: 2, md: 4 } }}>

                    <Table aria-label='simple table'>
                        {/* info */}
                        <TableRow>
                            <TableCell sx={{ px: 0, pt: 0, pb: 1 }}><Typography variant={'body2'} color={'text.secondary'}>{langConfigs.memberInfo[preferenceStates.lang]}</Typography></TableCell>
                            <TableCell sx={{ px: 0, pt: 0, pb: 1 }}></TableCell>
                        </TableRow>
                        {/* memberId */}
                        <TableRow>
                            <TableCell sx={{ pt: 1, pb: 0, px: { xs: 0, sm: 1 }, borderBottom: 'none' }}>{langConfigs.memberId[preferenceStates.lang]}</TableCell>
                            <TableCell sx={{ pt: 1, pb: 0, px: { xs: 0, sm: 1 }, borderBottom: 'none' }} align='right'>{authorId}</TableCell>
                        </TableRow>
                        {/* email address */}
                        <TableRow>
                            <TableCell sx={{ pt: 1, pb: 0, px: { xs: 0, sm: 1 }, borderBottom: 'none' }}>{langConfigs.emailAddress[preferenceStates.lang]}</TableCell>
                            <TableCell sx={{ pt: 1, pb: 0, px: { xs: 0, sm: 1 }, borderBottom: 'none', maxWidth: { xs: 120, sm: 160 } }} align='right'>
                                <Typography variant={'body2'} sx={{ overflowWrap: 'anywhere' }}>{emailAddress}</Typography>
                            </TableCell>
                        </TableRow>
                        {/* registeredDate */}
                        <TableRow>
                            <TableCell sx={{ pt: 1, pb: 0, px: { xs: 0, sm: 1 }, borderBottom: 'none' }}>{langConfigs.registeredDate[preferenceStates.lang]}</TableCell>
                            <TableCell sx={{ pt: 1, pb: 0, px: { xs: 0, sm: 1 }, borderBottom: 'none' }} align='right'>{new Date(memberComprehensive_ss.registeredTimeBySecond * 1000).toLocaleDateString()}</TableCell>
                        </TableRow>
                        {/* verifiedDate */}
                        <TableRow>
                            <TableCell sx={{ pt: 1, pb: 0, px: { xs: 0, sm: 1 }, borderBottom: 'none' }}>{langConfigs.verifiedDate[preferenceStates.lang]}</TableCell>
                            <TableCell sx={{ pt: 1, pb: 0, px: { xs: 0, sm: 1 }, borderBottom: 'none' }} align='right'>{new Date(memberComprehensive_ss.verifiedTimeBySecond * 1000).toLocaleDateString()}</TableCell>
                        </TableRow>
                        {/* memberStatus */}
                        <TableRow>
                            <TableCell sx={{ pt: 1, pb: 0, px: { xs: 0, sm: 1 }, borderBottom: 'none' }}>{langConfigs.memberStatus[preferenceStates.lang]}</TableCell>
                            <TableCell sx={{ pt: 1, pb: 0, px: { xs: 0, sm: 1 }, borderBottom: 'none' }} align='right'>{200 === memberComprehensive_ss.status ? langConfigs.normalStatus[preferenceStates.lang] : langConfigs.restrictedStatus[preferenceStates.lang]}</TableCell>
                        </TableRow>

                        <Box pt={4}></Box>

                        {/* statistics */}
                        <TableRow>
                            <TableCell sx={{ px: 0, pt: 0, pb: 1 }}><Typography variant={'body2'} color={'text.secondary'}>{langConfigs.memberStatistics[preferenceStates.lang]}</Typography></TableCell>
                            <TableCell sx={{ px: 0, pt: 0, pb: 1 }}></TableCell>
                        </TableRow>
                        <TableRow>
                            {/* totalCreationCount */}
                            <TableCell sx={{ pt: 1, pb: 0, px: { xs: 0, sm: 1 }, borderBottom: 'none' }}>{langConfigs.totalCreationCount[preferenceStates.lang]}</TableCell>
                            <TableCell sx={{ pt: 1, pb: 0, px: { xs: 0, sm: 1 }, borderBottom: 'none' }} align='right'>{memberStatistics_ss.totalCreationCount}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{ pt: 1, pb: 0, px: { xs: 0, sm: 1 }, borderBottom: 'none' }}>{langConfigs.totalCreationHitCount[preferenceStates.lang]}</TableCell>
                            <TableCell sx={{ pt: 1, pb: 0, px: { xs: 0, sm: 1 }, borderBottom: 'none' }} align='right'>{memberStatistics_ss.totalCreationHitCount}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{ pt: 1, pb: 0, px: { xs: 0, sm: 1 }, borderBottom: 'none' }}>{langConfigs.totalCreationLikedCount[preferenceStates.lang]}</TableCell>
                            <TableCell sx={{ pt: 1, pb: 0, px: { xs: 0, sm: 1 }, borderBottom: 'none' }} align='right'>{memberStatistics_ss.totalCreationLikedCount}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{ pt: 1, pb: 0, px: { xs: 0, sm: 1 }, borderBottom: 'none' }}>{langConfigs.totalCreationSavedCount[preferenceStates.lang]}</TableCell>
                            <TableCell sx={{ pt: 1, pb: 0, px: { xs: 0, sm: 1 }, borderBottom: 'none' }} align='right'>{memberStatistics_ss.totalCreationSavedCount}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{ pt: 1, pb: 0, px: { xs: 0, sm: 1 }, borderBottom: 'none' }}>{langConfigs.totalFollowedByCount[preferenceStates.lang]}</TableCell>
                            <TableCell sx={{ pt: 1, pb: 0, px: { xs: 0, sm: 1 }, borderBottom: 'none' }} align='right'>{memberStatistics_ss.totalFollowedByCount}</TableCell >
                        </TableRow >
                    </Table >
                </Box >
            );
        };

        //////// COMPONENT - setting layout frame //////// 
        return (
            <Grid container mt={2}>

                {/* //// placeholder - left //// */}
                <Grid item xs={0} sm={1} md={2} lg={3} xl={3} />

                {/* //// middle column */}
                <Grid item xs={12} sm={10} md={8} lg={6} xl={6}>
                    <Box sx={{ display: 'flex', flexDirection: 'row', borderRadius: 1, boxShadow: { xs: 0, sm: 2 }, minHeight: 480 }}>

                        {/* //// left column //// */}
                        <Box sx={{ minWidth: { xs: 100, sm: 140, md: 160 }, padding: { xs: 0, sm: 1, md: 2 } }}>
                            <MenuList>

                                {/* avatar */}
                                <MenuItem onClick={handleSettingSelect(0)} selected={0 === settinglayoutStates.selectedSettingId} >
                                    <ListItemIcon>
                                        <AccountCircleIcon />
                                    </ListItemIcon>
                                    <ListItemText>
                                        <Typography variant={'body2'}>{langConfigs.avatar[preferenceStates.lang]}</Typography>
                                    </ListItemText>
                                </MenuItem>

                                {/* nickname */}
                                <MenuItem onClick={handleSettingSelect(1)} selected={1 === settinglayoutStates.selectedSettingId}>
                                    <ListItemIcon>
                                        <LabelIcon />
                                    </ListItemIcon>
                                    <ListItemText>
                                        <Typography variant={'body2'}>{langConfigs.nickname[preferenceStates.lang]}</Typography>
                                    </ListItemText>
                                </MenuItem>

                                {/* password */}
                                {'MojitoMemberSystem' === memberComprehensive_ss.providerId && <MenuItem onClick={handleSettingSelect(2)} selected={2 === settinglayoutStates.selectedSettingId}>
                                    <ListItemIcon>
                                        <LockIcon />
                                    </ListItemIcon>
                                    <ListItemText>
                                        <Typography variant={'body2'}>{langConfigs.password[preferenceStates.lang]}</Typography>
                                    </ListItemText>
                                </MenuItem>}

                                {/* brief intro */}
                                <MenuItem onClick={handleSettingSelect(3)} selected={3 === settinglayoutStates.selectedSettingId}>
                                    <ListItemIcon>
                                        <InterestsIcon />
                                    </ListItemIcon>
                                    <ListItemText>
                                        <Typography variant={'body2'}>{langConfigs.briefIntro[preferenceStates.lang]}</Typography>
                                    </ListItemText>
                                </MenuItem>

                                {/* gender */}
                                <MenuItem onClick={handleSettingSelect(4)} selected={4 === settinglayoutStates.selectedSettingId}>
                                    <ListItemIcon>
                                        <OpacityIcon />
                                    </ListItemIcon>
                                    <ListItemText>
                                        <Typography variant={'body2'}>{langConfigs.gender[preferenceStates.lang]}</Typography>
                                    </ListItemText>
                                </MenuItem>

                                {/* birthday */}
                                <MenuItem onClick={handleSettingSelect(5)} selected={5 === settinglayoutStates.selectedSettingId}>
                                    <ListItemIcon>
                                        <CakeIcon />
                                    </ListItemIcon>
                                    <ListItemText>
                                        <Typography variant={'body2'}>{langConfigs.birthday[preferenceStates.lang]}</Typography>
                                    </ListItemText>
                                </MenuItem>

                                {/* privacy */}
                                <MenuItem onClick={handleSettingSelect(6)} selected={6 === settinglayoutStates.selectedSettingId}>
                                    <ListItemIcon>
                                        <CheckBoxIcon />
                                    </ListItemIcon>
                                    <ListItemText>
                                        <Typography variant={'body2'}>{langConfigs.privacySettings[preferenceStates.lang]}</Typography>
                                    </ListItemText>
                                </MenuItem>

                                {/* blacklist */}
                                <MenuItem onClick={handleSettingSelect(7)} selected={7 === settinglayoutStates.selectedSettingId}>
                                    <ListItemIcon>
                                        <BlockIcon />
                                    </ListItemIcon>
                                    <ListItemText>
                                        <Typography variant={'body2'}>{langConfigs.blacklist[preferenceStates.lang]}</Typography>
                                    </ListItemText>
                                </MenuItem>

                                {/* register info */}
                                <MenuItem onClick={handleSettingSelect(10)} selected={10 === settinglayoutStates.selectedSettingId}>
                                    <ListItemIcon>
                                        <InfoIcon />
                                    </ListItemIcon>
                                    <ListItemText>
                                        <Typography variant={'body2'}>{langConfigs.info[preferenceStates.lang]}</Typography>
                                    </ListItemText>
                                </MenuItem>
                            </MenuList>
                        </Box>

                        {/* //// right column //// */}
                        <Container sx={{ px: { xs: 0, sm: 2, md: 4 } }}>
                            {/* multi-display */}
                            {0 === settinglayoutStates.selectedSettingId && <AvatarImageSetting />}
                            {1 === settinglayoutStates.selectedSettingId && <NicknameSetting />}
                            {2 === settinglayoutStates.selectedSettingId && <PasswordeSetting />}
                            {3 === settinglayoutStates.selectedSettingId && <BriefIntroSetting />}
                            {4 === settinglayoutStates.selectedSettingId && <GenderSetting />}
                            {5 === settinglayoutStates.selectedSettingId && <BirthdaySetting />}
                            {6 === settinglayoutStates.selectedSettingId && <PrivacySettings />}
                            {7 === settinglayoutStates.selectedSettingId && <BlacklistSettings />}
                            {10 === settinglayoutStates.selectedSettingId && <RegisterInfo />}
                        </Container>

                    </Box>
                </Grid>

                {/* //// placeholder - right //// */}
                <Grid item xs={0} sm={1} md={2} lg={3} xl={3} />
            </Grid >
        );
    };

    ///////// COMPONENT - member page /////////
    return (
        <ThemeProvider theme={theme}>
            <Navbar avatarImageUrl={memberInfoStates.avatarImageUrl} />

            {/* //// first layer - member info //// */}
            <Box sx={{ minHeight: { xs: 160, md: 200 } }}>
                <Box>

                    {/* avatar */}
                    <CentralizedBox sx={{ mt: { xs: 4, sm: 5 } }}>
                        <Avatar src={memberInfoStates.avatarImageUrl} sx={{ height: { xs: 90, sm: 72 }, width: { xs: 90, sm: 72 } }}>{memberInfoStates.nickname?.charAt(0).toUpperCase()}</Avatar>
                    </CentralizedBox>

                    {/* nickname */}
                    <CentralizedBox sx={{ mt: { xs: 1, sm: 1 } }}>
                        <Typography variant='body1' textAlign={'center'} fontSize={{ xs: 22, sm: 26 }}>{memberInfoStates.nickname}</Typography>
                    </CentralizedBox>

                    {/* brief intro */}
                    <CentralizedBox sx={{ mt: { xs: 0 } }}>
                        <Typography variant={'body2'} textAlign={'center'} fontSize={{ xs: 14, sm: 15 }}>{memberInfoStates.briefIntro}</Typography>
                    </CentralizedBox>

                    {/* divider */}
                    <CentralizedBox sx={{ mt: { xs: 1, sm: 2 } }}>
                        <Box></Box>
                        <Box sx={{ width: { xs: 220, sm: 280 } }}><Divider></Divider></Box>
                        <Box></Box>
                    </CentralizedBox>

                    {/* info */}
                    <Grid container columnSpacing={{ xs: 3, sm: 5 }} sx={{ mt: { xs: 1, sm: 2 } }}>

                        {/* blank space */}
                        <Grid item flexGrow={1}></Grid>

                        {/* creation count */}
                        <Grid item>
                            <CentralizedBox>
                                <Typography variant={'body2'}>{langConfigs.creations[preferenceStates.lang]}</Typography>
                            </CentralizedBox>
                            <CentralizedBox>
                                <Typography variant={'body2'}>{memberStatistics_ss.totalCreationCount}</Typography>
                            </CentralizedBox>
                        </Grid>

                        {/* followed by count */}
                        <Grid item>
                            <CentralizedBox>
                                <Typography variant={'body2'}>{langConfigs.followedBy[preferenceStates.lang]}</Typography>
                            </CentralizedBox>
                            <CentralizedBox>
                                <Typography variant={'body2'}>{memberStatistics_ss.totalFollowedByCount}</Typography>
                            </CentralizedBox>
                        </Grid>

                        {/* creation saved count */}
                        <Grid item>
                            <CentralizedBox>
                                <Typography variant={'body2'}>{langConfigs.saved[preferenceStates.lang]}</Typography>
                            </CentralizedBox>
                            <CentralizedBox>
                                <Typography variant={'body2'}>{memberStatistics_ss.totalCreationSavedCount}</Typography>
                            </CentralizedBox>
                        </Grid>

                        {/* creation liked count */}
                        <Grid item>
                            <CentralizedBox>
                                <Typography variant={'body2'}>{langConfigs.like[preferenceStates.lang]}</Typography>
                            </CentralizedBox>
                            <CentralizedBox>
                                <Typography variant={'body2'}>{memberStatistics_ss.totalCreationLikedCount}</Typography>
                            </CentralizedBox>
                        </Grid>

                        {/* blank space */}
                        <Grid item flexGrow={1}></Grid>
                    </Grid>

                    {/* layout select */}
                    <Stack spacing={1} direction='row' mt={2} sx={{ pb: 1, justifyContent: 'center', overflow: 'auto' }}>

                        {/* s0 - message layout */}
                        {('authenticated' === status && memberId === authorId) && <Button variant={'contained'} size='small' color={'messagelayout' === processStates.selectedLayout ? 'primary' : 'inherit'} onClick={handleSelectLayout('messagelayout')}>
                            <Typography variant={'body2'} color={'dark' === theme.palette.mode ? 'black' : 'inherit'}  >
                                {langConfigs.message[preferenceStates.lang]}
                            </Typography>
                        </Button>}

                        {/* s1 - list layout - my/author's following */}
                        <Button variant={'contained'} size='small' color={'listlayout' === processStates.selectedLayout ? 'primary' : 'inherit'} onClick={handleSelectLayout('listlayout')}>
                            <Typography variant={'body2'} color={'dark' === theme.palette.mode ? 'black' : 'inherit'}  >
                                {memberId === authorId ? langConfigs.following[preferenceStates.lang] : langConfigs.hisFollowing[preferenceStates.lang]}
                            </Typography>
                        </Button>

                        {/* s2 - post layout - my/author's posts */}
                        <Button variant={'contained'} size='small' color={'postlayout' === processStates.selectedLayout ? 'primary' : 'inherit'} onClick={handleSelectLayout('postlayout')}>
                            <Typography variant={'body2'} color={'dark' === theme.palette.mode ? 'black' : 'inherit'}  >
                                {memberId === authorId ? langConfigs.posts[preferenceStates.lang] : langConfigs.authorsPosts[preferenceStates.lang]}
                            </Typography>
                        </Button>

                        {/* s3 - setting layout */}
                        {('authenticated' === status && memberId === authorId) && <Button variant={'contained'} size='small' color={'settinglayout' === processStates.selectedLayout ? 'primary' : 'inherit'} onClick={handleSelectLayout('settinglayout')}>
                            <Typography variant={'body2'} color={'dark' === theme.palette.mode ? 'black' : 'inherit'}  >
                                {langConfigs.settings[preferenceStates.lang]}
                            </Typography>
                        </Button>}

                    </Stack>
                </Box>
            </Box>

            {/* blank space (gap) */}
            <Box mt={{ xs: 0, sm: 0, md: 2 }}></Box>

            {/* //// second layer - multi-display */}

            {/* message layout */}
            {'messagelayout' === processStates.selectedLayout && <MessageLayout />}

            {/* posts layout */}
            <Grid container display={'postlayout' === processStates.selectedLayout ? 'flex' : 'none'}>

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
                                        <Typography>{memberComprehensive_ss.memberId === memberId ? langConfigs.myCreations[preferenceStates.lang] : langConfigs.authorsCreations[preferenceStates.lang]}</Typography>
                                    </ListItemText>
                                </MenuItem>

                                {/* saved post list item */}
                                <MenuItem onClick={handleSelectPostCategory('savedposts')} selected={'savedposts' === postLayoutStates.selectedCategory}>
                                    <ListItemIcon ><StarIcon /></ListItemIcon>
                                    <ListItemText>
                                        <Typography>{memberComprehensive_ss.memberId === memberId ? langConfigs.mySavedPosts[preferenceStates.lang] : langConfigs.authorsSavedPosts[preferenceStates.lang]}</Typography>
                                    </ListItemText>
                                </MenuItem>

                                {/* browsing history list item */}
                                {('authenticated' === status && authorId === memberId) && <MenuItem onClick={handleSelectPostCategory('browsinghistory')} selected={'browsinghistory' === postLayoutStates.selectedCategory}>
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
                            <Typography variant='body2'>{memberComprehensive_ss.memberId === memberId ? langConfigs.myCreations[preferenceStates.lang] : langConfigs.authorsCreations[preferenceStates.lang]}</Typography>
                        </Button>

                        {/*  saved post button */}
                        <Button variant={'savedposts' === postLayoutStates.selectedCategory ? 'contained' : 'outlined'} size='small' sx={{ minWidth: 'max-content' }} onClick={handleSelectPostCategory('savedposts')}>
                            <Typography variant='body2'>{langConfigs.mySavedPosts[preferenceStates.lang]}</Typography>
                        </Button>

                        {/* browsing history button */}
                        {('authenticated' === status && authorId === memberId) && <Button variant={'browsinghistory' === postLayoutStates.selectedCategory ? 'contained' : 'outlined'} size='small' sx={{ minWidth: 'max-content' }} onClick={handleSelectPostCategory('browsinghistory')}>
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
                            {/* ('authenticated' === status && authorId === viewerId) */}
                            {/* "mycreations" | "savedposts" | "browsinghistory" */}
                            {'mycreations' === postLayoutStates.selectedCategory && <Typography color={'text.secondary'} align={'center'}>
                                {memberId === authorId ? langConfigs.noCreationsRecord[preferenceStates.lang] : langConfigs.authorNoCreationsRecord[preferenceStates.lang]}
                            </Typography>}
                            {'savedposts' === postLayoutStates.selectedCategory && <Typography color={'text.secondary'} align={'center'}>
                                {memberId === authorId ? langConfigs.noSavedPostsRecord[preferenceStates.lang] : langConfigs.authorNoSavedPostsRecord[preferenceStates.lang]}
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
                                                            <Avatar src={provideAvatarImageUrl(authorId, domain)} sx={{ width: 34, height: 34, bgcolor: 'grey' }}>{info.nickname?.charAt(0).toUpperCase()}</Avatar>
                                                            <Box ml={1}>

                                                                {/* nickname */}
                                                                <Typography variant={'body2'}>{getNicknameBrief(info.nickname)}</Typography>

                                                                {/* created time */}
                                                                <Typography fontSize={12} align={'left'}>{timeToString(info.createdTimeBySecond, preferenceStates.lang)}</Typography>
                                                            </Box>
                                                        </Button>
                                                    </Box>
                                                </Grid>

                                                {/* member behaviour / placeholder */}
                                                {('authenticated' === status && memberId === authorId) && <Grid item>
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

            {/* list layout */}
            {'listlayout' === processStates.selectedLayout && <ListLayout />}

            {/* setting layout */}
            {'settinglayout' === processStates.selectedLayout && <SettingLayout />}

            <Copyright sx={{ mt: 16 }} lang={preferenceStates.lang} />
            <Terms sx={{ mb: 8 }} lang={preferenceStates.lang} />

        </ThemeProvider>
    );
};

export default Member;