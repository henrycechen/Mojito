import * as React from 'react';
import { PaletteMode } from '@mui/material';

import grey from '@mui/material/colors/grey';

export const ColorModeContext = React.createContext<any>({})

export const getDesignTokens = (mode: PaletteMode) => ({
    palette: {
        mode,
        ...(mode === 'light'
            ? {
                // palette values for light mode
                secondary: {
                    main: '#757575',
                    light: '#9e9e9e',
                    dark: '#616161'
                },
                background: {
                    paper: '#fff',
                    default: '#fff',
                    defaultChannel: '255 255 255'
                },
                text: {
                    primary: grey[900],
                    secondary: grey[800],
                },
            }
            : {
                // palette values for dark mode
                secondary: {
                    main: '#757575',
                    light: '#9e9e9e',
                    dark: '#616161'
                },
                background: {
                    paper: '#424242',
                    default: '#424242',
                    defaultChannel: '24 24 24'
                },
                text: {
                    primary: '#fff',
                    secondary: grey[500],
                },
            }),
    },
});