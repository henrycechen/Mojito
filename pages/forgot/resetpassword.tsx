import * as React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import InputAdornment from '@mui/material/InputAdornment';
import OutlinedInput from '@mui/material/OutlinedInput';
import FormControl from '@mui/material/FormControl';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

import ReCAPTCHA from 'react-google-recaptcha';

import { LangConfigs } from '../../lib/types';
import { verifyPassword } from '../../lib/utils/verify';

import Copyright from '../../ui/Copyright';
import BackToHomeButtonGroup from '../../ui/BackToHomeButtonGroup';
import Guidelines from '../../ui/Guidelines';
import LangSwitch from '../../ui/LangSwitch';
import Terms from '../../ui/Terms';
import ThemeSwitch from '../../ui/ThemeSwitch';

interface PasswordStates {
    password: string;
    repeatpassword: string;
    showpassword: boolean;
}

const recaptchaClientKey = process.env.NEXT_PUBLIC_INVISIABLE_RECAPTCHA_SITE_KEY ?? '';
const desc = process.env.NEXT_PUBLIC_APP_DESCRIPTION ?? '';
const lang = process.env.NEXT_PUBLIC_APP_LANG ?? 'tw';
const langConfigs: LangConfigs = {
    submit: {
        tw: '确认',
        cn: '确认',
        en: 'Confirm'
    },
    tokenCheck: {
        tw: '正在检查令牌...',
        cn: '正在检查令牌...',
        en: 'Checking token...'
    },
    tokenError: {
        tw: '令牌出错了😥请重新发起修改密码请求',
        cn: '令牌出错了😥请重新发起修改密码请求',
        en: 'Invalid token😥 Please resubmit change password request'
    },
    tokenExpired: {
        tw: '令牌逾期或已被使用过😥请重新发起修改密码请求',
        cn: '令牌逾期或已被使用过😥请重新发起修改密码请求',
        en: 'Token expired😥 Please resubmit change password request'
    },
    backToHome: {
        tw: '返回主页',
        cn: '返回主页',
        en: 'Back to home'
    },
    resetPassword: {
        tw: '设置新密码',
        cn: '设置新密码',
        en: 'Set your new password'
    },
    password: {
        tw: '新密码',
        cn: '新密码',
        en: 'New password'
    },
    repeatPassword: {
        tw: '重复输入新密码',
        cn: '重复输入新密码',
        en: 'Repeat new password'
    },
    passwordInstructions: {
        tw: '安全性要求：密码长度不小于八个字符，并需包含大小写字母、数字和特殊字符',
        cn: '安全性要求：密码长度不小于八个字符，并需包含大小写字母、数字和特殊字符',
        en: 'Security requirements: Password must contain at least eight characters, at least one number and both lower and uppercase letters and special characters'
    },
    passwordNotSatisfiedError: {
        tw: '新密码不符合安全性要求',
        cn: '新密码不符合安全性要求',
        en: 'Passwords do not satisfy the security requirements'
    },
    passwordNotMatchError: {
        tw: '两次输入的密码不相符',
        cn: '两次输入的密码不相符',
        en: 'Passwords not match'
    },
    recaptchaLang: {
        tw: 'zh-CN',
        cn: 'zh-CN',
        en: 'en'
    },
    goodResult: {
        tw: '新密码设置成功😄现在就返回主页登录吧~',
        cn: '新密码设置成功😄现在就返回主页登录吧~',
        en: 'All set😄 Ready to go!'
    },
    badResult: {
        tw: '新密码设置失败😥请稍后重试或者联系我们的管理员',
        cn: '新密码设置失败😥请稍后重试或者联系我们的管理员',
        en: 'Failed to set new password😥 Please try again later or contact our Webmaster'
    }
};

/**
 * Last update:
 * - 25/05/2023 v0.1.2 New layout applied
 */
