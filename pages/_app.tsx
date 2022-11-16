import * as React from 'react';
import type { AppProps } from 'next/app'
import Head from 'next/head';


import createTheme from '@mui/material/styles/createTheme';
import ThemeProvider from '@mui/material/styles/ThemeProvider';
import CssBaseline from '@mui/material/CssBaseline';
import { SessionProvider } from 'next-auth/react';
import { Session } from 'next-auth';

import { PaletteMode } from '@mui/material';
import useMediaQuery from '@mui/material/useMediaQuery';
import { ColorModeContext, getDesignTokens } from '../ui/Theme';


export default ({ Component, pageProps: { session, ...pageProps } }: AppProps<{ session: Session }>) => {
  const [mode, setMode] = React.useState<PaletteMode>('light');
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  React.useEffect(() => {
    setMode(prefersDarkMode ? 'dark' : 'light');
  }, [prefersDarkMode]);

  const theme = React.useMemo(() => createTheme(getDesignTokens(mode)), [mode]);
  const colorMode = React.useMemo(() => {
    toggleColorMode: () => {
      setMode((prevMode: PaletteMode) => prevMode === 'light' ? 'dark' : 'light')
    }
  }, []);

  return (
    < SessionProvider session={session} >
      <ThemeProvider theme={theme}>
        <ColorModeContext.Provider value={{ mode, setMode }}>
          <CssBaseline />
          {/* <Head>
            <meta name="theme-color" content="#ecd96f" media="(prefers-color-scheme: light)" />
            <meta name="theme-color" content="#0b3e05" media="(prefers-color-scheme: dark)" />
          </Head> */}
          <Component {...pageProps} />
        </ColorModeContext.Provider>
      </ThemeProvider>
    </SessionProvider >
  )
}