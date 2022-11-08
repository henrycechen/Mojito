import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
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

import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';

import ReCAPTCHA from "react-google-recaptcha";

import { useRouter } from 'next/router';
import { LangConfigs } from '../../lib/types';
import { verifyPassword } from '../../lib/utils';

import Copyright from '../../ui/Copyright';
import BackToHomeButtonGroup from '../../ui/BackToHomeButtonGroup';

interface PasswordState {
    password: string;
    repeatpassword: string;
    showPassword: boolean;
}

/**
 * Domain and language settings
 */
const domain = process.env.NEXT_PUBLIC_APP_DOMAIN;
const recaptchaClientKey = process.env.NEXT_PUBLIC_INVISIABLE_RECAPTCHA_SITE_KEY ?? '';
const lang = process.env.NEXT_PUBLIC_APP_LANG ?? 'ch';
const langConfigs: LangConfigs = {
    submit: {
        ch: '确认',
        en: 'Confirm'
    },
    tokenCheck: {
        ch: '正在检查令牌...',
        en: 'Checking token...'
    },
    tokenError: {
        ch: '令牌出错了😥请重新发起修改密码请求',
        en: 'Invalid token😥 Please resubmit change password request'
    },
    tokenExpired: {
        ch: '令牌逾期或已被使用过😥请重新发起修改密码请求',
        en: 'Token expired😥 Please resubmit change password request'
    },
    backToHome: {
        ch: '返回主页',
        en: 'Back to home'
    },
    resetPassword: {
        ch: '设置新密码',
        en: 'Set your new password'
    },
    newPassword: {
        ch: '新密码',
        en: 'New password'
    },
    repeatPassword: {
        ch: '重复输入新密码',
        en: 'Repeat new password'
    },
    passwordInstructions: {
        ch: '安全性要求：密码长度不小于八个字符，并需包含大小写字母、数字和特殊字符',
        en: 'Security requirements: Password must contain at least eight characters, at least one number and both lower and uppercase letters and special characters'
    },
    passwordNotMatchError: {
        ch: '两次输入的密码不相符',
        en: 'Passwords not match'
    },
    passwordNotSatisfiedError: {
        ch: '新密码不符合安全性要求',
        en: 'Passwords do not meet security requirements'
    },
    recaptchaLang: {
        ch: 'zh-CN',
        en: 'en'
    },
    goodResult: {
        ch: '新密码设置成功😄现在就返回主页登录吧~',
        en: 'All set😄 Ready to go!'
    },
    badResult: {
        ch: '新密码设置失败😥请稍后重试或者联系我们的管理员',
        en: 'Failed to set new password😥 Please try again later or contact our Webmaster'
    }
}

