import * as React from 'react';
import { useRouter } from 'next/router';
import { signIn, useSession, } from 'next-auth/react';
import useTheme from '@mui/material/styles/useTheme';

import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';

import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import AddIcon from '@mui/icons-material/Add';
import ArticleIcon from '@mui/icons-material/Article';
import AppsIcon from '@mui/icons-material/Apps';
import BlockIcon from '@mui/icons-material/Block';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CreateIcon from '@mui/icons-material/Create';
import EditIcon from '@mui/icons-material/Edit';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import FlagIcon from '@mui/icons-material/Flag';
import ForumIcon from '@mui/icons-material/Forum';
import BarChartIcon from '@mui/icons-material/BarChart';
import IconButton from '@mui/material/IconButton';
import ListAltIcon from '@mui/icons-material/ListAlt';
import EmailIcon from '@mui/icons-material/Email';
import MarkEmailUnreadIcon from '@mui/icons-material/MarkEmailUnread';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import ReorderIcon from '@mui/icons-material/Reorder';
import SettingsIcon from '@mui/icons-material/Settings';
import AlternateEmailIcon from '@mui/icons-material/AlternateEmail';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import StarIcon from '@mui/icons-material/Star';

import { INoticeInfoWithMemberInfo } from '../lib/interfaces/notification';
import { LangConfigs, TPreferenceStates } from '../lib/types';

import { timeToString, restoreFromLocalStorage } from '../lib/utils/general';
import { provideAvatarImageUrl, getNicknameBrief } from '../lib/utils/for/member';
import { noticeIdToUrl, noticeInfoToString } from '../lib/utils/for/notification';

import { CentralizedBox, ResponsiveCard, TextButton } from '../ui/Styled';



import LegalInfo from '../ui/LegalInfo';
import Navbar from '../ui/Navbar';
import SideMenu from '../ui/SideMenu';
import SideColumn from '../ui/SideColumn';

const storageName0 = 'PreferenceStates';
const restorePreferenceStatesFromCache = restoreFromLocalStorage(storageName0);

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







    liked: {
        tw: '喜歡',
        cn: '赞过',
        en: 'Liked'
    },
    saved: {
        tw: '收藏',
        cn: '收藏',
        en: 'Saved'
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
    noNotificationRecord: {
        tw: '暫時沒有本類別的訊息',
        cn: '暂时没有本类别的讯息',
        en: 'No records of notification'
    },
};

