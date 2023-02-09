import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Link from '@mui/material/Link';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';

import { signIn, signOut, getProviders, getSession, getCsrfToken, useSession } from 'next-auth/react'
import { LangConfigs, TSignInCredentialStates } from '../lib/types';


import { useRouter } from 'next/router';
import Copyright from '../ui/Copyright';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';

import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';

import { NextPageContext } from 'next/types';

export async function getServerSideProps(context: NextPageContext) {
    return {
        props: {
            providers: await getProviders(),
            csrfToken: await getCsrfToken(context),
        }
    }
}
/**
 * Language settings
 */
const lang = process.env.NEXT_PUBLIC_APP_LANG ?? 'tw';
const langConfig: LangConfigs = {
    appSignout: {
        tw: '确认要登出吗？',
        cn: '确认要登出吗？',
        en: 'Confirm to sign out?'
    },
    confirm: {
        tw: '登出',
        cn: '登出',
        en: 'Sign out'
    }

}

const SignOut = () => {
    /**
     * Handle session
     */
    const { data: session, status } = useSession();
    const router = useRouter();
    // React.useEffect(() => { if (!session) router.push('/') }, []);
    console.log(session?.user);


    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        signOut();
    }

    return (
        <Container component='main' maxWidth='xs'>
            <Stack sx={{ mt: '10rem' }}>
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    {/* FIXME: replace with user avatar url */}
                    <Avatar src='./favicon.ico' sx={{ width: 56, height: 56 }} />
                </Box>
                <Typography variant="h5" sx={{ textAlign: 'center', mt: 2 }}>
                    {langConfig.appSignout[lang]}
                </Typography>
                <Stack component={'form'} spacing={2} sx={{ mt: 4 }} onSubmit={handleSubmit}>
                    <Button type='submit' fullWidth variant='contained'>
                        {langConfig.confirm[lang]}
                    </Button>
                </Stack>
            </Stack>
            <Copyright sx={{ mt: 16, mb: 4 }} />
        </Container>
    )
}

export default SignOut;