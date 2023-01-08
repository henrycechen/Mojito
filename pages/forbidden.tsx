import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import AppBar from '../ui/Navbar';
import Copyright from '../ui/Copyright';

import { LangConfigs } from '../lib/types';
import BackToHomeButtonGroup from '../ui/BackToHomeButtonGroup';

const lang = process.env.NEXT_PUBLIC_APP_LANG ?? 'tw';
const langConfigs: LangConfigs = {
    title: {
        tw: '您的权限不足',
        cn: '您的权限不足',
        en: 'Forbidden'
    },
    requireSignUpOrSignIn: {
        tw: '请注冊或登入后嘗試🙂',
        cn: '请注册或登入后重试🙂',
        en: 'Please sign up or sign in before trying again🙂'
    }
}

export default function Forbidden() {
    return (
        <>
            <AppBar />
            <Stack
                sx={{ backgroundColor: '#2DAAE0', height: '100vh' }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: '10rem' }}>
                    <Typography
                        sx={{
                            color: 'white',
                            fontSize: { xs: '4rem', sm: '6rem' },
                            fontWeight: 1000,
                            letterSpacing: '.2rem',
                            maxWidth: 460,
                            ml: { xs: 'none', sm: '2.8rem' }
                        }}>
                        {langConfigs.title[lang]}
                    </Typography>
                    <Typography sx={{
                        display: { xs: 'none', sm: 'block' },
                        color: 'white',
                        fontSize: '6rem',
                        fontWeight: 1000,
                        letterSpacing: '.2rem',
                    }}>
                        ..
                    </Typography>
                </Box>
                <Box sx={{ color: 'white', textAlign: 'center', mt: '3rem', padding: 4 }}>
                    <Typography variant='h6' sx={{ color: 'white', textAlign: 'center' }}>
                        {langConfigs.requireSignUpOrSignIn[lang]}
                    </Typography>
                </Box>
                <BackToHomeButtonGroup color={'white'} />
                <Copyright sx={{ mt: '10rem', mb: 4, color: 'white' }} />
            </Stack>
        </>
    )
}