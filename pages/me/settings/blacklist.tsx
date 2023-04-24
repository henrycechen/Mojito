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

import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';

import { Alert, Menu } from '@mui/material';


import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

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

import { createTheme, responsiveFontSizes, styled, ThemeProvider } from '@mui/material/styles';
import { provideCoverImageUrl } from '../../../lib/utils/for/post';

const storageName0 = 'PreferenceStates';
const updatePreferenceStatesCache = updateLocalStorage(storageName0);
const restorePreferenceStatesFromCache = restoreFromLocalStorage(storageName0);

const storageName1 = 'MemberPageProcessStates';
const updateProcessStatesCache = updateLocalStorage(storageName1);
const restoreProcessStatesFromCache = restoreFromLocalStorage(storageName1);

const storageName2 = 'MemberPagePostsLayoutStates';
const updatePostsLayoutStatesCache = updateLocalStorage(storageName2);
const restorePostsLayoutStatesFromCache = restoreFromLocalStorage(storageName2);




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


const Blacklist = () => {

    const router = useRouter();
    const { data: session } = useSession({ required: true, onUnauthenticated() { signIn(); } });

    let memberId = '';

    React.useEffect(() => {


        const viewerSession: any = { ...session };
        memberId = viewerSession?.user?.id;
        restorePreferenceStatesFromCache(setPreferenceStates);

    }, [session]);

    //////// STATES - preference ////////
    const [preferenceStates, setPreferenceStates] = React.useState<TPreferenceStates>({
        lang: defaultLang,
        mode: 'light'
    });

    type TProcessStates = {
        displayAlert: boolean;
    };

    //////// STATES - process ////////
    const [processStates, setProcessStates] = React.useState<TProcessStates>({
        displayAlert: false,
    });

    //////// STATES - blocked member info arr ////////
    const [blockedMemberInfoArr, setBlockedMemberInfoArr] = React.useState<IMemberInfo[]>([]);

    React.useEffect(() => { getBlockedMemberInfoArray(); }, [blockedMemberInfoArr]);

    const getBlockedMemberInfoArray = async () => {

        const resp = await fetch(`/api/member/blockedbyme/${memberId}`);
        try {
            if (200 !== resp.status) {
                throw new Error(`Bad fetch response`);
            }
            const arr = await resp.json();
            setBlockedMemberInfoArr(arr);
        } catch (e) {
            console.log(`Attempt to get blocked member info array of from resp. ${e}`);
        }

    };

    const handleUndoBlock = async (blockedId: string) => {
        // Delete element (member info) from the array
        const arr: IMemberInfo[] = [...blockedMemberInfoArr];
        for (let i = 0; i < arr.length; i++) {
            if (blockedId === arr[i].memberId) {
                arr.splice(i, 1);
                setBlockedMemberInfoArr(arr);
                break;
            }
        }
        // Send request
        const resp = await fetch(`/api/block/${blockedId}`, { method: 'POST' });
        if (200 !== resp.status) {
            console.log(`Attempt to undo block for ${blockedId}`);
        }
    };

    const handleClickOnInitiateInfo = (memberId: string) => (event: React.MouseEvent<HTMLButtonElement>) => {

    };

    const onBackwardClick = () => {
        router.push('/me/settings/');
    };

    return (
        <ThemeProvider theme={theme}>
            <Navbar avatarImageUrl={provideAvatarImageUrl(memberId, domain)} />


            {/* <SettingLayout /> */}
            <Grid container mt={{ xs: 1, sm: 10 }}>
                {/* placeholder */}
                <Grid item xs={0} sm={2} md={3} lg={3}></Grid>

                {/* middle column */}
                <Grid item xs={12} sm={8} md={6} lg={6}>
                    <ResponsiveCard sx={{ pt: { xs: 0, sm: 2 }, minHeight: 500 }}>

                        {/* 'backward' button */}
                        <Box>
                            <Button color='inherit' onClick={onBackwardClick}>
                                <ArrowBackIosIcon fontSize={'small'} sx={{ color: 'grey' }} />
                            </Button>
                        </Box>

                        <Stack spacing={3} sx={{ px: 1 }}>
                            <Box mt={{ xs: 0, sm: 0 }}></Box>
                            {0 !== blockedMemberInfoArr.length && blockedMemberInfoArr.map(info =>

                                <Box key={info.memberId} sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }} >

                                    {/* member info */}
                                    <Stack direction={'row'} sx={{ maxHeight: 40 }}>
                                        <IconButton sx={{ px: 0 }} onClick={handleClickOnInitiateInfo(info.memberId)}>
                                            <Avatar src={provideAvatarImageUrl(info.memberId, domain)} sx={{ width: 40, height: 40, bgcolor: 'grey' }}>{info.nickname?.charAt(0).toUpperCase()}</Avatar>
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
                            {0 === blockedMemberInfoArr.length && <Box minHeight={200} mt={10}>
                                <Typography color={'text.secondary'} align={'center'}>{langConfigs.noRecordOfBlacklist[preferenceStates.lang]}</Typography>
                            </Box>}
                        </Stack>

                    </ResponsiveCard>
                </Grid>



                {/* placeholder */}
                <Grid item xs={0} sm={2} md={3} lg={3}></Grid>

            </Grid>




            <Copyright sx={{ mt: 16 }} lang={preferenceStates.lang} />
            <Terms sx={{ mb: 8 }} lang={preferenceStates.lang} />

        </ThemeProvider>
    );
};

export default Blacklist;