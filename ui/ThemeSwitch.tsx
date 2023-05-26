import * as React from 'react';
import useTheme from '@mui/material/styles/useTheme';

import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';

import DarkModeIcon from '@mui/icons-material/DarkMode';
import WbSunnyIcon from '@mui/icons-material/WbSunny';

import { ColorModeContext } from '../ui/Theme';

type TComponentProps = {
    sx?: any;
};

export default function ThemeSwitch(props: TComponentProps) {

    const theme = useTheme();
    const colorMode = React.useContext(ColorModeContext);
    const handleColorModeSelect = () => {
        const preferredColorMode = colorMode.mode === 'dark' ? 'light' : 'dark';
        colorMode.setMode(preferredColorMode);
        document.cookie = `PreferredColorMode=${preferredColorMode}`;
    };

    const sx = { ...props.sx, display: 'flex', flexDirection: 'row', justifyContent: 'center' };

    return (
        <Box sx={sx}>
            <IconButton onClick={handleColorModeSelect}>
                {theme.palette.mode === 'dark' ? <WbSunnyIcon /> : <DarkModeIcon />}
            </IconButton>
        </Box>
    );
}