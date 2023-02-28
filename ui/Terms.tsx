import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import { LangConfigs } from '../lib/types';

type TComponentProps = {
    lang?: string,
    sx?: any
}

const langConfigs: LangConfigs = {
    terms: {
        tw: '服務協議',
        cn: '服务协议',
        en: 'Service agreement,'
    },
    about: {
        tw: '關於我們',
        cn: '关于我们',
        en: 'About us'
    }
}

export default function TermsFooter(props: TComponentProps) {
    const { lang, sx } = props;
    return (
        <Typography variant={'body2'} color={'text.secondary'} align={'center'} {...sx}>
            <Link color={'inherit'} href={'/terms'} underline={'none'}>
                {langConfigs.terms[lang ?? 'tw']}
            </Link>
            {' '}
            <Link color={'inherit'} href={'/about'} underline={'none'}>
                {langConfigs.about[lang ?? 'tw']}
            </Link>
        </Typography>
    );
}