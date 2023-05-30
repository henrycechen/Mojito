import * as React from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/router';

import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import IconButton from '@mui/material/IconButton';

import Toolbar from '@mui/material/Toolbar';

import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import CreateOutlinedIcon from '@mui/icons-material/CreateOutlined';
import CircleNotificationsOutlinedIcon from '@mui/icons-material/CircleNotificationsOutlined';

import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import MarkEmailUnreadOutlinedIcon from '@mui/icons-material/MarkEmailUnreadOutlined';

import { LangConfigs } from '../lib/types';

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
    unreadNotification?: boolean;
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

    const handleCloseMemberMenu = () => {
        setProcessStates({
            ...processStates,
            menuAnchorEl: null
        });
    };

    const handleClick = (actionIndex: number) => (event: React.MouseEvent<HTMLButtonElement>) => {
        setProcessStates({ ...processStates, menuAnchorEl: null });
        if (actionIndex === 0) { router.push('/'); };
        if (actionIndex === 1) { router.push(`/follow`); };
        if (actionIndex === 2) { router.push(`/create`); };
        if (actionIndex === 3) { router.push(`/message`); };
        if (actionIndex === 4) { router.push(`/me/${processStates.memberId}`); };
        // if (actionIndex === 5) { signOut(); };
    };

    const handleSignIn = (event: React.MouseEvent<HTMLElement>) => {
        event.preventDefault();
        signIn();
    };


    const ControlComponents = () => {
        return (
            <>

                {/* posts */}
                <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center' }}>
                    <IconButton
                        aria-label={'posts'}
                        onClick={handleClick(0)}
                    >
                        <ArticleOutlinedIcon sx={{ fontSize: 30 }} />
                    </IconButton>
                </Box>

                {/* follow */}
                <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center' }}>
                    <IconButton
                        aria-label={'follow'}
                        onClick={handleClick(1)}
                    >
                        <CircleNotificationsOutlinedIcon sx={{ fontSize: 30 }} />
                    </IconButton>
                </Box>

                <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center' }}>
                    <IconButton

                        aria-label="open drawer"
                        onClick={handleClick(2)}
                    >
                        <CreateOutlinedIcon sx={{ fontSize: 30 }} />
                    </IconButton>
                </Box>

                {/* message */}
                <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center' }}>
                    <IconButton

                        aria-label="open drawer"
                        onClick={handleClick(3)}
                    >
                        {!!props.unreadNotification ?
                            <MarkEmailUnreadOutlinedIcon sx={{ fontSize: 30 }} /> :
                            <EmailOutlinedIcon sx={{ fontSize: 30 }} />
                        }
                    </IconButton>
                </Box>

                <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center' }}>
                    <IconButton

                        aria-label="open drawer"
                        onClick={handleClick(4)}
                    >
                        <AccountCircleOutlinedIcon sx={{ fontSize: 30 }} />
                    </IconButton>
                </Box>
            </>
        );
    };


    return (
        <>
            <AppBar position="fixed" color="inherit" sx={{ top: 'auto', bottom: 0, height: '6rem', display: { xs: 'block', sm: 'block', md: 'none' } }}>
                <Container maxWidth={'md'}>
                    <Toolbar disableGutters>

                        <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center' }}></Box>

                        {/* authenticated - control components */}
                        {(session && 'authenticated' == status) && ControlComponents()}

                        {/* authenticated - signin button */}
                        {(!session || 'authenticated' !== status) && (
                            <Button variant='contained' onClick={handleSignIn}>{langConfigs.signIn[props.lang ?? 'tw']}</Button>
                        )}

                        <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center' }}></Box>
                    </Toolbar >
                </Container >
            </AppBar >

        </>
    );
}