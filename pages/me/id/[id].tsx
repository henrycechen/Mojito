import * as React from 'react';
import { NextPageContext } from 'next';

import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { useSession } from 'next-auth/react'

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


import { useTheme } from '@emotion/react';
import { useRouter } from 'next/router';

import Navbar from '../../../ui/Navbar';
import { TBrowsingHelper, LangConfigs, TChannelInfoDictionary, TChannelInfoStates, TNoticeInfoWithMemberInfo, TPreferenceStates } from '../../../lib/types';
import { updateLocalStorage, restoreFromLocalStorage, verifyId, fakeConciseMemberInfo, fakeConciseMemberStatistics, timeToString, noticeInfoToString, verifyNoticeId, getNicknameBrief, noticeIdToUrl, getContentBrief, provideLocalStorage } from '../../../lib/utils';
import { CenterlizedBox, ResponsiveCard, StyledSwitch, TextButton } from '../../../ui/Styled';
import { IConciseMemberInfo, IConciseMemberStatistics, IConcisePostComprehensiveWithMemberInfo, IConciseMemberInfoWithBriefIntroAndTime, IConciseMemberInfoWithTime, IProcessStates } from '../../../lib/interfaces';
import FormGroup from '@mui/material/FormGroup';
import Switch from '@mui/material/Switch';
import Checkbox from '@mui/material/Checkbox';
import Link from '@mui/material/Link';

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
    channelInfoDict_ss: TChannelInfoDictionary;
    memberInfo_ss: IConciseMemberInfo;
    memberStatistics_ss: IConciseMemberStatistics;
    redirect404: boolean;
}

interface IMemberPageProcessStates extends IProcessStates {
    lang: string;
    selectedLayout: 'messageslayout' | 'listlayout' | 'postslayout' | 'settingslayout';
    wasRedirected: boolean;
}

type TMessagesLayoutStates = {
    selectedCategory: string;
    noticeInfoArr: TNoticeInfoWithMemberInfo[];
    noticeStatistics: { [category: string]: number };
}

type TListLayoutStates = {
    selectedCategory: 'following' | 'followedby';
    memberInfoArr: IConciseMemberInfoWithBriefIntroAndTime[];
}

type TPostsLayoutStates = {
    selectedCategory: 'mycreations' | 'savedposts' | 'browsinghistory';
    selectedHotPosts: boolean;
    selectedChannelId: string;
    memorizeChannelBarPositionX: number | undefined;
    memorizeViewPortPositionY: number | undefined;
    memorizeLastViewedPostId: string | undefined;
}

type TBehaviourStates = {
    undoSaved: { [postId: string]: number }
}

type TSettingsLayoutStates = {
    selectedSettingId: number;
    avatarImageUrl: string | undefined;
    nickname: string;
    password: string;
    repeatPassword: string;
    showpassword?: boolean;
    briefIntro: string;
    gender: number;
    birthday: Dayjs | null;
    isWishToCancelChecked: boolean;
    blacklist: IConciseMemberInfoWithTime[];
    registerDate: string;
}

