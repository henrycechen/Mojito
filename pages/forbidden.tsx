import * as React from 'react';
import Head from 'next/head';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { LangConfigs } from '../lib/types';

import Navbar from '../ui/Navbar';
import Copyright from '../ui/Copyright';
import BackToHomeButtonGroup from '../ui/BackToHomeButtonGroup';
import Guidelines from '../ui/Guidelines';
import LangSwitch from '../ui/LangSwitch';
import Terms from '../ui/Terms';

const desc = process.env.NEXT_PUBLIC_APP_DESCRIPTION ?? '';
const lang = process.env.NEXT_PUBLIC_APP_LANG ?? 'tw';
const langConfigs: LangConfigs = {
    title: {
        tw: '权限不足',
        cn: '权限不足',
        en: 'Forbidden'
    },
    requireSignUpOrSignIn: {
        tw: '请注冊或登入后嘗試🙂',
        cn: '请注册或登入后重试🙂',
        en: 'Please sign up or sign in before trying again🙂'
    }
};

/**
 * Last update:
 * - 25/05/2023 v0.1.2 New layout applied
 */
export default function Forbidden() {

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
                    {{ tw: '权限不足', cn: '权限不足', en: 'Forbidden' }[processStates.lang]}
                </title>
                <meta
                    name="description"
                    content={desc}
                    key="desc"
                />
            </Head>
            <Navbar lang={processStates.lang} />
            <Stack
                sx={{ backgroundColor: '#2DAAE0', height: '100vh' }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: '10rem' }}>
                    <Typography
                        sx={{
                            color: 'white',
                            fontSize: { xs: '5rem', sm: '7rem' },
                            fontWeight: 1000,
                            letterSpacing: '.2rem',
                            maxWidth: 600,
                            textAlign: 'center'
                        }}>
                        {langConfigs.title[processStates.lang]}
                    </Typography>
                </Box>
                <Box sx={{ color: 'white', textAlign: 'center', mt: '3rem', padding: 4 }}>
                    <Typography variant='h6' sx={{ color: 'white', textAlign: 'center' }}>
                        {langConfigs.requireSignUpOrSignIn[processStates.lang]}
                    </Typography>
                </Box>

                <BackToHomeButtonGroup color={'white'} lang={processStates.lang} />

                <Copyright sx={{ mt: '10rem', color: 'white' }} />
                <Guidelines sx={{ color: 'white' }} lang={processStates.lang} />
                <Terms sx={{ mb: 2, color: 'white' }} lang={processStates.lang} />
                <LangSwitch sx={{ mb: 8 }} setLang={setLang} />
            </Stack>
        </>
    );
}