import * as React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { signIn, getProviders, useSession } from 'next-auth/react';
import useTheme from '@mui/material/styles/useTheme';

import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import DarkModeIcon from '@mui/icons-material/DarkMode';
import WbSunnyIcon from '@mui/icons-material/WbSunny';

import InputLabel from '@mui/material/InputLabel';
import InputAdornment from '@mui/material/InputAdornment';
import OutlinedInput from '@mui/material/OutlinedInput';
import FormControl from '@mui/material/FormControl';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import TextField from '@mui/material/TextField';

import ReCAPTCHA from 'react-google-recaptcha';

import { LangConfigs, TSignInCredentialStates } from '../lib/types';
import { verifyEmailAddress, verifyPassword } from '../lib/utils/verify';
import { ColorModeContext } from '../ui/Theme';

import Copyright from '../ui/Copyright';
import Consent from '../ui/Consent';
import BackToHomeButtonGroup from '../ui/BackToHomeButtonGroup';
import Guidelines from '../ui/Guidelines';
import LangSwitch from '../ui/LangSwitch';
import Terms from '../ui/Terms';

export async function getServerSideProps() {
    return {
        props: { providers: await getProviders() }
    };
}

const recaptchaClientKey = process.env.NEXT_PUBLIC_INVISIABLE_RECAPTCHA_SITE_KEY ?? '';
const desc = process.env.NEXT_PUBLIC_APP_DESCRIPTION ?? '';
const lang = process.env.NEXT_PUBLIC_APP_LANG ?? 'tw';
const langConfigs: LangConfigs = {
    signUp: {
        tw: '註冊',
        cn: '注册',
        en: 'Sign up'
    },
    emailAddress: {
        tw: '郵件地址',
        cn: '邮件地址',
        en: 'Email address'
    },
    password: {
        tw: '密碼',
        cn: '密码',
        en: 'Password'
    },
    repeatPassword: {
        tw: '重複輸入密碼',
        cn: '重复输入密码',
        en: 'Re-enter password'
    },
    appSignup: {
        tw: '沒有Mojito賬號？現在就註冊吧',
        cn: '没有Mojito账户？现在就注册吧',
        en: 'Don\' have a Mojito account? Sign up now'
    },
    thirdPartySignUp: {
        tw: (partyName: string) => `使用 ${partyName} 賬號註冊`,
        cn: (partyName: string) => `使用 ${partyName} 账户注册`,
        en: (partyName: string) => `Use ${partyName} Account to sign up`,
    },
    forgotPassword: {
        tw: '忘記密碼了？',
        cn: '忘记密码了？',
        en: 'Forgot password?'
    },
    appSignin: {
        tw: '已經有Mojito賬號了？現在就登錄吧',
        cn: '已经有Mojito账户了？现在就登录吧',
        en: 'Have a Mojito account? Sign in now'
    },
    recaptchaLang: {
        tw: 'zh-TW',
        cn: 'zh-CN',
        en: 'en'
    },
    recaptchaNotVerifiedError: {
        tw: '請告訴我們您不是機器人😎',
        cn: '请告诉我们您不是机器人😎',
        en: 'Please tell us if you are not a robot😎'
    },
    recaptchaError: {
        tw: '我們的人機驗證系統出了些問題🤯...請嘗試刷新或聯繫我們的管理員',
        cn: '我们的人机验证系统出了些问题🤯...请尝试刷新或联系我们的管理员',
        en: 'Something went wrong with our CAPTCHA🤯...Please try to refresh or contact our Webmaster'
    },
    emailAddressNotSatisfiedError: {
        tw: '郵件地址不符合格式',
        cn: '邮件地址不符合格式',
        en: 'Email address does not match the format'
    },
    passwordNotSatisfiedError: {
        tw: '密碼不符合安全性要求',
        cn: '密码不符合安全性要求',
        en: 'Passwords do not satisfy the security requirements'
    },
    passwordNotMatchError: {
        tw: '兩次輸入的密碼不相符',
        cn: '两次输入的密码不相符',
        en: 'Passwords not match'
    },
    loginCredentialsExistError: {
        tw: '郵件地址已被用於註冊',
        cn: '邮件地址已被用于注册',
        en: 'Email address has already been used for registration'
    },
    goodResult: {
        tw: '賬號註冊成功😄一封驗證郵件已發送到註冊時使用的郵箱😉驗證郵箱後就可以登錄啦~',
        cn: '账户注册成功😄一封验证邮件已发送到注册时使用的邮箱😉验证邮箱后就可以登录啦~',
        en: 'Well done😄 A verification email has been sent to the address for registration😉 After verifying your email address you will have full access'
    },
    badResult: {
        tw: '賬號註冊失敗😥請稍後重試或者聯繫我們的管理員',
        cn: '账户注册失败😥请稍后重试或者联系我们的管理员',
        en: 'Failed to register😥 Please try again later or contact our Webmaster'
    },
    goodResendEmailResult: {
        tw: '一封驗證郵件已發送到註冊時使用的郵箱😉驗證郵箱後就可以登錄啦~',
        cn: '一封验证邮件已发送到注册时使用的邮箱😉验证邮箱后就可以登录啦~',
        en: 'A verification email has been sent to the address for registration😉 After verifying your email address you will have full access'
    },
    cannotResendEmailResult: {
        tw: '您的賬號存在問題或已停用或註銷因而不能發送驗證郵件😥如有問題請聯繫我們的管理員，',
        cn: '您的账户存在问题或已停用或注销因而不能发送验证邮件😥如有问题请联系我们的管理员，',
        en: 'An error occurred with your member or your member has been suspended or deactivated😥 If there is any problem please contact our Webmaster'
    },
    badResendEmailResult: {
        tw: '驗證郵件發送失敗😥請稍後重試或者聯繫我們的管理員',
        cn: '验证邮件发送失败😥请稍后重试或者联系我们的管理员',
        en: 'Failed to re-send verification email😥 Please try again later or contact our Webmaster'
    }
};

