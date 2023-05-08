import * as React from 'react';
import { signIn, signOut, useSession, } from 'next-auth/react';
import { useRouter } from 'next/router';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Checkbox from '@mui/material/Checkbox';

import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import CircularProgress from '@mui/material/CircularProgress';

import { ResponsiveCard } from '../../../ui/Styled';
import Navbar from '../../../ui/Navbar';
import Copyright from '../../../ui/Copyright';
import Terms from '../../../ui/Terms';

import { LangConfigs, TPreferenceStates } from '../../../lib/types';
import { restoreFromLocalStorage } from '../../../lib/utils/general';

const storageName0 = 'PreferenceStates';
const restorePreferenceStatesFromCache = restoreFromLocalStorage(storageName0);

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

    update: {
        tw: '更新',
        cn: '更新',
        en: 'Update'
    },
    updateSucceeded: {
        tw: '更新成功',
        cn: '更新成功',
        en: 'Success'
    },
    updateFailed: {
        tw: '更新失敗，點擊以重試',
        cn: '更新失敗，点击以重试',
        en: 'Update failed, click to re-try'
    },

    cancel: {
        tw: '注銷',
        cn: '注銷',
        en: 'Confirm'
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

const PravicySettings = () => {

    const router = useRouter();
    const { data: session, status } = useSession({ required: true, onUnauthenticated() { signIn(); } });

    React.useEffect(() => {
        if ('authenticated' === status) {
            const viewerSession: any = { ...session };
            setProcessStates({ ...processStates, memberId: viewerSession?.user?.id ?? '' });
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
        countdown: number;
        displayAlert: boolean;
        displayUpdateButton: boolean;
        displayProgress: boolean;
        displayCancelButton: boolean;
        displayCountdown: boolean;
        disableButton: boolean;
        progressStatus: 100 | 200 | 300 | 400;
    };

    //////// STATES - process ////////
    const [processStates, setProcessStates] = React.useState<TProcessStates>({
        memberId: '',
        countdown: 5,
        displayAlert: false,
        displayUpdateButton: false,
        displayProgress: false,
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
    React.useEffect(() => { if ('' !== processStates.memberId) { fetchPrivacySettings(); } }, [processStates.memberId]);

    //////// STATES - previous settings ////////
    const [privacySettingsStates, setPrivacySettingsStates] = React.useState<TPrivacySettingsStates>({
        allowKeepingBrowsingHistory: true,
        allowVisitingFollowedMembers: true,
        allowVisitingSavedPosts: true,
        hidePostsAndCommentsOfBlockedMember: true,
    });

    const fetchPrivacySettings = async () => {
        const resp = await fetch(`/api/member/info/${processStates.memberId}`);
        try {
            if (200 !== resp.status) {
                // error handling
                throw new Error(`Bad fetch response`);
            }
            const info = await resp.json();
            setPreviousSettingsStates({
                allowKeepingBrowsingHistory: info.allowKeepingBrowsingHistory,
                allowVisitingFollowedMembers: info.allowVisitingFollowedMembers,
                allowVisitingSavedPosts: info.allowVisitingSavedPosts,
                hidePostsAndCommentsOfBlockedMember: info.hidePostsAndCommentsOfBlockedMember,
            });
            setPrivacySettingsStates({
                allowKeepingBrowsingHistory: info.allowKeepingBrowsingHistory,
                allowVisitingFollowedMembers: info.allowVisitingFollowedMembers,
                allowVisitingSavedPosts: info.allowVisitingSavedPosts,
                hidePostsAndCommentsOfBlockedMember: info.hidePostsAndCommentsOfBlockedMember,
            });
        } catch (e) {
            console.log(`Attempt to get member info (privacy settings). ${e}`);
            setProcessStates({ ...processStates, displayAlert: true });
        }
    };

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
        setProcessStates({ ...processStates, displayProgress: true, displayCancelButton: false, disableButton: true, progressStatus: 300 });
        const resp = await fetch(`/api/member/info/${processStates.memberId}/privacysettings`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ settings: { ...privacySettingsStates } })
        });

        if (200 === resp.status) {
            setPreviousSettingsStates({ ...privacySettingsStates });
            setProcessStates({ ...processStates, displayProgress: false, displayCancelButton: false, disableButton: true, progressStatus: 200 });
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
            const resp = await fetch(`/api/member/info/${processStates.memberId}/cancel`, { method: 'DELETE' });
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
        <>
            <Navbar lang={preferenceStates.lang} />

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
                                {'authenticated' !== status && <CircularProgress size={20} />}
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
                                <Typography variant={'body1'} py={1}>{langConfigs.privacy[preferenceStates.lang]}</Typography>
                                <Stack pl={{ xs: 0, sm: 2, }}>

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
                                    {processStates.displayUpdateButton && <Box py={2}>
                                        <Button
                                            variant={'contained'}
                                            color={400 !== processStates.progressStatus ? 'primary' : 'error'}
                                            size={'small'}
                                            onClick={async () => { await handleUpdate(); }}
                                            disabled={processStates.disableButton}
                                            fullWidth
                                        >

                                            {processStates.displayProgress && <CircularProgress size={24} color='inherit' />}
                                            {/* button: enabled, result: 100 (ready) */}
                                            {!processStates.displayProgress && 100 === processStates.progressStatus && <Typography variant={'body2'}>{langConfigs.update[preferenceStates.lang]}</Typography>}
                                            {/* button: disabled, result: 200 (succeeded) */}
                                            {!processStates.displayProgress && 200 === processStates.progressStatus && <Typography variant={'body2'}>{langConfigs.updateSucceeded[preferenceStates.lang]}</Typography>}
                                            {/* button: enabled, result: 400 (failed) */}
                                            {!processStates.displayProgress && 400 === processStates.progressStatus && <Typography variant={'body2'}>{langConfigs.updateFailed[preferenceStates.lang]}</Typography>}
                                        </Button>
                                    </Box>}
                                </Stack>

                                {/* blank space */}
                                <Box py={1}></Box>

                                {/* title - cancel membership */}
                                <Typography variant={'body1'} py={1}>{langConfigs.cancel[preferenceStates.lang]}</Typography>

                                {/* cancel membership */}
                                <Box pl={{ xs: 0, sm: 2, md: 4 }}>
                                    <FormControlLabel control={<Checkbox onChange={handleCheck} checked={processStates.displayCancelButton} />} label={langConfigs.wishToCancelMembership[preferenceStates.lang]} />
                                </Box>

                                {/* 'cancel' button */}
                                {processStates.displayCancelButton && <Box mb={3} >
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
                <Grid item xs={0} sm={2} md={3} lg={3} xl={4}></Grid>

            </Grid>

            <Copyright sx={{ mt: 16 }} lang={preferenceStates.lang} />
            <Terms sx={{ mb: 8 }} lang={preferenceStates.lang} />

        </>
    );
};

export default PravicySettings;