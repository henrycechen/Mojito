import * as React from 'react';
import Head from 'next/head';

import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';

import ReCAPTCHA from 'react-google-recaptcha';

import { LangConfigs } from '../../lib/types';
import { verifyEmailAddress } from '../../lib/utils/verify';

import Copyright from '../../ui/Copyright';
import BackToHomeButtonGroup from '../../ui/BackToHomeButtonGroup';
import Guidelines from '../../ui/Guidelines';
import LangSwitch from '../../ui/LangSwitch';
import Terms from '../../ui/Terms';
import ThemeSwitch from '../../ui/ThemeSwitch';

const recaptchaClientKey = process.env.NEXT_PUBLIC_INVISIABLE_RECAPTCHA_SITE_KEY ?? '';
const desc = process.env.NEXT_PUBLIC_APP_DESCRIPTION ?? '';
const lang = process.env.NEXT_PUBLIC_APP_LANG ?? 'tw';
const langConfigs: LangConfigs = {
    submit: {
        tw: '确认',
        cn: '确认',
        en: 'Confirm'
    },
    pleaseEnterEmailAddress: {
        tw: '请输入注册 Mojito 账户时使用的邮件地址',
        cn: '请输入注册 Mojito 账户时使用的邮件地址',
        en: 'Please enter the email address you used to register your Mojito account'
    },
    emailAddress: {
        tw: '邮件地址',
        cn: '邮件地址',
        en: 'Email address'
    },
    invalidEmailAddressError: {
        tw: '无效的邮件地址',
        cn: '无效的邮件地址',
        en: 'Invalid email address'
    },
    recaptchaLang: {
        tw: 'zh-CN',
        cn: 'zh-CN',
        en: 'en'
    },
    recaptchaNotVerifiedError: {
        tw: '请告诉我们您不是机器人😎',
        cn: '请告诉我们您不是机器人😎',
        en: 'Please tell us if you are not a robot😎'
    },
    recaptchaError: {
        tw: '我们的人机验证系统出了些问题🤯...请尝试刷新或联系我们的管理员',
        cn: '我们的人机验证系统出了些问题🤯...请尝试刷新或联系我们的管理员',
        en: 'Something went wrong with our CAPTCHA🤯...Please try to refresh or contact our Webmaster'
    },
    memberIdNotFoundError: {
        tw: '看起来我们没有您的注册信息😧',
        cn: '看起来我们没有您的注册信息😧',
        en: 'We do not seem to have your registration information😧'
    },
    goodResult: {
        tw: '一封含有重置密码的邮件已发到您注册时使用的邮箱中，请检查收件箱🙂',
        cn: '一封含有重置密码的邮件已发到您注册时使用的邮箱中，请检查收件箱🙂',
        en: 'An email containing a reset password has been sent to the email address you used to register, please check your inbox🙂'
    },
    badResult: {
        tw: '我们的服务器出了些问题🤯...请稍后重试或者联系我们的管理员',
        cn: '我们的服务器出了些问题🤯...请稍后重试或者联系我们的管理员',
        en: 'Something went wrong with our server 🤯... Please try again later or contact our Webmaster'
    }
};

/**
 * Last update:
 * - 25/05/2023 v0.1.2 New layout applied
 */
