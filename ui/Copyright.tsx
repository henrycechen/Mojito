import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';

import { LangConfigs } from '../lib/types';

const appName = process.env['APP_FULL_NAME'] ?? 'Mojito New Zealand';
const lang = process.env.NEXT_PUBLIC_APP_LANG ?? 'ch';
const langConfigs: LangConfigs = {

    guidelines: {
        ch: '社区准则',
        en: 'community guidelines'
    }
}

export default (props: any) => {
    return (
        <Typography variant="body2" color="text.secondary" align="center" {...props}>
            {'Copyright © '}
            <Link color="inherit" href="/" underline={'none'}>
                {appName}
            </Link>
            {' '}
            {new Date().getFullYear()}
            {' '}
            <Link color="inherit" href="/" underline={'none'}>
                {langConfigs.guidelines[lang]}
            </Link>
        </Typography>
    );
}