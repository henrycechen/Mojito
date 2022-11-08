import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Avatar from '@mui/material/Avatar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import { useSession, signIn, signOut } from 'next-auth/react';
import { LangConfigs } from '../lib/types';

/**
 * Domain and language settings
 */
const domain = process.env.NEXT_PUBLIC_APP_DOMAIN;
const lang = process.env.NEXT_PUBLIC_APP_LANG ?? 'ch';
const langConfigs: LangConfigs = {
    signIn: {
        ch: '登入',
        en: 'Sign in'
    },
    memberMenu: {
        ch: ['发帖', '账户', '登出'],
        en: ['New posting', 'Account', 'Sign out']
    }
}

export default () => {
    /**
     * Handle session
     */
    const { data: session, status } = useSession();
    /**
     * Handle MemberMenu actions
     */
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const handleOpenMemberMenu = (event: React.MouseEvent<HTMLElement>) => { setAnchorEl(event.currentTarget) }
    const handleCloseMemberMenu = (actionIndex: number) => {
        setAnchorEl(null);
        if (actionIndex === 0) { signOut() };
        if (actionIndex === 1) { signOut() };
        if (actionIndex === 2) { signOut() };
    }
    /**
     * Handle click on SignIn Button
     */
    const handleSignIn = (event: React.MouseEvent<HTMLElement>) => {
        event.preventDefault();
        signIn();
    }
    return (
        <AppBar position='sticky'>
            <Container maxWidth={'xl'}>
                <Toolbar disableGutters>
                    <Link href='/'>
                        <Box component={'img'} src={`${domain}/logo.png`} sx={{ height: '40px' }}></Box>
                    </Link>
                    <Box sx={{ flexGrow: 1 }}></Box>
                    {'authenticated' !== status && !session && (
                        <Button variant='contained' onClick={handleSignIn}>{langConfigs.signIn[lang]}</Button>
                    )}
                    {session && (
                        <Box sx={{ flexGrow: 0 }}>
                            <Tooltip title="Open settings">
                                <IconButton onClick={handleOpenMemberMenu} sx={{ p: 0 }}>
                                    <Avatar alt={session?.user?.name ?? ''} src={session?.user?.image ?? ''} />
                                </IconButton>
                            </Tooltip>
                            <Menu
                                sx={{ mt: '45px' }}
                                anchorEl={anchorEl}
                                anchorOrigin={{
                                    vertical: 'top',
                                    horizontal: 'right',
                                }}
                                keepMounted
                                transformOrigin={{
                                    vertical: 'top',
                                    horizontal: 'right',
                                }}
                                open={Boolean(anchorEl)}
                                onClose={handleCloseMemberMenu}
                            >
                                {langConfigs.memberMenu[lang].map((action: string, index: number) => (
                                    <MenuItem
                                        key={action}
                                        onClick={() => { handleCloseMemberMenu(index) }}
                                    >
                                        <Typography sx={{ textAlign: 'center' }}>{action}</Typography>
                                    </MenuItem>
                                ))}
                            </Menu>
                        </Box>
                    )}
                </Toolbar>
            </Container>
        </AppBar>
    )
}