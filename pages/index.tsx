import * as React from 'react';
import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'

import { getSession, getCsrfToken, useSession } from 'next-auth/react'


import AppBar from '../ui/Navbar';
import Box from '@mui/material/Box';

const Home = () => {
  const { data: session } = useSession()
  React.useEffect(() => {
    console.log(session);
    
  }, [])
  return (
    <>
      <AppBar />
      <Box>
        Index
      </Box>
    </>
  )
}

export default Home
