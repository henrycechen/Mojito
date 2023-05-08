import * as React from 'react';
import { signIn, useSession, } from 'next-auth/react';
import { useRouter } from 'next/router';

import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import IconButton from '@mui/material/IconButton';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import CircularProgress from '@mui/material/CircularProgress';

import { IMemberInfo } from '../../../lib/interfaces/member';
import { LangConfigs, TPreferenceStates } from '../../../lib/types';
import { timeToString, restoreFromLocalStorage } from '../../../lib/utils/general';
import { provideAvatarImageUrl, getNicknameBrief } from '../../../lib/utils/for/member';
import { ResponsiveCard, TextButton } from '../../../ui/Styled';

import Navbar from '../../../ui/Navbar';
import Copyright from '../../../ui/Copyright';
import Terms from '../../../ui/Terms';

const storageName0 = 'PreferenceStates';
const restorePreferenceStatesFromCache = restoreFromLocalStorage(storageName0);

const domain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? '';
const defaultLang = process.env.NEXT_PUBLIC_APP_LANG ?? 'tw';
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

const Blacklist = () => {

    const router = useRouter();
    const { data: session, status } = useSession({ required: true, onUnauthenticated() { signIn(); } });

    React.useEffect(() => {
        if ('authenticated' === status) {
            const viewerSession: any = { ...session };
            setProcessStates({ ...processStates, memberId: viewerSession?.user?.id });
            restorePreferenceStatesFromCache(setPreferenceStates);
        }
    }, [status]);

    //////// STATES - preference ////////
    const [preferenceStates, setPreferenceStates] = React.useState<TPreferenceStates>({
        lang: defaultLang,
        mode: 'light'
    });

    type TProcessStates = {
        memberId: string;
        displayAlert: boolean;
        displayProgress: boolean;
    };

    //////// STATES - process ////////
    const [processStates, setProcessStates] = React.useState<TProcessStates>({
        memberId: '',
        displayAlert: false,
        displayProgress: true
    });

    //////// STATES - blocked member info arr ////////
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

    const handleClickOnMemberInfo = (memberId: string) => (event: React.MouseEvent<HTMLButtonElement>) => {
        router.push(`/me/id/${memberId}`);
    };

    const onBackwardClick = () => {
        router.push('/me/settings/');
    };

    return (
        <>
            <Navbar lang={preferenceStates.lang} />

            {/* <SettingLayout /> */}
            <Grid container mt={{ xs: 1, sm: 10 }}>
                {/* placeholder */}
                <Grid item xs={0} sm={2} md={3} lg={3} xl={4}></Grid>

                {/* middle column */}
                <Grid item xs={12} sm={8} md={6} lg={6} xl={4}>
                    <ResponsiveCard sx={{ p: { xs: 1, sm: 2, md: 4 }, minHeight: { xs: 0, sm: 500 } }}>


                        {/* 'backward' button */}
                        <Box>
                            <Button color='inherit' onClick={onBackwardClick}>
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

                        {/* component stack - member info */}
                        <Stack spacing={2} px={{ xs: 1, sm: 2, md: 4 }}>
                            <Box mt={{ xs: 0, sm: 0 }}></Box>
                            {0 !== blockedMemberInfoArr.length && blockedMemberInfoArr.map(info =>

                                <Box key={info.memberId} sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }} >

                                    {/* member info */}
                                    <Stack direction={'row'} sx={{ maxHeight: 40 }}>
                                        <IconButton sx={{ px: 0 }} onClick={handleClickOnMemberInfo(info.memberId)}>
                                            <Avatar src={provideAvatarImageUrl(info.memberId, domain)} sx={{ width: 40, height: 40, bgcolor: 'grey' }}>{info.nickname?.charAt(0).toUpperCase()}</Avatar>
                                        </IconButton>
                                        <Box ml={1}>
                                            <TextButton color={'inherit'} onClick={handleClickOnMemberInfo(info.memberId)}>

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
                <Grid item xs={0} sm={2} md={3} lg={3} xl={4}></Grid>

            </Grid>

            <Copyright sx={{ mt: 16 }} lang={preferenceStates.lang} />
            <Terms sx={{ mb: 8 }} lang={preferenceStates.lang} />

        </>
    );
};

export default Blacklist;