/**
 * Last update:
 * - 25/05/2023 v0.1.2 New layout applied
 */
const SignUp = ({ providers }: any) => {

    const { data: session } = useSession();

    const router = useRouter();

    React.useEffect(() => {
        if (session) router.push('/');
        const { info } = router.query;
        if ('string' === typeof info) {
            if ('ResendVerificationEmailSuccess' === info) {
                setProcessStates({
                    ...processStates,
                    componentOnDisplay: 'signuprequestresult',
                    displayCircularProgress: false,
                    resultContent: langConfigs.goodResendEmailResult
                });
                return;
            }
            if ('CannotVerificationEmailSuccess' === info) {
                setProcessStates({
                    ...processStates,
                    componentOnDisplay: 'signuprequestresult',
                    displayCircularProgress: false,
                    resultContent: langConfigs.cannotResendEmailResult
                });
                return;
            }
            if ('ResendVerificationEmailError' === info) {
                setProcessStates({
                    ...processStates,
                    componentOnDisplay: 'signuprequestresult',
                    displayCircularProgress: false,
                    resultContent: langConfigs.badResendEmailResult
                });
                return;
            }
        }
    }, []);

    let recaptcha: any;

    type TProcessStates = {
        lang: string;
        componentOnDisplay: 'signuprequestform' | 'signuprequestresult';
        recaptchaResponse: string;
        errorContent: { [key: string]: string; };
        displayError: boolean;
        displayCircularProgress: boolean;
        resultContent: { [key: string]: string; };
    };

    const [processStates, setProcessStates] = React.useState<TProcessStates>({
        lang: lang,
        /**
         * component list:
         * - signuprequestform
         * - signuprequestresult
         */
        componentOnDisplay: 'signuprequestform',
        recaptchaResponse: '',
        errorContent: {
            tw: '',
            cn: '',
            en: '',
        },
        displayError: false,
        displayCircularProgress: false,
        resultContent: {
            tw: '',
            cn: '',
            en: '',
        },
    });

    const setLang = () => {
        if ('tw' === processStates.lang) { setProcessStates({ ...processStates, lang: 'cn' }); }
        if ('cn' === processStates.lang) { setProcessStates({ ...processStates, lang: 'en' }); }
        if ('en' === processStates.lang) { setProcessStates({ ...processStates, lang: 'tw' }); }
    };

    // Handle process states change
    React.useEffect(() => { postRequest(); }, [processStates.recaptchaResponse]);

    const postRequest = async () => {
        if ('' === processStates.recaptchaResponse) {
            // ReCAPTCHA challenge not ready
            return;
        }
        if ('' !== signInCredentialStates.emailAddress && '' !== signInCredentialStates.password) {
            const resp = await fetch(`/api/member/signup?recaptchaResponse=${processStates.recaptchaResponse}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    emailAddress: signInCredentialStates.emailAddress,
                    password: signInCredentialStates.password
                })
            });
            if (200 === resp.status) {
                setProcessStates({
                    ...processStates,
                    componentOnDisplay: 'signuprequestresult',
                    displayCircularProgress: false,
                    resultContent: langConfigs.goodResult
                });
            } else if (400 === resp.status) {
                // reest ReCAPTCHA
                recaptcha?.reset();
                setProcessStates({
                    ...processStates,
                    errorContent: langConfigs.loginCredentialsExistError,
                    displayError: true,
                    displayCircularProgress: false
                });
            } else {
                setProcessStates({
                    ...processStates,
                    componentOnDisplay: 'signuprequestresult',
                    displayCircularProgress: false,
                    resultContent: langConfigs.badResult
                });
            }
        }
    };

    // Decalre signIn credential states
    const [signInCredentialStates, setSignInCredentialStates] = React.useState({
        emailAddress: '',
        password: '',
        repeatpassword: '',
        showpassword: false
    });

    // Handle signIn credential states change
    const handleChange = (prop: keyof TSignInCredentialStates) => (event: React.ChangeEvent<HTMLInputElement>) => {
        setSignInCredentialStates({ ...signInCredentialStates, [prop]: event.target.value });
    };
    const handleShowPassword = () => {
        setSignInCredentialStates({ ...signInCredentialStates, showpassword: !signInCredentialStates.showpassword });
    };
    const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
    };

    // Handle signUp form submit
    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (verifyEmailAddress(signInCredentialStates.emailAddress)) {
            setProcessStates({ ...processStates, displayError: false });
        } else {
            setProcessStates({ ...processStates, errorContent: langConfigs.emailAddressNotSatisfiedError, displayError: true });
            return;
        }
        if (signInCredentialStates.password !== signInCredentialStates.repeatpassword) {
            setProcessStates({ ...processStates, errorContent: langConfigs.passwordNotMatchError, displayError: true });
            return;
        } else {
            setProcessStates({ ...processStates, displayError: false });
        }
        if (!verifyPassword(signInCredentialStates.password)) {
            setProcessStates({ ...processStates, errorContent: langConfigs.passwordNotSatisfiedError, displayError: true });
            return;
        } else {
            setProcessStates({ ...processStates, displayError: false });
        }
        setProcessStates({ ...processStates, displayCircularProgress: true });
        recaptcha?.execute();
    };

    // Handle ReCAPTCHA challenge
    const handleRecaptchaChange = (value: any) => {
        if (!!value) {
            setProcessStates({ ...processStates, recaptchaResponse: value });
        } else {
            setProcessStates({ ...processStates });
        }
    };

    const theme = useTheme();

    const colorMode = React.useContext(ColorModeContext);

    const handleColorModeSelect = () => {
        const preferredColorMode = colorMode.mode === 'dark' ? 'light' : 'dark';
        colorMode.setMode(preferredColorMode);
        document.cookie = `PreferredColorMode=${preferredColorMode}`;
    };

    return (
        <>
            <Head>
                <title>
                    {{ tw: '注冊', cn: '注册', en: 'Sign Up' }[processStates.lang]}
                </title>
                <meta
                    name="description"
                    content={desc}
                    key="desc"
                />
            </Head>
            <Container component='main' maxWidth='xs'>
                {/* signuprequestresult */}
                <Box sx={{ mt: '18rem', mb: '10rem', display: 'signuprequestresult' === processStates.componentOnDisplay ? 'block' : 'none' }}>
                    <Typography textAlign={'center'}>{processStates.resultContent[processStates.lang]}</Typography>
                    <BackToHomeButtonGroup />
                </Box>
                {/* signuprequestform */}
                <Stack sx={{ mt: '5rem', display: 'signuprequestform' === processStates.componentOnDisplay ? 'block' : 'none' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <Link href='/'>
                            <Avatar src='./favicon.ico' sx={{ width: 56, height: 56 }} />
                        </Link>
                    </Box>
                    <Typography component='h1' variant='h5' sx={{ textAlign: 'center', mt: 2 }}>
                        {langConfigs.appSignup[processStates.lang]}
                    </Typography>
                    <Stack component={'form'} spacing={2} sx={{ mt: 4 }} onSubmit={handleSubmit}>
                        {/* Alert */}
                        <Box sx={{ display: processStates.displayError ? 'block' : 'none' }}>
                            <Alert severity='error' >
                                <strong>{processStates.errorContent[processStates.lang]}</strong>
                            </Alert>
                        </Box>
                        <TextField
                            required
                            id='emailAddress'
                            label={langConfigs.emailAddress[processStates.lang]}
                            onChange={handleChange('emailAddress')}
                            autoComplete='email'
                        />
                        <FormControl variant='outlined'>
                            <InputLabel htmlFor='outlined-adornment-password'>{langConfigs.password[processStates.lang]}</InputLabel>
                            <OutlinedInput
                                required
                                id={'outlined-adornment-password'}
                                label={langConfigs.password[processStates.lang]}
                                type={signInCredentialStates.showpassword ? 'text' : 'password'}
                                value={signInCredentialStates.password}
                                onChange={handleChange('password')}
                                endAdornment={
                                    <InputAdornment position='end'>
                                        <IconButton
                                            aria-label='toggle password visibility'
                                            onClick={handleShowPassword}
                                            onMouseDown={handleMouseDownPassword}
                                            edge='end'
                                        >
                                            {signInCredentialStates.showpassword ? <VisibilityIcon /> : <VisibilityOffIcon />}
                                        </IconButton>
                                    </InputAdornment>
                                }
                            />
                        </FormControl>
                        <FormControl variant='outlined'>
                            <InputLabel htmlFor='outlined-adornment-repeat-password'>{langConfigs.repeatPassword[processStates.lang]}</InputLabel>
                            <OutlinedInput
                                required
                                id={'outlined-adornment-repeat-password'}
                                label={langConfigs.repeatPassword[processStates.lang]}
                                type={signInCredentialStates.showpassword ? 'text' : 'password'}
                                value={signInCredentialStates.repeatpassword}
                                onChange={handleChange('repeatpassword')}
                                endAdornment={
                                    <InputAdornment position='end'>
                                        <IconButton
                                            aria-label='toggle password visibility'
                                            onClick={handleShowPassword}
                                            onMouseDown={handleMouseDownPassword}
                                            edge='end'
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
                                    {langConfigs.signUp[processStates.lang]}
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
                                    color={theme.palette.mode === 'dark' ? 'secondary' : 'inherit'}
                                    onClick={() => { signIn(providers[p].id); }}
                                    key={providers[p].id}
                                >
                                    {langConfigs.thirdPartySignUp[processStates.lang](providers[p].name)}
                                </Button>
                            );
                        })}
                    </Stack>
                    <Grid container sx={{ mt: 3 }} >
                        <Grid item flexGrow={1}>
                            <Link href='/api/auth/signin' variant='body2'>
                                {langConfigs.appSignin[processStates.lang]}
                            </Link>
                        </Grid>
                        <Grid item>
                            <Link href='/forgot' variant='body2'>
                                {langConfigs.forgotPassword[processStates.lang]}
                            </Link>
                        </Grid>
                    </Grid>
                </Stack>

                {/* copyright */}
                <Copyright sx={{ mt: 8 }} />
                <Guidelines lang={processStates.lang} />
                <Terms sx={{ mb: 2 }} lang={processStates.lang} />
                <LangSwitch setLang={setLang} />

                {/* theme mode switch */}
                <Box sx={{ mb: 8, display: 'flex', flexDirection: 'row', justifyContent: 'center' }}>
                    <IconButton onClick={handleColorModeSelect}>
                        {theme.palette.mode === 'dark' ? <WbSunnyIcon /> : <DarkModeIcon />}
                    </IconButton>
                </Box>
            </Container>

            <ReCAPTCHA
                hl={langConfigs.recaptchaLang[processStates.lang]}
                size={'invisible'}
                ref={(ref: any) => ref && (recaptcha = ref)}
                sitekey={recaptchaClientKey}
                onChange={handleRecaptchaChange}
            />
        </>
    );
};

export default SignUp;