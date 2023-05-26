import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import { LangConfigs } from '../lib/types';

type TComponentProps = {
    lang?: string,
    sx?: any;
};

const langConfigs: LangConfigs = {
    about: {
        tw: '關於我們',
        cn: '关于我们',
        en: 'About us'
    }
};

export default (props: TComponentProps) => {
    const { lang, sx } = props;
    return (
        <Typography variant='body2' color='text.secondary' align='center' {...sx}>
            <Link color='inherit' href='/about' underline={'none'}>
                {langConfigs.about[lang ?? 'tw']}
            </Link>
        </Typography>
    );
};