const domain = process.env.NEXT_PUBLIC_APP_DOMAIN;
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
    myFollowedBy: {
        tw: '訂閲我的會員',
        cn: '我的粉丝',
        en: 'My fans'
    },
    undoFollow: {
        tw: '取消關注',
        cn: '取关',
        en: 'Undo'
    },
    authorsFollowing: {
        tw: '作者的訂閲',
        cn: '作者的粉丝',
        en: `Author's following`
    },
    posts: {
        tw: '帖子',
        cn: '帖子',
        en: 'Posts'
    },
    creations: {
        tw: '創作',
        cn: '发布',
        en: 'Creations'
    },
    followedBy: {
        tw: '訂閲',
        cn: '粉丝',
        en: 'Followed'
    },
    myCreations: {
        tw: '我的創作',
        cn: '我的发布',
        en: 'My creations'
    },
    authorsPosts: {
        tw: '作者的帖子',
        cn: '作者的帖子',
        en: `Author's posts`
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
    authorsSaved: {
        tw: '作者的收藏',
        cn: '作者的收藏',
        en: `Author's saved`
    },
    like: {
        tw: '喜歡',
        cn: '赞',
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
        tw: '您沒有訂閲其他會員',
        cn: '您没有关注其他会员',
        en: 'You have not followed any members'
    },
    noFollowedByMemberInfoRecord: {
        tw: '暫時沒有其他會員訂閲您',
        cn: '暂时没有其他会员关注您',
        en: 'No records of following member'
    },
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
    nickname: {
        tw: '名稱',
        cn: '昵称',
        en: 'Nickname'
    },
    update: {
        tw: '更新',
        cn: '更新',
        en: 'Update'
    },
    newNickname: {
        tw: '新昵稱',
        cn: '新昵称',
        en: 'New nickname'
    },
    password: {
        tw: '密碼',
        cn: '密码',
        en: 'Password'
    },
    currentPassword: {
        tw: '現在的密碼',
        cn: '现在的密码',
        en: 'Current password'
    },
    newPassword: {
        tw: '新密碼',
        cn: '新密码',
        en: 'New password'
    },
    repeatNewPassword: {
        tw: '重複鍵入新密碼',
        cn: '重复输入新密码',
        en: 'Repeat new password'
    },
    forgotPassword: {
        tw: '我忘記密碼了...',
        cn: '我忘记密码了...',
        en: 'I forgot my password...'

    },
    briefIntro: {
        tw: '個人簡介',
        cn: '个人简介',
        en: 'Brief intro'
    },
    introduceYourself: {
        tw: '來介紹一下你自己吧',
        cn: '介绍一下自己吧',
        en: 'Tell everybody something about yourself'
    },
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
    birthday: {
        tw: '出生日期',
        cn: '生日',
        en: 'Birthday'
    },
    chooseYourBirthday: {
        tw: '選擇您的出生日期',
        cn: '选择您的生日',
        en: 'Choose your birthday'
    },
    memberInfo: {
        tw: '賬號資訊',
        cn: '账号信息',
        en: 'Member Info'
    },
    memberId: {
        tw: 'Mojito 會員ID',
        cn: 'Mojito 会员ID',
        en: 'Mojito Member ID'
    },
    registerDate: {
        tw: '注冊日期',
        cn: '注册日期',
        en: 'Register date'
    },
    privacySettings: {
        tw: '隱私與設定',
        cn: '隐私与设置',
        en: 'Settings'
    },
    visibility: {
        tw: '可見性',
        cn: '可见性',
        en: 'Visibility'

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
    cancelMembership: {
        tw: '注銷',
        cn: '注銷',
        en: 'Cancel membership'
    },
    cancel: {
        tw: '注銷',
        cn: '注銷',
        en: 'Confirm'
    },
    allowVisitingSavedPosts: {
        tw: '允許他人訪問您的收藏',
        cn: '允许他人访问您的收藏',
        en: 'Allow other member visiting your saved posts'
    },
    allowSavingBrowsingHistory: {
        tw: '保存您的瀏覽記錄',
        cn: '保存您的浏览记录',
        en: 'Save browsing history'

    },
    hidePostsAndCommentsFromBlockedMember: {
        tw: '隱藏屏蔽的會員的作品和評論',
        cn: '隐藏屏蔽的会员的作品与评论',
        en: 'Hide posts and comments from blocked member'

    },
    wishToCancelMembership: {
        tw: '我希望注銷我的賬號',
        cn: '我希望注销我的账户',
        en: 'I wish to cancel my membership'
    },
    blacklist: {
        tw: '黑名單',
        cn: '黑名單',
        en: 'Blacklist'
    },
    undoBlock: {
        tw: '移除',
        cn: '移除',
        en: 'Undo'
    }
}

//// Get multiple member info server-side ////
export async function getServerSideProps(context: NextPageContext): Promise<{ props: TMemberPageProps }> {
    const { id } = context.query;
    const { isValid, category } = verifyId(id);
    // Verify member id
    if (!(isValid && 'member' === category)) {
        return {
            props: {
                channelInfoDict_ss: {},
                memberInfo_ss: fakeConciseMemberInfo(),
                memberStatistics_ss: fakeConciseMemberStatistics(),
                redirect404: true
            }
        }
    }
    // GET channel info by id
    const dictionary_resp = await fetch(`${domain}/api/channel/info/dictionary`);
    if (200 !== dictionary_resp.status) {
        throw new Error('Attempt to GET channel info dictionary');
    }
    const channelInfoDict_ss = await dictionary_resp.json();
    // GET member info by id
    const info_resp = await fetch(`${domain}/api/member/info/${id}`);
    if (200 !== info_resp.status) {
        throw new Error('Attempt to GET member info');
    }
    const memberInfo_ss = await info_resp.json();
    // GET member statistics by id
    const statistics_resp = await fetch(`${domain}/api/member/statistics/${id}`);
    if (200 !== statistics_resp.status) {
        throw new Error('Attempt to GET member statistics');
    }
    const memberStatistics_ss = await statistics_resp.json();
    return {
        props: {
            channelInfoDict_ss,
            memberInfo_ss,
            memberStatistics_ss,
            redirect404: false
        }
    }
}

const Member = ({ channelInfoDict_ss, memberInfo_ss, memberStatistics_ss, redirect404 }: TMemberPageProps) => {

    const router = useRouter();
    React.useEffect(() => {
        if (redirect404) {
            router.push('/404');
        }
    }, [])

    const { data: session, status } = useSession();
    const theme: any = useTheme();

    //////// INFO - viewer //////// (conditional.)
    let viewerId = '';
    if ('authenticated' === status) {
        const viewerSession: any = { ...session };
        viewerId = viewerSession?.user?.id;
    }

    //////// REF - masonry ////////
    const masonryWrapper = React.useRef<any>();
    const [width, setWidth] = React.useState(636);
    // [!] set width on select layout moved to process states section

    //////// INFO - member ////////
    const { memberId, nickname, avatarImageUrl } = memberInfo_ss;

    //////// STATES - preference ////////
    const [preferenceStates, setPreferenceStates] = React.useState<TPreferenceStates>({
        lang: defaultLang,
        mode: 'light'
    })
    React.useEffect(() => { restorePreferenceStatesFromCache(setPreferenceStates) }, [])

    //////// STATES - process ////////
    const [processStates, setProcessStates] = React.useState<IMemberPageProcessStates>({
        // lang: undefined !== preferenceFromCache?.lang ? preferenceFromCache?.lang : defaultLang,
        lang: 'cn',
        selectedLayout: 'postslayout', // default
        wasRedirected: false,
    })


    React.useEffect(() => { selectLayoutByQuery() }, [router])

    const selectLayoutByQuery = () => {
        const { layout } = router.query;
        if ('message' === layout) {
            setProcessStates({ ...processStates, selectedLayout: 'messageslayout' });
        }
        if ('post' === layout) {
            setProcessStates({ ...processStates, selectedLayout: 'postslayout' });
        }
    }

    React.useEffect(() => {
        restoreProcessStatesFromCache(setProcessStates);
        restorePostsLayoutStatesFromCache(setPostsLayoutStates);
    }, []);

    React.useEffect(() => { setWidth(masonryWrapper?.current?.offsetWidth) }, [processStates.selectedLayout])

    const handleSelectCategory = (layout: 'messageslayout' | 'listlayout' | 'postslayout' | 'settingslayout') => (event: React.MouseEvent<HTMLButtonElement>) => {
        let states: IMemberPageProcessStates = { ...processStates, selectedLayout: layout };
        states.memorizeViewPortPositionY = window.scrollY;
        setProcessStates(states);
        updateProcessStatesCache(states);
        return;
    }

    ////////////////////////  Message Layout ////////////////////////

    //////// STATES - message layout ////////
    const [messageslayoutStates, setMessagesLayoutStates] = React.useState<TMessagesLayoutStates>({
        selectedCategory: 'like', // default
        noticeInfoArr: [],
        noticeStatistics: { cue: 0, reply: 0, like: 0, pin: 0, save: 0, follow: 0 }
    });

    React.useEffect(() => { updateNoticeArrayAndStatistics(); }, [])
    React.useEffect(() => { updateNoticeArray() }, [messageslayoutStates.selectedCategory])

    const updateNoticeArray = async () => {
        const resp = await fetch(`/api/notice/of/${messageslayoutStates.selectedCategory}`);
        if (200 !== resp.status) {
            console.log(`Attempt to GET notice of ${messageslayoutStates.selectedCategory}`);
            return;
        }
        try {
            const arr = await resp.json();
            setMessagesLayoutStates({ ...messageslayoutStates, noticeInfoArr: arr });
        } catch (e) {
            console.log(`Attempt to get notice array from resp. ${e}`)
        }
    }

    const updateNoticeArrayAndStatistics = async () => {
        let update_arr = [];
        let update_stat = { cue: 0, reply: 0, like: 0, pin: 0, save: 0, follow: 0 };
        const resp_arr = await fetch(`/api/notice/of/${messageslayoutStates.selectedCategory}`);
        if (200 !== resp_arr.status) {
            console.log(`Attempt to GET notice of ${messageslayoutStates.selectedCategory}`);
            return;
        }
        try {
            const arr = await resp_arr.json();
            update_arr.push(...arr);
        } catch (e) {
            console.log(`Attempt to get notice array from resp. ${e}`)
        }
        const resp_stat = await fetch(`/api/notice/statistics`);
        if (200 !== resp_stat.status) {
            console.log(`Attempt to GET notice statistics`);
            return;
        }
        try {
            const obj = await resp_stat.json();
            update_stat = { ...obj };
        } catch (e) {
            console.log(`Attempt to get notice statistics (obj) from resp. ${e}`)
        }
        setMessagesLayoutStates({ ...messageslayoutStates, noticeInfoArr: [...update_arr], noticeStatistics: { ...update_stat } });
        await resetNoticeStatistics();
    }

    const resetNoticeStatistics = async () => {
        const resp = await fetch(`/api/notice/statistics`, { method: 'PUT' });
        if (200 !== resp.status) {
            console.log(`Attempt to PUT (reset) notice statistics`);
            return;
        }
    }

    const handleSelectNoticeCategory = (categoryId: string) => (event: React.MouseEvent<HTMLButtonElement>) => {
        setMessagesLayoutStates({ ...messageslayoutStates, selectedCategory: categoryId });
    }

    const handleClickOnInitiateInfo = (initiateId: string) => (event: React.MouseEvent<HTMLButtonElement>) => {
        router.push(`/me/id/${initiateId}`);
    }

    const handleClickOnNoticeInfo = (noticeId: string) => (event: React.MouseEvent<HTMLButtonElement>) => {
        router.push(noticeIdToUrl(noticeId));
    }

    //////// COMPONENT - message layout ////////
    const MessagesLayout = () => {
        return (
            <Grid container>

                {/* left column (placeholder) */}
                <Grid item xs={0} sm={2} md={3} lg={3}></Grid>

                {/* middle column */}
                <Grid item xs={12} sm={8} md={6} lg={6}>
                    <ResponsiveCard>
                        <Stack>

                            {/* section select */}
                            <Box sx={{ display: 'flex', justifyContent: 'space-evenly' }}>
                                <Button sx={{ color: 'like' === messageslayoutStates.selectedCategory ? 'primary' : 'grey.600' }} onClick={handleSelectNoticeCategory('like')}>
                                    <Box>
                                        <CenterlizedBox sx={{ padding: 1, }}><ThumbUpIcon /></CenterlizedBox>
                                        <Typography variant='body2' textAlign={'center'}>{langConfigs.liked[preferenceStates.lang]}{0 === messageslayoutStates.noticeStatistics.like ? '' : `+${messageslayoutStates.noticeStatistics.like}`}</Typography>
                                    </Box>
                                </Button>
                                <Button sx={{ color: 'save' === messageslayoutStates.selectedCategory ? 'primary' : 'grey.600' }} onClick={handleSelectNoticeCategory('save')}>
                                    <Box>
                                        <CenterlizedBox sx={{ padding: 1 }}><StarIcon /></CenterlizedBox>
                                        <Typography variant='body2' textAlign={'center'}>{langConfigs.saved[preferenceStates.lang]}{0 === messageslayoutStates.noticeStatistics.save ? '' : `+${messageslayoutStates.noticeStatistics.save}`}</Typography>
                                    </Box>
                                </Button>
                                <Button sx={{ color: 'reply' === messageslayoutStates.selectedCategory ? 'primary' : 'grey.600' }} onClick={handleSelectNoticeCategory('reply')}>
                                    <Box>
                                        <CenterlizedBox sx={{ padding: 1 }}><ChatBubbleIcon /></CenterlizedBox>
                                        <Typography variant='body2' textAlign={'center'}>{langConfigs.replied[preferenceStates.lang]}{0 === messageslayoutStates.noticeStatistics.reply ? '' : `+${messageslayoutStates.noticeStatistics.reply}`}</Typography>
                                    </Box>
                                </Button>
                                <Button sx={{ color: 'cue' === messageslayoutStates.selectedCategory ? 'primary' : 'grey.600' }} onClick={handleSelectNoticeCategory('cue')}>
                                    <Box>
                                        <CenterlizedBox sx={{ padding: 1 }}><AlternateEmailIcon /></CenterlizedBox>
                                        <Typography variant='body2' textAlign={'center'}>{langConfigs.cued[preferenceStates.lang]}{0 === messageslayoutStates.noticeStatistics.cue ? '' : `+${messageslayoutStates.noticeStatistics.cue}`}</Typography>
                                    </Box>
                                </Button>
                            </Box>
                            <Box mt={{ xs: 1, sm: 2 }}><Divider /></Box>

                            {/* message list */}
                            <Stack padding={{ xs: 0, sm: 2 }} spacing={{ xs: 4, sm: 4, md: 5 }}>
                                {0 !== messageslayoutStates.noticeInfoArr.length && messageslayoutStates.noticeInfoArr.map(info =>
                                    <Box key={info.noticeId} mt={{ xs: 3, sm: 2 }} sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }} >

                                        {/* initiate info */}
                                        <Stack direction={'row'} sx={{ maxHeight: 40 }}>
                                            <IconButton sx={{ padding: 0 }} onClick={handleClickOnInitiateInfo(info.initiateId)}>
                                                <Avatar src={info.avatarImageUrl} sx={{ width: 38, height: 38, bgcolor: 'grey' }}>{info.nickname?.charAt(0).toUpperCase()}</Avatar>
                                            </IconButton>
                                            <Box ml={1} width={100}>
                                                <TextButton color='inherit' onClick={handleClickOnInitiateInfo(info.initiateId)}>

                                                    {/* nickname */}
                                                    <Typography variant='body2' align='left'>{getNicknameBrief(info.nickname)}</Typography>

                                                    {/* created time */}
                                                    <Typography variant='body2' fontSize={{ xs: 12, align: 'right' }}>{timeToString(info.createdTime, preferenceStates.lang)}</Typography>
                                                </TextButton>
                                            </Box>
                                        </Stack>

                                        {/* notice info */}
                                        <Box sx={{ maxWidth: 300, display: 'flex', flexDirection: 'column', justifyContent: 'center', marginLeft: 2, }} >
                                            <TextButton color='inherit' onClick={handleClickOnNoticeInfo(info.noticeId)}>
                                                <Typography variant={'body2'} align={'right'}>{noticeInfoToString(info, preferenceStates.lang)}</Typography>
                                            </TextButton>
                                        </Box>
                                    </Box>
                                )}
                                {0 === messageslayoutStates.noticeInfoArr.length &&
                                    <Box mt={{ xs: 3, sm: 2 }}>
                                        <Typography color={'text.secondary'} align={'center'}>{langConfigs.noNotificationRecord[preferenceStates.lang]}</Typography>
                                    </Box>
                                }
                            </Stack>

                        </Stack>
                    </ResponsiveCard>
                </Grid>

                {/* right column (placeholder) */}
                <Grid item xs={0} sm={2} md={3} lg={3}></Grid>
            </Grid >
        )
    }

    ////////////////////////   List Layout   ////////////////////////

    //////// STATES - list layout ////////
    const [listLayoutStates, setListLayoutStates] = React.useState<TListLayoutStates>({
        selectedCategory: 'following', // 'following' | 'followedby'
        memberInfoArr: [],
    })

    React.useEffect(() => { updateMemberInfoArr() }, [])
    React.useEffect(() => { updateMemberInfoArr() }, [listLayoutStates.selectedCategory])

    const updateMemberInfoArr = async () => {
        const resp = await fetch(`/api/member/follow/${listLayoutStates.selectedCategory}/${memberId}`);
        if (200 !== resp.status) {
            console.log(`Attempt to GET member info array of ${listLayoutStates.selectedCategory}`);
            return;
        }
        try {
            const arr = await resp.json();
            setListLayoutStates({ ...listLayoutStates, memberInfoArr: arr });
        } catch (e) {
            console.log(`Attempt to get member info array  of ${listLayoutStates.selectedCategory} from resp. ${e}`)
        }
    }

    const handleSelectListCategory = (categoryId: 'following' | 'followedby') => (event: React.MouseEvent<HTMLButtonElement>) => {
        setListLayoutStates({ ...listLayoutStates, selectedCategory: categoryId });
    }

    const handleUndoFollow = (memberId: string) => (event: React.MouseEvent<HTMLButtonElement>) => {

    }

    //////// COMPONENT - list layout ////////
    const ListLayout = () => {
        return (
            <Grid container>

                {/* left column (placeholder) */}
                <Grid item xs={0} sm={2} md={3} lg={3}></Grid>

                {/* middle column */}
                <Grid item xs={12} sm={8} md={6} lg={6}>
                    <ResponsiveCard>
                        <Stack>

                            {/* section select */}
                            <Box sx={{ display: 'flex', justifyContent: 'space-evenly' }}>
                                <Button sx={{ color: 'following' === listLayoutStates.selectedCategory ? 'primary' : 'grey.600' }} onClick={handleSelectListCategory('following')}>
                                    <Box>
                                        <Typography variant='body2' textAlign={'center'}>{langConfigs.myFollowing[preferenceStates.lang]}</Typography>
                                    </Box>
                                </Button>
                                <Button sx={{ color: 'followedby' === listLayoutStates.selectedCategory ? 'primary' : 'grey.600' }} onClick={handleSelectListCategory('followedby')}>
                                    <Box>
                                        <Typography variant='body2' textAlign={'center'}>{langConfigs.myFollowedBy[preferenceStates.lang]}{0 === messageslayoutStates.noticeStatistics.follow ? '' : `+${messageslayoutStates.noticeStatistics.follow}`}</Typography>
                                    </Box>
                                </Button>
                            </Box>
                            <Box mt={{ xs: 1, sm: 2 }}><Divider /></Box>

                            {/* member info list */}
                            <Stack padding={{ xs: 0, sm: 2 }} spacing={{ xs: 4, sm: 4, md: 5 }}>
                                {0 !== listLayoutStates.memberInfoArr.length && listLayoutStates.memberInfoArr.map(info =>

                                    <Box key={info.memberId} mt={{ xs: 3, sm: 2 }} sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }} >

                                        {/* initiate info */}
                                        <Stack direction={'row'} sx={{ maxHeight: 40 }}>
                                            <IconButton sx={{ padding: 0 }} onClick={handleClickOnInitiateInfo(info.memberId)}>
                                                <Avatar src={info.avatarImageUrl} sx={{ width: 38, height: 38, bgcolor: 'grey' }}>{info.nickname?.charAt(0).toUpperCase()}</Avatar>
                                            </IconButton>
                                            <Box ml={1}>
                                                <TextButton color='inherit' onClick={handleClickOnInitiateInfo(info.memberId)}>

                                                    {/* nickname */}
                                                    <Typography variant='body2' align='left'>{getContentBrief(info.nickname, 14)}</Typography>

                                                    {/* brief intro */}
                                                    <Typography variant='body2' fontSize={{ xs: 12, align: 'left' }} >{getContentBrief(info.briefIntro, 14)}</Typography>
                                                </TextButton>
                                            </Box>
                                        </Stack>

                                        {/* undo follow button */}
                                        {'following' === listLayoutStates.selectedCategory && <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }} >
                                            <Button variant='text' color='inherit' onClick={handleUndoFollow(info.memberId)}>
                                                <Typography variant={'body2'} align={'right'}>{langConfigs.undoFollow[preferenceStates.lang]}</Typography>
                                            </Button>
                                        </Box>}

                                        {/* created time */}
                                        {'followedby' === listLayoutStates.selectedCategory && <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }} >
                                            <Typography variant={'body2'} align={'right'} sx={{ paddingRight: 1 }}>{timeToString(info.createdTime, preferenceStates.lang)}</Typography>
                                        </Box>}
                                    </Box>
                                )}
                                {0 === listLayoutStates.memberInfoArr.length &&
                                    <Box mt={{ xs: 3, sm: 2 }}>
                                        <Typography color={'text.secondary'} align={'center'}>{langConfigs.noFollowingMemberInfoRecord[preferenceStates.lang]}</Typography>
                                    </Box>
                                }
                            </Stack>

                        </Stack>
                    </ResponsiveCard>
                </Grid>

                {/* right column (placeholder) */}
                <Grid item xs={0} sm={2} md={3} lg={3}></Grid>
            </Grid >
        )
    }

    ////////////////////////   Post Layout   ////////////////////////

    //////// STATES - post layout ////////
    const [postsLayoutStates, setPostsLayoutStates] = React.useState<TPostsLayoutStates>({
        selectedCategory: 'mycreations', // 'mycreations' | 'savedposts' | 'browsinghistory'
        selectedHotPosts: false, // default
        selectedChannelId: 'all', // default
        memorizeChannelBarPositionX: undefined,
        memorizeViewPortPositionY: undefined,
        memorizeLastViewedPostId: undefined,
    })

    const handleSelectPostCategory = (categoryId: 'mycreations' | 'savedposts' | 'browsinghistory') => (event: React.MouseEvent<HTMLButtonElement> | React.SyntheticEvent) => {
        let states: TPostsLayoutStates = { ...postsLayoutStates, selectedCategory: categoryId };
        // Step #1 update post layout states
        setPostsLayoutStates(states);
        // Step #2 update post layout states cache
        updatePostsLayoutStatesCache(states);
        // Step #3 reset helper
        setBrowsingHelper({ ...browsingHelper, memorizeViewPortPositionY: undefined });
    }

    //////// STATES - browsing helper ////////
    const [browsingHelper, setBrowsingHelper] = React.useState<TBrowsingHelper>({
        memorizeViewPortPositionY: undefined, // reset scroll-help on handleChannelSelect, handleSwitchChange, ~~handlePostCardClick~~
    })

    ///////// STATES - channel /////////
    const [channelInfoStates, setChannelInfoStates] = React.useState<TChannelInfoStates>({
        channelIdSequence: [],
    });

    React.useEffect(() => { updateChannelIdSequence() }, []);

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
    }

    // Handle channel bar restore on refresh
    React.useEffect(() => {
        if (undefined !== postsLayoutStates.memorizeChannelBarPositionX) {
            document.getElementById('channel-bar')?.scrollBy(postsLayoutStates.memorizeChannelBarPositionX ?? 0, 0);
        }
    }, [channelInfoStates.channelIdSequence]);

    const handleChannelSelect = (channelId: string) => (event: React.MouseEvent<HTMLButtonElement> | React.SyntheticEvent) => {
        let states: TPostsLayoutStates = { ...postsLayoutStates };
        states.selectedChannelId = channelId;
        states.memorizeChannelBarPositionX = document.getElementById('channel-bar')?.scrollLeft;
        // Step #1 update post layout states
        setPostsLayoutStates(states);
        // Step #2 update post layout states cache
        updatePostsLayoutStatesCache(states);
        // Step #3 reset helper
        setBrowsingHelper({ ...browsingHelper, memorizeViewPortPositionY: undefined });
    }

    const handleSwitchChange = () => {
        let states: TPostsLayoutStates = { ...postsLayoutStates, selectedHotPosts: !postsLayoutStates.selectedHotPosts }
        // Step #1 update post layout states
        setPostsLayoutStates(states);
        // Step #2 update post layout states cache
        updatePostsLayoutStatesCache(states);
        // Step #3 reset helper
        setBrowsingHelper({ ...browsingHelper, memorizeViewPortPositionY: undefined });
    }

    //////// STATES - (masonry) post info array ////////
    const [masonryPostInfoArr, setMasonryPostInfoArr] = React.useState<IConcisePostComprehensiveWithMemberInfo[]>([]);

    React.useEffect(() => { updatePostsArr() }, [postsLayoutStates.selectedHotPosts, postsLayoutStates.selectedChannelId, postsLayoutStates.selectedCategory]);

    const updatePostsArr = async () => {
        const resp = await fetch(`/api/post/s/of${postsLayoutStates.selectedHotPosts ? '/hot/24h' : '/new'}?channelId=${postsLayoutStates.selectedChannelId}&withMemberInfo=true`);
        if (200 === resp.status) {
            try {
                setMasonryPostInfoArr(await resp.json());
            } catch (e) {
                console.log(`Attempt to GET posts of ${postsLayoutStates.selectedHotPosts ? '24 hours hot' : 'new'}. ${e}`);
            }
        }
    }

    // Handle restore browsing position after reload
    React.useEffect(() => {
        if (processStates.selectedLayout === 'postslayout' && processStates.wasRedirected) {
            const postId = postsLayoutStates.memorizeLastViewedPostId;
            // Step #1 restore browsing position
            if (!postId) {
                return;
            } else if (600 > window.innerWidth) { // 0 ~ 599
                setBrowsingHelper({ ...browsingHelper, memorizeViewPortPositionY: (document.getElementById(postId)?.offsetTop ?? 0) / 2 - 200 });
            } else { // 600 ~ ∞
                setBrowsingHelper({ ...browsingHelper, memorizeViewPortPositionY: postsLayoutStates.memorizeViewPortPositionY });
            }
            // Step #2 update process states and cache
            let states1: IMemberPageProcessStates = { ...processStates, wasRedirected: false };
            setProcessStates({ ...states1 });
            updateProcessStatesCache(states1);
            let states2: TPostsLayoutStates = { ...postsLayoutStates, memorizeLastViewedPostId: undefined, memorizeViewPortPositionY: undefined };
            // Step #3 update post layout states and cache
            setPostsLayoutStates({ ...states2 })
            updatePostsLayoutStatesCache(states2);
        }
    }, [masonryPostInfoArr]);

    if (!!browsingHelper.memorizeViewPortPositionY) {
        window.scrollTo(0, browsingHelper.memorizeViewPortPositionY ?? 0);
    }

    const handleClickOnPost = (postId: string) => (event: React.MouseEvent) => {
        // Step #1 update process states and post layout cache
        updateProcessStatesCache({ ...processStates, wasRedirected: true });
        updatePostsLayoutStatesCache({ ...postsLayoutStates, memorizeLastViewedPostId: postId, memorizeViewPortPositionY: window.scrollY });
        // Step #2 jump
        router.push(`/post/${postId}`);
    }

    const handleClickOnMemberInfo = (memberId: string, postId: string) => (event: React.MouseEvent) => {
        // Step #1 update process states and post layout cache
        updateProcessStatesCache({ ...processStates, wasRedirected: true });
        updatePostsLayoutStatesCache({ ...postsLayoutStates, memorizeLastViewedPostId: postId, memorizeViewPortPositionY: window.scrollY });
        // Step #2 jump
        router.push(`/me/id/${memberId}`);
    }

    const [behaviourStates, setBehaviourStates] = React.useState<TBehaviourStates>({
        undoSaved: {}
    })

    // Handle click on bottom-right icon button
    const handleMultiProposeClick = (buttonId: number, postId: string) => (event: React.MouseEvent<HTMLButtonElement>) => {
        // edit post
        if (1 === buttonId) {
            router.push(`/me/editpost/${postId}`);
            return;
        }

        // undo save post
        if (2 === buttonId) {
            // Step #1 mark post of chice as "undo-saved"
            let update: { [postId: string]: number } = { ...behaviourStates.undoSaved };
            if (update.hasOwnProperty(postId)) {
                update[postId] = -1 * update[postId]
            } else {
                update[postId] = -1
            }
            setBehaviourStates({ ...behaviourStates, undoSaved: { ...update } });
            // Step #2 request to delete record
        }

        // delete browsing history
        if (3 === buttonId) {
            // Step #1 remove post card
            const update = masonryPostInfoArr.filter(po => po.postId !== postId);
            setMasonryPostInfoArr([...update]);
            // Step #2 request to delete record
        }
    }

    //////////////////////// Settings Layout ////////////////////////

    //////// STATES - settings layout ////////
    const [settingslayoutStates, setSettingsLayoutStates] = React.useState<TSettingsLayoutStates>({
        selectedSettingId: 0,
        nickname: memberInfo_ss.nickname,
        avatarImageUrl: memberInfo_ss.avatarImageUrl,
        password: '',
        repeatPassword: '',
        showpassword: false,
        briefIntro: '',
        gender: -1,
        birthday: dayjs('2014-08-18T21:11:54'),

        isWishToCancelChecked: false,
        blacklist: [],
        registerDate: '2022-11-10T22:44:24.373372Z'
    });

    React.useEffect(() => { updateSettingslayoutStates() }, [settingslayoutStates.selectedSettingId])

    const updateSettingslayoutStates = async () => {
        // TODO: 1 ~ 6 have not satistied
        if (7 === settingslayoutStates.selectedSettingId) {
            const resp = await fetch(`/api/member/block/blockedby/${memberId}`);
            if (200 !== resp.status) {
                console.log(`Attempt to GET blocked member info array`);
                return;
            }
            try {
                const arr = await resp.json();
                setSettingsLayoutStates({ ...settingslayoutStates, blacklist: [...arr] });
            } catch (e) {
                console.log(`Attempt to get blocked member info array of from resp. ${e}`)
            }
        }
    }

    const handleSettingSelect = (settingId: number) => (event: React.SyntheticEvent) => {
        setSettingsLayoutStates({ ...settingslayoutStates, selectedSettingId: settingId });
    }

    const handleUndoBlock = (memberId: string) => (event: React.MouseEvent<HTMLButtonElement>) => {

    }

    //////// COMPONENT - settings layout ////////
    const SettingsLayout = () => {

        //// Avatar ////
        const AvatarSetting = () => {
            const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
                if (event.target.files?.length !== 0 && event.target.files !== null) {
                    const url = URL.createObjectURL(event.target.files[0]);
                    setSettingsLayoutStates({ ...settingslayoutStates, avatarImageUrl: url })
                }
            }

            return (
                <Box sx={{ paddingTop: 6 }}>

                    {/* image */}
                    <CenterlizedBox>
                        <Avatar src={settingslayoutStates.avatarImageUrl} sx={{ width: { xs: 96, md: 128 }, height: { xs: 96, md: 128 }, }}></Avatar>
                    </CenterlizedBox>
                    <CenterlizedBox mt={1}>
                        <Box>
                            <IconButton color="primary" aria-label="upload picture" component="label" >
                                <input hidden accept="image/*" type="file" onChange={handleUpload} />
                                <PhotoCamera />
                            </IconButton>
                        </Box>
                    </CenterlizedBox>

                    {/* upload */}
                    <CenterlizedBox mt={1}>
                        <Button variant='contained' size='small'>
                            <Typography>{langConfigs.upload[preferenceStates.lang]}</Typography>
                        </Button>
                    </CenterlizedBox>
                </Box>
            )
        }

        //// Nickname ////
        const NicknameSetting = () => {
            const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
                setSettingsLayoutStates({ ...settingslayoutStates, nickname: event.target.value });
            }
            const handleSubmit = () => { }

            return (
                <Container maxWidth='xs' sx={{ paddingTop: { xs: 6, sm: 16 } }}>

                    {/* input */}
                    <CenterlizedBox>
                        <TextField
                            required
                            label={langConfigs.newNickname[preferenceStates.lang]}
                            value={settingslayoutStates.nickname}
                            onChange={handleChange}
                            size={'small'}
                        />
                    </CenterlizedBox>

                    {/* update */}
                    <CenterlizedBox sx={{ mt: 2 }}>
                        <Button variant='contained' size='small'>
                            <Typography>{langConfigs.update[preferenceStates.lang]}</Typography>
                        </Button>
                    </CenterlizedBox>
                </Container>
            )
        }

        //// Password ////
        const PasswordeSetting = () => {

            const handleShowPassword = () => {
                setSettingsLayoutStates({ ...settingslayoutStates, showpassword: !settingslayoutStates.showpassword });
            }
            const handleChange = (prop: keyof TSettingsLayoutStates) => (event: React.ChangeEvent<HTMLInputElement>) => {
                setSettingsLayoutStates({ ...settingslayoutStates, [prop]: event.target.value });
            }
            const handleSubmit = () => { }

            return (
                <Container maxWidth='xs' sx={{ paddingTop: 6 }}>
                    {/* current password */}
                    <CenterlizedBox>
                        <FormControl variant='outlined' size='small'>
                            <InputLabel htmlFor='outlined-adornment-password'>{langConfigs.newPassword[preferenceStates.lang]}</InputLabel>
                            <OutlinedInput
                                required
                                id={'outlined-adornment-password'}
                                label={langConfigs.newPassword[preferenceStates.lang]}
                                type={settingslayoutStates.showpassword ? 'text' : 'password'}
                                value={settingslayoutStates.password}
                                onChange={handleChange('password')}
                                endAdornment={
                                    <InputAdornment position="end">
                                        <IconButton
                                            aria-label="toggle password visibility"
                                            onClick={handleShowPassword}
                                            edge="end"
                                        >
                                            {settingslayoutStates.showpassword ? <VisibilityIcon /> : <VisibilityOffIcon />}
                                        </IconButton>
                                    </InputAdornment>
                                }
                            />
                        </FormControl>
                    </CenterlizedBox>

                    {/* new password */}
                    <CenterlizedBox sx={{ mt: 2 }}>
                        <FormControl variant='outlined' size='small'>
                            <InputLabel htmlFor='outlined-adornment-new-password'>{langConfigs.newPassword[preferenceStates.lang]}</InputLabel>
                            <OutlinedInput
                                required
                                id={'outlined-adornment-new-password'}
                                label={langConfigs.newPassword[preferenceStates.lang]}
                                type={settingslayoutStates.showpassword ? 'text' : 'password'}
                                value={settingslayoutStates.password}
                                onChange={handleChange('password')}
                                endAdornment={
                                    <InputAdornment position="end">
                                        <IconButton
                                            aria-label="toggle password visibility"
                                            onClick={handleShowPassword}
                                            edge="end"
                                        >
                                            {settingslayoutStates.showpassword ? <VisibilityIcon /> : <VisibilityOffIcon />}
                                        </IconButton>
                                    </InputAdornment>
                                }
                            />
                        </FormControl>
                    </CenterlizedBox>

                    {/* repear new password */}
                    <CenterlizedBox sx={{ mt: 2 }}>
                        <FormControl variant='outlined' size='small'>
                            <InputLabel htmlFor='outlined-adornment-repeat-new-password'>{langConfigs.repeatNewPassword[preferenceStates.lang]}</InputLabel>
                            <OutlinedInput
                                required
                                id={'outlined-adornment-repeat-new-password'}
                                label={langConfigs.repeatNewPassword[preferenceStates.lang]}
                                type={settingslayoutStates.showpassword ? 'text' : 'password'}
                                value={settingslayoutStates.repeatPassword}
                                onChange={handleChange('repeatPassword')}
                                endAdornment={
                                    <InputAdornment position="end">
                                        <IconButton
                                            aria-label="toggle password visibility"
                                            onClick={handleShowPassword}
                                            edge="end"
                                        >
                                            {settingslayoutStates.showpassword ? <VisibilityIcon /> : <VisibilityOffIcon />}
                                        </IconButton>
                                    </InputAdornment>
                                }
                            />
                        </FormControl>
                    </CenterlizedBox>




                    <CenterlizedBox sx={{ mt: 2 }}>
                        <Button variant='contained' size='small'>
                            <Typography>{langConfigs.submit[preferenceStates.lang]}</Typography>
                        </Button>
                    </CenterlizedBox>
                    <Box sx={{ mt: 6, paddingX: 2, textAlign: 'right' }} >
                        <Link href="/forgot" variant="body2">
                            {langConfigs.forgotPassword[preferenceStates.lang]}
                        </Link>
                    </Box>
                </Container>
            )
        }

        //// Brief Intro ////
        const BriefIntroSetting = () => {
            const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
                setSettingsLayoutStates({ ...settingslayoutStates, briefIntro: event.target.value });
            }

            const handleSubmit = () => { }

            return (
                <Container maxWidth='xs' sx={{ paddingTop: { xs: 6, sm: 12 } }}>

                    <CenterlizedBox>
                        <TextField
                            required
                            label={langConfigs.briefIntro[preferenceStates.lang]}
                            multiline
                            rows={3}
                            value={settingslayoutStates.briefIntro}
                            placeholder={langConfigs.introduceYourself[preferenceStates.lang]}
                            onChange={handleChange}
                            size='small'
                        />
                    </CenterlizedBox>
                    <CenterlizedBox sx={{ mt: 2 }}>
                        <Button variant='contained' size='small'>
                            <Typography>{langConfigs.submit[preferenceStates.lang]}</Typography>
                        </Button>
                    </CenterlizedBox>
                </Container>
            )
        }

        //// Gender ////
        const GenderSetting = () => {
            const handleChange = (event: SelectChangeEvent) => {
                setSettingsLayoutStates({ ...settingslayoutStates, gender: parseInt(event.target.value) })
            };

            const handleSubmit = () => { };

            return (
                <Container maxWidth='xs' sx={{ paddingTop: { xs: 6, sm: 16 } }}>
                    <CenterlizedBox>
                        <FormControl sx={{ minWidth: 100 }}>
                            <InputLabel id="gender-select-label">{langConfigs.gender[preferenceStates.lang]}</InputLabel>
                            <Select
                                labelId="gender-select-label"
                                id="gender-select"
                                value={settingslayoutStates.gender.toString()}
                                label={langConfigs.gender[preferenceStates.lang]}
                                onChange={handleChange}
                                size='small'
                            >
                                <MenuItem value={0}>{langConfigs.female[preferenceStates.lang]}</MenuItem>
                                <MenuItem value={1}>{langConfigs.male[preferenceStates.lang]}</MenuItem>
                                <MenuItem value={-1}>{langConfigs.keepAsSecret[preferenceStates.lang]}</MenuItem>
                            </Select>
                        </FormControl>
                    </CenterlizedBox>
                    <CenterlizedBox sx={{ mt: 2 }}>
                        <Button variant='contained' size='small'>
                            <Typography>{langConfigs.submit[preferenceStates.lang]}</Typography>
                        </Button>
                    </CenterlizedBox>
                </Container>
            )
        }

        //// Birthday ////
        const BirthdaySetting = () => {
            const handleChange = (value: Dayjs | null) => {
                setSettingsLayoutStates({ ...settingslayoutStates, birthday: value });
            };
            const handleSubmit = () => { };
            return (
                <Container maxWidth='xs' sx={{ paddingTop: { xs: 6, sm: 14 } }}>
                    <CenterlizedBox>
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <MobileDatePicker
                                label={langConfigs.chooseYourBirthday[preferenceStates.lang]}
                                inputFormat='MM/DD/YYYY'
                                value={settingslayoutStates.birthday}
                                onChange={handleChange}
                                renderInput={(params) => <TextField {...params} />}
                            />
                        </LocalizationProvider>
                    </CenterlizedBox>
                    <CenterlizedBox sx={{ mt: 2 }}>
                        <Button variant='contained' size='small'>
                            <Typography>{langConfigs.submit[preferenceStates.lang]}</Typography>
                        </Button>
                    </CenterlizedBox>
                </Container>
            )
        }



        //// Privacy ////
        const PrivacySettings = () => {
            const handleSelectLang = (event: SelectChangeEvent<string>) => {
                setProcessStates({ ...processStates, lang: event.target.value });
                setPreferenceStates({ ...preferenceStates, lang: event.target.value });
                updatePreferenceStatesCache({ ...preferenceStates, lang: event.target.value })
            }
            const handleCheck = () => {
                setSettingsLayoutStates({ ...settingslayoutStates, isWishToCancelChecked: !settingslayoutStates.isWishToCancelChecked });
            }
            return (
                <Container maxWidth='xs' sx={{ paddingTop: { xs: 2.5 } }}>
                    <FormGroup>

                        {/* visibility */}
                        <Typography variant={'body2'} >{langConfigs.visibility[preferenceStates.lang]}</Typography>
                        <Box pl={{ xs: 0, sm: 2, md: 4 }} mb={1}>
                            <FormControlLabel control={<Switch defaultChecked />} label={<Typography variant={'body2'} align={'left'}>{langConfigs.allowVisitingSavedPosts[preferenceStates.lang]}</Typography>} sx={{ fontSize: 14 }} />
                        </Box>


                        {/* privacy */}
                        <Typography variant={'body2'} >{langConfigs.privacy[preferenceStates.lang]}</Typography>
                        <Box pl={{ xs: 0, sm: 2, md: 4 }} mb={1}>
                            <FormControlLabel control={<Switch defaultChecked />} label={<Typography variant={'body2'} align={'left'}>{langConfigs.allowSavingBrowsingHistory[preferenceStates.lang]}</Typography>} sx={{ fontSize: 14 }} />
                            <FormControlLabel control={<Switch defaultChecked />} label={<Typography variant={'body2'} align={'left'}>{langConfigs.hidePostsAndCommentsFromBlockedMember[preferenceStates.lang]}</Typography>} sx={{ fontSize: 14 }} />
                        </Box>

                        {/* language */}
                        <Typography variant={'body2'} >{langConfigs.language[preferenceStates.lang]}</Typography>
                        <Box pl={{ xs: 0, sm: 2, md: 4 }} mb={2} pt={1}>
                            <Select
                                value={preferenceStates.lang}
                                onChange={handleSelectLang}
                                size='small'
                            >
                                <MenuItem value={'tw'}>{'繁体中文'}</MenuItem>
                                <MenuItem value={'cn'}>{'简体中文'}</MenuItem>
                                <MenuItem value={'en'}>{'English'}</MenuItem>
                            </Select>
                        </Box>


                        {/* cancel member */}
                        <Typography variant={'body2'} >{langConfigs.cancelMembership[preferenceStates.lang]}</Typography>
                        <Box pl={{ xs: 0, sm: 2, md: 4 }}>
                            <FormControlLabel control={<Checkbox onChange={handleCheck} checked={settingslayoutStates.isWishToCancelChecked} />} label={langConfigs.wishToCancelMembership[preferenceStates.lang]} />
                        </Box>
                        {settingslayoutStates.isWishToCancelChecked && <Box mb={4} paddingX={2}>
                            <Button variant='contained' size='small' fullWidth>{langConfigs.cancel[preferenceStates.lang]}</Button>
                        </Box>}
                    </FormGroup>

                </Container >
            )
        }

        //// Blocked member list ////
        const BlacklistSettings = () => {
            return (
                <Container maxWidth='xs' >

                    {/* blocked member info list */}
                    <Stack padding={{ xs: 0, sm: 2 }} spacing={{ xs: 4, sm: 4, md: 5 }}>
                        {0 !== settingslayoutStates.blacklist.length && settingslayoutStates.blacklist.map(info =>

                            <Box key={info.memberId} mt={{ xs: 3, sm: 2 }} sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }} >

                                {/* member info */}
                                <Stack direction={'row'} sx={{ maxHeight: 40 }}>
                                    <IconButton sx={{ padding: 0 }} onClick={handleClickOnInitiateInfo(info.memberId)}>
                                        <Avatar src={info.avatarImageUrl} sx={{ width: 38, height: 38, bgcolor: 'grey' }}>{info.nickname?.charAt(0).toUpperCase()}</Avatar>
                                    </IconButton>
                                    <Box ml={1}>
                                        <TextButton color='inherit' onClick={handleClickOnInitiateInfo(info.memberId)}>

                                            {/* nickname */}
                                            <Typography variant='body2' align='left'>{getContentBrief(info.nickname, 14)}</Typography>

                                            {/* created time */}
                                            <Typography variant='body2' fontSize={{ xs: 12, align: 'right' }}>{timeToString(info.createdTime, preferenceStates.lang)}</Typography>
                                        </TextButton>
                                    </Box>
                                </Stack>

                                {/* undo follow button */}
                                {'following' === listLayoutStates.selectedCategory && <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }} >
                                    <Button variant='text' color='inherit' onClick={handleUndoBlock(info.memberId)}>
                                        <Typography variant={'body2'} align={'right'}>{langConfigs.undoBlock[preferenceStates.lang]}</Typography>
                                    </Button>
                                </Box>}

                            </Box>
                        )}
                        {0 === listLayoutStates.memberInfoArr.length &&
                            <Box mt={{ xs: 3, sm: 2 }}>
                                <Typography color={'text.secondary'} align={'center'}>{langConfigs.noFollowingMemberInfoRecord[preferenceStates.lang]}</Typography>
                            </Box>
                        }
                    </Stack>
                </Container>
            )
        }

        //// Register Info ////
        const RegisterInfo = () => {
            return (
                <Container maxWidth='xs' sx={{ paddingTop: { xs: 6, sm: 14 } }}>
                    
                    {/* memberid */}
                    <Typography variant='body1' color={'text.secondary'}>{`${langConfigs.memberId[preferenceStates.lang]}: ${memberId}`}</Typography>
                    
                    {/* register date */}
                    <Typography variant='body1'>{`${langConfigs.registerDate[preferenceStates.lang]}: ${new Date(settingslayoutStates.registerDate).toLocaleDateString()}`}</Typography>
                </Container>
            )
        }

        //////// COMPONENT - settings layout frame //////// 
        return (
            <Grid container mt={2}>

                {/* //// placeholder - left //// */}
                <Grid item xs={0} sm={2} md={2} lg={4} xl={4}></Grid>

                {/* //// left column //// */}
                <Grid item xs={4} sm={2} md={2} lg={1} xl={1} sx={{ minWidth: { xs: 0, sm: 160 } }}>
                    <Box sx={{ borderRadius: 1, boxShadow: { xs: 0, sm: 1, md: 2 }, padding: { xs: 0, sm: 1 }, marginRight: 1, minHeight: 400 }}>
                        <MenuList>

                            {/* avatar */}
                            <MenuItem onClick={handleSettingSelect(0)} selected={0 === processStates.selectedSettingId} >
                                <ListItemIcon>
                                    <AccountCircleIcon />
                                </ListItemIcon>
                                <ListItemText>
                                    <Typography variant='body2'>{langConfigs.avatar[preferenceStates.lang]}</Typography>
                                </ListItemText>
                            </MenuItem>

                            {/* nickname */}
                            <MenuItem onClick={handleSettingSelect(1)} selected={1 === processStates.selectedSettingId}>
                                <ListItemIcon>
                                    <LabelIcon />
                                </ListItemIcon>
                                <ListItemText>
                                    <Typography variant='body2'>{langConfigs.nickname[preferenceStates.lang]}</Typography>
                                </ListItemText>
                            </MenuItem>

                            {/* password */}
                            <MenuItem onClick={handleSettingSelect(2)} selected={2 === processStates.selectedSettingId}>
                                <ListItemIcon>
                                    <LockIcon />
                                </ListItemIcon>
                                <ListItemText>
                                    <Typography variant='body2'>{langConfigs.password[preferenceStates.lang]}</Typography>
                                </ListItemText>
                            </MenuItem>

                            {/* brief intro */}
                            <MenuItem onClick={handleSettingSelect(3)} selected={3 === processStates.selectedSettingId}>
                                <ListItemIcon>
                                    <InterestsIcon />
                                </ListItemIcon>
                                <ListItemText>
                                    <Typography variant='body2'>{langConfigs.briefIntro[preferenceStates.lang]}</Typography>
                                </ListItemText>
                            </MenuItem>

                            {/* gender */}
                            <MenuItem onClick={handleSettingSelect(4)} selected={4 === processStates.selectedSettingId}>
                                <ListItemIcon>
                                    <OpacityIcon />
                                </ListItemIcon>
                                <ListItemText>
                                    <Typography variant='body2'>{langConfigs.gender[preferenceStates.lang]}</Typography>
                                </ListItemText>
                            </MenuItem>

                            {/* birthday */}
                            <MenuItem onClick={handleSettingSelect(5)} selected={5 === processStates.selectedSettingId}>
                                <ListItemIcon>
                                    <CakeIcon />
                                </ListItemIcon>
                                <ListItemText>
                                    <Typography variant='body2'>{langConfigs.birthday[preferenceStates.lang]}</Typography>
                                </ListItemText>
                            </MenuItem>

                            {/* privacy */}
                            <MenuItem onClick={handleSettingSelect(6)} selected={6 === processStates.selectedSettingId}>
                                <ListItemIcon>
                                    <CheckBoxIcon />
                                </ListItemIcon>
                                <ListItemText>
                                    <Typography variant='body2'>{langConfigs.privacySettings[preferenceStates.lang]}</Typography>
                                </ListItemText>
                            </MenuItem>

                            {/* blacklist */}
                            <MenuItem onClick={handleSettingSelect(7)} selected={7 === processStates.selectedSettingId}>
                                <ListItemIcon>
                                    <BlockIcon />
                                </ListItemIcon>
                                <ListItemText>
                                    <Typography variant='body2'>{langConfigs.blacklist[preferenceStates.lang]}</Typography>
                                </ListItemText>
                            </MenuItem>

                            {/* register info */}
                            <MenuItem onClick={handleSettingSelect(10)} selected={10 === processStates.selectedSettingId}>
                                <ListItemIcon>
                                    <InfoIcon />
                                </ListItemIcon>
                                <ListItemText>
                                    <Typography variant='body2'>{langConfigs.memberInfo[preferenceStates.lang]}</Typography>
                                </ListItemText>
                            </MenuItem>
                        </MenuList>
                    </Box>
                </Grid>

                {/* //// right column //// */}
                <Grid item xs={8} sm={6} md={6} lg={3} xl={3}>
                    {/* multi-display */}
                    <Box sx={{ borderRadius: 1, boxShadow: { xs: 0, sm: 1, md: 2 }, minHeight: 400 }}>
                        {0 === settingslayoutStates.selectedSettingId && <AvatarSetting />}
                        {1 === settingslayoutStates.selectedSettingId && <NicknameSetting />}
                        {2 === settingslayoutStates.selectedSettingId && <PasswordeSetting />}
                        {3 === settingslayoutStates.selectedSettingId && <BriefIntroSetting />}
                        {4 === settingslayoutStates.selectedSettingId && <GenderSetting />}
                        {5 === settingslayoutStates.selectedSettingId && <BirthdaySetting />}
                        {6 === settingslayoutStates.selectedSettingId && <PrivacySettings />}
                        {7 === settingslayoutStates.selectedSettingId && <BlacklistSettings />}
                        {10 === settingslayoutStates.selectedSettingId && <RegisterInfo />}
                    </Box>
                </Grid>

                {/* //// placeholder - right //// */}
                <Grid item xs={0} sm={2} md={2} lg={4} xl={4}></Grid>
            </Grid>
        )
    }

    ///////// COMPONENT - member page /////////
    return (
        <>
            <Navbar />

            {/* //// first layer - member info //// */}
            <Box sx={{ minHeight: { xs: 160, md: 200 } }}>
                <Box>

                    {/* avatar */}
                    <CenterlizedBox sx={{ marginTop: { xs: 4, sm: 6 } }}>
                        <Avatar src={avatarImageUrl} sx={{ height: { xs: 90, sm: 72 }, width: { xs: 90, sm: 72 } }}>{nickname?.charAt(0).toUpperCase()}</Avatar>
                    </CenterlizedBox>

                    {/* nickname */}
                    <CenterlizedBox sx={{ marginTop: { xs: 0, sm: 1 } }}>
                        <Typography variant='h6' textAlign={'center'}>{nickname}</Typography>
                    </CenterlizedBox>

                    {/* info */}
                    <Grid container columnSpacing={3} sx={{ marginTop: 1 }}>

                        {/* blank space */}
                        <Grid item flexGrow={1}></Grid>

                        {/* creation count */}
                        <Grid item>
                            <CenterlizedBox>
                                <Typography variant='body1'>{langConfigs.creations[preferenceStates.lang]}</Typography>
                            </CenterlizedBox>
                            <CenterlizedBox>
                                <Typography variant='body1'>{memberStatistics_ss.totalCreationCount}</Typography>
                            </CenterlizedBox>
                        </Grid>

                        {/* followed by count */}
                        <Grid item>
                            <CenterlizedBox>
                                <Typography variant='body1'>{langConfigs.followedBy[preferenceStates.lang]}</Typography>
                            </CenterlizedBox>
                            <CenterlizedBox>
                                <Typography variant='body1'>{memberStatistics_ss.totalFollowedByCount}</Typography>
                            </CenterlizedBox>
                        </Grid>

                        {/* creation saved count */}
                        <Grid item>
                            <CenterlizedBox>
                                <Typography variant='body1'>{langConfigs.saved[preferenceStates.lang]}</Typography>
                            </CenterlizedBox>
                            <CenterlizedBox>
                                <Typography variant='body1'>{memberStatistics_ss.totalCreationSavedCount}</Typography>
                            </CenterlizedBox>
                        </Grid>

                        {/* creation liked count */}
                        <Grid item>
                            <CenterlizedBox>
                                <Typography variant='body1'>{langConfigs.liked[preferenceStates.lang]}</Typography>
                            </CenterlizedBox>
                            <CenterlizedBox>
                                <Typography variant='body1'>{memberStatistics_ss.totalCreationLikedCount}</Typography>
                            </CenterlizedBox>
                        </Grid>

                        {/* blank space */}
                        <Grid item flexGrow={1}></Grid>
                    </Grid>

                    {/* layout select */}
                    <Stack spacing={1} direction='row' mt={1} sx={{ padding: 1, justifyContent: 'center', overflow: 'auto' }}>

                        {/* s0 - message layout */}
                        {('authenticated' === status && viewerId === memberId) && <Button variant={'contained'} size='small' color={'messageslayout' === processStates.selectedLayout ? 'primary' : 'inherit'} onClick={handleSelectCategory('messageslayout')}>
                            <Typography variant={'body2'} color={'dark' === theme.palette.mode ? 'black' : 'inherit'}>
                                {langConfigs.message[preferenceStates.lang]}
                            </Typography>
                        </Button>}

                        {/* s1 - list layout - my/author's following */}
                        <Button variant={'contained'} size='small' color={'listlayout' === processStates.selectedLayout ? 'primary' : 'inherit'} onClick={handleSelectCategory('listlayout')}>
                            <Typography variant={'body2'} color={'dark' === theme.palette.mode ? 'black' : 'inherit'}>
                                {viewerId === memberId ? langConfigs.following[preferenceStates.lang] : langConfigs.authorsFollowing[preferenceStates.lang]}
                            </Typography>
                        </Button>

                        {/* s2 - post layout - my/author's posts */}
                        <Button variant={'contained'} size='small' color={'postslayout' === processStates.selectedLayout ? 'primary' : 'inherit'} onClick={handleSelectCategory('postslayout')}>
                            <Typography variant={'body2'} color={'dark' === theme.palette.mode ? 'black' : 'inherit'}>
                                {viewerId === memberId ? langConfigs.posts[preferenceStates.lang] : langConfigs.authorsPosts[preferenceStates.lang]}
                            </Typography>
                        </Button>

                        {/* s3 - settings layout */}
                        {('authenticated' === status && viewerId === memberId) && <Button variant={'contained'} size='small' color={'settingslayout' === processStates.selectedLayout ? 'primary' : 'inherit'} onClick={handleSelectCategory('settingslayout')}>
                            <Typography variant={'body2'} color={'dark' === theme.palette.mode ? 'black' : 'inherit'} >
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
            {'messageslayout' === processStates.selectedLayout && <MessagesLayout />}

            {/* posts layout */}
            <Grid container display={'postslayout' === processStates.selectedLayout ? 'flex' : 'none'}>

                {/* //// placeholder left //// */}
                <Grid item xs={0} sm={1} md={2} lg={2} xl={2}></Grid>

                {/* //// left column //// */}
                <Grid item xs={0} sm={0} md={2} lg={2} xl={1}>
                    <Stack spacing={0} sx={{ marginX: 1, display: { xs: 'none', sm: 'none', md: 'block' } }} >

                        {/* my posts / saved posts / browsing history switch */}
                        <ResponsiveCard >
                            <MenuList>

                                {/* creations list item */}
                                <MenuItem onClick={handleSelectPostCategory('mycreations')} selected={'mycreations' === postsLayoutStates.selectedCategory}>
                                    <ListItemIcon ><CreateIcon /></ListItemIcon>
                                    <ListItemText>
                                        <Typography>{langConfigs.myCreations[preferenceStates.lang]}</Typography>
                                    </ListItemText>
                                </MenuItem>

                                {/* saved post list item */}
                                <MenuItem onClick={handleSelectPostCategory('savedposts')} selected={'savedposts' === postsLayoutStates.selectedCategory}>
                                    <ListItemIcon >
                                        <StarIcon />
                                    </ListItemIcon>
                                    <ListItemText>
                                        <Typography>{langConfigs.mySavedPosts[preferenceStates.lang]}</Typography>
                                    </ListItemText>
                                </MenuItem>

                                {/* browsing history list item */}
                                <MenuItem onClick={handleSelectPostCategory('browsinghistory')} selected={'browsinghistory' === postsLayoutStates.selectedCategory}>
                                    <ListItemIcon >
                                        <HistoryIcon />
                                    </ListItemIcon>
                                    <ListItemText>
                                        <Typography>{langConfigs.browsingHistory[preferenceStates.lang]}</Typography>
                                    </ListItemText>
                                </MenuItem>
                            </MenuList>
                        </ResponsiveCard>

                        {/* the channel menu (desktop mode) */}
                        <ResponsiveCard sx={{ padding: 1 }}>
                            <MenuList>
                                {/* the 'all' menu item */}
                                <MenuItem onClick={handleChannelSelect('all')} selected={postsLayoutStates.selectedChannelId === 'all'}>
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
                                            selected={channelId === postsLayoutStates.selectedChannelId}
                                        >
                                            <ListItemIcon >
                                                <SvgIcon><path d={svgIconPath} /></SvgIcon>
                                            </ListItemIcon>
                                            <ListItemText>
                                                <Typography>{name[preferenceStates.lang]}</Typography>
                                            </ListItemText>
                                        </MenuItem>
                                    )
                                })}
                            </MenuList>
                        </ResponsiveCard>

                        {/* hotest / newest switch */}
                        <ResponsiveCard sx={{ padding: 0, paddingY: 2, paddingLeft: 2 }}>
                            <FormControlLabel
                                control={<StyledSwitch sx={{ ml: 1 }} checked={postsLayoutStates.selectedHotPosts} />}
                                label={postsLayoutStates.selectedHotPosts ? langConfigs.hotPosts[preferenceStates.lang] : langConfigs.newPosts[preferenceStates.lang]}
                                onChange={handleSwitchChange}
                                sx={{ marginRight: 0 }}
                            />
                        </ResponsiveCard>
                    </Stack>
                </Grid>

                {/* //// right column //// */}
                <Grid item xs={12} sm={10} md={6} lg={6} xl={6}>

                    {/* channel bar (mobile mode) */}
                    <Stack id={'channel-bar'} direction={'row'} sx={{ display: { sm: 'flex', md: 'none' }, padding: 1, overflow: 'auto' }}>

                        {/* creations button */}
                        <Box pr={1 / 2}>
                            <Button variant={'mycreations' === postsLayoutStates.selectedCategory ? 'contained' : 'outlined'} size='small' sx={{ minWidth: 'max-content' }} onClick={handleSelectPostCategory('mycreations')}>
                                {langConfigs.myCreations[preferenceStates.lang]}
                            </Button>
                        </Box>

                        {/*  saved post button */}
                        <Box pr={1 / 2}>
                            <Button variant={'savedposts' === postsLayoutStates.selectedCategory ? 'contained' : 'outlined'} size='small' sx={{ minWidth: 'max-content' }} onClick={handleSelectPostCategory('savedposts')}>
                                {langConfigs.mySavedPosts[preferenceStates.lang]}
                            </Button>
                        </Box>

                        {/* browsing history button */}
                        <Box pr={1}>
                            <Button variant={'browsinghistory' === postsLayoutStates.selectedCategory ? 'contained' : 'outlined'} size='small' sx={{ minWidth: 'max-content' }} onClick={handleSelectPostCategory('browsinghistory')}>
                                {langConfigs.browsingHistory[preferenceStates.lang]}
                            </Button>
                        </Box>

                        {/* the 'all' button */}
                        <Button variant={'all' === postsLayoutStates.selectedChannelId ? 'contained' : 'text'} size='small' onClick={handleChannelSelect('all')} >
                            <Typography variant='body2' color={'all' === postsLayoutStates.selectedChannelId ? 'white' : "text.secondary"} sx={{ backgroundColor: 'primary' }}>
                                {langConfigs.allPosts[preferenceStates.lang]}
                            </Typography>
                        </Button>

                        {/* other channels */}
                        {channelInfoStates.channelIdSequence.map(id => {
                            const { channelId, name } = channelInfoDict_ss[id];
                            return (
                                <Button variant={channelId === postsLayoutStates.selectedChannelId ? 'contained' : 'text'} key={`button-${channelId}`} size='small' sx={{ minWidth: 'en' === preferenceStates.lang ? 'max-content' : 64 }} onClick={handleChannelSelect(channelId)}>
                                    <Typography
                                        variant={'body2'}
                                        color={channelId === postsLayoutStates.selectedChannelId ? 'white' : 'text.secondary'}
                                        sx={{ backgroundColor: 'primary' }}>
                                        {name[preferenceStates.lang]}
                                    </Typography>
                                </Button>
                            )
                        })}
                    </Stack>

                    {/* mansoy */}
                    <Box ml={1} ref={masonryWrapper}>
                        <Masonry columns={{ xs: 2, sm: 3, md: 3, lg: 3, xl: 4 }}>

                            {/* posts */}
                            {0 !== masonryPostInfoArr.length && masonryPostInfoArr.map(info => {
                                return (
                                    <Paper key={info.postId} id={info.postId} sx={{ maxWidth: 300, '&:hover': { cursor: 'pointer' } }}>
                                        <Stack>
                                            {/* image */}
                                            <Box
                                                component={'img'}
                                                src={info.imageUrlsArr[0]}
                                                sx={{ maxWidth: { xs: width / 2, sm: 300 }, height: 'max-content', borderTopLeftRadius: 4, borderTopRightRadius: 4 }}
                                                onClick={handleClickOnPost(info.postId)}
                                            ></Box>

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
                                                                <Avatar src={info.avatarImageUrl} sx={{ width: 34, height: 34, bgcolor: 'grey' }}>{info.nickname?.charAt(0).toUpperCase()}</Avatar>
                                                                <Box ml={1}>
                                                                    <Typography variant='body2'>{getNicknameBrief(info.nickname)}</Typography>
                                                                </Box>
                                                            </Button>
                                                        </Box>
                                                    </Grid>

                                                    {/* member behaviour / placeholder */}
                                                    {('authenticated' === status && viewerId === memberId) && <Grid item>
                                                        <IconButton onClick={handleMultiProposeClick(processStates.selectedCategoryId, info.postId)}>
                                                            {'mycreations' === postsLayoutStates.selectedCategory && <CreateIcon color={'inherit'} />}
                                                            {'savedposts' === postsLayoutStates.selectedCategory && <StarIcon color={-1 === behaviourStates.undoSaved[info.postId] ? 'inherit' : 'primary'} />}
                                                            {'browsinghistory' === postsLayoutStates.selectedCategory && <DeleteIcon color={'inherit'} />}
                                                        </IconButton>
                                                    </Grid>}
                                                </Grid>
                                            </Box>
                                        </Stack>
                                    </Paper>
                                )
                            })}
                        </Masonry>
                    </Box>
                </Grid>

                {/* //// placeholder - right //// */}
                <Grid item xs={0} sm={1} md={2} lg={2} xl={2}></Grid>
            </Grid>

            {/* list layout */}
            {'listlayout' === processStates.selectedLayout && <ListLayout />}

            {/* settings layout */}
            {'settingslayout' === processStates.selectedLayout && <SettingsLayout />}

        </>
    )
}

export default Member;