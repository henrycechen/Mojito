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

const storageName1 = 'MemberPageProcessStates';
const updateProcessStatesCache = updateLocalStorage(storageName1);
const restoreProcessStatesFromCache = restoreFromLocalStorage(storageName1);

const storageName2 = 'MemberPagePostsLayoutStates';
const updatePostsLayoutStatesCache = updateLocalStorage(storageName2);
const restorePostsLayoutStatesFromCache = restoreFromLocalStorage(storageName2);

type TMemberPageProps = {
    channelInfoDict_ss: IChannelInfoDictionary;
    memberInfo_ss: IRestrictedMemberComprehensive;
    memberStatistics_ss: IConciseMemberStatistics;
    redirect404: boolean;
    redirect500: boolean;
};

type TMemberPageProcessStates = {
    selectedLayout: 'messagelayout' | 'listlayout' | 'postlayout' | 'settinglayout';
};

const domain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? '';
const defaultLang = process.env.NEXT_PUBLIC_APP_LANG ?? 'tw';
const langConfigs: LangConfigs = {



    ui: {
        tw: '界面',
        cn: '界面',
        en: 'UI'
    },
    changeLang: {
        tw: '變更界面語言',
        cn: '变更界面语言',
        en: 'Change UI language'
    },
    account: {
        tw: '賬號',
        cn: '账户',
        en: 'Account'
    },
    updatePassword: {
        tw: '變更密碼',
        cn: '变更密码',
        en: 'Update your password'
    },
    privacy: {
        tw: '資料和隱私權',
        cn: '资料与隐私',
        en: 'Data & Privacy'
    },
    blacklist: {
        tw: '屏蔽列表',
        cn: '黑名单',
        en: 'Blacklist'
    },
    member: {
        tw: '會員',
        cn: '会员',
        en: 'Member'
    },
    infoStatistics: {
        tw: '信息和數據',
        cn: '信息和数据',
        en: 'Info & Statistics'
    }

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

//// Get multiple member info server-side ////

const Settings = () => {

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


    //////// STATES - process ////////
    const [processStates, setProcessStates] = React.useState<TMemberPageProcessStates>({
        selectedLayout: 'postlayout', // default
    });


    type TPopUpMenuStates = {
        anchorEl: null | HTMLElement;
    };

    //////// STATES - pop up menu ////////
    const [popUpMenuStates, setPopUpMenuStates] = React.useState<TPopUpMenuStates>({
        anchorEl: null,
    });

    const handleOpenPopUpMenu = (event: React.MouseEvent<HTMLElement>) => {
        setPopUpMenuStates({ anchorEl: event.currentTarget });
    };

    const handleClosePopUpMenu = () => {
        setPopUpMenuStates({ anchorEl: null });
    };

    const handleSelectLang = (lang: string) => (event: React.MouseEvent<HTMLElement>) => {
        setPopUpMenuStates({ anchorEl: null });
        setPreferenceStates({ ...preferenceStates, lang });
        updatePreferenceStatesCache({ ...preferenceStates, lang });
    };

    const handleMenuItemClick = (cat: number) => (event: React.MouseEvent<HTMLElement>) => {

        if (0 === cat) {
            router.push('/forgot/');
        }
        if (1 === cat) {
            router.push('/me/settings/privacy');
        }
        if (2 === cat) {
            router.push('/me/settings/blacklist');
        }
        if (3 === cat) {
            router.push('/me/settings/statistics');
        }
    };


    ///////// COMPONENT - member page /////////
    return (
        <ThemeProvider theme={theme}>
            <Navbar avatarImageUrl={provideAvatarImageUrl(memberId, domain)} lang={preferenceStates.lang} />


            {/* <SettingLayout /> */}
            <Grid container mt={{ xs: 1, sm: 10 }}>
                {/* placeholder */}
                <Grid item xs={0} sm={2} md={3} lg={3}></Grid>

                {/* middle column */}
                <Grid item xs={12} sm={8} md={6} lg={6}>
                    <ResponsiveCard sx={{ pt: { xs: 0, sm: 2 }, minHeight: 500 }}>

                        <MenuList >
                            {/* title - UI */}
                            <Box px={1}>
                                <Typography sx={{ color: 'text.disabled' }}>{langConfigs.ui[preferenceStates.lang]}</Typography>
                            </Box>
                            <MenuItem onClick={handleOpenPopUpMenu}>
                                <ListItemText>{langConfigs.changeLang[preferenceStates.lang]}</ListItemText>
                                <ListItemIcon ><ArrowForwardIosIcon fontSize="small" /></ListItemIcon>

                            </MenuItem>

                            {/* title - account */}
                            <Box px={1} pt={3}>
                                <Typography sx={{ color: 'text.disabled' }}>{langConfigs.account[preferenceStates.lang]}</Typography>
                            </Box>
                            <MenuItem onClick={handleMenuItemClick(0)}>
                                <ListItemText>{langConfigs.updatePassword[preferenceStates.lang]}</ListItemText>
                                <ListItemIcon><ArrowForwardIosIcon fontSize="small" /></ListItemIcon>
                            </MenuItem>
                            <MenuItem onClick={handleMenuItemClick(1)}>
                                <ListItemText>{langConfigs.privacy[preferenceStates.lang]}</ListItemText>
                                <ListItemIcon><ArrowForwardIosIcon fontSize="small" /></ListItemIcon>
                            </MenuItem>
                            <MenuItem onClick={handleMenuItemClick(2)}>
                                <ListItemText>{langConfigs.blacklist[preferenceStates.lang]}</ListItemText>
                                <ListItemIcon><ArrowForwardIosIcon fontSize="small" /></ListItemIcon>
                            </MenuItem>

                            {/* title - member */}
                            <Box px={1} pt={3}>
                                <Typography sx={{ color: 'text.disabled' }}>{langConfigs.member[preferenceStates.lang]}</Typography>
                            </Box>
                            <MenuItem onClick={handleMenuItemClick(3)}>
                                <ListItemText>{langConfigs.infoStatistics[preferenceStates.lang]}</ListItemText>
                                <ListItemIcon><ArrowForwardIosIcon fontSize="small" /></ListItemIcon>
                            </MenuItem>


                        </MenuList>



                        <Menu
                            sx={{ mt: '45px' }}
                            anchorEl={popUpMenuStates.anchorEl}
                            anchorOrigin={{ vertical: 'top', horizontal: 'right', }}
                            keepMounted
                            transformOrigin={{ vertical: 'top', horizontal: 'right', }}
                            open={Boolean(popUpMenuStates.anchorEl)}
                            onClose={handleClosePopUpMenu}
                            MenuListProps={{}}
                        >

                            <MenuItem onClick={handleSelectLang('tw')}>
                                <ListItemText>繁体中文</ListItemText>
                            </MenuItem>
                            <MenuItem onClick={handleSelectLang('cn')}>
                                <ListItemText>简体中文</ListItemText>
                            </MenuItem>
                            <MenuItem onClick={handleSelectLang('en')}>
                                <ListItemText>English</ListItemText>
                            </MenuItem>
                        </Menu>

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

export default Settings;