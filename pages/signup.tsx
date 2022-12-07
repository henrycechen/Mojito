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

import { signIn, getProviders, useSession } from 'next-auth/react'

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
import BackToHomeButtonGroup from '../ui/BackToHomeButtonGroup';

import ReCAPTCHA from "react-google-recaptcha";

import { useRouter } from 'next/router';
import { LangConfigs, SignInCredentialStates } from '../lib/types';
import { verifyEmailAddress, verifyPassword } from '../lib/utils';
import Consent from '../ui/Consent';

export async function getServerSideProps() {
    return {
        props: { providers: await getProviders() }
    }
}

const recaptchaClientKey = process.env.NEXT_PUBLIC_INVISIABLE_RECAPTCHA_SITE_KEY ?? '';
const lang = process.env.NEXT_PUBLIC_APP_LANG ?? 'ch';
const langConfigs: LangConfigs = {
    signUp: {
        ch: '注册',
        en: 'Sign up'
    },
    emailAddress: {
        ch: '邮件地址',
        en: 'Email address'
    },
    password: {
        ch: '密码',
        en: 'Password'
    },
    repeatPassword: {
        ch: '重复输入密码',
        en: 'Re-enter password'
    },
    appSignup: {
        ch: '没有Mojito账户？现在就注册吧',
        en: 'Don\' have a Mojito account? Sign up now'
    },
    thirdPartySignUp: {
        ch: (partyName: string) => `使用 ${partyName} 账户注册`,
        en: (partyName: string) => `Use ${partyName} Account to sign up`,
    },
    forgotPassword: {
        ch: '忘记密码了？',
        en: 'Forgot password?'
    },
    appSignin:
    {
        ch: '已经有Mojito账户了？现在就登录吧',
        en: 'Have a Mojito account? Sign in now'
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
    emailAddressNotSatisfiedError: {
        ch: '邮件地址不符合格式',
        en: 'Email address does not match the format'

    },
    passwordNotSatisfiedError: {
        ch: '密码不符合安全性要求',
        en: 'Passwords do not satisfy the security requirements'
    },
    passwordNotMatchError: {
        ch: '两次输入的密码不相符',
        en: 'Passwords not match'
    },
    loginCredentialsExistError: {
        ch: '邮件地址已被用于注册',
        en: 'Email address has already been used for registration'
    },
    goodResult: {
        ch: '账户注册成功😄一封验证邮件已发送到注册时使用的邮箱😉验证邮箱后就可以登录啦~',
        en: 'Well done😄 A verification email has been sent to the address for registration😉 After verifying your email address you will have full access'
    },
    badResult: {
        ch: '账户注册失败😥请稍后重试或者联系我们的管理员',
        en: 'Failed to register😥 Please try again later or contact our Webmaster'
    }
}

const SignUp = ({ providers }: any) => {
    // Handle session
    const { data: session } = useSession();
    const router = useRouter();
    React.useEffect(() => {
        if (session) router.push('/');
        const { info } = router.query;
        if ('string' === typeof info && 'ThirdPartySignupSuccess' === info) {
            setProcessStates({ ...processStates, componentOnDisplay: 'signuprequestresult', displayCircularProgress: false, resultContent: langConfigs.goodResult[lang] });
        }
    }, []);

    let recaptcha: any;

    // Declare process states
    const [processStates, setProcessStates] = React.useState({
        /**
         * component list:
         * - signuprequestform
         * - signuprequestresult
         */
        componentOnDisplay: 'signuprequestform',
        recaptchaResponse: '',
        errorContent: '',
        displayError: false,
        displayCircularProgress: false,
        resultContent: '',
    });

    // Handle process states change
    React.useEffect(() => { postRequest() }, [processStates.recaptchaResponse]);
    const postRequest = async () => {
        if ('' === processStates.recaptchaResponse) {
            // ReCAPTCHA challenge not ready
            return;
        }
        if ('' !== signInCredentialStates.emailAddress && '' !== signInCredentialStates.password) {
            const resp = await fetch(`/api/member/behaviour/signup?recaptchaResponse=${processStates.recaptchaResponse}`, {
                method: 'POST',
                body: JSON.stringify({
                    emailAddress: signInCredentialStates.emailAddress,
                    password: signInCredentialStates.password
                })
            });
            if (200 === resp.status) {
                setProcessStates({ ...processStates, componentOnDisplay: 'signuprequestresult', displayCircularProgress: false, resultContent: langConfigs.goodResult[lang] });
            } else if (400 === resp.status) {
                // reest ReCAPTCHA
                recaptcha?.reset();
                setProcessStates({
                    ...processStates,
                    errorContent: langConfigs.loginCredentialsExistError[lang],
                    displayError: true,
                    displayCircularProgress: false
                })
            } else {
                setProcessStates({ ...processStates, componentOnDisplay: 'signuprequestresult', displayCircularProgress: false, resultContent: langConfigs.badResult[lang] })
            }
        }
    }

    // Decalre signIn credential states
    const [signInCredentialStates, setSignInCredentialStates] = React.useState({
        emailAddress: '',
        password: '',
        repeatpassword: '',
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

    // Handle signUp form submit
    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (verifyEmailAddress(signInCredentialStates.emailAddress)) {
            setProcessStates({ ...processStates, displayError: false })
        } else {
            setProcessStates({ ...processStates, errorContent: langConfigs.emailAddressNotSatisfiedError[lang], displayError: true })
            return;
        }
        if (signInCredentialStates.password !== signInCredentialStates.repeatpassword) {
            setProcessStates({ ...processStates, errorContent: langConfigs.passwordNotMatchError[lang], displayError: true })
            return;
        } else {
            setProcessStates({ ...processStates, displayError: false })
        }
        if (!verifyPassword(signInCredentialStates.password)) {
            setProcessStates({ ...processStates, errorContent: langConfigs.passwordNotSatisfiedError[lang], displayError: true })
            return;
        } else {
            setProcessStates({ ...processStates, displayError: false })
        }
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
                {/* signuprequestresult */}
                <Box sx={{ mt: '18rem', mb: '10rem', display: 'signuprequestresult' === processStates.componentOnDisplay ? 'block' : 'none' }}>
                    <Typography textAlign={'center'}>{processStates.resultContent}</Typography>
                    <BackToHomeButtonGroup />
                </Box>
                {/* signuprequestform */}
                <Stack sx={{ mt: '5rem', display: 'signuprequestform' === processStates.componentOnDisplay ? 'block' : 'none' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <Link href="/">
                            <Avatar src='./favicon.ico' sx={{ width: 56, height: 56 }} />
                        </Link>
                    </Box>
                    <Typography component="h1" variant="h5" sx={{ textAlign: 'center', mt: 2 }}>
                        {langConfigs.appSignup[lang]}
                    </Typography>
                    <Stack component={'form'} spacing={2} sx={{ mt: 4 }} onSubmit={handleSubmit}>
                        {/* Alert */}
                        <Box sx={{ display: processStates.displayError ? 'block' : 'none' }}>
                            <Alert severity='error' >
                                <strong>{processStates.errorContent}</strong>
                            </Alert>
                        </Box>
                        <TextField
                            required
                            id='emailAddress'
                            label={langConfigs.emailAddress[lang]}
                            onChange={handleChange('emailAddress')}
                            autoComplete='email'
                        />
                        <FormControl variant='outlined'>
                            <InputLabel htmlFor='outlined-adornment-password'>{langConfigs.password[lang]}</InputLabel>
                            <OutlinedInput
                                required
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
                        <FormControl variant='outlined'>
                            <InputLabel htmlFor='outlined-adornment-repeat-password'>{langConfigs.repeatPassword[lang]}</InputLabel>
                            <OutlinedInput
                                required
                                id={'outlined-adornment-repeat-password'}
                                label={langConfigs.repeatPassword[lang]}
                                type={signInCredentialStates.showpassword ? 'text' : 'password'}
                                value={signInCredentialStates.repeatpassword}
                                onChange={handleChange('repeatpassword')}
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
                                    {langConfigs.signUp[lang]}
                                </Typography>
                                <CircularProgress sx={{ color: 'white', display: processStates.displayCircularProgress ? 'block' : 'none' }} />
                            </Button>
                        </Box>
                        <Consent />
                    </Stack>
                    <Divider sx={{ mt: 2, mb: 2 }} />
                    <Stack spacing={1}>
                        {Object.keys(providers).map(p => {
                            return ('credentials' !== providers[p].type) && (
                                <Button
                                    variant='contained'
                                    fullWidth
                                    color={'inherit'}
                                    onClick={() => { signIn(providers[p].id) }}
                                    key={providers[p].id}
                                >
                                    {langConfigs.thirdPartySignUp[lang](providers[p].name)}
                                </Button>
                            )
                        })}
                    </Stack>
                    <Grid container sx={{ mt: 3 }} >
                        <Grid item flexGrow={1}>
                            <Link href="/api/auth/signin" variant="body2">
                                {langConfigs.appSignin[lang]}
                            </Link>
                        </Grid>
                        <Grid item>
                            <Link href="/forgot" variant="body2">
                                {langConfigs.forgotPassword[lang]}
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

export default SignUp;