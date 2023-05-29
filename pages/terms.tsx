import * as React from 'react';
import Head from 'next/head';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { LangConfigs } from '../lib/types';
import { getRandomHexStr } from '../lib/utils/create';

import BackwardToSettingsButton from '../ui/BackwardButton';
import Copyright from '../ui/Copyright';
import Guidelines from '../ui/Guidelines';
import Navbar from '../ui/Navbar';
import Terms from '../ui/Terms';
import ThemeSwitch from '../ui/ThemeSwitch';

const desc = process.env.NEXT_PUBLIC_APP_DESCRIPTION ?? '';
const lang = process.env.NEXT_PUBLIC_APP_LANG ?? 'tw';
const langConfigs: LangConfigs = {
    title: {
        tw: '軟體使用許可及服務協議',
        cn: '软件使用许可及服务协议',
        en: 'Software license and service agreement'
    },
    publishedDate: {
        tw: `更新日期：2023年2月13日`,
        cn: `更新日期：2023年2月13日`,
        en: `Updated: February 13, 2022`
    },
    terms: {
        tw: [
            '1. 版權聲明：本軟體受著作權法和國際版權公約的保護。未經我們書面許可，您不得以任何方式複制、使用或散佈本軟體。',
            '2. 服務聲明：我們將按照您在使用本軟體時的需求提供服務，但我們不對因系統故障、網路故障等因素導致的服務中斷和數據丟失負責。',
            '3. 隱私聲明：我們將嚴格保護您的個人信息，不會將您的個人信息與任何第三方共享，除非得到您的同意或法律法規要求。',
            '4. 免責聲明：我們不對因使用本軟體造成的任何直接、間接、偶然、特殊或後果性損害負責，也不對因您的使用行為造成的任何損失負責。',
            '5. 更新聲明：我們有權在不事先通知您的情況下對本軟體進行更新，並不對因更新造成的任何影響負責。',
            '請您遵守以上聲明，使用本軟體前請仔細閱讀。',
        ],
        cn: [
            '1. 版权声明：本软件受著作权法和国际版权公约的保护。未经我们书面许可，您不得以任何方式复制、使用或散布本软件',
            '2. 服务声明：我们将按照您在使用本软件时的需求提供服务，但我们不对因系统故障、网路故障等因素导致的服务中断和数据丢失负责。',
            '3. 隐私声明：我们将严格保护您的个人信息，不会将您的个人信息与任何第三方共享，除非得到您的同意或法律法规要求。',
            '4. 免责声明：我们不对因使用本软件造成的任何直接、间接、偶然、特殊或后果性损害负责，也不对因您的使用行为造成的任何损失负责。',
            '5. 更新声明：我们有权在不事先通知您的情况下对本软件进行更新，并不对因更新造成的任何影响负责。',
            '请遵守以上声明，使用本软件前请仔细阅读。'
        ],
        en: [
            '1. Copyright Statement: This software is protected by copyright laws and international copyright conventions. You may not copy, use or distribute this software in any way without our written permission.',
            '2. Service statement: We will provide services according to your needs when using this software, but we are not responsible for service interruption and data loss caused by system failures, network failures and other factors.',
            '3. Privacy statement: We will strictly protect your personal information, and will not share your personal information with any third party, unless we have your consent or are required by laws and regulations.',
            '4. Disclaimer: We are not responsible for any direct, indirect, incidental, special or consequential damages caused by the use of this software, nor are we responsible for any losses caused by your use.',
            '5. Update statement: We have the right to update this software without prior notice to you, and we are not responsible for any impact caused by the update.',
            'Please abide by the above statement, please read carefully before using this software.'
        ],
    }
};

/**
 * Last update:
 * - 25/05/2023 v0.1.2 New layout applied
 */
export default function LicenseAndAgreement() {

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
                    {{ tw: '服務協議', cn: '服务协议', en: 'License & Agreement' }[processStates.lang]}
                </title>
                <meta
                    name='description'
                    content={desc}
                    key='desc'
                />
            </Head>
            <Navbar lang={processStates.lang} />
            <BackwardToSettingsButton />
            <Container sx={{ minHeight: { xs: 1000, sm: 1000, md: 800 } }}>
                <Grid container>
                    <Grid item md={1}></Grid>
                    <Grid item md={3} sx={{ px: 1, pt: { xs: 8, sm: 8, md: 24 } }}>
                        <Typography variant={'h5'}>{langConfigs.title[processStates.lang]}</Typography>
                        <Typography variant={'body2'}>{langConfigs.publishedDate[processStates.lang]}</Typography>
                        <Button variant='text' sx={{ textTransform: 'none' }} onClick={setLang}>
                            <Typography variant={'body2'}>{'繁|简|English'}</Typography>
                        </Button>
                    </Grid>
                    <Grid item md={7} sx={{ px: 1, pt: { xs: 4, sm: 8, md: 24 } }}>
                        <Stack direction={'column'} spacing={1}>
                            {langConfigs.terms[processStates.lang].map((term: string) => <Typography key={getRandomHexStr()} variant={'body1'}>{term}</Typography>)}
                        </Stack>
                    </Grid>
                    <Grid item md={1}></Grid>
                </Grid>
            </Container>
            <Box sx={{ display: { xs: 'none', sm: 'none', md: 'block' } }}>
                <Copyright sx={{ mt: 8 }} />
                <Guidelines lang={processStates.lang} />
                <Terms sx={{ mb: 2 }} lang={processStates.lang} />
                <ThemeSwitch sx={{ mb: '8rem' }} />
            </Box>
        </>
    );
}