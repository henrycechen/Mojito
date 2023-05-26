import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import { LangConfigs } from '../lib/types';

type TComponentProps = {
    lang?: string,
    sx?: any
}

const langConfigs: LangConfigs = {
    guidelines: {
        tw: '社區規範',
        cn: '社区规范',
        en: 'Guidelines,'
    },
    privacy: {
        tw: '隱私政策',
        cn: '隐私政策',
        en: 'Privacy'
    },
}

export default function CopyrightFooter(props: TComponentProps) {
    const { lang, sx } = props;
    return (
        <Typography variant={'body2'} color={'text.secondary'} align={'center'} {...sx}>
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