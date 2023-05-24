import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';

type TComponentProps = {
    lang?: string,
    sx?: any
}

const appName = process.env['NEXT_PUBLIC_APP_NAME'] ?? 'Mojito';

export default function CopyrightFooter(props: TComponentProps) {
    const { lang, sx } = props;
    return (
        <Typography variant={'body2'} color={'text.secondary'} align={'center'} {...sx}>
            {'Copyright © '}
            <Link color={'inherit'} href={'/'} underline={'none'}>
                {appName}
            </Link>
            {' 2022 - '}
            {new Date().getFullYear()}
        </Typography>
    );
}