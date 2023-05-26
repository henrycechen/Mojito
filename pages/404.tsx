import * as React from 'react';
import Head from 'next/head';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { LangConfigs } from '../lib/types';

import BackToHomeButtonGroup from '../ui/BackToHomeButtonGroup';
import Copyright from '../ui/Copyright';
import Guidelines from '../ui/Guidelines';
import LangSwitch from '../ui/LangSwitch';
import Navbar from '../ui/Navbar';
import Terms from '../ui/Terms';

const domain = process.env.NEXT_PUBLIC_APP_DOMAIN;
const desc = process.env.NEXT_PUBLIC_APP_DESCRIPTION ?? '';
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
};

/**
 * Last update:
 * - 25/05/2023 v0.1.2 New layout applied
 */
export default function FourHundredAndFour() {

    type TProcessStates = {
        lang: string;
    };

    const [processStates, setProcessStates] = React.useState<TProcessStates>({
        lang: lang
    });

    const setLang = () => {
        if ('tw' === processStates.lang) { setProcessStates({ ...processStates, lang: 'cn' }); }
        if ('cn' === processStates.lang) { setProcessStates({ ...processStates, lang: 'en' }); }
        if ('en' === processStates.lang) { setProcessStates({ ...processStates, lang: 'tw' }); }
    };

    return (
        <>
            <Head>
                <title>
                    {{ tw: '很抱歉，你要找的頁面不見了', cn: '很抱歉，你要找的页面不见了', en: 'Sorry, we can not find the page you\'re looking for' }[processStates.lang]}
                </title>
                <meta
                    name="description"
                    content={desc}
                    key="desc"
                />
            </Head>
            <Navbar lang={processStates.lang} />
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
                    {langConfigs.msg[processStates.lang]}
                </Typography>

                <BackToHomeButtonGroup color={'white'} lang={processStates.lang} />

                <Copyright sx={{ mt: '10rem', color: 'white' }} />
                <Guidelines sx={{ color: 'white' }} lang={processStates.lang} />
                <Terms sx={{ mb: 2, color: 'white' }} lang={processStates.lang} />
                <LangSwitch sx={{ mb: 8 }} setLang={setLang} />
            </Stack>
        </>
    );
};