import * as React from 'react';
import { useRouter } from 'next/router';
import { signIn, useSession } from 'next-auth/react';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';

import Menu from '@mui/material/Menu';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import Typography from '@mui/material/Typography';

import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

import Navbar from '../../../ui/Navbar';
import Copyright from '../../../ui/Copyright';
import Terms from '../../../ui/Terms';
import { ResponsiveCard } from '../../../ui/Styled';

import { LangConfigs, TPreferenceStates } from '../../../lib/types';
import { updateLocalStorage, restoreFromLocalStorage } from '../../../lib/utils/general';

const storageName0 = 'PreferenceStates';
const updatePreferenceStatesCache = updateLocalStorage(storageName0);
const restorePreferenceStatesFromCache = restoreFromLocalStorage(storageName0);

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
        tw: '隱私權',
        cn: '隐私',
        en: 'Privacy'
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

const Settings = () => {

    const router = useRouter();
    const { data: session } = useSession({ required: true, onUnauthenticated() { signIn(); } });

    React.useEffect(() => {
        const viewerSession: any = { ...session };
        setProcessStates({ ...processStates, memberId: viewerSession?.user?.id });
        restorePreferenceStatesFromCache(setPreferenceStates);
    }, [session]);

    //////// STATES - preference ////////
    const [preferenceStates, setPreferenceStates] = React.useState<TPreferenceStates>({
        lang: defaultLang,
        mode: 'light'
    });

    type TProcessStates = {
        memberId: string,
        languageSettingMenuAnchorEl: null | HTMLElement;
    };

    //////// STATES - process ////////
    const [processStates, setProcessStates] = React.useState<TProcessStates>({
        memberId: '',
        languageSettingMenuAnchorEl: null
    });

    const handleOpenPopUpMenu = (event: React.MouseEvent<HTMLElement>) => {
        setProcessStates({ ...processStates, languageSettingMenuAnchorEl: event.currentTarget });
    };

    const handleClosePopUpMenu = () => {
        setProcessStates({ ...processStates, languageSettingMenuAnchorEl: null });
    };

    const handleSelectLang = (lang: string) => (event: React.MouseEvent<HTMLElement>) => {
        setProcessStates({ ...processStates, languageSettingMenuAnchorEl: null });
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
        <>
            <Navbar lang={preferenceStates.lang} />

            {/* <SettingLayout /> */}
            <Grid container mt={{ xs: 1, sm: 10 }}>

                {/* placeholder */}
                <Grid item xs={0} sm={2} md={3} lg={3} xl={4}></Grid>

                {/* middle column */}
                <Grid item xs={12} sm={8} md={6} lg={6} xl={4}>
                    <ResponsiveCard sx={{ p: { xs: 1, sm: 2, md: 4, lg: 6 }, minHeight: { xs: 0, sm: 500 } }}>

                        <MenuList >
                            {/* title - UI */}
                            <Box px={1}>
                                <Typography sx={{ color: 'text.disabled' }}>{langConfigs.ui[preferenceStates.lang]}</Typography>
                            </Box>

                            {/* language settings */}
                            <MenuItem onClick={handleOpenPopUpMenu}>
                                <ListItemText>{langConfigs.changeLang[preferenceStates.lang]}</ListItemText>
                                <ListItemIcon ><ArrowForwardIosIcon fontSize='small' /></ListItemIcon>
                            </MenuItem>

                            {/* title - account */}
                            <Box px={1} pt={3}>
                                <Typography sx={{ color: 'text.disabled' }}>{langConfigs.account[preferenceStates.lang]}</Typography>
                            </Box>

                            {/* update password */}
                            <MenuItem onClick={handleMenuItemClick(0)}>
                                <ListItemText>{langConfigs.updatePassword[preferenceStates.lang]}</ListItemText>
                                <ListItemIcon><ArrowForwardIosIcon fontSize='small' /></ListItemIcon>
                            </MenuItem>

                            {/* pravicy settings */}
                            <MenuItem onClick={handleMenuItemClick(1)}>
                                <ListItemText>{langConfigs.privacy[preferenceStates.lang]}</ListItemText>
                                <ListItemIcon><ArrowForwardIosIcon fontSize='small' /></ListItemIcon>
                            </MenuItem>

                            {/* blacklist */}
                            <MenuItem onClick={handleMenuItemClick(2)}>
                                <ListItemText>{langConfigs.blacklist[preferenceStates.lang]}</ListItemText>
                                <ListItemIcon><ArrowForwardIosIcon fontSize='small' /></ListItemIcon>
                            </MenuItem>

                            {/* title - member */}
                            <Box px={1} pt={3}>
                                <Typography sx={{ color: 'text.disabled' }}>{langConfigs.member[preferenceStates.lang]}</Typography>
                            </Box>

                            {/* member info */}
                            <MenuItem onClick={handleMenuItemClick(3)}>
                                <ListItemText>{langConfigs.infoStatistics[preferenceStates.lang]}</ListItemText>
                                <ListItemIcon><ArrowForwardIosIcon fontSize='small' /></ListItemIcon>
                            </MenuItem>
                        </MenuList>

                        <Menu
                            sx={{ mt: '45px' }}
                            anchorEl={processStates.languageSettingMenuAnchorEl}
                            anchorOrigin={{ vertical: 'top', horizontal: 'right', }}
                            keepMounted
                            transformOrigin={{ vertical: 'top', horizontal: 'right', }}
                            open={Boolean(processStates.languageSettingMenuAnchorEl)}
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
                <Grid item xs={0} sm={2} md={3} lg={3} xl={4}></Grid>

            </Grid>

            <Copyright sx={{ mt: 16 }} lang={preferenceStates.lang} />
            <Terms sx={{ mb: 8 }} lang={preferenceStates.lang} />

        </>
    );
};

export default Settings;