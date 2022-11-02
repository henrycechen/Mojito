import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";

const appName = process.env['APP_FULL_NAME'] ?? 'Mojito New Zealand';

export default (props: any) => {
    return (
        <Typography variant="body2" color="text.secondary" align="center" {...props}>
            {'Copyright © '}
            <Link color="inherit" href="/" underline={'none'}>
                {appName}
            </Link>
            {' '}
            {new Date().getFullYear()}
            {/* {'.'} */}
        </Typography>
    );
}