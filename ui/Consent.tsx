import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";

import { LangConfigs } from '../lib/types';

const lang = process.env.NEXT_PUBLIC_APP_LANG ?? 'ch';
const langConfigs: LangConfigs = {
    title: {
        ch: '* 注册即同意我们的',
        en: '* By signing up you agree to our '
    },
    and: {
        ch: '和',
        en: ' and '
    },
    guidelines: {
        ch: '社区准则',
        en: 'community guidelines'
    },
    agreement: {
        ch: '服务协议',
        en: 'service agreement'
    }
}

export default () => {
    return (
        <Typography variant="body2" color="text.secondary" align="center">
            {langConfigs.title[lang]}
            <Link color="inherit" href="/terms/community-gidelines" >
                {langConfigs.guidelines[lang]}
            </Link>
            {langConfigs.and[lang]}
            <Link color="inherit" href="/terms/service-agreement" >
                {langConfigs.agreement[lang]}
            </Link>
        </Typography>
    );
}