import * as React from 'react';
import { NextPageContext } from 'next/types';
import { useRouter } from 'next/router';
import { signOut, getProviders, getCsrfToken, useSession } from 'next-auth/react';

import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { LangConfigs } from '../lib/types';
import { provideAvatarImageUrl } from '../lib/utils/for/member';

import Copyright from '../ui/Copyright';
import Guidelines from '../ui/Guidelines';
import LangSwitch from '../ui/LangSwitch';
import Terms from '../ui/Terms';
import ThemeSwitch from '../ui/ThemeSwitch';

export async function getServerSideProps(context: NextPageContext) {
    return {
        props: {
            providers: await getProviders(),
            csrfToken: await getCsrfToken(context),
        }
    };
}

const imageDomain = process.env.NEXT_PUBLIC_IMAGE_DOMAIN ?? '';
const lang = process.env.NEXT_PUBLIC_APP_LANG ?? 'tw';
const langConfig: LangConfigs = {
    appSignout: {
        tw: '確認登出嚒?',
        cn: '确认登出嘛?',
        en: 'Confirm to sign out?'
    },
    confirm: {
        tw: '登出',
        cn: '登出',
        en: 'Sign out'
    }

};

/**
 * Last update:
 * - 25/05/2023 v0.1.2 New layout applied
 */
const SignOut = () => {

    const router = useRouter();

    const { data: session } = useSession();

    const [memberInfoStates, setMemberInfoStates] = React.useState({
        memberId: ''
    });

    React.useEffect(() => {
        if (!session) {
            router.push('/');
        } else {
            const userSession: any = { ...session };
            setMemberInfoStates({ memberId: userSession?.user?.id ?? '' });
        }
    }, []);

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

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        signOut();
    };

    return (
        <Container component='main' maxWidth='xs'>
            <Stack sx={{ mt: '5rem' }}>
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <Avatar src={provideAvatarImageUrl(memberInfoStates.memberId, imageDomain)} sx={{ width: 56, height: 56 }} />
                </Box>
                <Typography variant='h5' sx={{ textAlign: 'center', pt: 2 }}>
                    {langConfig.appSignout[processStates.lang]}
                </Typography>
                <Stack component={'form'} sx={{ pt: 10 }} onSubmit={handleSubmit}>
                    <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'center' }}>

                        <Button type='submit' variant='contained'>
                            {langConfig.confirm[processStates.lang]}
                        </Button>
                    </Box>
                </Stack>
            </Stack>
            <Copyright sx={{ mt: 16 }} />
            <Guidelines lang={processStates.lang} />
            <Terms sx={{ mb: 2 }} lang={processStates.lang} />
            <LangSwitch setLang={setLang} />
            <ThemeSwitch sx={{ mb: 8 }} />
        </Container>
    );
};

export default SignOut;