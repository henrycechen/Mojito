import * as React from 'react';
import { signIn, useSession, } from 'next-auth/react';
import { useRouter } from 'next/router';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';

import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';

import Table from '@mui/material/Table/Table';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableBody from '@mui/material/TableBody';

import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';

import { createTheme, responsiveFontSizes, ThemeProvider } from '@mui/material/styles';

import { LangConfigs, TPreferenceStates } from '../../../lib/types';
import { restoreFromLocalStorage } from '../../../lib/utils/general';
import { provideAvatarImageUrl, } from '../../../lib/utils/for/member';
import { ResponsiveCard } from '../../../ui/Styled';

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
    info: {
        tw: '資訊',
        cn: '信息',
        en: 'Info'
    },
    memberInfo: {
        tw: '賬號資訊',
        cn: '账户信息',
        en: 'Member info'
    },
    memberId: {
        tw: '賬號 ID',
        cn: '账户 ID',
        en: 'Member ID'
    },
    emailAddress: {
        tw: '郵件地址',
        cn: '电子邮箱',
        en: 'Email'
    },
    registeredDate: {
        tw: '注冊日期',
        cn: '注册日期',
        en: 'Register date'
    },
    verifiedDate: {
        tw: '驗證日期',
        cn: '验证日期',
        en: 'Verified date'
    },
    memberStatus: {
        tw: '賬號狀況',
        cn: '账户状态',
        en: 'Member status'
    },
    normalStatus: {
        tw: '正常',
        cn: '正常',
        en: 'normal'
    },
    restrictedStatus: {
        tw: '受限',
        cn: '受限',
        en: 'restricted'
    },
    memberStatistics: {
        tw: '統計數據',
        cn: '统计数据',
        en: 'Member statistics'
    },
    totalCreationsCount: {
        tw: '創作',
        cn: '发布',
        en: 'Total creations'
    },
    totalCreationHitCount: {
        tw: '觀看',
        cn: '浏览',
        en: 'Total creation viewed'
    },
    totalCreationLikedCount: {
        tw: '喜歡',
        cn: '点赞',
        en: 'Total creation liked'
    },
    totalCreationSavedCount: {
        tw: '收藏',
        cn: '收藏',
        en: 'Total creation saved'
    },
    totalFollowedByCount: {
        tw: '訂閲',
        cn: '粉丝',
        en: 'Followers'
    },
};

