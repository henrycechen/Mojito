import * as React from 'react';
import Head from 'next/head';
import { signIn, useSession, } from 'next-auth/react';
import { useRouter } from 'next/router';

import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';

import FlagIcon from '@mui/icons-material/Flag';
import MoreVertIcon from '@mui/icons-material/MoreVert';

import Masonry from '@mui/lab/Masonry';

import { IMemberInfo } from '../lib/interfaces/member';
import { LangConfigs, TBrowsingHelper, TPreferenceStates } from '../lib/types';
import { restoreFromLocalStorage, updateLocalStorage } from '../lib/utils/general';
import { provideAvatarImageUrl, getNicknameBrief } from '../lib/utils/for/member';
import { ColorModeContext } from '../ui/Theme';


import Navbar from '../ui/Navbar';
import SideMenu from '../ui/SideMenu';
import SideColumn from '../ui/SideColumn';
import { getRandomHexStr } from '../lib/utils/create';
import { IConcisePostComprehensive } from '../lib/interfaces/post';
import { provideCoverImageUrl } from '../lib/utils/for/post';

const storageName0 = 'PreferenceStates';
const restorePreferenceStatesFromCache = restoreFromLocalStorage(storageName0);

const storageName = 'FollowPageProcessStates';
const updateProcessStatesCache = updateLocalStorage(storageName);
const restoreProcessStatesFromCache = restoreFromLocalStorage(storageName);

const imageDomain = process.env.NEXT_PUBLIC_IMAGE_DOMAIN ?? '';
const desc = process.env.NEXT_PUBLIC_APP_DESCRIPTION ?? '';
const lang = process.env.NEXT_PUBLIC_APP_LANG ?? 'tw';
const langConfigs: LangConfigs = {
    alertContent: {
        tw: '出錯了，刷新頁面以重新獲取數據',
        cn: '出错了，刷新页面以重新获取数据',
        en: 'Something went wrong, refresh the page to refetch the data'
    },
    noRecordOfFollowedMembers: {
        tw: '您還沒有關注任何用戶',
        cn: '您还没有关注任何用户',
        en: 'You have not followed any members'
    },
    noPosts: {
        tw: '作者未曾發佈過文章',
        cn: '作者未曾发布过文章',
        en: 'Author has not posted any articles'
    },
    report: {
        tw: '檢舉',
        cn: '举报',
        en: 'Report',
    },
};

/**
 * Last update:
 * - 24/05/2023 v0.1.1
 */
