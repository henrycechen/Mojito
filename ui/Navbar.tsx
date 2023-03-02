import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Avatar from '@mui/material/Avatar';
import Toolbar from '@mui/material/Toolbar';
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
import { useRouter } from 'next/router';

import { ColorModeContext } from './Theme';
import { provideAvatarImageUrl } from '../lib/utils/for/member';

const domain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? '';
const lang = process.env.NEXT_PUBLIC_APP_LANG ?? 'tw';
const langConfigs: LangConfigs = {
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
}

type TNavBarProps = {
    avatarImageUrl?: string;
}

export default function NavBar(props: TNavBarProps) {

    const router = useRouter();

    let viewerId = '';
    let avatarImageUrl = '';

    const { data: session, status } = useSession();
    if ('authenticated' === status) {
        const viewerSession: any = { ...session };
        viewerId = viewerSession?.user?.id;
        const { avatarImageUrl: url } = props;
        if ('string' === typeof url) {
            avatarImageUrl = url;
        } else {
            avatarImageUrl = provideAvatarImageUrl(viewerId, domain);
        }
    }

    const theme = useTheme();
    const colorMode = React.useContext(ColorModeContext);

    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const handleOpenMemberMenu = (event: React.MouseEvent<HTMLElement>) => { setAnchorEl(event.currentTarget) }
    const handleCloseMemberMenu = () => { setAnchorEl(null) }
    const handleClick = (actionIndex: number) => {
        setAnchorEl(null);
        if (actionIndex === 0) { router.push('/me/createpost') };
        if (actionIndex === 1) { router.push(`/me/message`) };
        if (actionIndex === 2) { router.push(`/me/id/${viewerId}`) };
        if (actionIndex === 3) { router.push(`/me/settings`) };
        if (actionIndex === 4) { signOut() };
    }

    const handleSignIn = (event: React.MouseEvent<HTMLElement>) => {
        event.preventDefault();
        signIn();
    }

    const handleColorModeSelect = () => {
        const preferredColorMode = colorMode.mode === 'dark' ? 'light' : 'dark'
        colorMode.setMode(preferredColorMode);
        document.cookie = `PreferredColorMode=${preferredColorMode}`
    }

    return (
        <AppBar position='sticky'>
            <Container maxWidth={'xl'}>
                <Toolbar disableGutters>
                    <Link href='/' mt={1}>
                        <Box component={'img'} src={`${domain}/logo${'dark' === theme.palette.mode ? '-dark' : ''}.png`} sx={{ height: '2.5rem' }} />
                    </Link>
                    <Box sx={{ flexGrow: 1 }}></Box>
                    {'authenticated' !== status && !session && (
                        <Button variant='contained' onClick={handleSignIn}>{langConfigs.signIn[lang]}</Button>
                    )}
                    {session && (
                        <Box sx={{ flexGrow: 0 }}>
                            <Tooltip title="Open settings">
                                <IconButton onClick={handleOpenMemberMenu} sx={{ p: 0 }}>
                                    <Avatar src={avatarImageUrl} />
                                </IconButton>
                            </Tooltip>
                            <Menu
                                sx={{ mt: '45px' }}
                                anchorEl={anchorEl}
                                anchorOrigin={{ vertical: 'top', horizontal: 'right', }}
                                keepMounted
                                transformOrigin={{ vertical: 'top', horizontal: 'right', }}
                                open={Boolean(anchorEl)}
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
                                <MenuItem onClick={() => handleClick(3)} >
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
    )
}