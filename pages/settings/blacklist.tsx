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
import Typography from '@mui/material/Typography';

import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';

import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';

import { IMemberInfo } from '../../lib/interfaces/member';
import { LangConfigs, TPreferenceStates } from '../../lib/types';
import { restoreFromLocalStorage } from '../../lib/utils/general';
import { provideAvatarImageUrl, getNicknameBrief } from '../../lib/utils/for/member';


import Navbar from '../../ui/Navbar';
import SideMenu from '../../ui/SideMenu';
import SideColumn from '../../ui/SideColumn';

const storageName0 = 'PreferenceStates';
const restorePreferenceStatesFromCache = restoreFromLocalStorage(storageName0);

const imageDomain = process.env.NEXT_PUBLIC_IMAGE_DOMAIN ?? '';
const desc = process.env.NEXT_PUBLIC_APP_DESCRIPTION ?? '';
const lang = process.env.NEXT_PUBLIC_APP_LANG ?? 'tw';
const langConfigs: LangConfigs = {
    alertContent: {
        tw: '出錯了，刷新頁面以重新獲取數據',
        cn: '出错了，刷新页面以重新获取数据',
        en: 'Something went wrong, refresh the page to refetch the data'
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

/**
 * Last update:
 * - 24/05/2023 v0.1.2 New layout applied, new member info list layout
 */
const Blacklist = () => {

    const router = useRouter();
    const { data: session, status } = useSession({ required: true, onUnauthenticated() { signIn(); } });

    React.useEffect(() => {
        if ('authenticated' === status) {
            const memberSession: any = { ...session };
            setProcessStates({ ...processStates, memberId: memberSession?.user?.id ?? '' });
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
        displayAlert: boolean;
        displayProgress: boolean;
    };

    // States - process
    const [processStates, setProcessStates] = React.useState<TProcessStates>({
        memberId: '',
        displayAlert: false,
        displayProgress: true
    });

    // States - blocked member info arr
    const [blockedMemberInfoArr, setBlockedMemberInfoArr] = React.useState<IMemberInfo[]>([]);

    React.useEffect(() => {
        if ('' !== processStates.memberId) {
            getBlockedMemberInfoArray();
            setProcessStates({ ...processStates, displayProgress: false });
        }
    }, [processStates.memberId]);

    const getBlockedMemberInfoArray = async () => {
        const resp = await fetch(`/api/member/blockedbyme/${processStates.memberId}`);
        try {
            if (200 !== resp.status) {
                throw new Error(`Bad fetch response`);
            }
            const arr = await resp.json();
            setBlockedMemberInfoArr(arr);
        } catch (e) {
            console.error(`Attempt to get blocked member info array of from resp. ${e}`);
            setProcessStates({ ...processStates, displayAlert: true });
        }
    };

    const handleClickOnMemberInfo = (memberId: string) => (event: React.MouseEvent<HTMLLIElement>) => {
        router.push(`/me/${memberId}`);
    };

    const handleUndo = async (blockedId: string) => {
        // #1 delete JSX element
        const arr: IMemberInfo[] = [...blockedMemberInfoArr];
        for (let i = 0; i < arr.length; i++) {
            if (blockedId === arr[i].memberId) {
                arr.splice(i, 1);
                setBlockedMemberInfoArr(arr);
                break;
            }
        }
        // #2 send request
        const resp = await fetch(`/api/block/${blockedId}`, { method: 'POST' });
        if (200 !== resp.status) {
            console.error(`Attempt to undo block for ${blockedId}`);
        }
    };

    const handleBackward = () => {
        router.push('/settings');
    };

    return (
        <>
            <Head>
                <title>
                    {{ tw: '屏蔽列表', cn: '黑名单', en: 'Blacklist' }[preferenceStates.lang]}
                </title>
                <meta
                    name='description'
                    content={desc}
                    key='desc'
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
                    <Box pt={{ xs: 2, sm: 2, md: 10 }} px={2} >

                        {/* 'backward' button */}
                        <Box sx={{ display: { sm: 'block', md: 'none' } }}>
                            <Button color='inherit' onClick={handleBackward}>
                                <ArrowBackIosIcon fontSize={'small'} sx={{ color: 'grey' }} />
                                {('authenticated' !== status || processStates.displayProgress) && <CircularProgress size={20} />}
                            </Button>
                        </Box>

                        {/* alert */}
                        <Box pt={1} display={processStates.displayAlert ? 'block' : 'none'}>
                            <Alert severity='error'><strong>{langConfigs.alertContent[preferenceStates.lang]}</strong></Alert>
                        </Box>

                        {0 !== blockedMemberInfoArr.length && <MenuList>
                            {blockedMemberInfoArr.map(info =>
                                <MenuItem key={info.memberId} sx={{ height: 64 }} onClick={handleClickOnMemberInfo(info.memberId)}>
                                    <ListItemIcon>
                                        <Avatar src={provideAvatarImageUrl(info.memberId, imageDomain)} >{info.nickname?.charAt(0).toUpperCase()}</Avatar>
                                    </ListItemIcon>
                                    <ListItemText sx={{ pl: 2 }}>

                                        {/* nickname */}
                                        <Typography variant='body1'>{getNicknameBrief(info.nickname)}</Typography>

                                        {/* brief intro */}
                                        <Typography variant='body2' noWrap>{info.briefIntro}</Typography>

                                    </ListItemText>
                                    <ListItemIcon>

                                        {/* 'undo' button */}
                                        <Button variant={'text'} color={'inherit'} onClick={async (event) => { event.stopPropagation(); await handleUndo(info.memberId); }}>
                                            <Typography variant={'body2'} align={'right'}>{langConfigs.undoBlock[preferenceStates.lang]}</Typography>
                                        </Button>
                                    </ListItemIcon>
                                </MenuItem>
                            )}
                        </MenuList>}

                        {0 === blockedMemberInfoArr.length && <Box minHeight={200} mt={10}>
                            <Typography color={'text.secondary'} align={'center'}>{langConfigs.noRecordOfBlacklist[preferenceStates.lang]}</Typography>
                        </Box>}

                    </Box>
                </Grid>

                {/* right */}
                <Grid item xs={0} sm={0} md={3} lg={3} xl={4}>
                    <Box sx={{ display: { xs: 'none', sm: 'none', md: 'block' } }}>
                        <SideColumn lang={preferenceStates.lang} />
                    </Box>
                </Grid>

            </Grid>

            {/* bottom space */}
            <Box pb={'10rem'} />
        </>
    );
};

export default Blacklist;