const Follow = () => {

    const router = useRouter();

    const { data: session, status } = useSession({ required: true, onUnauthenticated() { signIn(); } });

    React.useEffect(() => {
        if ('authenticated' === status) {
            const memberSession: any = { ...session };
            setProcessStates({ ...processStates, memberId: memberSession?.user?.id });
            restorePreferenceStatesFromCache(setPreferenceStates);
        }
    }, [status]);

    // Ref - masonry
    const masonryWrapper = React.useRef<any>();

    // States - preference
    const [preferenceStates, setPreferenceStates] = React.useState<TPreferenceStates>({
        lang: lang,
        mode: 'light'
    });

    type TProcessStates = {
        memberId: string;
        selectedAuthorId: string;
        memorizeChannelBarPositionX: number | undefined;
        memorizeViewPortPositionY: number | undefined;
        memorizeLastViewedPostId: string | undefined;
        wasRedirected: boolean;
    };

    // States - process
    const [processStates, setProcessStates] = React.useState<TProcessStates>({
        memberId: '',
        selectedAuthorId: '',
        memorizeChannelBarPositionX: undefined,
        memorizeViewPortPositionY: undefined,
        memorizeLastViewedPostId: undefined,
        wasRedirected: false,
    });

    React.useEffect(() => { restoreProcessStatesFromCache(setProcessStates); }, []);

    // States - followed member info arr
    const [followedMemberInfoArr, setFollowedMemberInfoArr] = React.useState<IMemberInfo[]>([]);

    React.useEffect(() => {
        if ('' !== processStates.memberId) {
            getFollowedMemberInfoArray();
        }
    }, [processStates.memberId]);

    const getFollowedMemberInfoArray = async () => {
        const resp = await fetch(`/api/member/followedbyme/${processStates.memberId}`);
        try {
            if (200 !== resp.status) {
                throw new Error(`Bad fetch response`);
            }
            const arr = await resp.json();
            setFollowedMemberInfoArr(arr);
        } catch (e) {
            console.error(`Attempt to get followed member info array of from resp. ${e}`);
        }
    };

    const handleSelectedAuthor = (authorId: string) => (event: React.MouseEvent<HTMLElement>) => {
        let states: TProcessStates = { ...processStates };
        if (states.selectedAuthorId === authorId) {
            states.selectedAuthorId = '';
        } else {
            states.selectedAuthorId = authorId;
        }
        states.memorizeChannelBarPositionX = document.getElementById('author-bar')?.scrollLeft;
        // #1 update process states
        setProcessStates(states);
        // #2 presist process states to cache
        updateProcessStatesCache(states);
        // #3 reset browsing helper
        setBrowsingHelper({ ...browsingHelper, memorizeViewPortPositionY: undefined });
    };

    // States - browsing helper
    const [browsingHelper, setBrowsingHelper] = React.useState<TBrowsingHelper>({
        memorizeViewPortPositionY: undefined, // reset scroll-help on handleChannelSelect, handleSwitchChange, ~~handlePostCardClick~~
    });

    // States - posts (masonry)
    const [masonryPostInfoArr, setMasonryPostInfoArr] = React.useState<IConcisePostComprehensive[]>([]);

    React.useEffect(() => { updatePostsArr(); }, [processStates.selectedAuthorId]);

    // Handle restore browsing position after reload
    React.useEffect(() => {
        if (processStates.wasRedirected) {
            const postId = processStates.memorizeLastViewedPostId;
            // #1 restore browsing position
            if (!postId) {
                return;
            } else if (600 > window.innerWidth) { // 0 ~ 599
                setBrowsingHelper({ ...browsingHelper, memorizeViewPortPositionY: (document.getElementById(postId)?.offsetTop ?? 0) / 2 - 200 });
            } else { // 600 ~ ∞
                setBrowsingHelper({ ...browsingHelper, memorizeViewPortPositionY: processStates.memorizeViewPortPositionY });
            }
            let states: TProcessStates = { ...processStates, memorizeLastViewedPostId: undefined, memorizeViewPortPositionY: undefined, wasRedirected: false };
            // #2 update process states
            setProcessStates(states);
            // #3 update process state cache
            updateProcessStatesCache(states);
        }
    }, [masonryPostInfoArr]);

    if (!!browsingHelper.memorizeViewPortPositionY) {
        window.scrollTo(0, browsingHelper.memorizeViewPortPositionY ?? 0);
    }

    const updatePostsArr = async () => {
        let url = '';

        if ('' !== processStates.selectedAuthorId) {
            url = `/api/member/creations/${processStates.selectedAuthorId}`;
        } else {
            url = `/api/post/s/follow`;
        }

        const resp = await fetch(url);
        if (200 === resp.status) {
            try {
                setMasonryPostInfoArr(await resp.json());
            } catch (e) {
                console.error(`Attempt to GET posts. ${e}`);
            }
        }
    };

    const handleClickOnPost = (postId: string) => (event: React.MouseEvent) => {
        updateProcessStatesCache({
            ...processStates,
            memorizeLastViewedPostId: postId,
            memorizeViewPortPositionY: window.scrollY,
            wasRedirected: true
        });
        router.push(`/post/${postId}`);
    };

    const handleClickOnMemberInfo = (memberId: string, postId: string) => (event: React.MouseEvent) => {
        updateProcessStatesCache({
            ...processStates, memorizeLastViewedPostId: postId,
            memorizeViewPortPositionY: window.scrollY,
            wasRedirected: true
        });
        router.push(`/me/${memberId}`);
    };

    type TPopUpMenuStates = {
        anchorEl: null | HTMLElement;
        memberId: string;
        nickname: string;
        referenceId: string;
    };

    // States - pop up menu
    const [popUpMenuStates, setPopUpMenuStates] = React.useState<TPopUpMenuStates>({
        anchorEl: null,
        memberId: '',
        nickname: '',
        referenceId: '',
    });

    const handleOpenPopUpMenu = (memberId: string, nickname: string, referenceId: string) => (event: React.MouseEvent<HTMLElement>) => {
        setPopUpMenuStates({ anchorEl: event.currentTarget, memberId, nickname, referenceId, });
    };

    const handleClosePopUpMenu = () => {
        setPopUpMenuStates({ ...popUpMenuStates, anchorEl: null });
    };

    const handleReport = () => {
        const memberId = popUpMenuStates.memberId;
        const referenceId = popUpMenuStates.referenceId;

        setPopUpMenuStates({ anchorEl: null, memberId: '', nickname: '', referenceId: '', });

        router.push(`/report?memberId=${memberId}&referenceId=${referenceId}`);
    };

    type TAnimationStates = {
        scrollYPixels: number;
        requireUpdate: boolean;
    };

    // States - animation
    const [animationStates, setAnimationStates] = React.useState<TAnimationStates>({
        scrollYPixels: 0,
        requireUpdate: false,
    });

    // Register animation listener
    React.useEffect(() => {
        const handleScroll = () => {

            if (0 > window.scrollY) {
                setAnimationStates({
                    ...animationStates,
                    scrollYPixels: window.scrollY,
                });
                if (Math.abs(window.scrollY) > 50) {

                    setAnimationStates({
                        ...animationStates,
                        requireUpdate: true
                    });

                    window.removeEventListener('scroll', handleScroll);

                    setTimeout(() => {
                        setAnimationStates({
                            ...animationStates,
                            requireUpdate: false
                        });

                        window.addEventListener('scroll', handleScroll);
                    }, 5000);
                }
            }

        };

        window.addEventListener('scroll', handleScroll);

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    React.useEffect(() => { refreshPostsArr(); }, [animationStates.requireUpdate]);

    const refreshPostsArr = async () => {
        let url = '';

        if ('' !== processStates.selectedAuthorId) {
            url = `/api/member/creations/${processStates.selectedAuthorId}`;
        } else {
            url = `/api/post/s/follow/${processStates.memberId}`;
        }

        const resp = await fetch(url);
        if (200 === resp.status) {
            try {
                setMasonryPostInfoArr(await resp.json());
                setAnimationStates({ scrollYPixels: 0, requireUpdate: false });
            } catch (e) {
                console.error(`Attempt to GET posts. ${e}`);
            }
        }
    };

    const colorMode = React.useContext(ColorModeContext);

    return (
        <>
            <Head>
                <title>
                    {{ tw: '關注', cn: '關注', en: 'Follow' }[preferenceStates.lang]}
                </title>
                <meta
                    name="description"
                    content={desc}
                    key="desc"
                />
            </Head>

            {/* pull-to-refresh */}
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    opacity: animationStates.requireUpdate ? 1 : Math.abs(animationStates.scrollYPixels) / 25
                }}>
                <CircularProgress
                    variant={animationStates.requireUpdate ? 'indeterminate' : 'determinate'}
                    size={Math.abs(animationStates.scrollYPixels) * 1.8 < 24 && !animationStates.requireUpdate ? Math.abs(animationStates.scrollYPixels) * 1.8 : 24}
                    value={Math.abs(animationStates.scrollYPixels) < 50 && !animationStates.requireUpdate ? Math.abs(animationStates.scrollYPixels) * 2 : 100} />
            </Box>

            <Navbar lang={preferenceStates.lang} />
            <Grid container>

                {/* left */}
                <Grid item xs={0} sm={0} md={3} lg={3} xl={4} >
                    <Box sx={{ display: { xs: 'none', sm: 'none', md: 'flex' }, flexDirection: 'row-reverse', position: 'sticky', top: 0, left: 0, }}>
                        <SideMenu lang={preferenceStates.lang} />
                    </Box>
                </Grid>

                {/* middle */}
                <Grid item xs={12} sm={12} md={6} lg={6} xl={4}>
                    <Box pt={{ xs: 2, sm: 2, md: 10 }} px={1} >

                        {/* no followed member alert */}
                        {0 === followedMemberInfoArr.length && <Box py={5}>
                            <Typography color={'text.secondary'} align={'center'}>{langConfigs.noRecordOfFollowedMembers[preferenceStates.lang]}</Typography>
                        </Box>}

                        {/* followed member array */}
                        <Stack direction={'row'} id='author-bar' sx={{ position: 'sticky', top: 0, zIndex: 9999, backgroundColor: 'dark' === colorMode.mode ? '#424242 ' : '#fff', px: { xs: 0, sm: 1 }, pt: { xs: 1, sm: 2 }, overflow: 'auto', }} >
                            {followedMemberInfoArr.map(m => {
                                return (
                                    <Button key={getRandomHexStr()} size={'small'} sx={{ minWidth: 72, minHeight: 86 }} onClick={handleSelectedAuthor(m.memberId)}>
                                        <Stack >
                                            <Grid container>
                                                <Grid item flexGrow={1}></Grid>
                                                <Grid item>
                                                    <Avatar src={provideAvatarImageUrl(m.memberId, imageDomain)} sx={{ width: 34, height: 34, bgcolor: 'grey' }}>{m.nickname?.charAt(0).toUpperCase()}</Avatar>
                                                </Grid>
                                                <Grid item flexGrow={1}></Grid>
                                            </Grid>
                                            <Typography mt={1} sx={{ minHeight: 33, fontSize: 11, color: processStates.selectedAuthorId === m.memberId ? 'inherit' : 'text.secondary' }}>{getNicknameBrief(m.nickname)}</Typography>
                                        </Stack>
                                    </Button>
                                );
                            })}
                        </Stack>

                        {/* empty alert */}
                        {0 === masonryPostInfoArr.length &&
                            <Box minHeight={200} mt={10}>
                                <Typography color={'text.secondary'} align={'center'}>
                                    {langConfigs.noPosts[preferenceStates.lang]}
                                </Typography>
                            </Box>
                        }

                        {/* mansoy */}
                        <Box ref={masonryWrapper} maxWidth={{ md: 900, lg: 800 }}>
                            <Masonry columns={2} sx={{ margin: 0 }}>

                                {/* posts */}
                                {0 !== masonryPostInfoArr.length && masonryPostInfoArr.map(p => {
                                    return (
                                        <Paper key={p.postId} id={p.postId} sx={{ maxWidth: 450, '&:hover': { cursor: 'pointer' } }} >
                                            <Stack>

                                                {/* image */}
                                                <Box
                                                    component={'img'}
                                                    loading='lazy'
                                                    src={provideCoverImageUrl(p.postId, imageDomain)}
                                                    sx={{
                                                        maxWidth: 450,
                                                        height: 'auto',
                                                        borderTopLeftRadius: 4,
                                                        borderTopRightRadius: 4
                                                    }}
                                                    onClick={handleClickOnPost(p.postId)}
                                                ></Box>

                                                {/* title */}
                                                <Box pt={2} px={2} onClick={handleClickOnPost(p.postId)}>
                                                    <Typography variant={'body1'}>{p.title}</Typography>
                                                </Box>

                                                {/* member info & member behaviour */}
                                                <Box paddingTop={1} >
                                                    <Grid container>

                                                        {/* member info */}
                                                        <Grid item flexGrow={1}>
                                                            <Box display={'flex'} flexDirection={'row'}>
                                                                <Button variant={'text'} color={'inherit'} sx={{ textTransform: 'none' }} onClick={handleClickOnMemberInfo(p.memberId, p.postId)}>
                                                                    <Avatar src={provideAvatarImageUrl(p.memberId, imageDomain)} sx={{ width: { xs: 24, sm: 32 }, height: { xs: 24, sm: 32 }, bgcolor: 'grey' }}>{p.nickname?.charAt(0).toUpperCase()}</Avatar>
                                                                    <Box ml={1}>
                                                                        <Typography variant='body2'>{getNicknameBrief(p.nickname)}</Typography>
                                                                    </Box>
                                                                </Button>
                                                            </Box>
                                                        </Grid>

                                                        {/* member behaviour / placeholder */}
                                                        <Grid item >
                                                            <IconButton
                                                                sx={{ width: { xs: 34, sm: 34, md: 40 }, height: { xs: 34, sm: 34, md: 40 }, }}
                                                                onClick={handleOpenPopUpMenu(p.memberId, p.nickname ?? '', p.postId)}
                                                            >
                                                                <MoreVertIcon />
                                                            </IconButton>
                                                        </Grid>
                                                    </Grid>
                                                </Box>
                                            </Stack>
                                        </Paper>
                                    );
                                })}
                            </Masonry>
                        </Box>
                    </Box>
                </Grid>

                {/* right */}
                <Grid item xs={0} sm={0} md={3} lg={3} xl={4}>
                    <Box sx={{ display: { xs: 'none', sm: 'none', md: 'block' } }}>
                        <SideColumn lang={preferenceStates.lang} />
                    </Box>
                </Grid>

            </Grid>

            {/* pop-up memu */}
            <Menu
                sx={{ mt: '3rem' }}
                anchorEl={popUpMenuStates.anchorEl}
                anchorOrigin={{ vertical: 'top', horizontal: 'right', }}
                keepMounted
                transformOrigin={{ vertical: 'top', horizontal: 'right', }}
                open={Boolean(popUpMenuStates.anchorEl)}
                onClose={handleClosePopUpMenu}
                MenuListProps={{}}
            >
                {/* report */}
                <MenuItem onClick={handleReport}>
                    <ListItemIcon><FlagIcon fontSize='small' /></ListItemIcon>
                    <ListItemText><Typography variant={'body2'}>{langConfigs.report[preferenceStates.lang]}</Typography></ListItemText>
                </MenuItem>
            </Menu>
        </>
    );
};

export default Follow;