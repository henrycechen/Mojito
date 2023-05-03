import * as React from 'react';

import { useRouter } from 'next/router';
import { signIn, useSession, } from 'next-auth/react';

import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { createTheme, responsiveFontSizes, ThemeProvider } from '@mui/material/styles';

import AlternateEmailIcon from '@mui/icons-material/AlternateEmail';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import StarIcon from '@mui/icons-material/Star';
import Divider from '@mui/material/Divider';

import { INoticeInfoWithMemberInfo } from '../../lib/interfaces/notification';
import { LangConfigs, TPreferenceStates } from '../../lib/types';

import { timeToString, updateLocalStorage, restoreFromLocalStorage } from '../../lib/utils/general';
import { provideAvatarImageUrl, getNicknameBrief } from '../../lib/utils/for/member';
import { noticeIdToUrl, noticeInfoToString } from '../../lib/utils/for/notification';

import Navbar from '../../ui/Navbar';
import Copyright from '../../ui/Copyright';
import Terms from '../../ui/Terms';
import { CentralizedBox, ResponsiveCard, TextButton } from '../../ui/Styled';


const storageName0 = 'PreferenceStates';
const restorePreferenceStatesFromCache = restoreFromLocalStorage(storageName0);

const domain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? '';
const defaultLang = process.env.NEXT_PUBLIC_APP_LANG ?? 'tw';
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

    //////////////////////////////////////// INITIALIZE PAGE ////////////////////////////////////////
    React.useEffect(() => {
        updateNoticeArrayAndStatistics();
        restorePreferenceStatesFromCache(setPreferenceStates);
    }, [session]);

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

    //////////////////////////////////////// BEHAVIOURS ////////////////////////////////////////
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

    //////////////////////////////////////// JSX COMPONENT ////////////////////////////////////////
    return (
        <>

            <Navbar lang={preferenceStates.lang} />

            <Grid container mt={{ xs: 1, sm: 10 }}>

                {/* left column (placeholder) */}
                <Grid item xs={0} sm={2} md={3} lg={3} xl={4}></Grid>

                {/* middle column */}
                <Grid item xs={12} sm={8} md={6} lg={6} xl={4}>
                    <ResponsiveCard sx={{ pt: { xs: 0, sm: 2 } }}>
                        <Stack>

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
                                                <Avatar src={provideAvatarImageUrl(info.initiateId, domain)} sx={{ width: 40, height: 40, bgcolor: 'grey' }}>{info.nickname?.charAt(0).toUpperCase()}</Avatar>
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
                    </ResponsiveCard>
                </Grid>

                {/* right column (placeholder) */}
                <Grid item xs={0} sm={2} md={3} lg={3} xl={4}></Grid>
            </Grid >

            <Copyright sx={{ mt: 16 }} lang={preferenceStates.lang} />
            <Terms sx={{ mb: 8 }} lang={preferenceStates.lang} />

        </>
    );
};

export default Message;