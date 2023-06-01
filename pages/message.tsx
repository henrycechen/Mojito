import * as React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { signIn, useSession, } from 'next-auth/react';

import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';

import AlternateEmailIcon from '@mui/icons-material/AlternateEmail';
import ClearIcon from '@mui/icons-material/Clear';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import StarIcon from '@mui/icons-material/Star';

import { INotificationComprehensive } from '../lib/interfaces/notification';
import { LangConfigs, TPreferenceStates } from '../lib/types';

import { timeToString, restoreFromLocalStorage } from '../lib/utils/general';
import { provideAvatarImageUrl, getNicknameBrief } from '../lib/utils/for/member';
import { noticeIdToUrl, noticeInfoToString } from '../lib/utils/for/notification';

import Navbar from '../ui/Navbar';
import SideMenu from '../ui/SideMenu';
import SideColumn from '../ui/SideColumn';

const storageName0 = 'PreferenceStates';
const restorePreferenceStatesFromCache = restoreFromLocalStorage(storageName0);

const imageDomain = process.env.NEXT_PUBLIC_IMAGE_DOMAIN ?? '';
const desc = process.env.NEXT_PUBLIC_APP_DESCRIPTION ?? '';
const lang = process.env.NEXT_PUBLIC_APP_LANG ?? 'tw';
const langConfigs: LangConfigs = {

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
        lang: lang,
        mode: 'light'
    });

    type TProcessStates = {
        memberId: string;
        selectedCategory: string;
        noticeComprehensiveArr: INotificationComprehensive[];
        noticeStatistics: { [category: string]: number; };
    };

    // States - process
    const [processStates, setProcessStates] = React.useState<TProcessStates>({
        memberId: '',
        selectedCategory: 'like', // default
        noticeComprehensiveArr: [],
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
        setProcessStates({ ...processStates, noticeStatistics: { ...update_stat }, noticeComprehensiveArr: [...arr] });

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
                noticeComprehensiveArr: [...(await resp.json())]
            });
        } catch (e) {
            console.log(`Attempt to get notice array from resp. ${e}`);
        }
    };

    const handleSelectNoticeCategory = (category: string) => (event: React.MouseEvent<HTMLButtonElement>) => {
        setProcessStates({
            ...processStates,
            selectedCategory: category,
            noticeComprehensiveArr: [],
            noticeStatistics: { ...processStates.noticeStatistics, [category]: 0 }
        });
    };

    const handleClickOnInitiateInfo = (initiateId: string) => (event: React.MouseEvent<HTMLElement>) => {
        event.stopPropagation();
        router.push(`/me/${initiateId}`);
    };

    const handleClickOnNoticeInfo = (noticeId: string) => (event: React.MouseEvent<HTMLElement>) => {
        router.push(noticeIdToUrl(noticeId));
    };

    const handleDeleteNotice = async (noticeId: string) => {
        const arr = processStates.noticeComprehensiveArr;
        setProcessStates({
            ...processStates,
            noticeComprehensiveArr: arr.filter(n => noticeId !== n.noticeId)
        });

        const resp = await fetch(`/api/notice/id/${noticeId}`, {
            method: 'DELETE'
        });

        if (200 !== resp.status) {
            console.error('Delete notice failed');
        }
    };

    return (
        <>
            <Head>
                <title>
                    {{ tw: '消息', cn: '訊息', en: 'Messages' }[preferenceStates.lang]}
                </title>
                <meta
                    name='description'
                    content={desc}
                    key='desc'
                />
            </Head>
            <Navbar lang={preferenceStates.lang} />
            <Grid container >

                {/* left */}
                <Grid item xs={0} sm={0} md={3} lg={3} xl={4} >
                    <Box sx={{ display: { xs: 'none', sm: 'none', md: 'flex' }, flexDirection: 'row-reverse', position: 'sticky', top: 0, left: 0, }}>
                        <SideMenu lang={preferenceStates.lang} />
                    </Box>
                </Grid>

                {/* middle */}
                <Grid item xs={12} sm={12} md={6} lg={6} xl={4} >
                    <Stack pt={{ xs: 2, sm: 2, md: 9 }} px={2} >

                        {/* section select */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-evenly' }}>

                            {/* like */}
                            <Button sx={{ color: 'like' === processStates.selectedCategory ? 'primary' : 'grey.600' }} onClick={handleSelectNoticeCategory('like')}>
                                <Box>
                                    <Box sx={{ p: 1, display: 'flex', flexDirection: 'row', justifyContent: 'center' }}><ThumbUpIcon sx={{ fontSize: 22 }} /></Box>
                                    <Typography variant={'body2'} textAlign={'center'}>{langConfigs.liked[preferenceStates.lang]}{0 === processStates.noticeStatistics.like ? '' : `+${processStates.noticeStatistics.like}`}</Typography>
                                </Box>
                            </Button>

                            {/* save */}
                            <Button sx={{ color: 'save' === processStates.selectedCategory ? 'primary' : 'grey.600' }} onClick={handleSelectNoticeCategory('save')}>
                                <Box>
                                    <Box sx={{ p: 1, display: 'flex', flexDirection: 'row', justifyContent: 'center' }}><StarIcon sx={{ fontSize: 22 }} /></Box>
                                    <Typography variant={'body2'} textAlign={'center'}>{langConfigs.saved[preferenceStates.lang]}{0 === processStates.noticeStatistics.save ? '' : `+${processStates.noticeStatistics.save}`}</Typography>
                                </Box>
                            </Button>

                            {/* reply */}
                            <Button sx={{ color: 'reply' === processStates.selectedCategory ? 'primary' : 'grey.600' }} onClick={handleSelectNoticeCategory('reply')}>
                                <Box>
                                    <Box sx={{ p: 1, display: 'flex', flexDirection: 'row', justifyContent: 'center' }}><ChatBubbleIcon sx={{ fontSize: 22 }} /></Box>
                                    <Typography variant={'body2'} textAlign={'center'}>{langConfigs.replied[preferenceStates.lang]}{0 === processStates.noticeStatistics.reply ? '' : `+${processStates.noticeStatistics.reply}`}</Typography>
                                </Box>
                            </Button>

                            {/* cue */}
                            <Button sx={{ color: 'cue' === processStates.selectedCategory ? 'primary' : 'grey.600' }} onClick={handleSelectNoticeCategory('cue')}>
                                <Box>
                                    <Box sx={{ p: 1, display: 'flex', flexDirection: 'row', justifyContent: 'center' }}><AlternateEmailIcon sx={{ fontSize: 22 }} /></Box>
                                    <Typography variant={'body2'} textAlign={'center'}>{langConfigs.cued[preferenceStates.lang]}{0 === processStates.noticeStatistics.cue ? '' : `+${processStates.noticeStatistics.cue}`}</Typography>
                                </Box>
                            </Button>
                        </Box>
                        <Box mt={{ xs: 1, sm: 2 }} mb={{ xs: 2, sm: 1 }}><Divider /></Box>

                        {/* message list */}
                        <MenuList>
                            {0 !== processStates.noticeComprehensiveArr.length && processStates.noticeComprehensiveArr.map(n =>
                                <MenuItem key={n.noticeId} sx={{ whiteSpace: 'normal', px: { xs: 0 }, py: 1 }} onClick={handleClickOnNoticeInfo(n.noticeId)}>

                                    {/* initiate info */}
                                    <ListItemButton sx={{ p: 1, width: { xs: 360, sm: 200, md: 380 } }} onClick={handleClickOnInitiateInfo(n.initiateId)}>

                                        <Avatar src={provideAvatarImageUrl(n.initiateId, imageDomain)} sx={{ width: 36, height: 36 }}>{n.nickname?.charAt(0).toUpperCase()}</Avatar>
                                        <Box pl={1}>

                                            {/* nickname */}
                                            <Typography align={'left'} fontSize={{ xs: 14, sm: 14, md: 16 }}>{getNicknameBrief(n.nickname)}</Typography>

                                            {/* created time */}
                                            <Typography fontSize={{ xs: 12, sm: 12, md: 14 }} align={'left'}>{timeToString(n.createdTimeBySecond, preferenceStates.lang)}</Typography>
                                        </Box>
                                    </ListItemButton>

                                    {/* notice info */}
                                    <Box
                                        sx={{
                                            px: 1,
                                            fontSize: { xs: 14, sm: 14, md: 16 },
                                            overflowWrap: 'break-word',
                                        }}
                                    >{noticeInfoToString(n, preferenceStates.lang)}
                                    </Box>

                                    {/* delete button */}
                                    <ListItemIcon sx={{ pl: 1 }} onClick={async (event: React.MouseEvent<HTMLElement>) => { event.stopPropagation(); await handleDeleteNotice(n.noticeId); }}>
                                        <ClearIcon sx={{ fontSize: { xs: 16, sm: 16, md: 20 } }} />
                                    </ListItemIcon>

                                </MenuItem>
                            )}
                        </MenuList>


                        {/* no record alert */}
                        {0 === processStates.noticeComprehensiveArr.length &&
                            <Box minHeight={200} mt={10}>
                                <Typography color={'text.secondary'} align={'center'}>{langConfigs.noNotificationRecord[preferenceStates.lang]}</Typography>
                            </Box>
                        }

                    </Stack>

                </Grid>

                {/* right */}
                <Grid item xs={0} sm={0} md={3} lg={3} xl={4}>
                    <Box sx={{ display: { xs: 'none', sm: 'none', md: 'block' } }}>
                        <SideColumn lang={preferenceStates.lang} />
                    </Box>
                </Grid>
            </Grid >

            {/* bottom space */}
            <Box pb={{ xs: '10rem', sm: '10rem', md: 0 }} />
        </>
    );
};

export default Message;