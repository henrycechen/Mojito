import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import { LangConfigs } from '../lib/types';

type TComponentProps = {
    lang?: string,
    sx?: any;
};

const langConfigs: LangConfigs = {
    title: {
        tw: '* 注册即同意我们的',
        cn: '* 注冊即爲同意我們的',
        en: '* By signing up you agree to our '
    },
    and: {
        tw: '和',
        cn: '和',
        en: ' and '
    },
    guidelines: {
        tw: '社区规范',
        cn: '社區規範',
        en: 'community guidelines'
    },
    agreement: {
        tw: '服务协议',
        cn: '服務協議',
        en: 'service agreement'
    }
};

export default (props: TComponentProps) => {
    const { lang, sx } = props;
    return (
        <Typography variant='body2' color='text.secondary' align='center'  {...sx}>
            {langConfigs.title[lang ?? 'tw']}
            <Link color='inherit' href='/terms/community-gidelines' >
                {langConfigs.guidelines[lang ?? 'tw']}
            </Link>
            {langConfigs.and[lang ?? 'tw']}
            <Link color='inherit' href='/terms/service-agreement' >
                {langConfigs.agreement[lang ?? 'tw']}
            </Link>
        </Typography>
    );
};