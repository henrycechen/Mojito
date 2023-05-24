import * as React from 'react';
import useTheme from '@mui/material/styles/useTheme';

import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';

import Brightness7Icon from '@mui/icons-material/Brightness7';
import Brightness4Icon from '@mui/icons-material/Brightness4';

import Copyright from '../ui/Copyright';
import Terms from '../ui/Terms';
import Guidelines from '../ui/Guidelines';
import { ColorModeContext } from '../ui/Theme';

type TSideColumnProps = {
    lang?: string;
};

export default function SideColumn(props: TSideColumnProps) {

    const lang = props.lang ?? 'tw';
    const theme = useTheme();

    const colorMode = React.useContext(ColorModeContext);

    const handleColorModeSelect = () => {
        const preferredColorMode = colorMode.mode === 'dark' ? 'light' : 'dark';
        colorMode.setMode(preferredColorMode);
        document.cookie = `PreferredColorMode=${preferredColorMode}`;
    };

    return (
        <Stack spacing={2} sx={{ width: { md: 200, lg: 240 }, paddingX: 3, paddingTop: 18, }} >
            {/* copyright */}
            <Box>
                <Copyright lang={lang} />
                <Guidelines lang={lang} />
                <Terms lang={lang} />
            </Box>

            {/* theme mode switch */}
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <IconButton onClick={handleColorModeSelect}>
                    {theme.palette.mode === 'dark' ? <Brightness4Icon /> : <Brightness7Icon />}
                </IconButton>
            </Box>
        </Stack>
    );
}