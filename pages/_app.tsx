import * as React from 'react';
import Head from 'next/head';
import Script from 'next/script';

import type { AppProps } from 'next/app';

import createTheme from '@mui/material/styles/createTheme';
import ThemeProvider from '@mui/material/styles/ThemeProvider';
import CssBaseline from '@mui/material/CssBaseline';
import { SessionProvider } from 'next-auth/react';
import { Session } from 'next-auth';

import { PaletteMode } from '@mui/material';
import useMediaQuery from '@mui/material/useMediaQuery';
import { ColorModeContext, getDesignTokens } from '../ui/Theme';
import Cookie from 'js-cookie';

const App = ({ Component, pageProps: { session, ...pageProps } }: AppProps<{ session: Session; }>) => {
  // Update 24/11/2022
  // Due to _app.tsx does not have the access to request.cookie
  // The flashing issue can not be fixed on dark mode (os/user-choice)
  // Update 1/06/2023
  // Introduced pull-to-refresh animation
  const [mode, setMode] = React.useState<PaletteMode>('light');
  // #1 get user choice on color mode
  let preferredDarkMode: boolean = Cookie.get('PreferredColorMode') === 'dark';
  React.useEffect(() => {
    if (preferredDarkMode) {
      setMode('dark');
    }
  });
  // #2 get OS color mode
  const systemOnDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  React.useEffect(() => {
    // Only turn light on user preferred light (or undefined) and OS is on light as well
    if (!preferredDarkMode && !systemOnDarkMode) {
      setMode('light');
    }
  }, [systemOnDarkMode]);
  // #3 create theme
  const theme = React.useMemo(() => {
    return createTheme(getDesignTokens(mode));
  }, [mode]);

  // const colorMode = React.useMemo(() => {
  //   // toggleColorMode: () => setMode((prevMode: PaletteMode) => prevMode === 'light' ? 'dark' : 'light')
  //   toggleColorMode: () => {
  //     console.log('Toggle color mode');

  //     setMode((prevMode: PaletteMode) => prevMode === 'light' ? 'dark' : 'light')
  //   }
  //   // toggleColorMode: () => setMode(mode === 'light' ? 'dark' : 'light')
  // }, []);

  return (
    < SessionProvider session={session} >
      <ThemeProvider theme={theme}>
        <ColorModeContext.Provider value={{ mode, setMode }}>
          <CssBaseline />
          <Head>
            <meta name='theme-color' content='#535353' media='(prefers-color-scheme: dark)' />
            <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
            <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
            <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
            <link rel="manifest" href="/site.webmanifest" />
            <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#5bbad5" />
            <meta name="msapplication-TileColor" content="#da532c" />
            <meta name="theme-color" content="#ffffff" />
          </Head>
          <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1498706619182029" crossOrigin="anonymous"></script>
          <Component {...pageProps} />
          <style jsx global>
            {`
              .swiper-pagination-bullet-active {
                background-color: ${'dark' === mode ? '#01ced1 ' : '#fff'} !important;
              }
          `}
          </style>
        </ColorModeContext.Provider>
      </ThemeProvider>
    </SessionProvider >
  );
};

export default App;