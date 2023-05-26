import * as React from 'react';
import Box from '@mui/material/Box';

import Copyright from '../ui/Copyright';
import Terms from '../ui/Terms';
import Guidelines from '../ui/Guidelines';

type TLegalInfoProps = {
    lang?: string;
};

export default function LegalInfo(props: TLegalInfoProps) {
    const lang = props.lang ?? 'tw';

    return (
        <Box py={5} sx={{ display: { sm: 'block', md: 'none' } }}>
            <Copyright lang={lang} />
            <Guidelines lang={lang} />
            <Terms lang={lang} />
        </Box>
    );
}