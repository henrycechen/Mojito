import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import AppBar from '../ui/Navbar';
import Copyright from '../ui/Copyright';

import { LangConfigs } from '../lib/types';
import BackToHomeButtonGroup from '../ui/BackToHomeButtonGroup';

const domain = process.env.NEXT_PUBLIC_APP_DOMAIN;
const lang = process.env.NEXT_PUBLIC_APP_LANG ?? 'tw';
const langConfigs: LangConfigs = {
    msg: {
        tw: '很抱歉，你要找的頁面不見了...',
        cn: '很抱歉，你要找的页面不见了...',
        en: 'Sorry, we can not find the page you\'re looking for'
    },
    backToHome: {
        tw: '返回主頁',
        cn: '返回主页',
        en: 'Back to home'
    }
}

const PageNotFound = () => {
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
                <BackToHomeButtonGroup color={'white'} />
                <Copyright sx={{ mt: '8rem', mb: 4, color: 'white' }} />
            </Stack>
        </>
    )
}

export default PageNotFound;