const ResetPassword = () => {
    let recaptcha: any;
    const router = useRouter();
    const { requestInfo } = router.query;
    const [processStates, setProcessStates] = React.useState({
        /**
         * Component list:
         * - tokencheck
         * - resetpasswordform
         * - resetpasswordresult
         */
        componentOnDisplay: 'tokencheck',
        recaptchaResponse: '',
        errorContent: '',
        displayError: false,
        displayCircularProgress: false,
        resultContent: '',
        memberId: '',
        resetPasswordToken: ''
    });

    /**
     * Verify request info
     */
    React.useEffect(() => { checkToken() }, [processStates.recaptchaResponse]);
    const checkToken = async () => {
        // step #1 execute recaptcha
        recaptcha?.execute();
        if ('' === processStates.recaptchaResponse) {
            return; // ReCAPTCHA challenge not ready
        }
        if ('' === processStates.resetPasswordToken) {
            // step #2 (token check) post request with requestInfo and recaptch token
            const resp = await fetch(`/api/member/behaviour/resetpassword/verify?requestInfo=${requestInfo}&recaptchaResponse=${processStates.recaptchaResponse}`);
            if (200 === resp.status) {
                recaptcha?.reset();
                const { memberId, resetPasswordToken } = await resp.json();
                setProcessStates({ ...processStates, componentOnDisplay: 'resetpasswordform', memberId, resetPasswordToken })
            } else {
                console.log(await resp.text());
                setProcessStates({ ...processStates, componentOnDisplay: 'resetpasswordresult', resultContent: langConfigs.tokenError[lang] });
            }
        } else {
            // step #3 (submit form) post request with memberId, resetPasswordToken, password (raw), recaptcha token
            setProcessStates({ ...processStates, displayCircularProgress: true });
            const resp = await fetch(`/api/member/behaviour/resetpassword?recaptchaResponse=${processStates.recaptchaResponse}`, {
                method: 'POST',
                body: JSON.stringify({
                    memberId: processStates.memberId,
                    resetPasswordToken: processStates.resetPasswordToken,
                    password: passwordStates.password
                })
            })
            // step #4 display result
            if (200 === resp.status) {
                setProcessStates({ ...processStates, componentOnDisplay: 'resetpasswordresult', displayCircularProgress: false, resultContent: langConfigs.goodResult[lang] })
            } else if ([403, 404].includes(resp.status)) {
                setProcessStates({ ...processStates, componentOnDisplay: 'resetpasswordresult', displayCircularProgress: false, resultContent: langConfigs.tokenExpired[lang] });
            } else {
                setProcessStates({ ...processStates, componentOnDisplay: 'resetpasswordresult', displayCircularProgress: false, resultContent: langConfigs.badResult[lang] })
            }
        }
    }

    /**
     * Handle password inputs
     */
    const [passwordStates, setPasswordStates] = React.useState({
        password: '',
        repeatpassword: '',
        showPassword: false
    });
    const handleChange = (prop: keyof PasswordState) => (event: React.ChangeEvent<HTMLInputElement>) => {
        setPasswordStates({ ...passwordStates, [prop]: event.target.value });
    };
    const handleShowPassword = () => {
        setPasswordStates({
            ...passwordStates,
            showPassword: !passwordStates.showPassword
        })
    }
    const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
    };

    /**
     * Handle ReCAPTCHA challenge
     */
    const handleRecaptchaChange = (value: any) => {
        if (!!value) {
            setProcessStates({ ...processStates, recaptchaResponse: value })
        } else {
            setProcessStates({ ...processStates })
        }
    }

    /**
     * Handle submit
     */
    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        // step #1 check if passwords match
        if (passwordStates.password !== passwordStates.repeatpassword) {
            setProcessStates({ ...processStates, errorContent: langConfigs.passwordNotMatchError[lang], displayError: true })
            return;
        } else {
            setProcessStates({ ...processStates, displayError: false })
        }
        // step #2 check if passwords satisfiy the rule
        if (!verifyPassword(passwordStates.password)) {
            setProcessStates({ ...processStates, errorContent: langConfigs.passwordNotSatisfiedError[lang], displayError: true })
            return;
        } else {
            setProcessStates({ ...processStates, displayError: false })
        }
        // step #3 execute recaptcha, again
        recaptcha?.execute();
    }

    return (
        <>
            <Container component='main' maxWidth={'xs'} >
                {/* tokencheck */}
                <Box sx={{ mt: '18rem', mb: '10rem', display: 'tokencheck' === processStates.componentOnDisplay ? 'block' : 'none' }}>
                    <Typography textAlign={'center'}>{langConfigs.tokenCheck[lang]}</Typography>
                </Box>
                {/* resetpasswordresult */}
                <Box sx={{ mt: '18rem', mb: '10rem', display: 'resetpasswordresult' === processStates.componentOnDisplay ? 'block' : 'none' }}>
                    <Typography textAlign={'center'}>{processStates.resultContent}</Typography>
                    <BackToHomeButtonGroup />
                </Box>
                {/* resetpasswordform */}
                <Stack sx={{ mt: '5rem', paddingX: 5.4, display: 'resetpasswordform' === processStates.componentOnDisplay ? 'block' : 'none' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <Link href="/">
                            {/* TODO: avatar src should be member's avatar url */}
                            <Avatar src={`${domain}/favicon.ico`} sx={{ width: 56, height: 56 }} />
                        </Link>
                    </Box>
                    <Typography component="h1" variant="h5" sx={{ textAlign: 'center', mt: 2 }}>
                        {langConfigs.resetPassword[lang]}
                    </Typography>
                    <Stack component={'form'} spacing={2} sx={{ mt: 4 }} onSubmit={handleSubmit} >
                        {/* password check result */}
                        <Box sx={{ display: processStates.displayError ? 'block' : 'none' }}>
                            <Alert severity='error' >
                                <strong>{processStates.errorContent}</strong>
                            </Alert>
                        </Box>
                        <FormControl variant='outlined'>
                            <InputLabel htmlFor='outlined-adornment-new-password'>{langConfigs.newPassword[lang]}</InputLabel>
                            <OutlinedInput
                                required
                                id={'outlined-adornment-new-password'}
                                label={langConfigs.newPassword[lang]}
                                type={passwordStates.showPassword ? 'text' : 'password'}
                                value={passwordStates.password}
                                onChange={handleChange('password')}
                                endAdornment={
                                    <InputAdornment position="end">
                                        <IconButton
                                            aria-label="toggle password visibility"
                                            onClick={handleShowPassword}
                                            onMouseDown={handleMouseDownPassword}
                                            edge="end"
                                        >
                                            {passwordStates.showPassword ? <VisibilityIcon /> : <VisibilityOffIcon />}
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
                                type={passwordStates.showPassword ? 'text' : 'password'}
                                value={passwordStates.repeatpassword}
                                onChange={handleChange('repeatpassword')}
                                endAdornment={
                                    <InputAdornment position="end">
                                        <IconButton
                                            aria-label="toggle password visibility"
                                            onClick={handleShowPassword}
                                            onMouseDown={handleMouseDownPassword}
                                            edge="end"
                                        >
                                            {passwordStates.showPassword ? <VisibilityIcon /> : <VisibilityOffIcon />}
                                        </IconButton>
                                    </InputAdornment>
                                }
                            />
                        </FormControl>
                        <Box>
                            <Button type='submit' fullWidth variant='contained'>
                                <Typography sx={{ display: !processStates.displayCircularProgress ? 'block' : 'none' }}>
                                    {langConfigs.submit[lang]}
                                </Typography>
                                <CircularProgress sx={{ color: 'white', display: processStates.displayCircularProgress ? 'block' : 'none' }} />
                            </Button>
                        </Box>
                    </Stack>
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

export default ResetPassword;