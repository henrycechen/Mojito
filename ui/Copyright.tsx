import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import { LangConfigs } from '../lib/types';

type TComponentProps = {
    lang?: string,
    sx: any
}

const appName = process.env['NEXT_PUBLIC_APP_NAME'] ?? 'Mojito';
const langConfigs: LangConfigs = {
    guidelines: {
        tw: '社區準則',
        cn: '社区准则',
        en: 'Community guidelines,'
    },
    privacy: {
        tw: '隱私政策',
        cn: '隐私政策',
        en: 'Privacy policy,'
    },
}

export default function Copyright(props: TComponentProps) {
    const { lang, sx } = props;
    return (
        <Typography variant={'body2'} color={'text.secondary'} align={'center'} {...sx}>
            {'Copyright © '}
            <Link color={'inherit'} href={'/'} underline={'none'}>
                {appName}
            </Link>
            {' 2022-'}
            {new Date().getFullYear()}
            {' '}
            <Link color={'inherit'} href={'/guidelines'} underline={'none'}>
                {langConfigs.guidelines[lang ?? 'tw']}
            </Link>
            {' '}
            <Link color={'inherit'} href={'/privacy'} underline={'none'}>
                {langConfigs.privacy[lang ?? 'tw']}
            </Link>
        </Typography>
    );
}