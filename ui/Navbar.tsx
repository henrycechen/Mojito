import * as React from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import useTheme from '@mui/material/styles/useTheme';
import useScrollTrigger from '@mui/material/useScrollTrigger';

import AppBar from '@mui/material/AppBar';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Slide from '@mui/material/Slide';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';

import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';

import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import CreateIcon from '@mui/icons-material/Create';
import EmailIcon from '@mui/icons-material/Email';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import SettingsIcon from '@mui/icons-material/Settings';

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
    followedMembers: {
        tw: '關注',
        cn: '关注',
        en: 'Followed'
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
    },
    mode: {
        tw: '主題',
        cn: '主題',
        en: 'Mode'
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

    const handleOpenMemberMenu = (event: React.MouseEvent<HTMLElement>) => {
        setProcessStates({
            ...processStates,
            menuAnchorEl: document.getElementById('menu-anchor')
        });
    };

    const handleCloseMemberMenu = () => {
        setProcessStates({
            ...processStates,
            menuAnchorEl: null
        });
    };

    const handleClick = (actionIndex: number) => {
        setProcessStates({ ...processStates, menuAnchorEl: null });
        if (actionIndex === 0) { router.push('/create'); };
        if (actionIndex === 1) { router.push(`/message`); };
        if (actionIndex === 2) { router.push(`/follow`); };
        if (actionIndex === 3) { router.push(`/me/${processStates.memberId}`); };
        if (actionIndex === 4) { router.push(`/settings`); };
        if (actionIndex === 5) { signOut(); };
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

    type TComponentProps = {
        children: React.ReactElement;
    };

    const HideOnScroll = (props: TComponentProps) => {
        const { children } = props;
        const trigger = useScrollTrigger();
        return (
            <Slide appear={false} direction="down" in={!trigger}>
                {children}
            </Slide>
        );
    };

    return (
        <>
            <Box id={'menu-anchor'}></Box>
            <HideOnScroll {...props}>
                <AppBar position='sticky' sx={{ display: { sm: 'block', md: 'none' } }}>
                    <Container maxWidth={'xl'}>
                        <Toolbar disableGutters>

                            {/* logo */}
                            <Link href='/' mt={1}>
                                <Box component={'img'} src={`${appDomain}/logo${'dark' === theme.palette.mode ? '-dark' : '-bright'}.png`} sx={{ height: '2.5rem' }} />
                            </Link>

                            {/* space */}
                            <Box sx={{ flexGrow: 1 }}></Box>

                            {/* authenticated - signin button */}
                            {(!session || 'authenticated' !== status) && (
                                <Button variant='contained' onClick={handleSignIn}>{langConfigs.signIn[props.lang ?? 'tw']}</Button>
                            )}

                            {/* authenticated - avatar */}
                            {(session && 'authenticated' === status) && (
                                <Box>
                                    <Tooltip title={langConfigs.open[lang]}>
                                        <IconButton onClick={handleOpenMemberMenu} sx={{ p: 0 }}>
                                            <Avatar src={'' === processStates.memberId ? '' : provideAvatarImageUrl(processStates.memberId, imageDomain, !!props.forceUpdateImageCache)} />
                                        </IconButton>
                                    </Tooltip>
                                </Box>
                            )}

                        </Toolbar>
                    </Container>
                </AppBar>
            </HideOnScroll>
            <Menu
                sx={{ mt: '3rem' }}
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
                    <ListItemIcon><NotificationsActiveIcon /></ListItemIcon>
                    <ListItemText>{langConfigs.followedMembers[lang]}</ListItemText>
                </MenuItem>

                <MenuItem onClick={() => handleClick(3)} >
                    <ListItemIcon><AccountCircleIcon /></ListItemIcon>
                    <ListItemText>{langConfigs.member[lang]}</ListItemText>
                </MenuItem>

                <MenuItem onClick={() => handleClick(4)} >
                    <ListItemIcon><SettingsIcon /></ListItemIcon>
                    <ListItemText>{langConfigs.settings[lang]}</ListItemText>
                </MenuItem>

                <MenuItem onClick={() => handleClick(5)} >
                    <ListItemIcon><ExitToAppIcon /></ListItemIcon>
                    <ListItemText>{langConfigs.signOut[lang]}</ListItemText>
                </MenuItem>

                <Divider />

                <MenuItem onClick={handleColorModeSelect} >
                    <ListItemIcon>
                        {theme.palette.mode === 'dark' ? <DarkModeIcon /> : <WbSunnyIcon />}
                    </ListItemIcon>
                    <ListItemText>
                        {langConfigs.mode[lang]}
                    </ListItemText>
                </MenuItem>
            </Menu>
        </>
    );
}