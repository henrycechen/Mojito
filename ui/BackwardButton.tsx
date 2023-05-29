import { useRouter } from 'next/router';

import Button from '@mui/material/Button';
import Box from '@mui/material/Box';

import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';

export default function BackwardToSettingsButton() {

    const router = useRouter();

    const handleBackward = () => {
        router.push('/settings');
    };

    return (
        <Box sx={{ pt: 2, px: 2, display: { sm: 'block', md: 'none' } }}>
            <Button color='inherit' onClick={handleBackward}>
                <ArrowBackIosIcon fontSize={'small'} sx={{ color: 'grey' }} />
            </Button>
        </Box>
    );
}