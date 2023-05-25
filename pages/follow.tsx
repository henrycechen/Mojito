import * as React from 'react';
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

import { IMemberInfo } from '../lib/interfaces/member';
import { LangConfigs, TPreferenceStates } from '../lib/types';
import { restoreFromLocalStorage } from '../lib/utils/general';
import { provideAvatarImageUrl, getNicknameBrief } from '../lib/utils/for/member';

import LegalInfo from '../ui/LegalInfo';
import Navbar from '../ui/Navbar';
import SideMenu from '../ui/SideMenu';
import SideColumn from '../ui/SideColumn';

const storageName0 = 'PreferenceStates';
const restorePreferenceStatesFromCache = restoreFromLocalStorage(storageName0);

const imageDomain = process.env.NEXT_PUBLIC_IMAGE_DOMAIN ?? '';
const defaultLang = process.env.NEXT_PUBLIC_APP_LANG ?? 'tw';
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
    undoFollow: {
        tw: '移除',
        cn: '取关',
        en: 'Undo'
    },
};

/**
 * Last update:
 * - 24/05/2023 v0.1.1
 */
const FollowedMembers = () => {

    const router = useRouter();
    const { data: session, status } = useSession({ required: true, onUnauthenticated() { signIn(); } });

    React.useEffect(() => {
        if ('authenticated' === status) {
            const memberSession: any = { ...session };
            setProcessStates({ ...processStates, memberId: memberSession?.user?.id });
            restorePreferenceStatesFromCache(setPreferenceStates);
        }
    }, [status]);

    // States - preference
    const [preferenceStates, setPreferenceStates] = React.useState<TPreferenceStates>({
        lang: defaultLang,
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

    // States - followed member info arr
    const [followedMemberInfoArr, setFollowedMemberInfoArr] = React.useState<IMemberInfo[]>([]);

    React.useEffect(() => {
        if ('' !== processStates.memberId) {
            getFollowedMemberInfoArray();
            setProcessStates({ ...processStates, displayProgress: false });
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
            setProcessStates({ ...processStates, displayAlert: true });
        }
    };

    const handleClickOnMemberInfo = (memberId: string) => (event: React.MouseEvent<HTMLLIElement>) => {
        router.push(`/me/${memberId}`);
    };

    const handleUndo = async (memberId: string) => {
        // #1 delete JSX element
        const arr: IMemberInfo[] = [...followedMemberInfoArr];
        for (let i = 0; i < arr.length; i++) {
            if (memberId === arr[i].memberId) {
                arr.splice(i, 1);
                setFollowedMemberInfoArr(arr);
                break;
            }
        }
        // #2 send request
        const resp = await fetch(`/api/follow/${memberId}`, { method: 'POST' });
        if (200 !== resp.status) {
            console.error(`Attempt to undo follow for ${memberId}`);
        }
    };

    const handleBackward = () => {
        router.push('/settings');
    };

    return (
        <>
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

                        {/* 'backward' button */}
                        <Box sx={{ display: { sm: 'block', md: 'none' } }}>
                            <Button color='inherit' onClick={handleBackward}>
                                <ArrowBackIosIcon fontSize={'small'} sx={{ color: 'grey' }} />
                                {('authenticated' !== status || processStates.displayProgress) && <CircularProgress size={20} />}
                            </Button>
                        </Box>

                        {/* space */}
                        <Box pt={1}></Box>

                        {/* alert */}
                        <Box pb={1} display={processStates.displayAlert ? 'block' : 'none'}>
                            <Alert severity='error'><strong>{langConfigs.alertContent[preferenceStates.lang]}</strong></Alert>
                        </Box>

                        {0 !== followedMemberInfoArr.length && <MenuList>
                            {followedMemberInfoArr.map(info =>
                                <MenuItem key={info.memberId} sx={{ height: 64 }} onClick={handleClickOnMemberInfo(info.memberId)}>
                                    <ListItemIcon>
                                        <Avatar src={provideAvatarImageUrl(info.memberId, imageDomain)} >{info.nickname?.charAt(0).toUpperCase()}</Avatar>
                                    </ListItemIcon>
                                    <ListItemText sx={{ pl: 2 }}>

                                        {/* nickname */}
                                        <Typography variant='body1'>{getNicknameBrief(info.nickname)}</Typography>

                                        {/* brief intro */}
                                        <Typography variant='body2' overflow={'hidden'} textOverflow={'ellipsis'}>{info.briefIntro}</Typography>

                                    </ListItemText>
                                    <ListItemIcon>

                                        {/* 'undo' button */}
                                        <Button variant={'text'} color={'inherit'} onClick={async (event) => { event.stopPropagation(); await handleUndo(info.memberId); }}>
                                            <Typography variant={'body2'} align={'right'}>{langConfigs.undoFollow[preferenceStates.lang]}</Typography>
                                        </Button>
                                    </ListItemIcon>
                                </MenuItem>
                            )}
                        </MenuList>}

                        {0 === followedMemberInfoArr.length && <Box minHeight={200} mt={10}>
                            <Typography color={'text.secondary'} align={'center'}>{langConfigs.noRecordOfFollowedMembers[preferenceStates.lang]}</Typography>
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

            {/* legal info */}
            <LegalInfo lang={preferenceStates.lang} />
        </>
    );
};

export default FollowedMembers;