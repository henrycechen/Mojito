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
const updatePreferenceStatesCache = updateLocalStorage(storageName0);
const restorePreferenceStatesFromCache = restoreFromLocalStorage(storageName0);

const domain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? '';
const defaultLang = process.env.NEXT_PUBLIC_APP_LANG ?? 'tw';
const langConfigs: LangConfigs = {

    alertContent: {
        tw: '出錯了，刷新頁面以重新獲取數據',
        cn: '出错了，刷新页面以重新获取数据',
        en: 'Something went wrong, refresh the page to refetch the data'
    },

    privacySettings: {
        tw: '設定',
        cn: '设置',
        en: 'Settings'
    },
    privacy: {
        tw: '隱私',
        cn: '隐私',
        en: 'Privacy'
    },

    cancel: {
        tw: '注銷',
        cn: '注銷',
        en: 'Confirm'
    },
    update: {
        tw: '更新',
        cn: '更新',
        en: 'Update'
    },
    cancelSucceeded: {
        tw: '注銷成功',
        cn: '注銷成功',
        en: 'Success'
    },
    cancelFailed: {
        tw: '注銷失敗，點擊以重試',
        cn: '注銷失败，点击以重试',
        en: 'Cancel membership failed, click to re-try',
    },
    allowVisitingFollowedMembers: {
        tw: '允許他人查看您的訂閲',
        cn: '允许他人查看您的订阅',
        en: 'Allow other members visiting your followed members'
    },
    allowVisitingSavedPosts: {
        tw: '允許他人訪問您的收藏',
        cn: '允许他人访问您的收藏',
        en: 'Allow other members visiting your saved posts'
    },
    clickXTimesToCancelMemberShip: {
        tw: (t: number) => 0 !== t ? `繼續點擊${t}次以注銷賬號` : `繼續點擊以注銷賬號`,
        cn: (t: number) => 0 !== t ? `继续点击${t}次以注销账户` : `继续点击以注销账户`,
        en: (t: number) => 0 !== t ? `Keep taping ${t} times to cancel membershipt` : `Keep taping to cancel membershipt`,
    },
    allowKeepingBrowsingHistory: {
        tw: '保存您的瀏覽記錄',
        cn: '保存您的浏览记录',
        en: 'Save browsing history'

    },
    hidePostsAndCommentsOfBlockedMember: {
        tw: '隱藏屏蔽的用戶的作品和評論',
        cn: '隐藏屏蔽的用户的作品与评论',
        en: 'Hide posts and comments from blocked member'

    },
    wishToCancelMembership: {
        tw: '我希望注銷我的賬號',
        cn: '我希望注销我的账户',
        en: 'I wish to cancel my membership'
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

const PravicySettings = () => {

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
        countdown: number;
        displayAlert: boolean;
        displayUpdateButton: boolean;
        displayCancelButton: boolean;
        displayCountdown: boolean;
        disableButton: boolean;
        progressStatus: 100 | 200 | 300 | 400;
    };

    //////// STATES - process ////////
    const [processStates, setProcessStates] = React.useState<TProcessStates>({
        countdown: 5,
        displayAlert: false,
        displayUpdateButton: false,
        displayCancelButton: false,
        displayCountdown: false,
        disableButton: false,
        progressStatus: 100,
    });

    type TPrivacySettingsStates = {
        allowKeepingBrowsingHistory: boolean;
        allowVisitingFollowedMembers: boolean;
        allowVisitingSavedPosts: boolean;
        hidePostsAndCommentsOfBlockedMember: boolean;
    };

    //////// STATES - previous settings ////////

    const [previousPrivacySettingsStates, setPreviousSettingsStates] = React.useState<TPrivacySettingsStates>({
        allowKeepingBrowsingHistory: true,
        allowVisitingFollowedMembers: true,
        allowVisitingSavedPosts: true,
        hidePostsAndCommentsOfBlockedMember: true,
    });

    //////// Init states ////////
    React.useEffect(() => {
        fetchPrivacySettings();
    }, []);

    const fetchPrivacySettings = async () => {
        const resp = await fetch(`/api/member/info/${memberId}`);
        if (200 !== resp.status) {
            // error handling
            setProcessStates({ ...processStates, displayAlert: true });
            return;
        }
        const stt = await resp.json();
        setPreviousSettingsStates({
            allowKeepingBrowsingHistory: stt.allowKeepingBrowsingHistory,
            allowVisitingFollowedMembers: stt.allowVisitingFollowedMembers,
            allowVisitingSavedPosts: stt.allowVisitingSavedPosts,
            hidePostsAndCommentsOfBlockedMember: stt.hidePostsAndCommentsOfBlockedMember,
        });
        setPrivacySettingsStates;
    };

    //////// STATES - previous settings ////////
    const [privacySettingsStates, setPrivacySettingsStates] = React.useState<TPrivacySettingsStates>({
        allowKeepingBrowsingHistory: true,
        allowVisitingFollowedMembers: true,
        allowVisitingSavedPosts: true,
        hidePostsAndCommentsOfBlockedMember: true,
    });

    const handleToggle = (prop: keyof TPrivacySettingsStates) => (event: React.ChangeEvent<HTMLInputElement>) => {
        setPrivacySettingsStates({ ...privacySettingsStates, [prop]: !privacySettingsStates[prop] });
    };

    React.useEffect(() => {
        if (
            !(
                previousPrivacySettingsStates.allowKeepingBrowsingHistory === privacySettingsStates.allowKeepingBrowsingHistory
                && previousPrivacySettingsStates.allowVisitingFollowedMembers === privacySettingsStates.allowVisitingFollowedMembers
                && previousPrivacySettingsStates.allowVisitingSavedPosts === privacySettingsStates.allowVisitingSavedPosts
                && previousPrivacySettingsStates.hidePostsAndCommentsOfBlockedMember === privacySettingsStates.hidePostsAndCommentsOfBlockedMember
            )
        ) {
            setProcessStates({ ...processStates, displayUpdateButton: true });
        } else {
            setProcessStates({ ...processStates, displayUpdateButton: false });
        }
    }, [privacySettingsStates]);

    const handleCheck = () => {
        setProcessStates({
            ...processStates,
            displayCancelButton: !processStates.displayCancelButton,
            countdown: 5,
            displayCountdown: false,
            progressStatus: 100
        });
    };

    const handleUpdate = async () => {
        if (
            previousPrivacySettingsStates.allowKeepingBrowsingHistory === privacySettingsStates.allowKeepingBrowsingHistory
            && previousPrivacySettingsStates.allowVisitingFollowedMembers === privacySettingsStates.allowVisitingFollowedMembers
            && previousPrivacySettingsStates.allowVisitingSavedPosts === privacySettingsStates.allowVisitingSavedPosts
            && previousPrivacySettingsStates.hidePostsAndCommentsOfBlockedMember === privacySettingsStates.hidePostsAndCommentsOfBlockedMember
        ) {
            return;
        }

        // Prepare to update privacy setting
        setProcessStates({ ...processStates, displayCancelButton: false, disableButton: true, progressStatus: 300 });
        const resp = await fetch(`/api/member/info/${memberId}/privacysetting`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ settings: { ...privacySettingsStates } })
        });

        if (200 === resp.status) {
            setPreviousSettingsStates({ ...privacySettingsStates });
            setProcessStates({ ...processStates, displayCancelButton: false, disableButton: true, progressStatus: 200 });
            setTimeout(() => {
                setProcessStates({ ...processStates, displayUpdateButton: false, progressStatus: 100 });
            }, 2000);
        } else {
            setProcessStates({ ...processStates, disableButton: false, progressStatus: 400 });
        }
    };

    const handleCancel = async () => {
        if (processStates.countdown > 0) {
            setProcessStates({ ...processStates, countdown: processStates.countdown - 1, displayCountdown: true });
        } else {
            const resp = await fetch(`/api/member/info/${memberId}/cancel`, { method: 'DELETE' });
            if (200 === resp.status) {
                setProcessStates({ ...processStates, displayCountdown: false, progressStatus: 200 });
                signOut();
            } else {
                setProcessStates({ ...processStates, displayCountdown: false, progressStatus: 400 });
            }
        }
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

                        <Box sx={{ px: { xs: 2, sm: 2, md: 4 }, py: 1 }}>
                            <Box pb={1} display={processStates.displayAlert ? 'block' : 'none'}>
                                <Alert severity='error'>
                                    <strong>{langConfigs.alertContent[preferenceStates.lang]}</strong>
                                </Alert>
                            </Box>

                            <FormGroup>

                                {/* title - privacy */}
                                <Typography variant={'body2'} mt={2}>{langConfigs.privacy[preferenceStates.lang]}</Typography>
                                <Stack pl={{ xs: 0, sm: 2, md: 4 }}>

                                    {/* browsing history */}
                                    <FormControlLabel
                                        control={<Switch checked={privacySettingsStates.allowKeepingBrowsingHistory} onChange={handleToggle('allowKeepingBrowsingHistory')} />}
                                        label={<Typography variant={'body2'} align={'left'}>{langConfigs.allowKeepingBrowsingHistory[preferenceStates.lang]}</Typography>}
                                        sx={{ fontSize: 14 }} />

                                    {/* show followed members */}
                                    <FormControlLabel
                                        control={<Switch checked={privacySettingsStates.allowVisitingFollowedMembers} onChange={handleToggle('allowVisitingFollowedMembers')} />}
                                        label={<Typography variant={'body2'} align={'left'}>{langConfigs.allowVisitingFollowedMembers[preferenceStates.lang]}</Typography>}
                                        sx={{ fontSize: 14 }} />

                                    {/* show saved posts */}
                                    <FormControlLabel
                                        control={<Switch checked={privacySettingsStates.allowVisitingSavedPosts} onChange={handleToggle('allowVisitingSavedPosts')} />}
                                        label={<Typography variant={'body2'} align={'left'}>{langConfigs.allowVisitingSavedPosts[preferenceStates.lang]}</Typography>}
                                        sx={{ fontSize: 14 }} />

                                    {/* hide from blocked members */}
                                    <FormControlLabel
                                        control={<Switch checked={privacySettingsStates.hidePostsAndCommentsOfBlockedMember} onChange={handleToggle('hidePostsAndCommentsOfBlockedMember')} />}
                                        label={<Typography variant={'body2'} align={'left'}>{langConfigs.hidePostsAndCommentsOfBlockedMember[preferenceStates.lang]}</Typography>}
                                        sx={{ fontSize: 14 }} />

                                    {/* 'update' button */}
                                    {processStates.displayUpdateButton && <Box mt={1} pl={{ xs: 0, sm: 3, md: 2 }}>
                                        <Button
                                            variant={'contained'}
                                            color={400 !== processStates.progressStatus ? 'primary' : 'error'}
                                            size={'small'}
                                            onClick={async () => { await handleUpdate(); }}
                                            disabled={processStates.disableButton}
                                            fullWidth
                                        >
                                            {/* button: enabled, result: 100 (ready) */}
                                            {100 === processStates.progressStatus && <Typography variant={'body2'}>{langConfigs.update[preferenceStates.lang]}</Typography>}
                                            {/* button: disabled, result: 200 (succeeded) */}
                                            {200 === processStates.progressStatus && <Typography variant={'body2'}>{langConfigs.updateSucceeded[preferenceStates.lang]}</Typography>}
                                            {/* button: disabled, result: 300 (ongoing) */}
                                            {300 === processStates.progressStatus && <Typography variant={'body2'}>{langConfigs.updatinging[preferenceStates.lang]}</Typography>}
                                            {/* button: enabled, result: 400 (failed) */}
                                            {400 === processStates.progressStatus && <Typography variant={'body2'}>{langConfigs.updateFailed[preferenceStates.lang]}</Typography>}
                                        </Button>
                                    </Box>}
                                </Stack>

                                {/* title - cancel membership */}
                                <Typography variant={'body2'} sx={{ mt: 4 }}>{langConfigs.cancel[preferenceStates.lang]}</Typography>
                                <Box pl={{ xs: 0, sm: 2, md: 4 }}>
                                    <FormControlLabel control={<Checkbox onChange={handleCheck} checked={processStates.displayCancelButton} />} label={langConfigs.wishToCancelMembership[preferenceStates.lang]} />
                                </Box>

                                {/* 'cancel' button */}
                                {processStates.displayCancelButton && <Box mb={4} pl={{ xs: 0, sm: 3, md: 6 }}>
                                    <Button variant={'contained'} color={'error'} size={'small'} onClick={async () => { await handleCancel(); }} fullWidth>
                                        {(!processStates.displayCountdown && 100 === processStates.progressStatus) && <Typography variant={'body2'}>{langConfigs.cancel[preferenceStates.lang]}</Typography>}
                                        {(!processStates.displayCountdown && 200 === processStates.progressStatus) && <Typography variant={'body2'}>{langConfigs.cancelSucceeded[preferenceStates.lang]}</Typography>}
                                        {(!processStates.displayCountdown && 400 === processStates.progressStatus) && <Typography variant={'body2'}>{langConfigs.cancelFailed[preferenceStates.lang]}</Typography>}
                                        {processStates.displayCountdown && <Typography variant={'body2'}>{langConfigs.clickXTimesToCancelMemberShip[preferenceStates.lang](processStates.countdown)}</Typography>}
                                    </Button>
                                </Box>}
                            </FormGroup>

                        </Box >

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

export default PravicySettings;