const ResetPassword = () => {
    let recaptcha: any;

    const router = useRouter();

    const { requestInfo } = router.query;

    type TProcessStates = {
        lang: string;
        componentOnDisplay: 'tokencheck' | 'resetpasswordform' | 'resetpasswordresult';
        recaptchaResponse: string;
        errorContent: { [key: string]: string; };
        displayError: boolean;
        displayCircularProgress: boolean;
        resultContent: { [key: string]: string; };
        emailAddress: string;
        resetPasswordToken: string;
    };

    const [processStates, setProcessStates] = React.useState<TProcessStates>({
        lang: lang,
        /**
         * Component list:
         * - tokencheck
         * - resetpasswordform
         * - resetpasswordresult
         */
        componentOnDisplay: 'tokencheck',
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
        emailAddress: '',
        resetPasswordToken: ''
    });

    const setLang = () => {
        if ('tw' === processStates.lang) { setProcessStates({ ...processStates, lang: 'cn' }); }
        if ('cn' === processStates.lang) { setProcessStates({ ...processStates, lang: 'en' }); }
        if ('en' === processStates.lang) { setProcessStates({ ...processStates, lang: 'tw' }); }
    };

    // Handle process states change
    // React.useEffect(() => { post(); }, [processStates.recaptchaResponse]);
    const post = async () => {
        if ('tokencheck' === processStates.componentOnDisplay && '' === processStates.recaptchaResponse) {
            recaptcha?.execute();
            return;
        }
        if ('' === processStates.recaptchaResponse) {
            // ReCAPTCHA challenge is not ready
            return;
        }
        if ('' === processStates.resetPasswordToken) {
            // Post to verify reset password token
            const resp = await fetch(`/api/member/resetpassword/verify?requestInfo=${requestInfo}&recaptchaResponse=${processStates.recaptchaResponse}`);
            if (200 === resp.status) {
                recaptcha?.reset();
                const { emailAddress, resetPasswordToken } = await resp.json();
                setProcessStates({ ...processStates, componentOnDisplay: 'resetpasswordform', emailAddress, resetPasswordToken });
            } else {
                // console.log(await resp.text());
                setProcessStates({ ...processStates, componentOnDisplay: 'resetpasswordresult', resultContent: langConfigs.tokenError[lang] });
            }
        } else {
            // Post reset password form
            const resp = await fetch(`/api/member/resetpassword?recaptchaResponse=${processStates.recaptchaResponse}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    emailAddress: processStates.emailAddress,
                    resetPasswordToken: processStates.resetPasswordToken,
                    password: passwordStates.password
                })
            });
            if (200 === resp.status) {
                setProcessStates({ ...processStates, componentOnDisplay: 'resetpasswordresult', displayCircularProgress: false, resultContent: langConfigs.goodResult[lang] });
            } else if ([403, 404].includes(resp.status)) {
                setProcessStates({ ...processStates, componentOnDisplay: 'resetpasswordresult', displayCircularProgress: false, resultContent: langConfigs.tokenExpired[lang] });
            } else {
                setProcessStates({ ...processStates, componentOnDisplay: 'resetpasswordresult', displayCircularProgress: false, resultContent: langConfigs.badResult[lang] });
            }
        }
    };

    // Declare password states
    const [passwordStates, setPasswordStates] = React.useState({
        password: '',
        repeatpassword: '',
        showpassword: false
    });

    // Handle password states change
    const handleChange = (prop: keyof PasswordStates) => (event: React.ChangeEvent<HTMLInputElement>) => {
        setPasswordStates({ ...passwordStates, [prop]: event.target.value });
    };
    const handleShowPassword = () => {
        setPasswordStates({ ...passwordStates, showpassword: !passwordStates.showpassword });
    };
    const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
    };

    // Handle reset password form submit
    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (passwordStates.password !== passwordStates.repeatpassword) {
            setProcessStates({ ...processStates, errorContent: langConfigs.passwordNotMatchError[lang], displayError: true });
            return;
        } else {
            setProcessStates({ ...processStates, displayError: false });
        }
        if (!verifyPassword(passwordStates.password)) {
            setProcessStates({ ...processStates, errorContent: langConfigs.passwordNotSatisfiedError[lang], displayError: true });
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
                    {{ tw: '設定新密碼', cn: '设定新密码', en: 'Set New Password' }[processStates.lang]}
                </title>
                <meta
                    name='description'
                    content={desc}
                    key='desc'
                />
            </Head>
            <Container component='main' maxWidth={'xs'} >

                {/* tokencheck */}
                <Box sx={{ mt: '18rem', mb: '10rem', display: 'tokencheck' === processStates.componentOnDisplay ? 'block' : 'none' }}>
                    <Typography textAlign={'center'}>{langConfigs.tokenCheck[processStates.lang]}</Typography>
                </Box>

                {/* resetpasswordresult */}
                <Box sx={{ mt: '18rem', mb: '10rem', display: 'resetpasswordresult' === processStates.componentOnDisplay ? 'block' : 'none' }}>
                    <Typography textAlign={'center'}>{processStates.resultContent[processStates.lang]}</Typography>
                    <BackToHomeButtonGroup />
                </Box>

                {/* resetpasswordform */}
                <Stack sx={{ mt: '5rem', display: 'resetpasswordform' === processStates.componentOnDisplay ? 'block' : 'none' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <Link href='/'>
                            <Avatar src={`/logo.png`} sx={{ width: 56, height: 56 }} />
                        </Link>
                    </Box>
                    <Typography component='h1' variant='h5' sx={{ textAlign: 'center', mt: 2 }}>
                        {langConfigs.resetPassword[processStates.lang]}
                    </Typography>
                    <Stack component={'form'} spacing={2} sx={{ mt: 4 }} onSubmit={handleSubmit} >
                        {/* Alert */}
                        <Box sx={{ display: processStates.displayError ? 'block' : 'none' }}>
                            <Alert severity='error' >
                                <strong>{processStates.errorContent[processStates.lang]}</strong>
                            </Alert>
                        </Box>
                        <FormControl variant='outlined'>
                            <InputLabel htmlFor='outlined-adornment-password'>{langConfigs.password[processStates.lang]}</InputLabel>
                            <OutlinedInput
                                required
                                id={'outlined-adornment-password'}
                                label={langConfigs.password[processStates.lang]}
                                type={passwordStates.showpassword ? 'text' : 'password'}
                                value={passwordStates.password}
                                onChange={handleChange('password')}
                                endAdornment={
                                    <InputAdornment position='end'>
                                        <IconButton
                                            aria-label='toggle password visibility'
                                            onClick={handleShowPassword}
                                            onMouseDown={handleMouseDownPassword}
                                            edge='end'
                                        >
                                            {passwordStates.showpassword ? <VisibilityIcon /> : <VisibilityOffIcon />}
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
                                type={passwordStates.showpassword ? 'text' : 'password'}
                                value={passwordStates.repeatpassword}
                                onChange={handleChange('repeatpassword')}
                                endAdornment={
                                    <InputAdornment position='end'>
                                        <IconButton
                                            aria-label='toggle password visibility'
                                            onClick={handleShowPassword}
                                            onMouseDown={handleMouseDownPassword}
                                            edge='end'
                                        >
                                            {passwordStates.showpassword ? <VisibilityIcon /> : <VisibilityOffIcon />}
                                        </IconButton>
                                    </InputAdornment>
                                }
                            />
                        </FormControl>
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

export default ResetPassword;