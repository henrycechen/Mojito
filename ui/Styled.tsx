import { styled } from '@mui/material';

import Box, { BoxProps } from '@mui/material/Box';

export const ResponsiveCard = styled(Box)<BoxProps>(({ theme }) => ({
    padding: 16,
    borderRadius: theme.shape.borderRadius,
    boxShadow: theme.shadows[2],
    [theme.breakpoints.down('md')]: {
        boxShadow: theme.shadows[0],
    }
}))

export const CenterlizedBox =  styled(Box)<BoxProps>(({ theme }) => ({
    display: 'flex',
    justifyContent: 'center'
}))