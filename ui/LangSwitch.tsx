import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

type TComponentProps = {
    setLang: any;
    sx?: any;
};

export default function LangSwitch(props: TComponentProps) {

    const sx = { ...props.sx, display: 'flex', flexDirection: 'row', justifyContent: 'center' };

    return (
        <Box sx={sx} >
            <Button variant='text' sx={{ textTransform: 'none' }} onClick={props.setLang}>
                <Typography variant={'body2'}>{'繁|简|English'}</Typography>
            </Button>
        </Box>
    );
}