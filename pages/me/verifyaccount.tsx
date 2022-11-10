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

interface PasswordStates {
    password: string;
    repeatpassword: string;
    showpassword: boolean;
}

const recaptchaClientKey = process.env.NEXT_PUBLIC_INVISIABLE_RECAPTCHA_SITE_KEY ?? '';
const lang = process.env.NEXT_PUBLIC_APP_LANG ?? 'ch';
const langConfigs: LangConfigs = {
    accountverify: {
        ch: '正在激活您的账户...',
        en: 'Activating your account...'
    },
    recaptchaLang: {
        ch: 'zh-CN',
        en: 'en'
    },
    goodResult: {
        ch: '账户已激活😄现在就返回主页登录吧~',
        en: 'All set😄 Ready to go!'
    },
    badResult: {
        ch: '账户激活失败😥请稍后重试或者联系我们的管理员',
        en: 'Failed to activate your account😥 Please try again later or contact our Webmaster'
    }
}

const VerifyAccount = () => {
    let recaptcha: any;
    const router = useRouter();
    const { requestInfo } = router.query;
    // if (!!requestInfo) { router.push('/') }

    // Decalre process states
    const [processStates, setProcessStates] = React.useState({
        /**
         * Component list:
         * - accountverify
         * - accountverifyresult
         */
        componentOnDisplay: 'accountverify',
        recaptchaResponse: '',
        resultContent: '',
    });

    // Handle process states change
    React.useEffect(() => { post() }, [processStates.recaptchaResponse]);
    const post = async () => {
        if ('accountverify' === processStates.componentOnDisplay && '' === processStates.recaptchaResponse) {
            recaptcha?.execute();
            return;
        }
        if ('' === processStates.recaptchaResponse) {
            // ReCAPTCHA challenge is not ready
            return;
        }
        const resp = await fetch(`/api/member/behaviour/signup/verify?requestInfo=${requestInfo}&recaptchaResponse=${processStates.recaptchaResponse}`, { method: 'POST' })
        if (200 === resp.status) {
            setProcessStates({ ...processStates, componentOnDisplay: 'resetpasswordresult', resultContent: langConfigs.goodResult[lang] })
        } else {
            setProcessStates({ ...processStates, componentOnDisplay: 'resetpasswordresult', resultContent: langConfigs.badResult[lang] })
        }

    }

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
            <Container component='main' maxWidth={'xs'} >
                {/* accountverify */}
                <Box sx={{ mt: '18rem', mb: '10rem', display: 'accountverify' === processStates.componentOnDisplay ? 'block' : 'none' }}>
                    <Typography textAlign={'center'}>{langConfigs.accountverify[lang]}</Typography>
                </Box>
                {/* accountverifyresult */}
                <Box sx={{ mt: '18rem', mb: '10rem', display: 'accountverifyresult' === processStates.componentOnDisplay ? 'block' : 'none' }}>
                    <Typography textAlign={'center'}>{processStates.resultContent}</Typography>
                    <BackToHomeButtonGroup />
                </Box>
                <Copyright sx={{ mt: 8, mb: 4 }} />
            </Container>
            <ReCAPTCHA
                sitekey={recaptchaClientKey}
                size={'invisible'}
                hl={langConfigs.recaptchaLang[lang]}
                ref={(ref: any) => ref && (recaptcha = ref)}
                onChange={handleRecaptchaChange}
            />
        </>
    )
}

export default VerifyAccount;