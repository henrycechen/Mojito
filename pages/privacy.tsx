import * as React from 'react';
import Head from 'next/head';

import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

import Copyright from '../ui/Copyright';
import Guidelines from '../ui/Guidelines';
import Navbar from '../ui/Navbar';
import Terms from '../ui/Terms';
import ThemeSwitch from '../ui/ThemeSwitch';

import { LangConfigs } from '../lib/types';
import { getRandomHexStr } from '../lib/utils/create';

const desc = process.env.NEXT_PUBLIC_APP_DESCRIPTION ?? '';
const lang = process.env.NEXT_PUBLIC_APP_LANG ?? 'tw';
const langConfigs: LangConfigs = {
    title: {
        tw: '軟體使用隱私權聲明',
        cn: '软件使用隐私权声明',
        en: 'Software Usage Privacy Statement'
    },
    publishedDate: {
        tw: `更新日期：2023年2月13日`,
        cn: `更新日期：2023年2月13日`,
        en: `Updated: February 13, 2022`
    },
    terms: {
        tw: [
            '1. 我們重視您的隱私權：我們非常重視您的隱私權，並將按照法律法規的要求嚴格保護您的個人信息。',
            '2. 信息收集：我們可能會收集您在使用本軟體時提供的個人信息，例如您的姓名、電子郵件地址、聯繫方式等，但我們會嚴格保密您的個人信息。',
            '3. 信息使用：我們僅會在以下情況使用您的個人信息：向您提供服務、改善我們的產品和服務、聯繫您有關本軟體的事宜、統計分析、完成法律所要求的任務。',
            '4. 信息共享：我們不會將您的個人信息與任何第三方共享，除非：得到您的同意、法律法規要求、保護我們的合法權益。',
            '5. 信息安全：我們將採取合理的技術和組織措施保護您的個人信息安全，防止信息的洩露、篡改和毀損。',
            '請您遵守以上聲明，使用本軟體前請仔細閱讀。'
        ],
        cn: [
            '1. 我们重视您的隐私权：我们非常重视您的隐私权，并将按照法律法规的要求严格保护您的个人信息。',
            '2. 信息收集：我们可能会收集您在使用本软件时提供的个人信息，例如您的姓名、电子邮件地址、联系方式等，但我们会严格保密您的个人信息。',
            '3. 信息使用：我们仅会在以下情况使用您的个人信息：向您提供服务、改善我们的产品和服务、联系您有关本软件的事宜、统计分析、完成法律所要求的任务。',
            '4. 信息共享：我们不会将您的个人信息与任何第三方共享，除非：得到您的同意、法律法规要求、保护我们的合法权益。',
            '5. 信息安全：我们将采取合理的技术和组织措施保护您的个人信息安全，防止信息的泄露、篡改和毁损。',
            '请遵守以上声明，使用本软件前请仔细阅读。'
        ],
        en: [
            '1. We attach great importance to your privacy: We attach great importance to your privacy and will strictly protect your personal information in accordance with the requirements of laws and regulations.',
            '2. Information collection: We may collect personal information you provide when using this software, such as your name, email address, contact information, etc., but we will keep your personal information strictly confidential.',
            '3. Use of information: We will only use your personal information in the following situations: to provide you with services, improve our products and services, contact you about this software, statistical analysis, and complete tasks required by law.',
            '4. Information sharing: We will not share your personal information with any third party, unless: with your consent, required by laws and regulations, to protect our legitimate rights and interests.',
            '5. Information security: We will take reasonable technical and organizational measures to protect the security of your personal information and prevent information leakage, tampering and damage.',
            'Please abide by the above statement, please read carefully before using this software.'
        ],
    }
};

/**
 * Last update:
 * - 25/05/2023 v0.1.2 New layout applied
*/
export default function PrivacyPolicy() {

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
                    {{ tw: '隱私權聲明', cn: '隐私权声明', en: 'License & Agreement' }[processStates.lang]}
                </title>
                <meta
                    name="description"
                    content={desc}
                    key="desc"
                />
            </Head>
            <Navbar lang={processStates.lang} />
            <Container sx={{ minHeight: 600 }}>
                <Grid container>
                    <Grid item md={1}></Grid>
                    <Grid item md={3} sx={{ p: 1, paddingTop: 16 }}>
                        <Typography variant={'h5'}>{langConfigs.title[processStates.lang]}</Typography>
                        <Typography variant={'body2'}>{langConfigs.publishedDate[processStates.lang]}</Typography>
                        <Button variant='text' sx={{ textTransform: 'none' }} onClick={setLang}>
                            <Typography variant={'body2'}>{'繁|简|English'}</Typography>
                        </Button>
                    </Grid>
                    <Grid item md={7} sx={{ p: 1, paddingTop: { xs: 4, sm: 8, md: 16 } }}>
                        <Stack direction={'column'} spacing={1}>
                            {langConfigs.terms[processStates.lang].map((term: string) => <Typography key={getRandomHexStr()} variant={'body1'}>{term}</Typography>)}
                        </Stack>
                    </Grid>
                    <Grid item md={1}></Grid>
                </Grid>
            </Container>

            <Copyright sx={{ mt: 8 }} />
            <Guidelines lang={processStates.lang} />
            <Terms sx={{ mb: 2 }} lang={processStates.lang} />
            <ThemeSwitch sx={{ mb: 8 }} />
        </>
    );
}