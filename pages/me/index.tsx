import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { getSession, getCsrfToken, useSession } from 'next-auth/react'

import { useRouter } from 'next/router';

import axios from 'axios';

import Navbar from '../../ui/Navbar';
import Copyright from '../../ui/Copyright';
import { userAgent } from 'next/server';

const CreatePost = () => {
    // Handle session
    const { data: session } = useSession({
        required: true,
        onUnauthenticated() {
            
        }
    })
    console.log(session?.user);
    
    return (
        <>
        <Navbar/>
            <Container>
123
            </Container>

        </>
    )
}

export default CreatePost