const Forgot = () => {
    let recaptcha: any;

    type TProcessStates = {
        lang: string;
        componentOnDisplay: 'resetpasswordrequestform' | 'resetpasswordrequestresult';
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
         * - resetpasswordrequestform
         * - resetpasswordrequestresult
         */
        componentOnDisplay: 'resetpasswordrequestform',
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
    React.useEffect(() => { post(); }, [processStates.recaptchaResponse]);

    const post = async () => {
        if ('' === processStates.recaptchaResponse) {
            // ReCAPTCHA challenge is not ready
            return;
        }
        if ('' !== emailAddress) {
            const resp = await fetch(`/api/member/resetpassword/request?emailAddress=${emailAddress}&recaptchaResponse=${processStates.recaptchaResponse}`, { method: 'POST' });
            if (200 === resp.status) {
                setProcessStates({
                    ...processStates,
                    componentOnDisplay: 'resetpasswordrequestresult',
                    displayCircularProgress: false,
                    resultContent: langConfigs.goodResult
                });
            } else if (404 === resp.status) {
                // SignIn credential not found, reset ReCAPTCHA
                recaptcha?.reset();
                setProcessStates({
                    ...processStates,
                    errorContent: langConfigs.memberIdNotFoundError,
                    displayError: true,
                    displayCircularProgress: false
                });
            } else {
                // 500
                setProcessStates({
                    ...processStates,
                    componentOnDisplay: 'resetpasswordrequestresult',
                    displayCircularProgress: false,
                    resultContent: langConfigs.badResult
                });
            }
        }
    };

    // Declare email address state
    const [emailAddress, setEmailAddress] = React.useState('');

    // Handle email address input
    const handleTextFieldChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setEmailAddress(event.target.value);
    };

    // Handle reset password request form submit
    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!verifyEmailAddress(emailAddress)) {
            setProcessStates({ ...processStates, errorContent: langConfigs.invalidEmailAddressError, displayError: true });
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

    return (
        <>
            <Head>
                <title>
                    {{ tw: '重新設定密碼', cn: '重新设置密码', en: 'Reset Password' }[processStates.lang]}
                </title>
                <meta
                    name='description'
                    content={desc}
                    key='desc'
                />
            </Head>
            <Container component='main' maxWidth={'xs'} >

                {/* resetpasswordrequestform */}
                <Stack sx={{ mt: '5rem', display: 'resetpasswordrequestform' === processStates.componentOnDisplay ? 'block' : 'none' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <Link href='/'>
                            <Avatar src={`/logo.png`} sx={{ width: 56, height: 56 }} />
                        </Link>
                    </Box>
                    <Typography component='h1' variant='h5' sx={{ mt: 2, textAlign: 'center' }}>
                        {langConfigs.pleaseEnterEmailAddress[processStates.lang]}
                    </Typography>
                    <Stack component={'form'} spacing={2} sx={{ mt: 4 }} onSubmit={handleSubmit} >
                        <Box sx={{ display: processStates.displayError ? 'block' : 'none' }}>
                            <Alert severity='error' >
                                <strong>{processStates.errorContent[processStates.lang]}</strong>
                            </Alert>
                        </Box>
                        <TextField
                            required
                            name='emailAddress'
                            label={langConfigs.emailAddress[processStates.lang]}
                            value={emailAddress}
                            onChange={handleTextFieldChange}
                        />
                        <Box>
                            <Button type='submit' fullWidth variant='contained'>
                                <Typography sx={{ display: !processStates.displayCircularProgress ? 'block' : 'none' }}>
                                    {langConfigs.submit[processStates.lang]}
                                </Typography>
                                <CircularProgress sx={{ color: 'white', display: processStates.displayCircularProgress ? 'block' : 'none' }} />
                            </Button>
                        </Box>
                    </Stack>
                </Stack>

                {/* resetpasswordrequestresult */}
                <Box sx={{ mt: '18rem', mb: '10rem', display: 'resetpasswordrequestresult' === processStates.componentOnDisplay ? 'block' : 'none' }}>
                    <Typography textAlign={'center'}>
                        {processStates.resultContent[processStates.lang]}
                    </Typography>
                    <BackToHomeButtonGroup />
                </Box>

                {/* copyright */}
                <Copyright sx={{ mt: '10rem' }} />
                <Guidelines lang={processStates.lang} />
                <Terms sx={{ mb: 2 }} lang={processStates.lang} />
                <LangSwitch setLang={setLang} />

                {/* theme mode switch */}
                <ThemeSwitch />

            </Container>
            <ReCAPTCHA
                sitekey={recaptchaClientKey}
                size={'invisible'}
                hl={langConfigs.recaptchaLang[processStates.lang]}
                ref={(ref: any) => ref && (recaptcha = ref)}
                onChange={handleRecaptchaChange}
            />
        </>
    );
};

export default Forgot;