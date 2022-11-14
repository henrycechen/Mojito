import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { signIn, getProviders, getSession, getCsrfToken, useSession } from 'next-auth/react'

import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import InputAdornment from '@mui/material/InputAdornment';
import OutlinedInput from '@mui/material/OutlinedInput';
import FormControl from '@mui/material/FormControl';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';

import Copyright from '../ui/Copyright';

import ReCAPTCHA from "react-google-recaptcha";

import { useRouter } from 'next/router';
import { NextPageContext } from 'next/types';
import { LangConfigs, SignInCredentialStates } from '../lib/types';

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

const recaptchaClientKey = process.env.NEXT_PUBLIC_INVISIABLE_RECAPTCHA_SITE_KEY ?? '';
const lang = process.env.NEXT_PUBLIC_APP_LANG ?? 'ch';
const langConfigs: LangConfigs = {
    signIn: {
        ch: '登入',
        en: 'Sign in'
    },
    emailAddress: {
        ch: '邮件地址',
        en: 'Email'
    },
    password: {
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
    recaptchaLang: {
        ch: 'zh-CN',
        en: 'en'
    },
    recaptchaNotVerifiedError: {
        ch: '请告诉我们您不是机器人😎',
        en: 'Please tell us if you are not a robot😎'
    },
    recaptchaError: {
        ch: '我们的人机验证系统出了些问题🤯...请尝试刷新或联系我们的管理员',
        en: 'Something went wrong with our CAPTCHA🤯...Please try to refresh or contact our Webmaster'
    },
    credentialSigninError: {
        ch: ['邮件地址与密码不匹配', '请再尝试一下'],
        en: ['Member and password do not match', 'please try again']
    },
    thirdPartySigninError: {
        ch: ['第三方账户登录遇到了一些问题', '请稍后重试或者联系我们的管理员'],
        en: ['Third-party Account sign in unsuccessful', 'please try again later or contact our Webmaster']
    }
}

const SignIn = ({ providers, csrfToken }: SigninPageProps) => {
    // Handle session
    const { data: session } = useSession();
    const router = useRouter();
    if (session) {
        router.push('/');
    }
    let recaptcha: any;

    // Decalre process states
    const [processStates, setProcessStates] = React.useState({
        recaptchaResponse: '',
        errorContent: '',
        displayError: false,
        displayCircularProgress: false
    })

    // Handle process states change
    React.useEffect(() => { postRequest() }, [processStates.recaptchaResponse]);
    const postRequest = async () => {
        if ('' === processStates.recaptchaResponse) {
            // ReCAPTCHA challenge not ready
            return;
        }
        if ('' !== signInCredentialStates.emailAddress && '' !== signInCredentialStates.password) {
            signIn('mojito', {
                recaptchaResponse: processStates.recaptchaResponse,
                emailAddress: signInCredentialStates.emailAddress,
                password: signInCredentialStates.password,
                redirectUrl: router.query?.redirectUrl
            })
            setProcessStates({ ...processStates, displayCircularProgress: false });
        }
    }

    // Decalre signIn credential states
    const [signInCredentialStates, setSignInCredentialStates] = React.useState({
        emailAddress: 'henrycechen@gmail.com',
        password: '123@abcD',
        showpassword: false
    })

    // Handle signIn credential states change
    const handleChange = (prop: keyof SignInCredentialStates) => (event: React.ChangeEvent<HTMLInputElement>) => {
        setSignInCredentialStates({ ...signInCredentialStates, [prop]: event.target.value });
    };
    const handleShowPassword = () => {
        setSignInCredentialStates({ ...signInCredentialStates, showpassword: !signInCredentialStates.showpassword })
    }
    const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
    };

    // Handle signIn form submit
    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setProcessStates({ ...processStates, displayCircularProgress: true });
        recaptcha?.execute();
    };

    // Handle ReCAPTCHA challenge
    const handleRecaptchaChange = (value: any) => {
        if (!!value) {
            setProcessStates({ ...processStates, recaptchaResponse: value })
        } else {
            setProcessStates({ ...processStates })
        }
    }

    return (
        <>
            <Container component='main' maxWidth='xs'>
                <Stack sx={{ mt: '5rem' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <Link href="/">
                            <Avatar src='./favicon.ico' sx={{ width: 56, height: 56 }} />
                        </Link>
                    </Box>
                    <Typography component="h1" variant="h5" sx={{ textAlign: 'center', mt: 2 }}>
                        {langConfigs.appSignin[lang]}
                    </Typography>
                    <Stack component={'form'} spacing={2} sx={{ mt: 4 }} onSubmit={handleSubmit}>
                        <input name='csrfToken' type={'hidden'} defaultValue={csrfToken ?? ''} />
                        <Box sx={{ display: 'CredentialsSignin' === router.query.error ? 'block' : 'none' }}>
                            <Alert severity='error' >
                                <strong>{langConfigs.credentialSigninError[lang][0]}</strong>, {langConfigs.credentialSigninError[lang][1]}
                            </Alert>
                        </Box>
                        <TextField
                            required
                            id='emailAddress'
                            label={langConfigs.emailAddress[lang]}
                            value={signInCredentialStates.emailAddress}
                            onChange={handleChange('emailAddress')}
                            autoComplete='email'
                        />
                        <FormControl variant='outlined' required>
                            <InputLabel htmlFor='outlined-adornment-password'>{langConfigs.password[lang]}</InputLabel>
                            <OutlinedInput
                                id={'outlined-adornment-password'}
                                label={langConfigs.password[lang]}
                                type={signInCredentialStates.showpassword ? 'text' : 'password'}
                                value={signInCredentialStates.password}
                                onChange={handleChange('password')}
                                endAdornment={
                                    <InputAdornment position="end">
                                        <IconButton
                                            aria-label="toggle password visibility"
                                            onClick={handleShowPassword}
                                            onMouseDown={handleMouseDownPassword}
                                            edge="end"
                                        >
                                            {signInCredentialStates.showpassword ? <VisibilityIcon /> : <VisibilityOffIcon />}
                                        </IconButton>
                                    </InputAdornment>
                                }
                            />
                        </FormControl>
                        <Box>
                            <Button type='submit' fullWidth variant='contained'>
                                <Typography sx={{ display: !processStates.displayCircularProgress ? 'block' : 'none' }}>
                                    {langConfigs.signIn[lang]}
                                </Typography>
                                <CircularProgress sx={{ color: 'white', display: processStates.displayCircularProgress ? 'block' : 'none' }} />
                            </Button>
                        </Box>
                    </Stack>
                    <Divider sx={{ mt: 2, mb: 2 }} />
                    <Stack spacing={1}>
                        <Box sx={{ display: !!router.query.error && 'CredentialsSignin' !== router.query.error ? 'block' : 'none' }}>
                            <Alert severity='error' >
                                <strong>{langConfigs.thirdPartySigninError[lang][0]}</strong>, {langConfigs.thirdPartySigninError[lang][1]}
                            </Alert>
                        </Box>
                        {providers && Object.keys(providers).map(p => {
                            return ('credentials' !== providers[p].type) && (
                                <Button
                                    variant='contained'
                                    fullWidth
                                    color={'inherit'}
                                    onClick={() => { signIn(providers[p].id) }}
                                    key={providers[p].id}
                                >
                                    {langConfigs.thirdPartySignin[lang](providers[p].name)}
                                </Button>
                            )
                        })}
                    </Stack>
                    <Grid container sx={{ mt: 3 }} >
                        <Grid item xs>
                            <Link href="/forgot" variant="body2">
                                {langConfigs.forgetPwd[lang]}
                            </Link>
                        </Grid>
                        <Grid item>
                            <Link href="/signup" variant="body2">
                                {langConfigs.appSignup[lang]}
                            </Link>
                        </Grid>
                    </Grid>
                </Stack>
                <Copyright sx={{ mt: 8, mb: 4 }} />
            </Container>
            <ReCAPTCHA
                hl={langConfigs.recaptchaLang[lang]}
                size={'invisible'}
                ref={(ref: any) => ref && (recaptcha = ref)}
                sitekey={recaptchaClientKey}
                onChange={handleRecaptchaChange}
            />
        </>
    )
}

export default SignIn;