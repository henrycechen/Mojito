import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
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

import Alert from '@mui/material/Alert';
import { NextPageContext } from 'next/types';
import { LangConfigs } from '../lib/types';

type SigninPageProps = {
    providers: Awaited<ReturnType<typeof getProviders>> | null;
    csrfToken: Awaited<ReturnType<typeof getCsrfToken>> | null;
}

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
const lang = process.env['APP_LANG'] ?? 'ch';
const langConfig: LangConfigs = {
    signin: {
        ch: '登入',
        en: 'Sign in'
    },
    email: {
        ch: '邮件地址',
        en: 'Email'
    },
    pwd: {
        ch: '密码',
        en: 'Password'
    },
    appSignin:
    {
        ch: '使用 Mojito 账户登录',
        en: 'Use Mojito Account to sign in'
    },
    thirdPartySignin: {
        ch: (partyName: string) => `使用 ${partyName} 账户登录`,
        en: (partyName: string) => `Use ${partyName} Account to sign in`,
    },
    forgetPwd: {
        ch: '忘记密码了？',
        en: 'Forgot password?'
    },
    appSignup: {
        ch: '没有Mojito账户？现在就注册吧',
        en: 'Don\' have a Mojito account? Sign up now'
    },
    credentialSigninError: {
        ch: ['邮件地址与密码不匹配', '请再尝试一下'],
        en: ['Member and password do not match', 'please try again']
    },
    thirdPartySigninError: {
        ch: ['第三方账户登录遇到了一些问题', '请再尝试一下'],
        en: ['Third-party Account sign in unsuccessful', 'please try again']
    }
}

const SignIn = ({ providers, csrfToken }: SigninPageProps) => {
    /**
     * Handle session
     */
    const { data: session, status } = useSession();
    const router = useRouter();
    if (session) {
        router.push('/');
    }
    
    return (
        <Container component='main' maxWidth='xs'>
            <Stack sx={{ mt: '5rem' }}>
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <Link href="/">
                        <Avatar src='./favicon.ico' sx={{ width: 56, height: 56 }} />
                    </Link>
                </Box>
                <Typography component="h1" variant="h5" sx={{ textAlign: 'center', mt: 2 }}>
                    {langConfig.appSignin[lang]}
                </Typography>
                <Stack component={'form'} spacing={2} sx={{ mt: 4 }} method={'POST'} action="/api/auth/callback/credentials">
                    <input name='csrfToken' type={'hidden'} defaultValue={csrfToken ?? ''} />
                    <Box sx={{ display: 'CredentialsSignin' === router.query.error ? 'block' : 'none' }}>
                        <Alert severity='error' >
                            <strong>{langConfig.credentialSigninError[lang][0]}</strong>, {langConfig.credentialSigninError[lang][1]}
                        </Alert>
                    </Box>
                    <TextField
                        margin="none"
                        required
                        fullWidth
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
                        label={langConfig.pwd[lang]}
                        type="password"
                        autoComplete="current-password"
                        //FIXME: only for testing here
                        value={'123...'}
                    />
                    <Button type='submit' fullWidth variant='contained'>
                        {langConfig.signin[lang]}
                    </Button>
                </Stack>
                <Divider sx={{ mt: 2, mb: 2 }} />
                <Stack spacing={1}>
                    <Box sx={{ display: !!router.query.error && 'CredentialsSignin' !== router.query.error ? 'block' : 'none' }}>
                        <Alert severity='error' >
                            <strong>{langConfig.thirdPartySigninError[lang][0]}</strong>, {langConfig.thirdPartySigninError[lang][1]}
                        </Alert>
                    </Box>
                    {providers && Object.keys(providers).map(p => {
                        return ('credentials' !== providers[p].id) && (
                            <Button
                                variant='contained'
                                fullWidth
                                color={'inherit'}
                                onClick={() => { signIn(providers[p].id) }}
                                key={providers[p].id}
                            >
                                {langConfig.thirdPartySignin[lang](providers[p].name)}
                            </Button>
                        )
                    })}
                </Stack>
                <Grid container sx={{ mt: 3 }} >
                    <Grid item xs>
                        <Link href="#" variant="body2">
                            {langConfig.forgetPwd[lang]}
                        </Link>
                    </Grid>
                    <Grid item>
                        <Link href="/signup" variant="body2">
                            {langConfig.appSignup[lang]}
                        </Link>
                    </Grid>
                </Grid>
            </Stack>
            <Copyright sx={{ mt: 8, mb: 4 }} />
        </Container>
    )
}

export default SignIn;