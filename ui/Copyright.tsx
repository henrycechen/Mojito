import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';

type TComponentProps = {
    lang?: string,
    sx?: any;
};

export default function CopyrightFooter(props: TComponentProps) {
    const { sx } = props;
    return (
        <Typography variant={'body2'} color={'text.secondary'} align={'center'} {...sx}>
            {'Copyright © '}
            <Link color={'inherit'} href={'/'} underline={'none'}>
                {'Mojito'}
            </Link>
            {' 2022 - '}
            {new Date().getFullYear()}
        </Typography>
    );
}