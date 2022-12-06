import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import AppBar from '../ui/Navbar';
import Copyright from '../ui/Copyright';

import { useRouter } from 'next/router';

import { LangConfigs } from '../lib/types';
import BackToHomeButtonGroup from '../ui/BackToHomeButtonGroup';

export async function getStaticProps() {
    return {
        props: {
            errorMessage: {
                ch: [
                    '我们的服务器遇到了一些技术难题😟',
                    '可能有些Bugs出现在了我们的服务器代码中🤯',
                    '我们的服务器遭遇了某些不可抗力🥲',
                    '我们的服务器刚刚开小差了😴',
                    '我们的服务器正在和它的朋友们喝Mojito😳'
                ][Math.floor(Math.random() * 5)],
                en: 'Something went wrong in our server.'
            }
        },
    }
}

const lang = process.env.NEXT_PUBLIC_APP_LANG ?? 'ch';
const langConfigs: LangConfigs = {
    title: {
        ch: '出错啦',
        en: 'Opps'
    },
    backToHome: {
        ch: '返回主页',
        en: 'Back to home'
    },

    error: {
        AccessDenied: {
            ch: '您的账户需要验证或已被注销',
            en: 'Your account needs verification or has been canceled'
        },
        PermissionDenied: {
            ch: '',
            en: ''
        },
        EmailAddressUnverified: {
            ch: '',
            en: ''
        },
        MemberSuspendedOrDeactivated: {
            ch: '',
            en: ''
        },
        MemberDeactivated: {
            ch: '',
            en: ''
        }
    }
}


export default function About({ errorMessage }: any) {
    const router = useRouter();
    return (
        <>
            <AppBar />
            <Stack
                sx={{ backgroundColor: '#2DAAE0', height: '100vh' }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: '10rem' }}>
                    <Typography
                        sx={{
                            color: 'white',
                            fontSize: { xs: '5rem', sm: '7rem' },
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
                        fontSize: '7rem',
                        fontWeight: 1000,
                        letterSpacing: '.2rem',
                    }}>
                        ..
                    </Typography>
                </Box>
                <Box sx={{ color: 'white', textAlign: 'center', mt: '3rem', padding: 4 }}>
                    {!!router.query.error && Object.keys(langConfigs.error).includes('string' === typeof router.query.error ? router.query.error : '') &&
                        <Typography variant='h6' sx={{ color: 'white', textAlign: 'center' }}>
                            {langConfigs.error['string' === typeof router.query.error ? router.query.error : ''][lang]}
                        </Typography>
                    }
                    {!router.query.error &&
                        <Typography variant='h6' sx={{ color: 'white', textAlign: 'center' }}>
                            {errorMessage[lang]}
                        </Typography>
                    }
                </Box>
                <BackToHomeButtonGroup color={'white'} />
                <Copyright sx={{ mt: '10rem', mb: 4, color: 'white' }} />
            </Stack>
        </>
    )
}