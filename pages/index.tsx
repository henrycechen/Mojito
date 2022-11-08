import * as React from 'react';
import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'

import AppBar from '../ui/Navbar';
import Box from '@mui/material/Box';

const Home: React.FC = () => {
  console.log(12)
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
