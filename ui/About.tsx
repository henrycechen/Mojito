import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';

import { LangConfigs } from '../lib/types';

const lang = process.env.NEXT_PUBLIC_APP_LANG ?? 'ch';
const langConfigs: LangConfigs = {
    about: {
        ch: '关于我们',
        en: 'About us'
    }
}

export default (props: any) => {
    return (
        <Typography variant='body2' color='text.secondary' align='center' {...props}>
            <Link color='inherit' href='/about' underline={'none'}>
                {langConfigs.about[lang]}
            </Link>
        </Typography>
    );
}