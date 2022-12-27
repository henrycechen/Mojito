import * as React from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import ReCAPTCHA from "react-google-recaptcha";

import { useRouter } from 'next/router';
import { LangConfigs } from '../../lib/types';

import Copyright from '../../ui/Copyright';
import BackToHomeButtonGroup from '../../ui/BackToHomeButtonGroup';

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

    // Decalre process states
    const [processStates, setProcessStates] = React.useState({
        /**
         * Component list:
         * - accountverify
         * - accountverifyresult
         */
        componentOnDisplay: 'accountverify',
        requestInfo: '',
        recaptchaResponse: '',
        resultContent: '',
    });

    // Handle process states change
    React.useEffect(() => {
        if (Object.keys(router.query).length === 0) {
            return;
        }
        const { requestInfo } = router.query
        if ('string' === typeof requestInfo) {
            setProcessStates({ ...processStates, requestInfo: requestInfo });
            recaptcha?.execute();
            return;
        } else {
            router.push('/');
            return;
        }
    }, [router]);

    React.useEffect(() => { post() }, [processStates.recaptchaResponse]);
    const post = async () => {
        if ('' === processStates.requestInfo) {
            // router.query is not ready
            return;
        }
        if ('' === processStates.recaptchaResponse) {
            // ReCAPTCHA challenge is not ready
            return;
        }
        const resp = await fetch(`/api/member/signup/verify?requestInfo=${processStates.requestInfo}&recaptchaResponse=${processStates.recaptchaResponse}`, { method: 'POST' })
        if (200 === resp.status) {
            setProcessStates({ ...processStates, componentOnDisplay: 'accountverifyresult', resultContent: langConfigs.goodResult[lang] })
        } else {
            setProcessStates({ ...processStates, componentOnDisplay: 'accountverifyresult', resultContent: langConfigs.badResult[lang] })
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