import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Link from "@mui/material/Link";
import { LangConfigs } from '../lib/types';

type TComponentProps = {
    color?: string;
    lang?: string,
};

const langConfigs: LangConfigs = {
    backToHome: {
        tw: '返回主頁',
        cn: '返回主页',
        en: 'Back to home'
    }
}

export default (props: TComponentProps) => {
    const {color, lang} = props
    return (
        <>
            <Box sx={{ display: { xs: 'none', sm: 'flex' }, justifyContent: 'center', mt: 2 }}>
                <Link href={'/'} sx={{ color: !color ? 'inherit' : color }} >{langConfigs.backToHome[lang ?? 'tw']}</Link>
            </Box>
            <Box sx={{ display: { xs: 'flex', sm: 'none' }, justifyContent: 'center', mt: 2, padding: 1 }}>
                <Button variant='contained' href={'/'}  >{langConfigs.backToHome[lang ?? 'tw']}</Button>
            </Box>
        </>
    );
}