const Message = () => {

    const router = useRouter();
    const { data: session, status } = useSession({ required: true, onUnauthenticated() { signIn(); } });

    React.useEffect(() => {
        if ('authenticated' === status) {
            const memberSession: any = { ...session };
            setProcessStates({ ...processStates, memberId: memberSession?.user?.id ?? '' });
            updateNoticeArrayAndStatistics();
            restorePreferenceStatesFromCache(setPreferenceStates);
        }
    }, [status]);

    // States - preference
    const [preferenceStates, setPreferenceStates] = React.useState<TPreferenceStates>({
        lang: defaultLang,
        mode: 'light'
    });

    type TMessagePageProcessStates = {
        memberId: string;
        selectedCategory: string;
        noticeInfoArr: INoticeInfoWithMemberInfo[];
        noticeStatistics: { [category: string]: number; };
    };

    // States - process
    const [processStates, setProcessStates] = React.useState<TMessagePageProcessStates>({
        memberId: '',
        selectedCategory: 'like', // default
        noticeInfoArr: [],
        noticeStatistics: { cue: 0, reply: 0, like: 0, pin: 0, save: 0, follow: 0 },
    });



    const updateNoticeArrayAndStatistics = async () => {
        let arr = [];
        let update_stat = {};

        // GET notice info
        const resp_arr = await fetch(`/api/notice/of/${processStates.selectedCategory}`);
        if (200 !== resp_arr.status) {
            console.error(`${updateNoticeArrayAndStatistics.name}: Attempt to GET notice of ${processStates.selectedCategory}`);
            return;
        }
        try {
            const _arr = await resp_arr.json();
            if (Array.isArray(_arr)) {
                arr.push(..._arr);
            }
        } catch (e) {
            console.error(`${updateNoticeArrayAndStatistics.name}: Attempt to GET notice array from resp. ${e}`);
        }

        // GET notice statistics
        const resp_stat = await fetch(`/api/notice/statistics`);
        if (200 !== resp_stat.status) {
            console.error(`${updateNoticeArrayAndStatistics.name}: Attempt to GET notice statistics`);
            return;
        }
        try {
            update_stat = { ...(await resp_stat.json()) };
        } catch (e) {
            console.error(`${updateNoticeArrayAndStatistics.name}: Attempt to GET notice statistics (obj) from resp. ${e}`);
        }

        // Update process states
        setProcessStates({ ...processStates, noticeStatistics: { ...update_stat }, noticeInfoArr: [...arr] });

        // PUT (reset) notice statistics
        const resp = await fetch(`/api/notice/statistics`, { method: 'PUT' });
        if (200 !== resp.status) {
            console.error(`${updateNoticeArrayAndStatistics.name}: Attempt to PUT (reset) notice statistics`);
            return;
        }
    };




    React.useEffect(() => { if ('authenticated' === status) { updateNoticeArray(); } }, [processStates.selectedCategory]);

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
            ...processStates,
            selectedCategory: category,
            noticeInfoArr: [],
            noticeStatistics: { ...processStates.noticeStatistics, [category]: 0 }
        });
    };

    const handleClickOnInitiateInfo = (initiateId: string) => (event: React.MouseEvent<HTMLButtonElement>) => {
        router.push(`/me/${initiateId}`);
    };

    const handleClickOnNoticeInfo = (noticeId: string) => (event: React.MouseEvent<HTMLButtonElement>) => {
        router.push(noticeIdToUrl(noticeId));
    };

    return (
        <>

            <Navbar lang={preferenceStates.lang} />

            <Grid container >

                {/* left */}
                <Grid item xs={0} sm={0} md={3} lg={3} xl={4} >
                    <Box sx={{ display: { xs: 'none', sm: 'none', md: 'flex' }, flexDirection: 'row-reverse', position: 'sticky', top: 0, left: 0, }}>
                        <SideMenu lang={preferenceStates.lang} />
                    </Box>
                </Grid>

                {/* middle */}
                <Grid item xs={12} sm={12} md={9} lg={6} xl={4} >

                    <Stack pt={2} >

                        {/* section select */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-evenly' }}>

                            {/* like */}
                            <Button sx={{ color: 'like' === processStates.selectedCategory ? 'primary' : 'grey.600' }} onClick={handleSelectNoticeCategory('like')}>
                                <Box>
                                    <CentralizedBox sx={{ p: 1 }}><ThumbUpIcon /></CentralizedBox>
                                    <Typography variant={'body1'} textAlign={'center'}>{langConfigs.liked[preferenceStates.lang]}{0 === processStates.noticeStatistics.like ? '' : `+${processStates.noticeStatistics.like}`}</Typography>
                                </Box>
                            </Button>

                            {/* save */}
                            <Button sx={{ color: 'save' === processStates.selectedCategory ? 'primary' : 'grey.600' }} onClick={handleSelectNoticeCategory('save')}>
                                <Box>
                                    <CentralizedBox sx={{ p: 1 }}><StarIcon /></CentralizedBox>
                                    <Typography variant={'body1'} textAlign={'center'}>{langConfigs.saved[preferenceStates.lang]}{0 === processStates.noticeStatistics.save ? '' : `+${processStates.noticeStatistics.save}`}</Typography>
                                </Box>
                            </Button>

                            {/* reply */}
                            <Button sx={{ color: 'reply' === processStates.selectedCategory ? 'primary' : 'grey.600' }} onClick={handleSelectNoticeCategory('reply')}>
                                <Box>
                                    <CentralizedBox sx={{ p: 1 }}><ChatBubbleIcon /></CentralizedBox>
                                    <Typography variant={'body1'} textAlign={'center'}>{langConfigs.replied[preferenceStates.lang]}{0 === processStates.noticeStatistics.reply ? '' : `+${processStates.noticeStatistics.reply}`}</Typography>
                                </Box>
                            </Button>

                            {/* cue */}
                            <Button sx={{ color: 'cue' === processStates.selectedCategory ? 'primary' : 'grey.600' }} onClick={handleSelectNoticeCategory('cue')}>
                                <Box>
                                    <CentralizedBox sx={{ p: 1 }}><AlternateEmailIcon /></CentralizedBox>
                                    <Typography variant={'body1'} textAlign={'center'}>{langConfigs.cued[preferenceStates.lang]}{0 === processStates.noticeStatistics.cue ? '' : `+${processStates.noticeStatistics.cue}`}</Typography>
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
                                            <Avatar src={provideAvatarImageUrl(info.initiateId, imageDomain)} sx={{ width: 40, height: 40, bgcolor: 'grey' }}>{info.nickname?.charAt(0).toUpperCase()}</Avatar>
                                            <Box ml={1}>

                                                {/* nickname */}
                                                <Typography fontSize={{ xs: 14, sm: 16 }} align={'left'}>{getNicknameBrief(info.nickname)}</Typography>

                                                {/* created time */}
                                                <Typography variant={'body2'} align={'left'}>{timeToString(info.createdTimeBySecond, preferenceStates.lang)}</Typography>
                                            </Box>
                                        </Box>
                                    </Button>

                                    {/* notice info */}
                                    <TextButton color={'inherit'} sx={{ p: 1 }} onClick={handleClickOnNoticeInfo(info.noticeId)}>
                                        <Box sx={{ maxWidth: { xs: 170, sm: 190, md: 240 } }}>
                                            <Typography fontSize={{ xs: 14, sm: 16 }} align={'right'}>{noticeInfoToString(info, preferenceStates.lang)}</Typography>
                                        </Box>
                                    </TextButton>
                                </Box>
                            )}

                            {/* no record alert */}
                            {0 === processStates.noticeInfoArr.length &&
                                <Box minHeight={200} mt={10}>
                                    <Typography color={'text.secondary'} align={'center'}>{langConfigs.noNotificationRecord[preferenceStates.lang]}</Typography>
                                </Box>
                            }
                        </Stack>

                    </Stack>

                </Grid>

                {/* right */}
                <Grid item xs={0} sm={0} md={0} lg={3} xl={4}>
                    <Box sx={{ display: { xs: 'none', sm: 'none', md: 'block' } }}>
                        <SideColumn lang={preferenceStates.lang} />
                    </Box>
                </Grid>
            </Grid >

            {/* legal info */}
            <LegalInfo lang={preferenceStates.lang} />
        </>
    );
};

export default Message;