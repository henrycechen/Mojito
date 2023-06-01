import * as React from 'react';
import Head from 'next/head';
import { signIn, useSession, } from 'next-auth/react';
import { NextPageContext } from 'next/types';
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

import Autocomplete from '@mui/material/Autocomplete';

import FormControl from '@mui/material/FormControl';
import Input from '@mui/material/Input';
import InputLabel from '@mui/material/InputLabel';
import TextField from '@mui/material/TextField';

import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';
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
import { IConciseTopicComprehensive } from '../lib/interfaces/topic';

const storageName0 = 'PreferenceStates';
const restorePreferenceStatesFromCache = restoreFromLocalStorage(storageName0);

const storageName = 'QueryPageProcessStates';
const updateProcessStatesCache = updateLocalStorage(storageName);
const restoreProcessStatesFromCache = restoreFromLocalStorage(storageName);

const imageDomain = process.env.NEXT_PUBLIC_IMAGE_DOMAIN ?? '';
const desc = process.env.NEXT_PUBLIC_APP_DESCRIPTION ?? '';
const lang = process.env.NEXT_PUBLIC_APP_LANG ?? 'tw';
const langConfigs: LangConfigs = {
    queryATopic: {
        tw: `What's on your mind?`,
        cn: `'What's on your mind?`,
        en: `What's on your mind?`,
    },
    query: {
        tw: '搜尋',
        cn: '搜索',
        en: 'Query',
    },
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
        tw: '未能搜尋到相關文章',
        cn: '未能搜索到相关文章',
        en: 'No related posts were found'
    },
    report: {
        tw: '檢舉',
        cn: '举报',
        en: 'Report',
    },
};

type TQueryPageProps = {
    topicId?: string;
    topicPlainText?: string;
};

export async function getServerSideProps(context: NextPageContext): Promise<{ props: TQueryPageProps; }> {
    const { topicId } = context.query;
    if (!('string' === typeof topicId && new RegExp(/^[-A-Za-z0-9+/]*={0,3}$/).test(topicId))) {
        return { props: {} };
    }
    return { props: { topicId, topicPlainText: Buffer.from(topicId, 'base64').toString() } };
}

/**
 * Last update:
 * - 31/05/2023 v0.1.1
 */
const Query = ({ topicId, topicPlainText }: TQueryPageProps) => {

    const router = useRouter();

    const { data: session, status } = useSession();

    React.useEffect(() => {
        if ('authenticated' === status) {
            const memberSession: any = { ...session };
            setProcessStates({ ...processStates, memberId: memberSession?.user?.id });
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
    };

    // States - process
    const [processStates, setProcessStates] = React.useState<TProcessStates>({
        memberId: '',
    });


    type TQueryHelper = {
        inputStr: string; // plain text
        queryStr: string; // base64 text
    };

    // States - query helper
    const [queryHelperStates, setQueryHelperStates] = React.useState<TQueryHelper>({
        inputStr: topicPlainText ?? '',
        queryStr: topicPlainText ?? '',
    });

    const handleInput = async (event: React.ChangeEvent<HTMLInputElement>) => {
        setQueryHelperStates({
            ...queryHelperStates,
            inputStr: event.target.value,
        });
    };

    // States - suggestion array
    const [suggestionsArr, setSuggestionArr] = React.useState<IConciseTopicComprehensive[]>([]);

    React.useEffect(() => { provideSuggestions(); }, [queryHelperStates.inputStr]);

    const provideSuggestions = async () => {
        const inputStr = queryHelperStates.inputStr;
        if ('' !== inputStr) {
            const queryStr = Buffer.from(inputStr).toString('base64');
            const resp = await fetch(`/api/topic/query?fragment=${queryStr}`);
            if (200 === resp.status) {
                try {
                    const update = await resp.json();
                    if (!(Array.isArray(update) && 0 !== update.length)) {
                        setSuggestionArr([]);
                        return;
                    }
                    setSuggestionArr(update);
                } catch (e) {
                    console.error(`Attempt to GET concise topic comprehensive array by fragment. ${e}`);
                }
            }
        }
    };

    const handleChooseSuggestion = (event: React.SyntheticEvent, value: string | null) => {
        if ('string' === typeof value && '' !== value) {
            setQueryHelperStates({
                ...queryHelperStates,
                queryStr: value
            });
        }
    };

    // States - posts (masonry)
    const [masonryPostInfoArr, setMasonryPostInfoArr] = React.useState<IConcisePostComprehensive[]>([]);

    React.useEffect(() => { if ('' !== topicId) { updatePostsArr(); } }, []);

    const updatePostsArr = async () => {
        let queryStr;
        const states: TQueryHelper = queryHelperStates;
        queryStr = states.inputStr === states.queryStr ? states.queryStr : states.inputStr;

        if ('string' === typeof queryStr && '' !== queryStr) {
            const resp = await fetch(`/api/post/s/of/topic?topicId=${Buffer.from(queryStr).toString('base64')}`);
            if (200 === resp.status) {
                try {
                    const arr = await resp.json();
                    if (Array.isArray(arr) && 0 !== arr.length) {
                        setMasonryPostInfoArr(arr);

                    } else {

                    }
                } catch (e) {
                    console.error(`Attempt to GET posts. ${e}`);
                }
            }
        };
    };

    const handleClickOnPost = (postId: string) => (event: React.MouseEvent) => {
        router.push(`/post/${postId}`);
    };

    const handleClickOnMemberInfo = (memberId: string, postId: string) => (event: React.MouseEvent) => {
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

    return (
        <>
            <Head>
                <title>
                    {{ tw: '搜尋', cn: '搜索', en: 'Query', }[preferenceStates.lang]}
                </title>
                <meta
                    name="description"
                    content={desc}
                    key="desc"
                />
            </Head>

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

                        <FormControl fullWidth >
                            <Grid container columnSpacing={1}>

                                {/* input */}
                                <Grid item flexGrow={1} mx={1}>
                                    <Autocomplete
                                        disablePortal
                                        options={suggestionsArr.map(s => s.content)}
                                        onChange={handleChooseSuggestion}
                                        defaultValue={topicPlainText}
                                        freeSolo={true}
                                        fullWidth
                                        renderInput={(params) => <TextField
                                            {...params}
                                            variant={'standard'}
                                            value={queryHelperStates.inputStr}
                                            onChange={handleInput}
                                        />}
                                    />
                                </Grid>

                                {/* 'query' button */}
                                <Grid item>
                                    <Button variant='contained' onClick={async () => { await updatePostsArr(); }}>{langConfigs.query[preferenceStates.lang]}</Button>
                                </Grid>
                            </Grid>
                        </FormControl>

                        {/* empty alert */}
                        {'' !== queryHelperStates.inputStr && 0 === masonryPostInfoArr.length &&
                            <Box minHeight={200} mt={10}>
                                <Typography color={'text.secondary'} align={'center'}>
                                    {langConfigs.noPosts[preferenceStates.lang]}
                                </Typography>
                            </Box>
                        }

                        {/* mansoy */}
                        <Box maxWidth={{ md: 900, lg: 800 }}>
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
                                                        maxWidth: 1,
                                                        maxHeight: 1,
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

                    {/* bottom space */}
                    <Box pb={{ xs: '10rem', sm: '10rem', md: 0 }} />
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

export default Query;