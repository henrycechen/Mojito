import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';

import { LangConfigs } from '../lib/types';

const lang = process.env.NEXT_PUBLIC_APP_LANG ?? 'tw';
const langConfigs: LangConfigs = {
    about: {
        tw: '關於我們',
        cn: '关于我们',
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