import * as React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { LangConfigs } from '../lib/types';

import Navbar from '../ui/Navbar';
import BackToHomeButtonGroup from '../ui/BackToHomeButtonGroup';
import Copyright from '../ui/Copyright';
import Guidelines from '../ui/Guidelines';
import LangSwitch from '../ui/LangSwitch';
import Terms from '../ui/Terms';

export async function getStaticProps() {
    return {
        props: {
            errorMessage: {
                tw: [
                    '我們遭遇了一些技術難題😟',
                    '也許有些Bugs出現在了我們的伺服器軟體中🤯',
                    '我們的伺服器遭遇了一些不可抗力🥲',
                    '我們的伺服器剛剛在發呆😴',
                    '我們的伺服器在和它的朋友們喝Mojito😳'
                ][Math.floor(Math.random() * 5)],
                cn: [
                    '我们遇到了一些技术难题😟',
                    '可能有些Bugs出现在了我们的服务器程序中🤯',
                    '我们的服务器遭遇了某些不可抗力🥲',
                    '我们的服务器刚刚开小差了😴',
                    '我们的服务器正在和它的朋友们喝Mojito😳'
                ][Math.floor(Math.random() * 5)],
                en: 'Something went wrong in our server.'
            }
        },
    };
}

const desc = process.env.NEXT_PUBLIC_APP_DESCRIPTION ?? '';
const lang = process.env.NEXT_PUBLIC_APP_LANG ?? 'tw';
const langConfigs: LangConfigs = {
    title: {
        tw: '出錯啦',
        cn: '出错啦',
        en: 'Opps'
    },
    backToHome: {
        tw: '返回主頁',
        cn: '返回主页',
        en: 'Back to home'
    },
    errors: {
        EmailAddressVerificationRequired: {
            tw: ['您需要完整對您賬戶的電郵驗證', '如有疑惑請聯係我們的管理員'],
            cn: ['您需要对您的账户完成邮箱验证', '，如有问题请联系我们的管理员'],
            en: ['You will need to complete email address verification before signin', ', please try again later or contact our Webmaster']
        },
        DefectiveMember: {
            tw: ['您的賬戶出錯了', '，請聯係我們的管理員'],
            cn: ['您的账户存在错误', '，请联系我们的管理员'],
            en: ['An error occurred with your membership', ', please contact our Webmaster']
        },
        MemberSuspendedOrDeactivated: {
            tw: ['您的賬戶已停用或被注銷', '如有疑惑請聯係我們的管理員'],
            cn: ['您的账户已停用或已被注销', '，如有问题请联系我们的管理员'],
            en: ['Your membership has been suspended or deactivated', ', please try again later or contact our Webmaster']
        }
    }
};

/**
 * Last update:
 * - 25/05/2023 v0.1.2 New layout applied
 */
export default function Error({ errorMessage }: any) {

    const router = useRouter();

    type TProcessStates = {
        lang: string;
    };

    const [processStates, setProcessStates] = React.useState<TProcessStates>({
        lang: lang
    });

    const setLang = () => {
        if ('tw' === processStates.lang) { setProcessStates({ ...processStates, lang: 'cn' }); }
        if ('cn' === processStates.lang) { setProcessStates({ ...processStates, lang: 'en' }); }
        if ('en' === processStates.lang) { setProcessStates({ ...processStates, lang: 'tw' }); }
    };

    return (
        <>
            <Head>
                <title>
                    {{ tw: '出錯啦', cn: '出错啦', en: 'Opps' }[processStates.lang]}
                </title>
                <meta
                    name='description'
                    content={desc}
                    key='desc'
                />
            </Head>
            <Navbar lang={processStates.lang} />
            <Stack
                sx={{ backgroundColor: '#2DAAE0', height: '100vh' }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: '10rem' }}>
                    <Typography
                        sx={{
                            color: 'white',
                            fontSize: { xs: '5rem', sm: '7rem' },
                            fontWeight: 1000,
                            letterSpacing: '.2rem',
                            maxWidth: 460,
                            textAlign: 'center'
                        }}>
                        {langConfigs.title[processStates.lang]}
                    </Typography>
                </Box>
                <Box sx={{ color: 'white', textAlign: 'center', mt: '3rem', padding: 4 }}>
                    {!!router.query.error && Object.keys(langConfigs.errors).includes('string' === typeof router.query.error ? router.query.error : '') &&
                        <Typography variant='h6' sx={{ color: 'white', textAlign: 'center' }}>
                            {langConfigs.errors['string' === typeof router.query.error ? router.query.error : ''][processStates.lang]}
                        </Typography>
                    }
                    {!router.query.error &&
                        <Typography variant='h6' sx={{ color: 'white', textAlign: 'center' }}>
                            {errorMessage[processStates.lang]}
                        </Typography>
                    }
                </Box>

                <BackToHomeButtonGroup color={'white'} lang={processStates.lang} />

                <Copyright sx={{ mt: '10rem', color: 'white' }} />
                <Guidelines sx={{ color: 'white' }} lang={processStates.lang} />
                <Terms sx={{ mb: 2, color: 'white' }} lang={processStates.lang} />
                <LangSwitch sx={{ mb: 8 }} setLang={setLang} />
            </Stack>
        </>
    );
}