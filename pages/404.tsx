import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import AppBar from '../ui/Navbar';
import Copyright from '../ui/Copyright';

import { LangConfigs } from '../lib/types';

/**
 * Domain and language settings
 */
const domain = process.env.NEXT_PUBLIC_APP_DOMAIN;
const lang = process.env.NEXT_PUBLIC_APP_LANG ?? 'ch';
const langConfigs: LangConfigs = {
    msg: {
        ch: '很抱歉，你要找的页面不见了...',
        en: 'Sorry, we can not find the page you\'re looking for'
    },
    backToHome: {
        ch: '返回主页',
        en: 'Back to home'
    }
}

export default () => {
    return (
        <>
            <AppBar />
            <Stack sx={{ backgroundColor: '#2DAAE0', height: '100vh' }}>
                <Box
                    sx={{
                        mt: '4rem',
                        height: 398,
                        backgroundSize: { xs: '100%', sm: '700px 398px' },
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        backgroundImage: `url(${domain}/404.png)`
                    }}>
                </Box>
                <Typography variant='h6' color={'white'} textAlign={'center'}>
                    {langConfigs.msg[lang]}
                </Typography>
                <Box sx={{ display: { xs: 'none', sm: 'flex' }, justifyContent: 'center', mt: 2 }}>
                    <Link href='/' sx={{ color: 'white' }}>{langConfigs.backToHome[lang]}</Link>
                </Box>
                <Box sx={{ display: { xs: 'flex', sm: 'none' }, justifyContent: 'center', mt: 2, padding: 1 }}>
                    <Button variant='contained' href='/' >{langConfigs.backToHome[lang]}</Button>
                </Box>
                <Copyright sx={{ mt: '8rem', mb: 4, color: 'white' }} />
            </Stack>
        </>
    )
}