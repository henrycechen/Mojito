import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Link from "@mui/material/Link";
import { LangConfigs } from '../lib/types';

type BackToHomeButtonGroupProps = {
    color?: string;
}

const domain = process.env.NEXT_PUBLIC_APP_DOMAIN;
const lang = process.env.NEXT_PUBLIC_APP_LANG ?? 'ch';
const langConfigs: LangConfigs = {
    backToHome: {
        ch: '返回主页',
        en: 'Back to home'
    }
}

export default ({ color }: BackToHomeButtonGroupProps) => {
    return (
        <>
            <Box sx={{ display: { xs: 'none', sm: 'flex' }, justifyContent: 'center', mt: 2 }}>
                <Link href={domain} sx={{ color: !color ? 'inherit' : color }} >{langConfigs.backToHome[lang]}</Link>
            </Box>
            <Box sx={{ display: { xs: 'flex', sm: 'none' }, justifyContent: 'center', mt: 2, padding: 1 }}>
                <Button variant='contained' href={domain}  >{langConfigs.backToHome[lang]}</Button>
            </Box>
        </>
    );
}