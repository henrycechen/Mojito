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

import { signIn, getProviders, getSession, getCsrfToken, useSession } from 'next-auth/react'


import { useRouter } from 'next/router';
import Copyright from '../ui/Copyright';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';

export async function getServerSideProps() {
    return {
        props: { providers: await getProviders() }
    }
}
const lang = 'ch';
const langConfig = {
    signup: {
        ch: '注册',
        en: 'Sign up'
    },
    email: {
        ch: '邮箱',
        en: 'Email'
    },
    pwd: {
        ch: '密码',
        en: 'Password'
    },
    repeatPwd: {
        ch: '重复输入密码',
        en: 'Re-enter password'
    },
    appSignup: {
        ch: '没有Mojito账户？现在就注册吧',
        en: 'Don\' have a Mojito account? Sign up now'
    },
    thirdPartySignin: {
        ch: (partyName: string) => `使用${partyName}账户登录`,
        en: (partyName: string) => `Use ${partyName} Account to sign in`,
    },
    forgetPwd: {
        ch: '忘记密码了？',
        en: 'Forgot password?'
    },
    appSignin:
    {
        ch: '已经有Mojito账户了？现在就登录吧',
        en: 'Have a Mojito account? Sign in now'
    },
}

const SignUp = ({ providers }: any) => {
    /**
     * Handle session
     */
    const { data: session, status } = useSession();
    if (session) {
        const router = useRouter();
        router.push('/');
    }
    /**
     * Handle page actions
     */
    const handleLoginSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        console.log({
            email: data.get('email'),
            password: data.get('password'),
        });
    };

    return (
        <Container component='main' maxWidth='xs'>
            <Stack sx={{ mt: '5rem' }}>
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <Link href="/">
                        <Avatar src='./favicon.ico' sx={{ width: 56, height: 56 }} />
                    </Link>
                </Box>
                <Typography component="h1" variant="h5" sx={{ textAlign: 'center', mt: 2 }}>
                    {langConfig.appSignup[lang]}
                </Typography>
                <Stack component={'form'} spacing={2} sx={{ mt: 4 }} onSubmit={handleLoginSubmit}>
                    <TextField
                        margin="none"
                        required
                        fullWidth
                        id="email"
                        label={langConfig.email[lang]}
                        name="email"
                        autoComplete="email"
                        autoFocus
                    />
                    <TextField
                        margin="none"
                        required
                        fullWidth
                        name="password"
                        label={langConfig.repeatPwd[lang]}
                        type="password"
                        id="password"
                        autoComplete="current-password"
                    />
                    <TextField
                        margin="none"
                        required
                        fullWidth
                        name="password"
                        label={langConfig.pwd[lang]}
                        type="password"
                        id="password"
                        autoComplete="current-password"
                    />
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"

                    >
                        {langConfig.signup[lang]}
                    </Button>
                </Stack>
                <Divider sx={{ mt: 2, mb: 2 }} />
                <Stack spacing={1}>

                    {Object.keys(providers).map(p => {
                        return ('credentials' !== providers[p].id) && (
                            <Button
                                variant='contained'
                                fullWidth
                                color={'inherit'}
                                onClick={() => { signIn(providers[p].id) }}
                                key={providers[p].id}
                            >
                                使用{providers[p].name}账户登录
                            </Button>
                        )
                    })}
                </Stack>
                <Grid container sx={{ mt: 3 }} >
                    <Grid item flexGrow={1}>
                        <Link href="/api/auth/signin" variant="body2">
                            {langConfig.appSignin[lang]}
                        </Link>
                    </Grid>
                    <Grid item>
                        <Link href="#" variant="body2">
                            {langConfig.forgetPwd[lang]}
                        </Link>
                    </Grid>
                </Grid>
            </Stack>
            <Copyright sx={{ mt: 8, mb: 4 }} />
        </Container>
    )
}

export default SignUp;