const MemberInfoAndStatistics = () => {

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
        displayAlert: false
    });

    type TMemberInfoStates = {
        memberId: string;
        avatarImageUrl: string;
        nickname: string;
        // registeredTimeBySecond: number;
        registeredTime: string;
        // verifiedTimeBySecond: number;
        verifiedTime: string;
        emailAddress: string;
        status: number;
    };

    //////// STATES - memberInfo ////////
    const [memberInfoStates, setMemberInfoStates] = React.useState<TMemberInfoStates>({
        memberId: '',
        avatarImageUrl: provideAvatarImageUrl(memberId, domain),
        nickname: '',
        // registeredTimeBySecond: 0,
        registeredTime: '',
        // verifiedTimeBySecond: 0,
        verifiedTime: '',
        emailAddress: '',
        status: 0,
    });

    type TMemberStatisticsStates = {
        totalCreationsCount: number;
        totalCreationHitCount: number;
        totalFollowedByCount: number;
        totalCreationSavedCount: number;
        totalCreationLikedCount: number;
    };

    //////// STATES - memberInfo ////////
    const [memberStatisticsStates, setMemberStatisticsStates] = React.useState<TMemberStatisticsStates>({
        totalCreationsCount: 0,
        totalCreationHitCount: 0,
        totalFollowedByCount: 0,
        totalCreationSavedCount: 0,
        totalCreationLikedCount: 0,
    });

    //////// Init states ////////
    React.useEffect(() => {
        fetchMemberInfoAsync();
        getMemberStatisticsAsync();
    }, []);

    const fetchMemberInfoAsync = async () => {
        const resp = await fetch(`/api/member/info/${memberId}`);
        try {
            if (200 !== resp.status) {
                // error handling
                throw new Error(`Bad fetch response`);
            }
            const info = await resp.json();
            setMemberInfoStates({
                ...memberInfoStates,
                memberId: info.memberId,
                // registeredTimeBySecond: info.registeredTimeBySecond,
                registeredTime: new Date(info.registeredTimeBySecond * 1000).toLocaleDateString(),
                // verifiedTimeBySecond: info.verifiedTimeBySecond,
                verifiedTime: new Date(info.verifiedTimeBySecond * 1000).toLocaleDateString(),
                emailAddress: info.emailAddress,
                status: info.status,
                nickname: info.nickname,
            });
        } catch (e) {
            console.log(`Attempt to get member info. ${e}`);
            setProcessStates({ ...processStates, displayAlert: true });
        }
    };

    const getMemberStatisticsAsync = async () => {
        try {
            const resp = await fetch(`/api/member/statistics/${memberId}`);
            if (200 !== resp.status) {
                throw new Error(`Bad fetch response`);
            }
            const stat = await resp.json();
            setMemberStatisticsStates({
                ...memberStatisticsStates,
                totalCreationsCount: stat.totalCreationsCount,
                totalCreationHitCount: stat.totalCreationHitCount,
                totalFollowedByCount: stat.totalFollowedByCount,
                totalCreationSavedCount: stat.totalCreationSavedCount,
                totalCreationLikedCount: stat.totalCreationLikedCount,
            });
        } catch (e) {
            console.log(`Attempt to get member statistics. ${e}`);
            setProcessStates({ ...processStates, displayAlert: true });
        }
    };

    const onBackwardClick = () => {
        router.push('/me/settings/');
    };

    return (
        <>
            <Navbar avatarImageUrl={memberInfoStates.avatarImageUrl} />

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
                            {/* alert */}
                            <Box pb={1} display={processStates.displayAlert ? 'block' : 'none'}>
                                <Alert severity='error'><strong>{langConfigs.alertContent[preferenceStates.lang]}</strong></Alert>
                            </Box>

                            {/* space */}
                            <Box pt={1}></Box>

                            {/* table title - info */}
                            <Box>
                                <Typography>{langConfigs.memberInfo[preferenceStates.lang]}</Typography>
                                <Divider></Divider>
                            </Box>

                            <Table aria-label='simple table' >
                                <TableBody>

                                    {/* memberId */}
                                    <TableRow>
                                        <TableCell sx={{ pt: 1, pb: 0, px: { xs: 0, sm: 1 }, borderBottom: 'none' }}>{langConfigs.memberId[preferenceStates.lang]}</TableCell>
                                        <TableCell sx={{ pt: 1, pb: 0, px: { xs: 0, sm: 1 }, borderBottom: 'none' }} align='right'>{memberInfoStates.memberId}</TableCell>
                                    </TableRow>

                                    {/* email address */}
                                    <TableRow>
                                        <TableCell sx={{ pt: 1, pb: 0, px: { xs: 0, sm: 1 }, borderBottom: 'none' }}>{langConfigs.emailAddress[preferenceStates.lang]}</TableCell>
                                        <TableCell sx={{ pt: 1, pb: 0, px: { xs: 0, sm: 1 }, borderBottom: 'none', maxWidth: { xs: 120, sm: 160 } }} align='right'>
                                            <Typography variant={'body2'} sx={{ overflowWrap: 'anywhere' }}>{memberInfoStates.emailAddress}</Typography>
                                        </TableCell>
                                    </TableRow>

                                    {/* registered date */}
                                    <TableRow>
                                        <TableCell sx={{ pt: 1, pb: 0, px: { xs: 0, sm: 1 }, borderBottom: 'none' }}>{langConfigs.registeredDate[preferenceStates.lang]}</TableCell>
                                        <TableCell sx={{ pt: 1, pb: 0, px: { xs: 0, sm: 1 }, borderBottom: 'none' }} align='right'>{memberInfoStates.registeredTime}</TableCell>
                                    </TableRow>

                                    {/* verified date */}
                                    <TableRow>
                                        <TableCell sx={{ pt: 1, pb: 0, px: { xs: 0, sm: 1 }, borderBottom: 'none' }}>{langConfigs.verifiedDate[preferenceStates.lang]}</TableCell>
                                        <TableCell sx={{ pt: 1, pb: 0, px: { xs: 0, sm: 1 }, borderBottom: 'none' }} align='right'>{memberInfoStates.verifiedTime}</TableCell>
                                    </TableRow>

                                    {/* status */}
                                    <TableRow>
                                        <TableCell sx={{ pt: 1, pb: 0, px: { xs: 0, sm: 1 }, borderBottom: 'none' }}>{langConfigs.memberStatus[preferenceStates.lang]}</TableCell>
                                        <TableCell sx={{ pt: 1, pb: 0, px: { xs: 0, sm: 1 }, borderBottom: 'none' }} align='right'>{200 === memberInfoStates.status ? langConfigs.normalStatus[preferenceStates.lang] : langConfigs.restrictedStatus[preferenceStates.lang]}</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table >

                            {/* space */}
                            <Box pt={4}></Box>

                            {/* table title - statistics */}
                            <Box>
                                <Typography>{langConfigs.memberStatistics[preferenceStates.lang]}</Typography>
                                <Divider></Divider>
                            </Box>

                            <Table aria-label='simple table' >
                                <TableBody>

                                    {/* creation count */}
                                    <TableRow>
                                        <TableCell sx={{ pt: 1, pb: 0, px: { xs: 0, sm: 1 }, borderBottom: 'none' }}>{langConfigs.totalCreationsCount[preferenceStates.lang]}</TableCell>
                                        <TableCell sx={{ pt: 1, pb: 0, px: { xs: 0, sm: 1 }, borderBottom: 'none' }} align='right'>{memberStatisticsStates.totalCreationsCount}</TableCell>
                                    </TableRow>

                                    {/* creation hit */}
                                    <TableRow>
                                        <TableCell sx={{ pt: 1, pb: 0, px: { xs: 0, sm: 1 }, borderBottom: 'none' }}>{langConfigs.totalCreationHitCount[preferenceStates.lang]}</TableCell>
                                        <TableCell sx={{ pt: 1, pb: 0, px: { xs: 0, sm: 1 }, borderBottom: 'none' }} align='right'>{memberStatisticsStates.totalCreationHitCount}</TableCell>
                                    </TableRow>

                                    {/* like */}
                                    <TableRow>
                                        <TableCell sx={{ pt: 1, pb: 0, px: { xs: 0, sm: 1 }, borderBottom: 'none' }}>{langConfigs.totalCreationLikedCount[preferenceStates.lang]}</TableCell>
                                        <TableCell sx={{ pt: 1, pb: 0, px: { xs: 0, sm: 1 }, borderBottom: 'none' }} align='right'>{memberStatisticsStates.totalCreationLikedCount}</TableCell>
                                    </TableRow>

                                    {/* save */}
                                    <TableRow>
                                        <TableCell sx={{ pt: 1, pb: 0, px: { xs: 0, sm: 1 }, borderBottom: 'none' }}>{langConfigs.totalCreationSavedCount[preferenceStates.lang]}</TableCell>
                                        <TableCell sx={{ pt: 1, pb: 0, px: { xs: 0, sm: 1 }, borderBottom: 'none' }} align='right'>{memberStatisticsStates.totalCreationSavedCount}</TableCell>
                                    </TableRow>

                                    {/* followed */}
                                    <TableRow>
                                        <TableCell sx={{ pt: 1, pb: 0, px: { xs: 0, sm: 1 }, borderBottom: 'none' }}>{langConfigs.totalFollowedByCount[preferenceStates.lang]}</TableCell>
                                        <TableCell sx={{ pt: 1, pb: 0, px: { xs: 0, sm: 1 }, borderBottom: 'none' }} align='right'>{memberStatisticsStates.totalFollowedByCount}</TableCell >
                                    </TableRow >
                                </TableBody>
                            </Table >
                        </Box >

                    </ResponsiveCard>
                </Grid>



                {/* placeholder */}
                <Grid item xs={0} sm={2} md={3} lg={3}></Grid>

            </Grid>

            <Copyright sx={{ mt: 16 }} lang={preferenceStates.lang} />
            <Terms sx={{ mb: 8 }} lang={preferenceStates.lang} />

        </>
    );
};

export default MemberInfoAndStatistics;