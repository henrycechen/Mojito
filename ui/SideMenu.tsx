import * as React from 'react';
import { useRouter } from 'next/router';
import { signIn, useSession, } from 'next-auth/react';
import useTheme from '@mui/material/styles/useTheme';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';

import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';

import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import ArticleIcon from '@mui/icons-material/Article';
import CreateIcon from '@mui/icons-material/Create';
import EmailIcon from '@mui/icons-material/Email';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SearchIcon from '@mui/icons-material/Search';
import SettingsIcon from '@mui/icons-material/Settings';

import { LangConfigs } from '../lib/types';

const langConfigs: LangConfigs = {
    signIn: {
        tw: '登入',
        cn: '登入',
        en: 'Sign in'
    },
    posts: {
        tw: '文章',
        cn: '文章',
        en: 'Posts'
    },
    follow: {
        tw: '關注',
        cn: '关注',
        en: 'Follow'
    },
    query: {
        tw: '搜尋',
        cn: '搜索',
        en: 'Query'
    },
    messages: {
        tw: '訊息',
        cn: '消息',
        en: 'Messages'
    },
    unread: {
        tw: `未讀`,
        cn: `未读`,
        en: `Unread`
    },
    member: {
        tw: '主頁',
        cn: '主页',
        en: 'Member'
    },
    settings: {
        tw: '設定',
        cn: '设定',
        en: 'Settings'
    },
    create: {
        tw: '創作',
        cn: '创作',
        en: 'Create'
    }
};

type TSideMenuProps = {
    lang?: string;
};

export default function SideMenu(props: TSideMenuProps) {
    const router = useRouter();
    const { data: session, status } = useSession();
    // status - 'unauthenticated' / 'authenticated'

    React.useEffect(() => {
        if ('authenticated' === status) {
            const authorSession: any = { ...session };
            setProcessStates({ ...processStates, memberId: authorSession?.user?.id ?? '' });
        }
    }, [status]);

    type TProcessStates = {
        memberId: string;
    };

    const [processStates, setProcessStates] = React.useState<TProcessStates>({
        memberId: ''
    });

    const lang = props.lang ?? 'tw';
    const theme = useTheme();

    const handleSignIn = (event: React.MouseEvent<HTMLElement>) => {
        event.preventDefault();
        signIn();
    };

    const handleProceedToHome = () => {
        router.push(`/`);
    };

    const handleProceedToFollowedMember = () => {
        router.push(`/follow`);
    };

    const handleProceedToQuery = () => {
        router.push(`/query`);
    };

    const handleProceedToMessage = () => {
        router.push(`/message`);
    };

    const handleProceedToMemberPage = () => {
        router.push(`/me/${processStates.memberId}`);
    };

    const handleProceedToSettingsPage = () => {
        router.push(`/settings`);
    };

    const handleProceedToCreatePage = () => {
        router.push(`/create`);
    };

    return (
        <Stack spacing={1} sx={{ width: { md: 200, lg: 240 }, }} >

            {/* logo */}
            <Link href='/' pt={5} px={2}>
                <Box component={'img'} src={`/logo${'dark' === theme.palette.mode ? '-dark' : '-blue'}.png`} sx={{ height: { md: '3rem', lg: '3.5rem' } }} />
            </Link>

            {/* unauthenticated - login*/}
            {'authenticated' !== status && <Box p={3}>
                <Button variant={'contained'} sx={{ width: { md: '7rem', lg: '8rem' }, borderRadius: 4 }} onClick={handleSignIn}>{langConfigs.signIn[lang]}</Button>
            </Box>}

            {/* authenticated - member menu */}
            {'authenticated' === status && <Box sx={{ padding: 1 }}>
                <MenuList>

                    {/* posts */}
                    <MenuItem sx={{ height: 56 }} onClick={handleProceedToHome} >
                        <ListItemIcon>
                            <ArticleIcon />
                        </ListItemIcon>
                        <ListItemText>
                            {langConfigs.posts[lang]}
                        </ListItemText>
                    </MenuItem>

                    {/* followed members */}
                    <MenuItem sx={{ height: 56 }} onClick={handleProceedToFollowedMember} >
                        <ListItemIcon>
                            <NotificationsIcon />
                        </ListItemIcon>
                        <ListItemText>
                            {langConfigs.follow[lang]}
                        </ListItemText>
                    </MenuItem>

                    {/* query */}
                    <MenuItem sx={{ height: 56 }} onClick={handleProceedToQuery} >
                        <ListItemIcon>
                            <SearchIcon />
                        </ListItemIcon>
                        <ListItemText>
                            {langConfigs.query[lang]}
                        </ListItemText>
                    </MenuItem>

                    {/* message */}
                    <MenuItem sx={{ height: 56 }} onClick={handleProceedToMessage} >
                        <ListItemIcon>
                            <EmailIcon />
                        </ListItemIcon>
                        <ListItemText>
                            {langConfigs.messages[lang]}
                        </ListItemText>
                    </MenuItem>

                    {/* member */}
                    <MenuItem sx={{ height: 56 }} onClick={handleProceedToMemberPage}>
                        <ListItemIcon>
                            <AccountCircleIcon />
                        </ListItemIcon>
                        <ListItemText>
                            {langConfigs.member[lang]}
                        </ListItemText>
                    </MenuItem>

                    {/* settings */}
                    <MenuItem sx={{ height: 56 }} onClick={handleProceedToSettingsPage} >
                        <ListItemIcon>
                            <SettingsIcon />
                        </ListItemIcon>
                        <ListItemText>
                            {langConfigs.settings[lang]}
                        </ListItemText>
                    </MenuItem>

                    <Divider />
                    {/* create */}
                    <MenuItem sx={{ height: 56 }} onClick={handleProceedToCreatePage} >
                        <ListItemIcon>
                            <CreateIcon />
                        </ListItemIcon>
                        <ListItemText>
                            {langConfigs.create[lang]}
                        </ListItemText>
                    </MenuItem>
                </MenuList>
            </Box>}
        </Stack >
    );
}