import * as React from 'react';
import '../styles/globals.css'
import type { AppProps } from 'next/app'
import createTheme from '@mui/material/styles/createTheme';
import ThemeProvider from '@mui/material/styles/ThemeProvider';
import CssBaseline from '@mui/material/CssBaseline';
import { SessionProvider } from 'next-auth/react';
import { Session } from 'next-auth';

const customTheme = createTheme();
/**
 * 31/10/2022
 * The interface AppProps takes a generic for pageProps,
 * Importing the Session type and passing it to the AppProps generic fixes this issue
 * 
 * Reference https://github.com/nextauthjs/next-auth-typescript-example/pull/18
 */
export default ({ Component, pageProps: { session, ...pageProps } }: AppProps<{ session: Session }>) => {
  return (
    < SessionProvider session={session} >
      <ThemeProvider theme={customTheme}>
        <CssBaseline />
        <Component {...pageProps} />
      </ThemeProvider>
    </SessionProvider >
  )
}