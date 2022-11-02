import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import AppBar from '../ui/Navbar';
import Copyright from '../ui/Copyright';

import { LangConfigs } from '../lib/types';


export async function getStaticProps() {
    return {
        props: {
            msg: {
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

const lang = process.env['APP_LANG'] ?? 'ch';
const langConfigs: LangConfigs = {
    err: {
        ch: '出错啦',
        en: 'Oooopppps'
    },
    backToHome: {
        ch: '返回主页',
        en: 'Back to home'
    }
}

export default function About({ msg }: any) {
    return (
        <>
            <AppBar />
            <Stack
                sx={{
                    backgroundColor: '#2DAAE0',
                    height: '100vh'
                }}>
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
                        {langConfigs.err[lang]}
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

                    <Typography variant='h6' sx={{ color: 'white', textAlign: 'center' }}>
                        {msg[lang]}

                    </Typography>
                </Box>
                <Box sx={{ display: { xs: 'none', sm: 'flex' }, justifyContent: 'center', mt: 2 }}>

                    <Link href='/' sx={{ color: 'white' }}>{langConfigs.backToHome[lang]}</Link>
                </Box>
                <Box sx={{ display: { xs: 'flex', sm: 'none' }, justifyContent: 'center', mt: 2, padding: 1 }}>

                    <Button variant='contained' href='/' >{langConfigs.backToHome[lang]}</Button>
                </Box>
            </Stack>
        </>
    )
}