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

import { IMemberInfo, IConciseMemberStatistics, IRestrictedMemberComprehensive } from '../../lib/interfaces/member';
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

const Message = () => {

    const router = useRouter();
    const { data: session } = useSession({ required: true, onUnauthenticated() { signIn(); } });

    React.useEffect(() => {

        updateNoticeArrayAndStatistics();
        restorePreferenceStatesFromCache(setPreferenceStates);
    }, [session]);

    //////// STATES - preference ////////
    const [preferenceStates, setPreferenceStates] = React.useState<TPreferenceStates>({
        lang: defaultLang,
        mode: 'light'
    });

    type TMessagePageProcessStates = {
        selectedCategory: string;
        noticeInfoArr: INoticeInfoWithMemberInfo[];
        noticeStatistics: { [category: string]: number; };
    };

    //////// STATES - process ////////
    const [processStates, setProcessStates] = React.useState<TMessagePageProcessStates>({
        selectedCategory: 'like', // default
        noticeInfoArr: [],
        noticeStatistics: { cue: 0, reply: 0, like: 0, pin: 0, save: 0, follow: 0 },
    });

    const updateNoticeArrayAndStatistics = async () => {
        let arr = [];
        let update_stat = {};
        console.log(processStates.selectedCategory);


        // GET notice info
        const resp_arr = await fetch(`/api/notice/of/${processStates.selectedCategory}`);
        if (200 !== resp_arr.status) {
            console.log(`Attempt to GET notice of ${processStates.selectedCategory}`);
            return;
        }
        try {
            const _arr = await resp_arr.json();
            if (Array.isArray(_arr)) {
                arr.push(..._arr);
            }
        } catch (e) {
            console.log(`Attempt to GET notice array from resp. ${e}`);
        }

        // GET notice statistics
        const resp_stat = await fetch(`/api/notice/statistics`);
        if (200 !== resp_stat.status) {
            console.log(`Attempt to GET notice statistics`);
            return;
        }
        try {
            update_stat = { ...(await resp_stat.json()) };
        } catch (e) {
            console.log(`Attempt to GET notice statistics (obj) from resp. ${e}`);
        }

        // Update process states
        setProcessStates({
            ...processStates,
            noticeStatistics: { ...update_stat },
            noticeInfoArr: [...arr]
        });

        // PUT (reset) notice statistics
        const resp = await fetch(`/api/notice/statistics`, { method: 'PUT' });
        if (200 !== resp.status) {
            console.log(`Attempt to PUT (reset) notice statistics`);
            return;
        }
    };

    React.useEffect(() => {
        if ('authenticated' === status) {
            updateNoticeArray();
        }
    }, [processStates.selectedCategory]);

    const updateNoticeArray = async () => {
        const resp = await fetch(`/api/notice/of/${processStates.selectedCategory}`);
        if (200 !== resp.status) {
            console.log(`Attempt to GET notice of ${processStates.selectedCategory}`);
            return;
        }
        try {
            setProcessStates({
                ...processStates,
                noticeInfoArr: [...(await resp.json())]
            });
        } catch (e) {
            console.log(`Attempt to get notice array from resp. ${e}`);
        }
    };

    const handleSelectNoticeCategory = (category: string) => (event: React.MouseEvent<HTMLButtonElement>) => {
        setProcessStates({
            selectedCategory: category,
            noticeInfoArr: [],
            noticeStatistics: { ...processStates.noticeStatistics, [category]: 0 }
        });
    };

    const handleClickOnInitiateInfo = (initiateId: string) => (event: React.MouseEvent<HTMLButtonElement>) => {
        router.push(`/me/id/${initiateId}`);
    };

    const handleClickOnNoticeInfo = (noticeId: string) => (event: React.MouseEvent<HTMLButtonElement>) => {
        router.push(noticeIdToUrl(noticeId));
    };

    return (
        <ThemeProvider theme={theme}>
            <Navbar />
            <Grid container mt={{ xs: 1, sm: 10 }}>

                {/* left column (placeholder) */}
                <Grid item xs={0} sm={2} md={3} lg={3}></Grid>

                {/* middle column */}
                <Grid item xs={12} sm={8} md={6} lg={6}>
                    <ResponsiveCard sx={{ pt: { xs: 0, sm: 2 } }}>
                        <Stack>

                            {/* section select */}
                            <Box sx={{ display: 'flex', justifyContent: 'space-evenly' }}>

                                {/* like */}
                                <Button sx={{ color: 'like' === processStates.selectedCategory ? 'primary' : 'grey.600' }} onClick={handleSelectNoticeCategory('like')}>
                                    <Box>
                                        <CentralizedBox sx={{ p: 1 }}><ThumbUpIcon /></CentralizedBox>
                                        <Typography variant={'body2'} textAlign={'center'}>{langConfigs.liked[preferenceStates.lang]}{0 === processStates.noticeStatistics.like ? '' : `+${processStates.noticeStatistics.like}`}</Typography>
                                    </Box>
                                </Button>

                                {/* save */}
                                <Button sx={{ color: 'save' === processStates.selectedCategory ? 'primary' : 'grey.600' }} onClick={handleSelectNoticeCategory('save')}>
                                    <Box>
                                        <CentralizedBox sx={{ p: 1 }}><StarIcon /></CentralizedBox>
                                        <Typography variant={'body2'} textAlign={'center'}>{langConfigs.saved[preferenceStates.lang]}{0 === processStates.noticeStatistics.save ? '' : `+${processStates.noticeStatistics.save}`}</Typography>
                                    </Box>
                                </Button>

                                {/* reply */}
                                <Button sx={{ color: 'reply' === processStates.selectedCategory ? 'primary' : 'grey.600' }} onClick={handleSelectNoticeCategory('reply')}>
                                    <Box>
                                        <CentralizedBox sx={{ p: 1 }}><ChatBubbleIcon /></CentralizedBox>
                                        <Typography variant={'body2'} textAlign={'center'}>{langConfigs.replied[preferenceStates.lang]}{0 === processStates.noticeStatistics.reply ? '' : `+${processStates.noticeStatistics.reply}`}</Typography>
                                    </Box>
                                </Button>

                                {/* cue */}
                                <Button sx={{ color: 'cue' === processStates.selectedCategory ? 'primary' : 'grey.600' }} onClick={handleSelectNoticeCategory('cue')}>
                                    <Box>
                                        <CentralizedBox sx={{ p: 1 }}><AlternateEmailIcon /></CentralizedBox>
                                        <Typography variant={'body2'} textAlign={'center'}>{langConfigs.cued[preferenceStates.lang]}{0 === processStates.noticeStatistics.cue ? '' : `+${processStates.noticeStatistics.cue}`}</Typography>
                                    </Box>
                                </Button>
                            </Box>
                            <Box mt={{ xs: 1, sm: 2 }} mb={{ xs: 2, sm: 1 }}><Divider /></Box>

                            {/* message list */}
                            <Stack padding={{ xs: 0, sm: 2 }} spacing={{ xs: 3, sm: 4 }}>
                                {0 !== processStates.noticeInfoArr.length && processStates.noticeInfoArr.map(info =>
                                    <Box key={info.noticeId} sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }} >

                                        {/* member info */}
                                        <Button variant={'text'} color={'inherit'} sx={{ pl: { xs: 0, sm: 1 }, textTransform: 'none' }} onClick={handleClickOnInitiateInfo(info.initiateId)}>
                                            <Box sx={{ display: 'flex', flexDirection: 'row' }}>

                                                {/* avatar */}
                                                <Avatar src={provideAvatarImageUrl(info.initiateId, domain)} sx={{ width: 40, height: 40, bgcolor: 'grey' }}>{info.nickname?.charAt(0).toUpperCase()}</Avatar>
                                                <Box ml={1}>

                                                    {/* nickname */}
                                                    <Typography align={'left'} variant={'body2'}>{getNicknameBrief(info.nickname)}</Typography>

                                                    {/* created time */}
                                                    <Typography fontSize={{ xs: 12 }} align={'left'}>{timeToString(info.createdTimeBySecond, preferenceStates.lang)}</Typography>
                                                </Box>
                                            </Box>
                                        </Button>

                                        {/* notice info */}
                                        <TextButton color={'inherit'} sx={{ p: 1 }} onClick={handleClickOnNoticeInfo(info.noticeId)}>
                                            <Box sx={{ maxWidth: { xs: 170, sm: 190, md: 240 } }}>
                                                <Typography variant={'body2'} align={'right'}>{noticeInfoToString(info, preferenceStates.lang)}</Typography>
                                            </Box>
                                        </TextButton>
                                    </Box>
                                )}
                                {0 === processStates.noticeInfoArr.length &&
                                    <Box minHeight={200} mt={10}>
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

            <Copyright sx={{ mt: 16 }} lang={preferenceStates.lang} />
            <Terms sx={{ mb: 8 }} lang={preferenceStates.lang} />

        </ThemeProvider>
    );
};

export default Message;