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
        tw: '關於 Mojito',
        cn: '关于 Mojito',
        en: 'About Mojito'
    },
    terms: {
        tw: [
            '欢迎来到我们的在线社区！ 我们的目标是创造一个安全友好的空间，让人们可以聚在一起学习、分享和相互联系。',
            '我们相信每个人都可以做出有价值的贡献，我们致力于营造一个积极和包容的环境，让所有的声音都能被听到和尊重。 无论您是经验丰富的专家还是初学者，我们都鼓励您与社区分享您的知识和经验。',
            '我们致力于确保我们的准则得到遵守，并且每个人都感到欢迎和舒适参与。 如果您有任何问题或疑虑，请随时与我们联系。',
            '我们希望您会喜欢成为 Mojito 的会员，并期待与您的联系！',
            '此致，',
            'The Mojito Team',
        ],
        cn: [
            '歡迎來到我們的在線社區！ 我們的目標是創造一個安全友好的空間，讓人們可以聚在一起學習、分享和相互聯繫。',
            '我們相信每個人都可以做出有價值的貢獻，我們致力於營造一個積極和包容的環境，讓所有的聲音都能被聽到和尊重。 無論您是經驗豐富的專家還是初學者，我們都鼓勵您與社區分享您的知識和經驗。',
            '我們致力於確保我們的準則得到遵守，並且每個人都感到歡迎和舒適參與。 如果您有任何問題或疑慮，請隨時與我們聯繫。',
            '我們希望您會喜歡成為 Mojito 的會員，並期待與您的聯繫！',
            '此致，',
            'The Mojito Team',
        ],
        en: [
            'Welcome to our online community! Our goal is to create a safe and friendly space where people can come together to learn, share, and connect with one another.',
            'We believe that everyone has something valuable to contribute, and we\'re committed to fostering a positive and inclusive environment where all voices are heard and respected. Whether you\'re a seasoned expert or a beginner, we encourage you to share your knowledge and experiences with the community.',
            'We are committed to ensuring that our guidelines are followed and that everyone feels welcome and comfortable participating. If you have any questions or concerns, please don\'t hesitate to reach out to us.',
            'We hope you\'ll enjoy being a member of Mojito and look forward to connecting with you!',
            'Best regards,',
            'The Mojito Team',
        ],
    }
};

/**
 * Last update:
 * - 25/05/2023 v0.1.2 New layout applied
 */
export default function CommunityGidelines() {

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
                    {{ tw: '關於 Mojito', cn: '关于 Mojito', en: 'About Mojito' }[processStates.lang]}
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
                        <Button variant='text' sx={{ textTransform: 'none' }} onClick={setLang}>
                            <Typography variant={'body2'}>{'繁|简|English'}</Typography>
                        </Button>
                    </Grid>
                    <Grid item md={7} sx={{ px: 1, pt: { xs: 8, sm: 8, md: 24 } }}>
                        <Stack direction={'column'} spacing={2}>
                            {langConfigs.terms[processStates.lang].map((term: string) => <Typography key={getRandomHexStr()} variant={'body1'}>{term}</Typography>)}
                        </Stack>
                        <Typography variant={'body1'}>{'webmaster.mojito@gmail.com'}</Typography>
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