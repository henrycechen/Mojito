import * as React from 'react';
import { WheelEvent } from 'react';
import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
// import styles from '../styles/Home.module.css'

import { getSession, getCsrfToken, useSession } from 'next-auth/react'

import AppBar from '../ui/Navbar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
// import parser from 'ua-parser-js';
// import mediaQuery from 'css-mediaquery';

// import { RemoveScrollBar } from 'react-remove-scroll-bar';

import { ChannelInfo, ChannelDictionary } from '../lib/types';
import Typography from '@mui/material/Typography';
const lang = process.env.NEXT_PUBLIC_APP_LANG ?? 'ch';

const Index = () => {

    // Decalre process states
    const [processStates, setProcessStates] = React.useState({
        selectedChannelId: '',
    })

    // Declare channel info state
    const [channelInfoList, setChannelInfoList] = React.useState<ChannelInfo[]>([]);
    React.useEffect(() => {
        getPostChannelList();
    }, []);

    // Initialize channel list
    const getPostChannelList = async () => {
        const channelDict = await fetch('/api/channel/getdictionary').then(resp => resp.json());
        const referenceList = await fetch('/api/channel/getindex').then(resp => resp.json());
        const channelList: ChannelInfo[] = [];
        referenceList.forEach((channel: keyof ChannelDictionary) => {
            channelList.push(channelDict[channel])
        });
        setChannelInfoList(channelList.filter(ch => !!ch));
    }

    const handleClickOnChannelButton = (channelId: string) => (event: React.MouseEvent<HTMLButtonElement>) => {
        setProcessStates({ ...processStates, selectedChannelId: channelId })
    }

    // const deviceType = parser(req.headers['user-agent']).device.type || 'desktop';
    // const ssrMatchMedia = (query) => ({
    //   matches: mediaQuery.match(query, {
    //     // The estimated CSS width of the browser.
    //     width: deviceType === 'mobile' ? '0px' : '1024px',
    //   }),
    // });

    const handleWheelEvent = (event: WheelEvent<HTMLDivElement>) => {
        event.currentTarget.scrollLeft += event.deltaY
    };






    return (
        <>
            <AppBar />
            
            {/* channel list bar */}
            <Stack direction={'row'} onWheel={handleWheelEvent}
                sx={{
                    padding: 1,
                    overflow: 'auto',
                    display: { xs: 'flex', sm: 'none' }
                }}
            >
                {channelInfoList.map(channel => {
                    return (
                        <Button variant={channel.id === processStates.selectedChannelId ? 'contained' : 'text'} key={channel.id} size='small' onClick={handleClickOnChannelButton(channel.id)}>
                            <Typography variant="body2" color={channel.id === processStates.selectedChannelId ? 'white' : "text.secondary"} sx={{ backgroundColor: 'primary' }}>
                                {channel.name[lang]}
                            </Typography>
                        </Button>
                    )
                })}
            </Stack>
            {/* post masonry */}
        </>
    )

}

export default Index;