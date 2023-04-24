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

type TMemberPageProcessStates = {
    selectedLayout: 'messagelayout' | 'listlayout' | 'postlayout' | 'settinglayout';
};

const domain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? '';
const defaultLang = process.env.NEXT_PUBLIC_APP_LANG ?? 'tw';
const langConfigs: LangConfigs = {



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
    noCreations: {
        tw: '作者还未发布主题帖',
        cn: '位会员正在关注作者',
        en: 'members are following the author',
    },
    authorsTotalFollowing: {
        tw: ' 位會員正在關注作者',
        cn: '位会员正在关注作者',
        en: 'members are following the author',
    },
    noFollowing: {
        tw: '还没有會員關注作者',
        cn: '位会员正在关注作者',
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
    totalCreationsCount: {
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

    //////// INFO - viewer //////// (Cond.)
    let viewerId = '';
    React.useEffect(() => {
        if ('authenticated' === status) {
            const viewerSession: any = { ...session };
            viewerId = viewerSession?.user?.id;
            restorePreferenceStatesFromCache(setPreferenceStates);
        }
    }, [session]);

    //////// REF - masonry ////////
    const masonryWrapper = React.useRef<any>();
    const [width, setWidth] = React.useState(375); // default 636, now use the width of iphonse se3

    //////// INFO - member (authod) ////////
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


    //////// STATES - process ////////
    const [processStates, setProcessStates] = React.useState<TMemberPageProcessStates>({
        selectedLayout: 'postlayout', // default
    });

    React.useEffect(() => { selectLayoutByQuery(); }, [router]);

    const selectLayoutByQuery = () => {
        const { layout } = router.query;
        if ('message' === layout) {
            setProcessStates({ ...processStates, selectedLayout: 'messagelayout' });
        }
        if ('post' === layout) {
            setProcessStates({ ...processStates, selectedLayout: 'postlayout' });
        }
    };

    React.useEffect(() => {
        restoreProcessStatesFromCache(setProcessStates);
        restorePostsLayoutStatesFromCache(setPostLayoutStates);
    }, []);

    React.useEffect(() => { setWidth(masonryWrapper?.current?.offsetWidth); }, [processStates.selectedLayout]);

    const handleSelectLayout = (layout: 'messagelayout' | 'listlayout' | 'postlayout' | 'settinglayout') => (event: React.MouseEvent<HTMLButtonElement>) => {
        let _processStates: TMemberPageProcessStates = { ...processStates, selectedLayout: layout };
        let postlayoutStates: TPostsLayoutStates = { ...postLayoutStates, };
        postlayoutStates.memorizeViewPortPositionY = window.scrollY;
        setProcessStates(_processStates);
        updateProcessStatesCache(_processStates);
        return;
    };



    const handleFollowOrUndoFollow = async () => {

    };


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
        if (processStates.selectedLayout === 'postlayout' && postLayoutStates.wasRedirected) {
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
            let states1: TMemberPageProcessStates = { ...processStates };
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


    const [open, setOpen] = React.useState(false);

    const toggleDrawer = (newOpen: boolean) => () => {
        setOpen(newOpen);
    };

    type TAuthorInfoSettingStates = {
        alternativeImageUrl: string | undefined;
        alternativeName: string;
        alternativeIntro: string;
        disableButton: boolean;
        progressStatus: 0 | 100 | 300 | 400;
    };

    const [authorInfoSettingStates, setAvatarImageSettingStates] = React.useState<TAuthorInfoSettingStates>({
        alternativeImageUrl: provideAvatarImageUrl('authorId', domain),
        alternativeName: memberInfoStates.nickname,
        alternativeIntro: memberInfoStates.briefIntro,
        disableButton: true,
        progressStatus: 0
    });

    const handleOpenFile = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files?.length !== 0 && event.target.files !== null) {
            const url = URL.createObjectURL(event.target.files[0]);
            setAvatarImageSettingStates({ ...authorInfoSettingStates, alternativeImageUrl: url, disableButton: false, progressStatus: 100 });
        }
    };

    const handleUploadAvatarImage = async () => {
        if (!(undefined !== authorInfoSettingStates.alternativeImageUrl && '' !== authorInfoSettingStates.alternativeImageUrl)) {
            return;
        }

        // Prepare to upload avatar image
        setAvatarImageSettingStates({ ...authorInfoSettingStates, disableButton: true, progressStatus: 300 });
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
            setAvatarImageSettingStates({ ...authorInfoSettingStates, disableButton: false, progressStatus: 400 });
            return;
        }

        // Post avatar image file
        formData.append('image', bb);
        await axios.post(`/api/avatar/upload/${authorId}`, formData, config)
            .then((response: AxiosResponse) => {
                setMemberInfoStates({ ...memberInfoStates, avatarImageUrl: provideAvatarImageUrl(authorId, domain, true) });
            })
            .catch((error: AxiosError) => {
                setAvatarImageSettingStates({ ...authorInfoSettingStates, disableButton: true, progressStatus: 400 });
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
                            height: `calc(75%)`,
                            borderTopLeftRadius: 8,
                            borderTopRightRadius: 8,
                            // overflow: 'visible',
                        },
                    },
                    '@media (min-width: 600px)': {

                        '.MuiDrawer-root > .MuiPaper-root': {
                            height: `calc(75%)`,
                            borderTopLeftRadius: 8,
                            borderTopRightRadius: 8,
                            // overflow: 'visible',
                            maxWidth: 600,
                            left: '50vw',
                            // transform: 'translate(-200, 0) scale(1)'
                        },
                    }
                }}
            />

            <SwipeableDrawer
                anchor="bottom"
                open={open}
                onClose={toggleDrawer(false)}
                onOpen={toggleDrawer(true)}
                swipeAreaWidth={50}
                disableSwipeToOpen={false}
                ModalProps={{
                    keepMounted: true,
                }}

            >
                <StyledBox
                    sx={{
                        px: 5,
                        pt: 2,
                        height: '100%',
                        overflow: 'auto',

                    }}
                >
                    <Puller />


                    {/* buttons */}
                    <Grid container>
                        <Grid item >
                            <Button variant='text'>Cancel</Button>
                        </Grid>
                        <Grid item flexGrow={1}>
                        </Grid>
                        <Grid item>
                            <Button>Update</Button>

                        </Grid>
                    </Grid>

                    {/* image */}
                    <CentralizedBox>
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
                    {/* nickname */}

                    <CentralizedBox>
                        <TextField
                            error={authorInfoSettingStates.displayError}
                            label={langConfigs.newNickname[preferenceStates.lang]}
                            value={authorInfoSettingStates.alternativeName}
                            onChange={handleNicknameChange}
                            size={'small'}
                        />
                    </CentralizedBox>

                    {/* brief intro */}
                    <CentralizedBox>
                        <TextField
                            error={authorInfoSettingStates.displayError}
                            label={langConfigs.briefIntro[preferenceStates.lang]}
                            multiline
                            rows={3}
                            value={authorInfoSettingStates.alternativeIntro}
                            placeholder={langConfigs.brieflyIntrodueYourself[preferenceStates.lang]}
                            onChange={handleBriefIntroChange}
                            size={'small'}
                            fullWidth
                        />
                    </CentralizedBox>
                </StyledBox>



            </SwipeableDrawer>





            <Navbar avatarImageUrl={memberInfoStates.avatarImageUrl} />


            {/* //// first layer - member info //// */}
            <Grid container >

                <Grid item xs={0} sm={1} md={2} lg={3} xl={3}></Grid>

                {/* //// middle column //// */}
                <Grid item xs={12} sm={10} md={8} lg={6} xl={6}>



                    <Box sx={{ minHeight: { xs: 160, md: 200 }, px: { xs: 2, sm: 0 } }}>
                        <Stack>

                            {/* 1st row - avatar */}
                            <Grid container sx={{ mt: { xs: 4, sm: 5 } }}>
                                {/* avatar image */}
                                <Grid item flexGrow={1}>
                                    <Avatar src={memberInfoStates.avatarImageUrl} sx={{ height: { xs: 64, sm: 90 }, width: { xs: 64, sm: 90 } }}>{memberInfoStates.nickname?.charAt(0).toUpperCase()}</Avatar>
                                </Grid>
                                {/* 'customize' button */}
                                <Grid item pt={2}>
                                    {viewerId !== authorId && <>
                                        <Tooltip title={'Follow'}>
                                            <>
                                                <IconButton sx={{ display: { xs: 'none', sm: 'flex' }, backgroundColor: 'grey.200' }} onClick={toggleDrawer(true)}><EditIcon sx={{}} /></IconButton>
                                                <IconButton sx={{ display: { xs: 'flex', sm: 'none' }, backgroundColor: 'grey.200' }} onClick={toggleDrawer(true)}><EditIcon fontSize='small' /></IconButton>
                                            </>
                                        </Tooltip>
                                    </>}
                                </Grid>
                                {/* 'follow' button */}
                                <Grid item sx={{ mt: 2 }} pl={1}>
                                    {viewerId !== authorId && <Tooltip title={'Follow'}>
                                        <Button variant={'contained'} color={'info'} sx={{ padding: { xs: 0.5, sm: 3 / 4 }, borderRadius: 4 }} onClick={async () => { await handleFollowOrUndoFollow(); }}>{'訂閲'}</Button>
                                    </Tooltip>}
                                </Grid>
                            </Grid>

                            {/* 2nd row - nickname */}
                            <Box pt={{ xs: 2, sm: 2, md: 4 }}>
                                <Typography variant='body1' fontSize={{ xs: 22, sm: 24, md: 27 }} fontWeight={600} color={'grey.800'} >{memberInfoStates.nickname}</Typography>
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

                            {/* <Stack direction={'row'} spacing={1} sx={{ mt: { xs: 1 } }}> */}

                            {/* <Typography variant={'body2'}>{memberStatistics_ss.totalCreationsCount}{langConfigs.creations[preferenceStates.lang]}</Typography> */}
                            {/* <Typography variant={'body2'}>{memberStatistics_ss.totalFollowedByCount}{langConfigs.followedBy[preferenceStates.lang]}</Typography> */}
                            {/* <Typography variant={'body2'}>{memberStatistics_ss.totalCreationSavedCount}{langConfigs.saved[preferenceStates.lang]}</Typography> */}
                            {/* <Typography variant={'body2'}>{memberStatistics_ss.totalCreationLikedCount}{langConfigs.like[preferenceStates.lang]}</Typography> */}




                            {/* </Stack> */}

                            <Box sx={{ py: 2 }}>
                                <Divider />

                            </Box>


                        </Stack>
                    </Box>



                </Grid>



                <Grid item xs={0} sm={1} md={2} lg={3} xl={3}></Grid>

            </Grid>


            {/* blank space (gap) */}
            <Box mt={{ xs: 0, sm: 0, md: 2 }}></Box>

            {/* //// second layer - multi-display */}

            {/* posts layout */}
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
                                        <Typography>{memberComprehensive_ss.memberId === viewerId ? langConfigs.myCreations[preferenceStates.lang] : langConfigs.authorsCreations[preferenceStates.lang]}</Typography>
                                    </ListItemText>
                                </MenuItem>

                                {/* saved post list item */}
                                <MenuItem onClick={handleSelectPostCategory('savedposts')} selected={'savedposts' === postLayoutStates.selectedCategory}>
                                    <ListItemIcon ><StarIcon /></ListItemIcon>
                                    <ListItemText>
                                        <Typography>{memberComprehensive_ss.memberId === viewerId ? langConfigs.mySavedPosts[preferenceStates.lang] : langConfigs.authorsSavedPosts[preferenceStates.lang]}</Typography>
                                    </ListItemText>
                                </MenuItem>

                                {/* browsing history list item */}
                                {('authenticated' === status && authorId === viewerId) && <MenuItem onClick={handleSelectPostCategory('browsinghistory')} selected={'browsinghistory' === postLayoutStates.selectedCategory}>
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
                            <Typography variant='body2'>{memberComprehensive_ss.memberId === viewerId ? langConfigs.myCreations[preferenceStates.lang] : langConfigs.authorsCreations[preferenceStates.lang]}</Typography>
                        </Button>

                        {/*  saved post button */}
                        <Button variant={'savedposts' === postLayoutStates.selectedCategory ? 'contained' : 'outlined'} size='small' sx={{ minWidth: 'max-content' }} onClick={handleSelectPostCategory('savedposts')}>
                            <Typography variant='body2'>{langConfigs.mySavedPosts[preferenceStates.lang]}</Typography>
                        </Button>

                        {/* browsing history button */}
                        {('authenticated' === status && authorId === viewerId) && <Button variant={'browsinghistory' === postLayoutStates.selectedCategory ? 'contained' : 'outlined'} size='small' sx={{ minWidth: 'max-content' }} onClick={handleSelectPostCategory('browsinghistory')}>
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
                                {viewerId === authorId ? langConfigs.noCreationsRecord[preferenceStates.lang] : langConfigs.authorNoCreationsRecord[preferenceStates.lang]}
                            </Typography>}
                            {'savedposts' === postLayoutStates.selectedCategory && <Typography color={'text.secondary'} align={'center'}>
                                {viewerId === authorId ? langConfigs.noSavedPostsRecord[preferenceStates.lang] : langConfigs.authorNoSavedPostsRecord[preferenceStates.lang]}
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
                                                {('authenticated' === status && viewerId === authorId) && <Grid item>
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

        </>

    );
};

export default Member;