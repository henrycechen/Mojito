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
import About from '../ui/About';

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
    errors: {
        RecaptchaNotVerifiedError: {
            ch: ['请告诉我们您不是机器人😎', ''],
            en: ['Please tell us if you are not a robot😎', '']
        },
        CredentialsSignin: {
            ch: ['邮件地址与密码不匹配，请再尝试一下', ''],
            en: ['Member and password do not match', ', please try again', '']
        },
        EmailAddressUnverified: {
            ch: ['您需要对您的账户完成邮箱验证', '，如有问题请联系我们的管理员'],
            en: ['You will need to complete email address verification before signin', ', please try again later or contact our Webmaster']
        },
        InappropriateEmailAddress: {
            ch: ['第三方平台提供的账户信息不能满足我们的要求，请尝试其他的账户或登录方式', '，如有问题请联系我们的管理员'],
            en: ['The information supplied by the third-party signin provider do not meet our requirements, please try signing in with another account or method', ', please try again later or contact our Webmaster']
        },
        MemberSuspendedOrDeactivated: {
            ch: ['您的账户已停用或已被注销', '，如有问题请联系我们的管理员'],
            en: ['Your membership has been suspended or deactivated', ', please try again later or contact our Webmaster']
        },
        UnrecognizedProvider: {
            ch: ['您刚刚尝试使用我们不支持的第三方账户登录', '请尝试使用Mojito账户或我们支持的登录方式，如有问题请联系我们的管理员'],
            en: ['The third-party signin provider you tried signin with is not supported by us', ', please try signing in with Mojito account or other methods we supported or contact our Webmaster']
        },
        ThirdPartyProviderSignin: {
            ch: ['第三方账户登录遇到了一些问题', '请稍后重试或者联系我们的管理员'],
            en: ['Third-party Account sign in unsuccessful', ', please try again later or contact our Webmaster']
        },
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
        credentialSigninAlertContent: '',
        displayCredentialSigninAlert: false,
        thirdPartyProviderSigninAlerContent: '',
        displayThirdPartyProviderSignAlert: false,
        displayCircularProgress: false
    })
    // Handle error hint
    React.useEffect(() => {
        const { error, provider } = router.query;
        if ('string' === typeof error) {
            if ('CredentialsSignin' === error) {
                setProcessStates({ ...processStates, credentialSigninAlertContent: langConfigs.errors.CredentialsSignin[lang], displayCredentialSigninAlert: true, displayThirdPartyProviderSignAlert: false });
                return;
            }
            if ('InappropriateEmailAddress' === error) {
                setProcessStates({ ...processStates, credentialSigninAlertContent: langConfigs.errors.CredentialsSignin[lang], displayCredentialSigninAlert: true, displayThirdPartyProviderSignAlert: false });
                return;
            }
            if ('EmailAddressUnverified' === error) {
                if ('string' === typeof provider && 'mojito' !== provider) {
                    setProcessStates({ ...processStates, thirdPartyProviderSigninAlerContent: langConfigs.errors.EmailAddressUnverified[lang], displayCredentialSigninAlert: false, displayThirdPartyProviderSignAlert: true });
                    return;
                }
                setProcessStates({ ...processStates, credentialSigninAlertContent: langConfigs.errors.EmailAddressUnverified[lang], displayCredentialSigninAlert: true, displayThirdPartyProviderSignAlert: false });
                return;
            }
            if ('MemberSuspendedOrDeactivated' === error) {
                if ('string' === typeof provider && 'mojito' !== provider) {
                    setProcessStates({ ...processStates, thirdPartyProviderSigninAlerContent: langConfigs.errors.MemberSuspendedOrDeactivated[lang], displayCredentialSigninAlert: false, displayThirdPartyProviderSignAlert: true });
                    return;
                }
                setProcessStates({ ...processStates, credentialSigninAlertContent: langConfigs.errors.MemberSuspendedOrDeactivated[lang], displayCredentialSigninAlert: true, displayThirdPartyProviderSignAlert: false });
                return;
            }
        }
    }, [router]);
    // Handle signin form submit on recaptcha response update
    React.useEffect(() => { postRequest() }, [processStates.recaptchaResponse]);
    const postRequest = async () => {
        if ('' === processStates.recaptchaResponse) {
            // ReCAPTCHA challenge not ready
            return;
        }
        if ('' !== signInCredentialStates.emailAddress && '' !== signInCredentialStates.password) {
            setProcessStates({ ...processStates, displayCredentialSigninAlert: false, displayThirdPartyProviderSignAlert: false });
            signIn('mojito', {
                recaptchaResponse: processStates.recaptchaResponse,
                emailAddress: signInCredentialStates.emailAddress,
                password: signInCredentialStates.password,
                redirectUrl: router.query?.redirectUrl
            })
        }
    }

    // Decalre signIn credential states
    const [signInCredentialStates, setSignInCredentialStates] = React.useState({
        // emailAddress: '',
        emailAddress: 'henryme8@gmail.com', //////// test
        // password: '',
        password: '123@abcD', //////// test
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
            setProcessStates({ ...processStates, recaptchaResponse: value, displayCredentialSigninAlert: false, displayThirdPartyProviderSignAlert: false });
        } else {
            setProcessStates({ ...processStates });
        }
    }
    const handleRecaptchaLoseFocus = () => {
        setProcessStates({
            ...processStates,
            credentialSigninAlertContent: langConfigs.errors.RecaptchaNotVerifiedError[lang],
            displayCredentialSigninAlert: true,
            displayCircularProgress: false
        })
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
                        {/* credentials signin & other error alert */}
                        <Box sx={{ display: processStates.displayCredentialSigninAlert ? 'block' : 'none' }}>
                            <Alert severity='error' >
                                <strong>{processStates.credentialSigninAlertContent[0]}</strong>{processStates.credentialSigninAlertContent[1]}
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
                        {/* third party provider signin error alert */}
                        <Box sx={{ display: processStates.displayThirdPartyProviderSignAlert ? 'block' : 'none' }}>
                            <Alert severity='error' >
                                <strong>{processStates.thirdPartyProviderSigninAlerContent[0]}</strong>{processStates.thirdPartyProviderSigninAlerContent[1]}
                            </Alert>
                        </Box>
                        {providers && Object.keys(providers).map(p => {
                            return ('credentials' !== providers[p].type) && (
                                <Button
                                    variant='contained'
                                    fullWidth
                                    color={'secondary'}
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
                <Copyright sx={{ mt: 8 }} />
                <About sx={{ mb: 8 }} />
            </Container>
            <ReCAPTCHA
                hl={langConfigs.recaptchaLang[lang]}
                size={'invisible'}
                ref={(ref: any) => ref && (recaptcha = ref)}
                sitekey={recaptchaClientKey}
                onChange={handleRecaptchaChange}
                onFocusCapture={handleRecaptchaLoseFocus}
            />
        </>
    )
}

export default SignIn;