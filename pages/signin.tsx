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

import { signIn, getProviders, getSession, getCsrfToken, useSession } from 'next-auth/react';

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
import { LangConfigs, TSignInCredentialStates } from '../lib/types';
import About from '../ui/About';
import Terms from '../ui/Terms';
import { CentralizedBox } from '../ui/Styled';

type SigninPageProps = {
    providers: Awaited<ReturnType<typeof getProviders>> | null;
    csrfToken: Awaited<ReturnType<typeof getCsrfToken>> | null;
};

export async function getServerSideProps(context: NextPageContext) {
    return {
        props: {
            providers: await getProviders(),
            csrfToken: await getCsrfToken(context),
        }
    };
}

const recaptchaClientKey = process.env.NEXT_PUBLIC_INVISIABLE_RECAPTCHA_SITE_KEY ?? '';
const defaultLang = process.env.NEXT_PUBLIC_APP_LANG ?? 'tw';
const langConfigs: LangConfigs = {
    signIn: {
        tw: '登入',
        cn: '登入',
        en: 'Sign in'
    },
    emailAddress: {
        tw: '郵件地址',
        cn: '邮件地址',
        en: 'Email'
    },
    password: {
        tw: '密碼',
        cn: '密码',
        en: 'Password'
    },
    appSignin:
    {
        tw: '使用 Mojito 賬號登錄',
        cn: '使用 Mojito 账户登录',
        en: 'Use Mojito Account to sign in'
    },
    thirdPartySignin: {
        tw: (partyName: string) => `使用 ${partyName} 賬號登錄`,
        cn: (partyName: string) => `使用 ${partyName} 账户登录`,
        en: (partyName: string) => `Use ${partyName} Account to sign in`,
    },
    forgotPassword: {
        tw: '忘記密碼了？',
        cn: '忘记密码了？',
        en: 'I forgot my password...'
    },
    resendVerificationEmail: {
        tw: '重新發送驗證郵件',
        cn: '重新发送验证邮件',
        en: 'Re-send verification email'
    },
    appSignup: {
        tw: '沒有Mojito賬號？現在就註冊吧',
        cn: '没有Mojito账户？现在就注册吧',
        en: 'Sign up now'
    },
    recaptchaLang: {
        tw: 'zh-TW',
        cancelIdleCallback: 'zh-CN',
        en: 'en'
    },
    errors: {
        RecaptchaNotVerifiedError: {
            tw: ['請告訴我們您不是機器人😎', ''],
            cn: ['请告诉我们您不是机器人😎', ''],
            en: ['Please tell us if you are not a robot😎', '']
        },
        CredentialsSignin: {
            tw: ['郵件地址與密碼不匹配，請再嘗試一下', ''],
            cn: ['邮件地址与密码不匹配，请再尝试一下', ''],
            en: ['Member and password do not match', ', please try again', '']
        },
        EmailAddressVerificationRequired: {
            tw: ['您需要對您的賬號完成郵箱驗證', '，如有問題請聯繫我們的管理員，'],
            cn: ['您需要对您的账户完成邮箱验证', '，如有问题请联系我们的管理员，'],
            en: ['You will need to complete email address verification before signin', ', please try again later or contact our Webmaster']
        },
        InappropriateEmailAddress: {
            tw: ['第三方平台提供的賬號信息不能滿足我們的要求，請嘗試其他的賬號或登錄方式', '，如有問題請聯繫我們的管理員'],
            cn: ['第三方平台提供的账户信息不能满足我们的要求，请尝试其他的账户或登录方式', '，如有问题请联系我们的管理员'],
            en: ['The information supplied by the third-party signin provider do not meet our requirements, please try signing in with another account or method', ', please try again later or contact our Webmaster']
        },
        DefectiveMember: {
            tw: ['您的賬號存在錯誤', '，請聯繫我們的管理員'],
            cn: ['您的账户存在错误', '，请联系我们的管理员'],
            en: ['An error occurred with your member', ', please contact our Webmaster']
        },
        MemberSuspendedOrDeactivated: {
            tw: ['您的賬號已停用或已被註銷', '，如有問題請聯繫我們的管理員'],
            cn: ['您的账户已停用或已被注销', '，如有问题请联系我们的管理员'],
            en: ['Your member has been suspended or deactivated', ', please try again later or contact our Webmaster']
        },
        UnrecognizedProvider: {
            tw: ['您嘗試使用我們不支持的第三方賬號登錄', '，請使用Mojito賬號或我們支持的登錄方式，如有問題請聯繫我們的管理員'],
            cn: ['您尝试使用我们不支持的第三方账户登录', '，请使用Mojito账户或我们支持的登录方式，如有问题请联系我们的管理员'],
            en: ['The third-party signin provider you tried signin with is not supported by us', ', please try signing in with Mojito account or other methods we supported or contact our Webmaster']
        },
        ThirdPartyProviderSignin: {
            tw: ['第三方賬號登錄遇到了一些問題', '，請稍後重試或者聯繫我們的管理員'],
            cn: ['第三方账户登录遇到了一些问题', '，请稍后重试或者联系我们的管理员'],
            en: ['Third-party Account sign in unsuccessful', ', please try again later or contact our Webmaster']
        }
    }
};

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
        lang: defaultLang,
        /**
         * progress list:
         * - signin
         * - login
         * - resendemail
         */
        processInProgress: 'signin',
        recaptchaResponse: '',
        mojitoMemberSystemSigninAlertContent: '',
        displayMojitoMemberSystemSigninAlert: false,
        thirdPartyProviderSigninAlertContent: '',
        displayThirdPartyProviderSignAlert: false,
        displayResendEmailButton: false,
        displayCircularProgress: false
    });


    const setLang = () => {
        if ('tw' === processStates.lang) { setProcessStates({ ...processStates, lang: 'cn' }); }
        if ('cn' === processStates.lang) { setProcessStates({ ...processStates, lang: 'en' }); }
        if ('en' === processStates.lang) { setProcessStates({ ...processStates, lang: 'tw' }); }
    };


    // Handle error hint
    React.useEffect(() => {
        const { error, providerId } = router.query;
        if ('string' === typeof error) {
            if ('CredentialsSignin' === error) {
                setProcessStates({
                    ...processStates,
                    mojitoMemberSystemSigninAlertContent: langConfigs.errors.CredentialsSignin[processStates.lang],
                    displayMojitoMemberSystemSigninAlert: true,
                    displayThirdPartyProviderSignAlert: false,
                    displayResendEmailButton: false
                });
                return;
            }
            if ('EmailAddressVerificationRequired' === error) {
                if ('string' === typeof providerId && 'MojitoMemberSystem' === providerId) {
                    setProcessStates({
                        ...processStates,
                        mojitoMemberSystemSigninAlertContent: langConfigs.errors.EmailAddressVerificationRequired[processStates.lang],
                        displayMojitoMemberSystemSigninAlert: true,
                        displayThirdPartyProviderSignAlert: false,
                        displayResendEmailButton: true
                    });
                    return;
                }
                setProcessStates({
                    ...processStates,
                    thirdPartyProviderSigninAlertContent: langConfigs.errors.EmailAddressVerificationRequired[processStates.lang],
                    displayMojitoMemberSystemSigninAlert: false,
                    displayThirdPartyProviderSignAlert: true,
                    displayResendEmailButton: true
                });
                return;
            }
            if ('InappropriateEmailAddress' === error) {
                setProcessStates({
                    ...processStates,
                    thirdPartyProviderSigninAlertContent: langConfigs.errors.InappropriateEmailAddress[processStates.lang],
                    displayMojitoMemberSystemSigninAlert: false,
                    displayThirdPartyProviderSignAlert: true,
                    displayResendEmailButton: false
                });
                return;
            }
            if ('DefectiveMember' === error) {
                if ('string' === typeof providerId && 'MojitoMemberSystem' === providerId) {
                    setProcessStates({
                        ...processStates,
                        mojitoMemberSystemSigninAlertContent: langConfigs.errors.DefectiveMember[processStates.lang],
                        displayMojitoMemberSystemSigninAlert: true,
                        displayThirdPartyProviderSignAlert: false,
                        displayResendEmailButton: false
                    });
                    return;
                }
                setProcessStates({
                    ...processStates,
                    thirdPartyProviderSigninAlertContent: langConfigs.errors.DefectiveMember[processStates.lang],
                    displayMojitoMemberSystemSigninAlert: false,
                    displayThirdPartyProviderSignAlert: true,
                    displayResendEmailButton: false
                });
                return;
            }
            if ('MemberSuspendedOrDeactivated' === error) {
                if ('string' === typeof providerId && 'MojitoMemberSystem' === providerId) {
                    setProcessStates({
                        ...processStates,
                        mojitoMemberSystemSigninAlertContent: langConfigs.errors.MemberSuspendedOrDeactivated[processStates.lang],
                        displayMojitoMemberSystemSigninAlert: true,
                        displayThirdPartyProviderSignAlert: false,
                        displayResendEmailButton: false
                    });
                    return;
                }
                setProcessStates({
                    ...processStates,
                    thirdPartyProviderSigninAlertContent: langConfigs.errors.MemberSuspendedOrDeactivated[processStates.lang],
                    displayMojitoMemberSystemSigninAlert: false,
                    displayThirdPartyProviderSignAlert: true,
                    displayResendEmailButton: false
                });
                return;
            }
            if ('UnrecognizedProvider' === error) {
                setProcessStates({
                    ...processStates,
                    thirdPartyProviderSigninAlertContent: langConfigs.errors.UnrecognizedProvider[processStates.lang],
                    displayMojitoMemberSystemSigninAlert: false,
                    displayThirdPartyProviderSignAlert: true,
                    displayResendEmailButton: false
                });
                return;
            }
            if ('ThirdPartyProviderSignin' === error) {
                setProcessStates({
                    ...processStates,
                    thirdPartyProviderSigninAlertContent: langConfigs.errors.ThirdPartyProviderSignin[processStates.lang],
                    displayMojitoMemberSystemSigninAlert: false,
                    displayThirdPartyProviderSignAlert: true,
                    displayResendEmailButton: false
                });
                return;
            }
        }
    }, [router]);

    // Handle signin form submit on recaptcha response update
    React.useEffect(() => { postRequest(); }, [processStates.recaptchaResponse]);
    const postRequest = async () => {
        if ('' === processStates.recaptchaResponse) {
            // ReCAPTCHA challenge not ready
            return;
        }
        if ('signin' === processStates.processInProgress) {
            if ('' !== signInCredentialStates.emailAddress && '' !== signInCredentialStates.password) {
                setProcessStates({ ...processStates, processInProgress: 'login', displayMojitoMemberSystemSigninAlert: false, displayThirdPartyProviderSignAlert: false });
                await signIn('mojito', {
                    recaptchaResponse: processStates.recaptchaResponse,
                    emailAddress: signInCredentialStates.emailAddress,
                    password: signInCredentialStates.password,
                    redirectUrl: router.query?.redirectUrl
                });
            }
        }
        if ('resendemail' === processStates.processInProgress) {
            const { providerId, emailAddressB64 } = router.query;
            const resp = await fetch(`/api/member/signup/request?recaptchaResponse=${processStates.recaptchaResponse}`, {
                method: 'POST',
                body: JSON.stringify({
                    providerId,
                    emailAddressB64
                })
            });
            if (200 === resp.status) {
                router.push('/signup?info=ResendVerificationEmailSuccess');
            } else if (500 !== resp.status) {
                router.push('/signup?info=CannotVerificationEmailSuccess');
            } else {
                router.push('/signup?info=ResendVerificationEmailError');
            }
        }
    };

    // Decalre signIn credential states
    const [signInCredentialStates, setSignInCredentialStates] = React.useState({
        emailAddress: '',
        password: '',
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

    // Handle signIn form submit
    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setProcessStates({ ...processStates, processInProgress: 'signin', displayCircularProgress: true });
        recaptcha?.execute();
    };

    // Handle re-send verification email
    const handleResendEmail = () => {
        setProcessStates({ ...processStates, processInProgress: 'resendemail', displayCircularProgress: false });
        recaptcha?.execute();
    };

    // Handle ReCAPTCHA challenge
    const handleRecaptchaChange = (value: any) => {
        if (!!value) {
            setProcessStates({
                ...processStates,
                recaptchaResponse: value,
                displayMojitoMemberSystemSigninAlert: false,
                displayThirdPartyProviderSignAlert: false
            });
        } else {
            setProcessStates({ ...processStates });
        }
    };
    const handleRecaptchaLoseFocus = () => {
        setTimeout(() => {
            setProcessStates({
                ...processStates,
                mojitoMemberSystemSigninAlertContent: langConfigs.errors.RecaptchaNotVerifiedError[processStates.lang],
                displayMojitoMemberSystemSigninAlert: 'login' !== processStates.processInProgress,
                displayResendEmailButton: false,
                displayCircularProgress: false
            });
        }, 2000);
    };

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
                        {langConfigs.appSignin[processStates.lang]}
                    </Typography>
                    <Stack component={'form'} spacing={2} sx={{ mt: 4 }} onSubmit={handleSubmit}>
                        <input name='csrfToken' type={'hidden'} defaultValue={csrfToken ?? ''} />
                        {/* credentials signin & other error alert */}
                        <Box sx={{ display: processStates.displayMojitoMemberSystemSigninAlert ? 'block' : 'none' }}>
                            <Alert severity='error' >
                                <strong>{processStates.mojitoMemberSystemSigninAlertContent[0]}</strong>
                                {processStates.mojitoMemberSystemSigninAlertContent[1]}
                                <Link color={'inherit'} sx={{ display: processStates.displayResendEmailButton ? 'inline' : 'none', cursor: 'default', '&:hover': { cursor: 'pointer' }, }} onClick={handleResendEmail}>
                                    {langConfigs.resendVerificationEmail[processStates.lang]}
                                </Link>
                            </Alert>
                        </Box>
                        <TextField
                            required
                            id='emailAddress'
                            label={langConfigs.emailAddress[processStates.lang]}
                            value={signInCredentialStates.emailAddress}
                            onChange={handleChange('emailAddress')}
                            autoComplete='email'
                        />
                        <FormControl variant='outlined' required>
                            <InputLabel htmlFor='outlined-adornment-password'>{langConfigs.password[processStates.lang]}</InputLabel>
                            <OutlinedInput
                                id={'outlined-adornment-password'}
                                label={langConfigs.password[processStates.lang]}
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
                                    {langConfigs.signIn[processStates.lang]}
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
                                <strong>{processStates.thirdPartyProviderSigninAlertContent[0]}</strong>
                                {processStates.thirdPartyProviderSigninAlertContent[1]}
                                <Link color={'inherit'} sx={{ display: processStates.displayResendEmailButton ? 'inline' : 'none', cursor: 'default', '&:hover': { cursor: 'pointer' }, }} onClick={handleResendEmail}>
                                    {langConfigs.resendVerificationEmail[processStates.lang]}
                                </Link>
                            </Alert>
                        </Box>
                        {providers && Object.keys(providers).map(p => {
                            return ('credentials' !== providers[p].type) && (
                                <Button
                                    variant='contained'
                                    fullWidth
                                    color={'secondary'}
                                    onClick={() => { signIn(providers[p].id); }}
                                    key={providers[p].id}
                                >
                                    {langConfigs.thirdPartySignin[processStates.lang](providers[p].name)}
                                </Button>
                            );
                        })}
                    </Stack>
                    <Grid container sx={{ mt: 3 }} >
                        <Grid item xs>
                            <Link href="/forgot" variant="body2">
                                {langConfigs.forgotPassword[processStates.lang]}
                            </Link>
                        </Grid>
                        <Grid item>
                            <Link href="/signup" variant="body2">
                                {langConfigs.appSignup[processStates.lang]}
                            </Link>
                        </Grid>
                    </Grid>
                </Stack>
                <Copyright sx={{ mt: 8 }} lang={processStates.lang} />
                <Terms lang={processStates.lang} />

                <CentralizedBox sx={{ mb: 8 }} >
                    <Button variant='text' sx={{ textTransform: 'none' }} onClick={setLang}>
                        <Typography variant={'body2'}>{'繁|简|English'}</Typography>
                    </Button>
                </CentralizedBox>
            </Container>
            <ReCAPTCHA
                hl={langConfigs.recaptchaLang[processStates.lang]}
                size={'invisible'}
                ref={(ref: any) => ref && (recaptcha = ref)}
                sitekey={recaptchaClientKey}
                onChange={handleRecaptchaChange}
                onFocusCapture={handleRecaptchaLoseFocus}
            />
        </>
    );
};

export default SignIn;