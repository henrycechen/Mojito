import * as React from 'react';
import { useRouter } from 'next/router';

import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import ReCAPTCHA from "react-google-recaptcha";

import { LangConfigs } from '../lib/types';

import Copyright from '../ui/Copyright';
import BackToHomeButtonGroup from '../ui/BackToHomeButtonGroup';
import Guidelines from '../ui/Guidelines';
import LangSwitch from '../ui/LangSwitch';
import Terms from '../ui/Terms';
import ThemeSwitch from '../ui/ThemeSwitch';

const recaptchaClientKey = process.env.NEXT_PUBLIC_INVISIABLE_RECAPTCHA_SITE_KEY ?? '';
const lang = process.env.NEXT_PUBLIC_APP_LANG ?? 'tw';
const langConfigs: LangConfigs = {
    accountverify: {
        tw: '正在激活您的账户...',
        cn: '正在激活您的账户...',
        en: 'Activating your account...'
    },
    recaptchaLang: {
        tw: 'zh-TW',
        cn: 'zh-CN',
        en: 'en'
    },
    goodResult: {
        tw: '账户已激活😄现在就返回主页登录吧~',
        cn: '账户已激活😄现在就返回主页登录吧~',
        en: 'All set😄 Ready to go!'
    },
    badResult: {
        tw: '账户激活失败😥请稍后重试或者联系我们的管理员',
        cn: '账户激活失败😥请稍后重试或者联系我们的管理员',
        en: 'Failed to activate your account😥 Please try again later or contact our Webmaster'
    }
};

/**
 * Last update:
 * - 25/05/2023 v0.1.2 New layout applied
 */
const VerifyEmailAddress = () => {
    let recaptcha: any;
    
    const router = useRouter();

    type TProcessStates = {
        lang: string;
        componentOnDisplay: 'accountverify' | 'accountverifyresult';
        requestInfo: string;
        recaptchaResponse: string;
        resultContent: { [key: string]: string; };
    };

    const [processStates, setProcessStates] = React.useState<TProcessStates>({
        lang: lang,
        /**
         * Component list:
         * - accountverify
         * - accountverifyresult
         */
        componentOnDisplay: 'accountverify',
        requestInfo: '',
        recaptchaResponse: '',
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
    React.useEffect(() => {
        if (Object.keys(router.query).length === 0) {
            return;
        }
        const { requestInfo } = router.query;
        if ('string' === typeof requestInfo) {
            setProcessStates({ ...processStates, requestInfo: requestInfo });
            recaptcha?.execute();
            return;
        } else {
            router.push('/');
            return;
        }
    }, [router]);

    React.useEffect(() => { post(); }, [processStates.recaptchaResponse]);
    const post = async () => {
        if ('' === processStates.requestInfo) {
            // router.query is not ready
            return;
        }
        if ('' === processStates.recaptchaResponse) {
            // ReCAPTCHA challenge is not ready
            return;
        }
        const resp = await fetch(`/api/member/signup/verify?requestInfo=${processStates.requestInfo}&recaptchaResponse=${processStates.recaptchaResponse}`, { method: 'POST' });
        if (200 === resp.status) {
            setProcessStates({ ...processStates, componentOnDisplay: 'accountverifyresult', resultContent: langConfigs.goodResult });
        } else {
            setProcessStates({ ...processStates, componentOnDisplay: 'accountverifyresult', resultContent: langConfigs.badResult });
        }
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
            <Container component='main' maxWidth={'xs'} >
                {/* accountverify */}
                <Box sx={{ mt: '18rem', mb: '10rem', display: 'accountverify' === processStates.componentOnDisplay ? 'block' : 'none' }}>
                    <Typography textAlign={'center'}>{langConfigs.accountverify[processStates.lang]}</Typography>
                </Box>
                {/* accountverifyresult */}
                <Box sx={{ mt: '18rem', mb: '10rem', display: 'accountverifyresult' === processStates.componentOnDisplay ? 'block' : 'none' }}>
                    <Typography textAlign={'center'}>{processStates.resultContent[processStates.lang]}</Typography>
                    <BackToHomeButtonGroup />
                </Box>

                {/* copyright */}
                <Copyright sx={{ mt: 8 }} />
                <Guidelines lang={processStates.lang} />
                <Terms sx={{ mb: 2 }} lang={processStates.lang} />
                <LangSwitch setLang={setLang} />
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

export default VerifyEmailAddress;