import * as React from 'react';
import { useRouter } from 'next/router';

import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';

import Toolbar from '@mui/material/Toolbar';

import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Tooltip from '@mui/material/Tooltip';

import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';

import CreateIcon from '@mui/icons-material/Create';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import EmailIcon from '@mui/icons-material/Email';
import SettingsIcon from '@mui/icons-material/Settings';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import Brightness4Icon from '@mui/icons-material/Brightness4';

import useTheme from '@mui/material/styles/useTheme';

import { useSession, signIn, signOut } from 'next-auth/react';
import { LangConfigs } from '../lib/types';

import { ColorModeContext } from './Theme';
import { provideAvatarImageUrl } from '../lib/utils/for/member';

const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? '';
const imageDomain = process.env.NEXT_PUBLIC_IMAGE_DOMAIN ?? '';
const langConfigs: LangConfigs = {
    open: {
        tw: '打開菜單',
        cn: '打开菜单',
        en: 'Open menu'
    },
    signIn: {
        tw: '登入',
        cn: '登入',
        en: 'Sign in'
    },
    create: {
        tw: '創作',
        cn: '创作',
        en: 'Create'
    },
    message: {
        tw: '消息',
        cn: '消息',
        en: 'Message'
    },
    member: {
        tw: '主页',
        cn: '主页',
        en: 'Member'
    },
    settings: {
        tw: '設定',
        cn: '设置',
        en: 'Settings'
    },
    signOut: {
        tw: '登出',
        cn: '登出',
        en: 'Sign out'
    }
};

type TNavbarProps = {
    lang?: string;
    forceUpdateImageCache?: boolean;
};

export default function Navbar(props: TNavbarProps) {

    const router = useRouter();
    const { data: session, status } = useSession();

    const lang = props.lang ?? 'tw';

    type TProcessStates = {
        memberId: string;
        menuAnchorEl: null | HTMLElement;
    };

    const [processStates, setProcessStates] = React.useState<TProcessStates>({
        memberId: '',
        menuAnchorEl: null,
    });

    React.useEffect(() => {
        if ('authenticated' === status) {
            const viewerSession: any = { ...session };
            setProcessStates({ ...processStates, memberId: viewerSession?.user?.id ?? '', });
        }
    }, [status]);


    const handleOpenMemberMenu = (event: React.MouseEvent<HTMLElement>) => { setProcessStates({ ...processStates, menuAnchorEl: event.currentTarget }); };

    const handleCloseMemberMenu = () => { setProcessStates({ ...processStates, menuAnchorEl: null }); };

    const handleClick = (actionIndex: number) => {
        setProcessStates({ ...processStates, menuAnchorEl: null });
        if (actionIndex === 0) { router.push('/create'); };
        if (actionIndex === 1) { router.push(`/message`); };
        if (actionIndex === 2) { router.push(`/me/${processStates.memberId}`); };
        if (actionIndex === 3) { router.push(`/settings`); };
        if (actionIndex === 4) { signOut(); };
    };

    const handleSignIn = (event: React.MouseEvent<HTMLElement>) => {
        event.preventDefault();
        signIn();
    };

    const colorMode = React.useContext(ColorModeContext);

    const handleColorModeSelect = () => {
        const preferredColorMode = colorMode.mode === 'dark' ? 'light' : 'dark';
        colorMode.setMode(preferredColorMode);
        document.cookie = `PreferredColorMode=${preferredColorMode}`;
    };

    const theme = useTheme();

    return (
        <AppBar position='sticky' sx={{ display: { sm: 'block', md: 'none' } }}>

            <Container maxWidth={'xl'}>

                <Toolbar disableGutters>

                    <Link href='/' mt={1}>
                        <Box component={'img'} src={`${appDomain}/logo${'dark' === theme.palette.mode ? '-dark' : '-bright'}.png`} sx={{ height: '2.5rem' }} />
                    </Link>

                    <Box sx={{ flexGrow: 1 }}></Box>

                    {(!session || 'authenticated' !== status) && (
                        <Button variant='contained' onClick={handleSignIn}>{langConfigs.signIn[props.lang ?? 'tw']}</Button>
                    )}

                    {(session && 'authenticated' === status) && (
                        <Box sx={{ flexGrow: 0 }}>
                            <Tooltip title={langConfigs.open[lang]}>
                                <IconButton onClick={handleOpenMemberMenu} sx={{ p: 0 }}>
                                    <Avatar src={'' === processStates.memberId ? '' : provideAvatarImageUrl(processStates.memberId, imageDomain, !!props.forceUpdateImageCache)} />
                                </IconButton>
                            </Tooltip>

                            <Menu
                                sx={{ mt: '45px' }}
                                anchorEl={processStates.menuAnchorEl}
                                anchorOrigin={{ vertical: 'top', horizontal: 'right', }}
                                keepMounted
                                transformOrigin={{ vertical: 'top', horizontal: 'right', }}
                                open={Boolean(processStates.menuAnchorEl)}
                                onClose={handleCloseMemberMenu}
                                MenuListProps={{}}
                            >
                                <MenuItem onClick={() => handleClick(0)} >
                                    <ListItemIcon><CreateIcon /></ListItemIcon>
                                    <ListItemText>{langConfigs.create[lang]}</ListItemText>
                                </MenuItem>

                                <MenuItem onClick={() => handleClick(1)} >
                                    <ListItemIcon><EmailIcon /></ListItemIcon>
                                    <ListItemText>{langConfigs.message[lang]}</ListItemText>
                                </MenuItem>

                                <MenuItem onClick={() => handleClick(2)} >
                                    <ListItemIcon><AccountCircleIcon /></ListItemIcon>
                                    <ListItemText>{langConfigs.member[lang]}</ListItemText>
                                </MenuItem>

                                <MenuItem onClick={() => handleClick(3)} >
                                    <ListItemIcon><SettingsIcon /></ListItemIcon>
                                    <ListItemText>{langConfigs.settings[lang]}</ListItemText>
                                </MenuItem>

                                <MenuItem onClick={() => handleClick(4)} >
                                    <ListItemIcon><ExitToAppIcon /></ListItemIcon>
                                    <ListItemText>{langConfigs.signOut[lang]}</ListItemText>
                                </MenuItem>

                                <Divider />

                                <MenuItem onClick={handleColorModeSelect} >
                                    <ListItemIcon>
                                        {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
                                    </ListItemIcon>
                                    <ListItemText>
                                        {theme.palette.mode}
                                    </ListItemText>
                                </MenuItem>
                            </Menu>
                        </Box>
                    )}

                </Toolbar>

            </Container>

        </AppBar>
    );
}