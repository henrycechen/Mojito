import { styled } from '@mui/material';

import Box, { BoxProps } from '@mui/material/Box';
import Button, { ButtonProps } from '@mui/material/Button';
import Switch from '@mui/material/Switch';

export const ResponsiveCard = styled(Box)<BoxProps>(({ theme }) => ({
    padding: 16,
    borderRadius: theme.shape.borderRadius,
    boxShadow: theme.shadows[2],
    [theme.breakpoints.down('md')]: {
        boxShadow: theme.shadows[0],
    }
}))

export const CenterlizedBox = styled(Box)<BoxProps>(({ theme }) => ({
    display: 'flex',
    justifyContent: 'center'
}))

export const TextButton = styled(Button)<ButtonProps>(({ theme }) => ({
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    textTransform: 'none'
}))

export const StyledSwitch = styled(Switch)(({ theme }) => ({
    width: 60,
    height: 32,
    padding: 7,
    '& .MuiSwitch-switchBase': {
        margin: 1,
        padding: 0,
        transform: 'translateX(6px)',
        '&.Mui-checked': {
            color: '#fff',
            transform: 'translateX(22px)',
            '& .MuiSwitch-thumb:before': {
                backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 22 22"><path fill="${encodeURIComponent(
                    '#fff',
                )}" d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z"/></svg>')`,
            },
            '& + .MuiSwitch-track': {
                opacity: 1,
                backgroundColor: theme.palette.mode === 'dark' ? '#535353' : '#aab4be',
            },
        },
    },
    '& .MuiSwitch-thumb': {
        backgroundColor: theme.palette.mode === 'dark' ? '#003892' : '#001e3c',
        width: 30,
        height: 30,
        '&:before': {
            content: "''",
            position: 'absolute',
            width: '100%',
            height: '100%',
            left: 0,
            top: 0,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 26 24"><path fill="${encodeURIComponent(
                '#fff',
            )}" d="m19 9 1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z"/></svg>')`,
        },
    },
    '& .MuiSwitch-track': {
        opacity: 1,
        backgroundColor: theme.palette.mode === 'dark' ? '#535353' : '#aab4be',
        borderRadius: 20 / 2,
    },
}));
