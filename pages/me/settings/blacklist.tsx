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

import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';

import { Alert, Menu } from '@mui/material';


import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

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

import Navbar from '../../../ui/Navbar';

import { IMemberInfo, IConciseMemberStatistics, IRestrictedMemberComprehensive } from '../../../lib/interfaces/member';
import { IConcisePostComprehensive } from '../../../lib/interfaces/post';
import { INoticeInfoWithMemberInfo } from '../../../lib/interfaces/notification';
import { IChannelInfoStates, IChannelInfoDictionary } from '../../../lib/interfaces/channel';

import { TBrowsingHelper, LangConfigs, TPreferenceStates } from '../../../lib/types';

import { timeToString, getContentBrief, updateLocalStorage, provideLocalStorage, restoreFromLocalStorage, logWithDate } from '../../../lib/utils/general';
import { verifyId, verifyNoticeId, verifyPassword } from '../../../lib/utils/verify';
import { provideAvatarImageUrl, getNicknameBrief, fakeConciseMemberInfo, fakeConciseMemberStatistics, fakeRestrictedMemberInfo } from '../../../lib/utils/for/member';
import { noticeIdToUrl, noticeInfoToString } from '../../../lib/utils/for/notification';

import { CentralizedBox, ResponsiveCard, StyledSwitch, TextButton } from '../../../ui/Styled';

import FormGroup from '@mui/material/FormGroup';
import Switch from '@mui/material/Switch';
import Checkbox from '@mui/material/Checkbox';
import Link from '@mui/material/Link';

import DoneIcon from '@mui/icons-material/Done';

import axios, { AxiosError, AxiosResponse } from 'axios';
import Copyright from '../../../ui/Copyright';
import Terms from '../../../ui/Terms';
import Table from '@mui/material/Table/Table';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';

import { createTheme, responsiveFontSizes, styled, ThemeProvider } from '@mui/material/styles';
import { provideCoverImageUrl } from '../../../lib/utils/for/post';

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


const Blacklist = () => {

    const router = useRouter();
    const { data: session } = useSession({ required: true, onUnauthenticated() { signIn(); } });

    let memberId = '';

    React.useEffect(() => {
        const viewerSession: any = { ...session };
        memberId = viewerSession?.user?.id;
        restorePreferenceStatesFromCache(setPreferenceStates);

    }, [session]);

    //////// STATES - preference ////////
    const [preferenceStates, setPreferenceStates] = React.useState<TPreferenceStates>({
        lang: defaultLang,
        mode: 'light'
    });

    type TProcessStates = {
        displayAlert: boolean;
    };

    //////// STATES - process ////////
    const [processStates, setProcessStates] = React.useState<TProcessStates>({
        displayAlert: false,
    });

    //////// STATES - blocked member info arr ////////
    const [blockedMemberInfoArr, setBlockedMemberInfoArr] = React.useState<IMemberInfo[]>([]);

    React.useEffect(() => { getBlockedMemberInfoArray(); }, []);

    const getBlockedMemberInfoArray = async () => {
        const resp = await fetch(`/api/member/blockedbyme/${memberId}`);
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
        <ThemeProvider theme={theme}>
            <Navbar avatarImageUrl={provideAvatarImageUrl(memberId, domain)} />

            {/* <SettingLayout /> */}
            <Grid container mt={{ xs: 1, sm: 10 }}>
                {/* placeholder */}
                <Grid item xs={0} sm={2} md={3} lg={3}></Grid>

                {/* middle column */}
                <Grid item xs={12} sm={8} md={6} lg={6}>
                    <ResponsiveCard sx={{ pt: { xs: 0, sm: 2 }, minHeight: 500 }}>

                        {/* 'backward' button */}
                        <Box>
                            <Button color='inherit' onClick={onBackwardClick}>
                                <ArrowBackIosIcon fontSize={'small'} sx={{ color: 'grey' }} />
                            </Button>
                        </Box>
                        {/* space */}
                        <Box pt={1}></Box>

                        {/* alert */}
                        <Box pb={1} display={processStates.displayAlert ? 'block' : 'none'}>
                            <Alert severity='error'><strong>{langConfigs.alertContent[preferenceStates.lang]}</strong></Alert>
                        </Box>

                        {/* component stack - member info */}
                        <Stack spacing={2} sx={{ px: 1 }}>
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
                <Grid item xs={0} sm={2} md={3} lg={3}></Grid>

            </Grid>




            <Copyright sx={{ mt: 16 }} lang={preferenceStates.lang} />
            <Terms sx={{ mb: 8 }} lang={preferenceStates.lang} />

        </ThemeProvider>
    );
};

export default Blacklist;