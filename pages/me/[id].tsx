import * as React from 'react';

import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { useSession } from 'next-auth/react'

import SvgIcon from '@mui/material/SvgIcon';

import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';

import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LabelIcon from '@mui/icons-material/Label';
import LockIcon from '@mui/icons-material/Lock';
import OpacityIcon from '@mui/icons-material/Opacity';
import BubbleChartIcon from '@mui/icons-material/BubbleChart';
import InterestsIcon from '@mui/icons-material/Interests';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import CreateIcon from '@mui/icons-material/Create';
import StarIcon from '@mui/icons-material/Star';
import DeleteIcon from '@mui/icons-material/Delete';
import CakeIcon from '@mui/icons-material/Cake';
import InfoIcon from '@mui/icons-material/Info';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

import Masonry from '@mui/lab/Masonry';

import dayjs, { Dayjs } from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { MobileDatePicker } from '@mui/x-date-pickers/MobileDatePicker';

import FormControlLabel from '@mui/material/FormControlLabel';
import InputAdornment from '@mui/material/InputAdornment';
import OutlinedInput from '@mui/material/OutlinedInput';
import Paper from '@mui/material/Paper';
import Select, { SelectChangeEvent } from '@mui/material/Select';

import Divider from '@mui/material/Divider';
import Container from '@mui/material/Container';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';


import { useTheme } from '@emotion/react';
import { useRouter } from 'next/router';

import { ProcessStates, Helper, ChannelDictionary, ChannelInfo, LangConfigs } from '../../lib/types';
import {  updateLocalStorage, restoreFromLocalStorage } from '../../lib/utils';
import { CenterlizedBox, ResponsiveCard, StyledSwitch, TextButton } from '../../ui/Styled';
import Navbar from '../../ui/Navbar';


const storageName = 'MemberPageProcessStates';
const updateProcessStates = updateLocalStorage(storageName);
const restoreProcessStates = restoreFromLocalStorage(storageName);

// Decalre process state type of this page
interface MemberPageProcessStates extends ProcessStates {
    /**
     * 0 - message - MessageLayout
     * 1 - posts - PostLayout
     * 2 - saved - PostLayout
     * 3 - liked - PostLayout
     * 4 - settings - SettingsLayout
     * 5
     */
    selectedCategoryId: number;
    selectedLayout: 'messagelayout' | 'postlayout' | 'settingslayout';
    selectedHotPosts: boolean;
    selectedChannelId: string;
    selectedSettingId: number;
    memorizeChannelBarPositionX: number | undefined;
    memorizeViewPortPositionY: number | undefined;
    memorizeLastViewedPostId: string | undefined;
    wasRedirected: boolean;
}

type PostInfo = {
    id: string;
    memberId: string;
    title: string;
    imgUrl: string;
    timestamp: string;
}

const lang = process.env.NEXT_PUBLIC_APP_LANG ?? 'ch';
const langConfigs: LangConfigs = {
    cat_message: { ch: '消息', en: 'Message' },
    cat_posts_short: { ch: '帖子', en: 'Posts' },
    cat_posts_long: { ch: '我的帖子', en: 'My Posts' },
    cat_saved: { ch: '收藏', en: 'Saved' },
    cat_liked: { ch: '赞过', en: 'Liked' },
    cat_history_short: { ch: '历史', en: 'History' },
    cat_history_long: { ch: '历史记录', en: 'History' },
    cat_settings: { ch: '设置', en: 'Settings' },
    submit: { ch: '提交', en: 'Submit' },
    settings_newNickname: { ch: '新昵称', en: 'New nickname' },
    settings_password: { ch: '新密码', en: 'New password' },
    settings_repeat_assword: { ch: '重复输入新密码', en: 'Repeat new password' },
    settings_briefIntro: { ch: '简介', en: 'Brief intro' },
    settings_introduceYourself: { ch: '简单介绍一下自己吧~', en: 'Tell us something about yourself :)' },
    settings_gender: { ch: '性别', en: 'Gender' },
    settings_female: { ch: '女生', en: 'Girl' },
    settings_male: { ch: '男生', en: 'Boy' },
    settings_secret: { ch: '保密', en: 'Secret' },
    settings_date: { ch: '您的生日', en: 'Birthday' },
    settings_memberId: { ch: 'Mojito 账户ID', en: 'Mojito Member ID' },
    settings_registerDate: { ch: '注册时间', en: 'Register date' },
}

const Member = () => {
    const { data: session, status } = useSession();
    // logic: 
    // - anthenticated: himself/herself => full access | other => post layout only
    // - - if (session.id === router.query.id)
    // 
    // - unanthenticated: post layout only
    const router = useRouter();
    const theme: any = useTheme();

    // Declare process states
    const [processStates, setProcessStates] = React.useState<MemberPageProcessStates>({
        selectedCategoryId: 0, // default
        selectedLayout: 'messagelayout', // default
        selectedHotPosts: false,
        selectedChannelId: 'all', // default
        selectedSettingId: 0,
        memorizeChannelBarPositionX: undefined,
        memorizeViewPortPositionY: undefined,
        memorizeLastViewedPostId: undefined,
        wasRedirected: false,
    })
    // Restore page process states on page re-load
    React.useEffect(() => {
        restoreProcessStates(setProcessStates);
    }, []);

    // Declare helper
    const [helper, setHelper] = React.useState<Helper>({
        memorizeViewPortPositionY: undefined, // reset scroll-help on handleChannelSelect, handleSwitchChange, ~~handlePostCardClick~~
    })

    // Handle muti-display category select and update process state cache
    const handleSelectCategory = (categoryId: number) => (event: React.MouseEvent<HTMLButtonElement>) => {
        let states: MemberPageProcessStates = { ...processStates };
        if (0 === categoryId) {
            states.selectedCategoryId = 0;
            states.selectedLayout = 'messagelayout';
        }
        if (1 === categoryId) {
            states.selectedCategoryId = 1;
            states.selectedLayout = 'postlayout';
        }
        if (2 === categoryId) {
            states.selectedCategoryId = 2;
            states.selectedLayout = 'postlayout';
        }
        if (3 === categoryId) {
            states.selectedCategoryId = 3;
            states.selectedLayout = 'postlayout';
        }
        if (4 === categoryId) {
            states.selectedCategoryId = 4;
            states.selectedLayout = 'settingslayout';
        }
        states.memorizeViewPortPositionY = window.scrollY;
        setProcessStates(states);
        updateProcessStates(states);
        return;
    }

    //////// Message layout ////////

    // Define message layout states
    type MessageLayoutStates = {

    }

    // Decalre message layout states
    const [messagelayoutStates, setMessageLayoutStates] = React.useState<MessageLayoutStates>();

    // Ui-compoent: Message layout
    const MessageLayout = () => {
        return (
            <Grid container>
                {/* left column (placeholder) */}
                <Grid item xs={0} sm={2} md={3} lg={4}></Grid>
                {/* middle column */}
                <Grid item xs={12} sm={8} md={6} lg={4}>
                    <ResponsiveCard>
                        <Stack>
                            {/* section select */}
                            <Box sx={{ display: 'flex', justifyContent: 'space-evenly' }}>
                                <Stack>
                                    <CenterlizedBox>
                                        <IconButton><ThumbUpIcon /></IconButton>
                                    </CenterlizedBox>
                                    <Typography variant='body2'>{'赞和收藏'}</Typography>
                                </Stack>
                                <Stack>
                                    <CenterlizedBox>
                                        <IconButton><AccountCircleIcon /></IconButton>
                                    </CenterlizedBox>
                                    <Typography variant='body2'>{'新增关注'}</Typography>
                                </Stack>
                                <Stack>
                                    <CenterlizedBox>
                                        <IconButton><ChatBubbleIcon /></IconButton>
                                    </CenterlizedBox>
                                    <Typography variant='body2'>{'评论和@'}</Typography>
                                </Stack>
                            </Box>
                            {/* message list */}
                            <Stack mt={1} padding={2} spacing={3}>
                                <Divider />
                                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(msg =>
                                    <React.Fragment key={msg}>
                                        <Grid container >
                                            <Grid item flexGrow={2}>
                                                <Stack direction={'row'} marginTop={0.5}>
                                                    <IconButton sx={{ padding: 0 }}>
                                                        <Avatar sx={{ width: 38, height: 38, bgcolor: 'grey' }}>{'W'}</Avatar>
                                                    </IconButton>
                                                    <Box ml={1}>
                                                        <TextButton color='inherit'>
                                                            <Typography variant='body2' >
                                                                {'WebMaster'}
                                                            </Typography>
                                                            <Typography variant='body2' fontSize={{ xs: 12 }} >
                                                                {'2 分钟前'}
                                                            </Typography>
                                                        </TextButton>
                                                    </Box>
                                                </Stack>
                                            </Grid>
                                            <Grid item flexGrow={1}>
                                                <Box marginTop={1.5}>
                                                    <Typography variant='body2'>{'赞了你'}</Typography>
                                                </Box>
                                            </Grid>
                                            <Grid item >
                                                <Box sx={{ width: { xs: 40, sm: 48 }, height: { xs: 40, sm: 48 }, backgroundColor: 'pink' }}></Box>

                                            </Grid>
                                        </Grid>
                                        <Divider />
                                    </React.Fragment>
                                )}
                            </Stack>
                        </Stack>
                    </ResponsiveCard>
                </Grid>
                {/* right column (placeholder) */}
                <Grid item xs={0} sm={2} md={3} lg={4}></Grid>
            </Grid>
        )
    }

    //////// Post layout ////////

    // Define post layout states
    type PostLayoutStates = {
    }

    // Declare post layout states
    const [postLayoutStates, setPostLayoutStates] = React.useState<PostLayoutStates>({
    });

    // Declare & initialize channel states
    const [channelInfoList, setChannelInfoList] = React.useState<ChannelInfo[]>([]);
    React.useEffect(() => {
        getPostChannelList();
    }, []);
    const getPostChannelList = async () => {
        const channelDict = await fetch('/api/channel/dictionary').then(resp => resp.json());
        const referenceList = await fetch('/api/channel').then(resp => resp.json());
        const channelList: ChannelInfo[] = [];
        referenceList.forEach((channel: keyof ChannelDictionary) => {
            channelList.push(channelDict[channel])
        });
        setChannelInfoList(channelList.filter(channel => !!channel));
    }
    // Restore channel bar position
    React.useEffect(() => {
        if (!!processStates.memorizeChannelBarPositionX) {
            document.getElementById('channel-bar')?.scrollBy(processStates.memorizeChannelBarPositionX ?? 0, 0);
        }
    }, [channelInfoList]);

    // Handle channel select
    const handleChannelSelect = (channelId: string) => (event: React.MouseEvent<HTMLButtonElement> | React.SyntheticEvent) => {
        let states: MemberPageProcessStates = { ...processStates };
        states.selectedChannelId = channelId;
        states.memorizeChannelBarPositionX = document.getElementById('channel-bar')?.scrollLeft;
        // Step #1 update process states
        setProcessStates(states);
        // Step #2 update process states cache
        updateProcessStates(states);
        // Step #3 reset helper
        setHelper({ ...helper, memorizeViewPortPositionY: undefined });
    }

    // Handle newest/hotest switch change
    const handleSwitchChange = () => {
        let states: MemberPageProcessStates = { ...processStates, selectedHotPosts: !processStates.selectedHotPosts }
        // Step #1 update process states
        setProcessStates(states);
        // Step #2 update process states cache
        updateProcessStates(states);
        // Step #3 reset helper
        setHelper({ ...helper, memorizeViewPortPositionY: undefined });
    }

    // Declare & initialize post lists
    const [postList, setPostList] = React.useState<PostInfo[]>([])
    React.useEffect(() => {
        if ('postlayout' === processStates.selectedLayout) {
            getPosts();
        }
    }, [processStates])
    const getPosts = async () => {
        //// TODO: test api '/post' moved to '/post/of' ////
        const resp = await fetch('/api/post/of?ranking=newest');
        const list = await resp.json();
        setPostList(list);
    }

    // Restore browsing after loading posts
    React.useEffect(() => {
        if (processStates.selectedLayout === 'postlayout' && processStates.wasRedirected) {
            const postId = processStates.memorizeLastViewedPostId;
            // Step #1 restore browsing position
            if (!postId) {
                return;
            } else if (600 > window.innerWidth) { // 0 ~ 599
                setHelper({ ...helper, memorizeViewPortPositionY: (document.getElementById(postId)?.offsetTop ?? 0) / 2 - 200 });
            } else { // 600 ~ ∞
                setHelper({ ...helper, memorizeViewPortPositionY: processStates.memorizeViewPortPositionY });
            }
            let states: MemberPageProcessStates = { ...processStates, memorizeLastViewedPostId: undefined, memorizeViewPortPositionY: undefined, wasRedirected: false };
            // Step #2 update process states
            setProcessStates(states);
            // Step #3 update process state cache
            updateProcessStates(states);
        }
    }, [postList]);
    if (!!helper.memorizeViewPortPositionY) {
        window.scrollTo(0, helper.memorizeViewPortPositionY ?? 0);
    }

    // Handle click on post card
    const handlePostCardClick = (postId: string) => (event: React.MouseEvent) => {
        // Step #1 update process state cache
        updateProcessStates({ ...processStates, memorizeLastViewedPostId: postId, memorizeViewPortPositionY: window.scrollY, wasRedirected: true });
        // Step #2 jump
        router.push(`/post/${postId}`);
    }

    // Handle click on Avatar / Nickname
    const handleIconButtonClick = () => {
        router.push('/me/id');
    }

    // Handle click on bottom-right icon button
    const handleMultiProposeClick = (buttonId: number) => (event: React.MouseEvent<HTMLButtonElement>) => {
        if (1 === buttonId) {
            // redirect to /me/editpost/[id]
            router.push('/me/createpost');
            return;

        }
        if (2 === buttonId) {
            // member behaviour: unsave
        }
        if (3 === buttonId) {
            // member behaviour: unlike
        }
    }

    //////// Settings layout ////////

    // Define settings layout states
    type SettingsLayoutStates = {
        avatarImageUrl: string | undefined;
        nickname: string;
        password: string;
        repeatPassword: string;
        showpassword?: boolean;
        briefIntro: string;
        gender: number;
        birthday: Dayjs | null;
        memberId: string;
        registerDate: string;
    }

    // Decalre settings layout states
    const [settingslayoutStates, setSettingsLayoutStates] = React.useState<SettingsLayoutStates>({
        avatarImageUrl: undefined,
        nickname: 'WebMaster',
        password: '',
        repeatPassword: '',
        showpassword: false,
        briefIntro: '',
        gender: -1,
        birthday: dayjs('2014-08-18T21:11:54'),
        memberId: '6TTK1WH0OD',
        registerDate: '2022-11-10T22:44:24.373372Z'
    });

    // Handle setting select
    const handleSettingSelect = (settingId: number) => (event: React.SyntheticEvent) => {
        setProcessStates({ ...processStates, selectedSettingId: settingId });
    }

    // Ui-component: Settings layout
    const SettingsLayout = () => {
        // Ui-sub-component
        const AvataSetting = () => {
            const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
                if (event.target.files?.length !== 0 && event.target.files !== null) {
                    const url = URL.createObjectURL(event.target.files[0]);
                    setSettingsLayoutStates({ ...settingslayoutStates, avatarImageUrl: url })
                }
            }
            return (
                <Box sx={{ paddingTop: 8 }}>
                    <CenterlizedBox>
                        <Avatar src={settingslayoutStates.avatarImageUrl} sx={{ width: { xs: 72, sm: 96 }, height: { xs: 72, sm: 96 } }}></Avatar>
                    </CenterlizedBox>
                    <CenterlizedBox>
                        <Box>
                            <IconButton color="primary" aria-label="upload picture" component="label" >
                                <input hidden accept="image/*" type="file" onChange={handleUpload} />
                                <PhotoCamera />
                            </IconButton>
                        </Box>
                    </CenterlizedBox>
                    <CenterlizedBox>
                        <Button variant='contained' size='small'>
                            <Typography>{langConfigs.submit[lang]}</Typography>
                        </Button>
                    </CenterlizedBox>
                </Box>
            )
        }
        // Ui-sub-component
        const NicknameSetting = () => {
            const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
                setSettingsLayoutStates({ ...settingslayoutStates, nickname: event.target.value });
            }
            const handleSubmit = () => { }
            return (
                <Container maxWidth='xs' sx={{ paddingTop: 14 }}>
                    <CenterlizedBox>
                        <TextField
                            required
                            label={langConfigs.settings_newNickname[lang]}
                            value={settingslayoutStates.nickname}
                            onChange={handleChange}
                        />
                    </CenterlizedBox>
                    <CenterlizedBox sx={{ mt: 4 }}>
                        <Button variant='contained' size='small'>
                            <Typography>{langConfigs.submit[lang]}</Typography>
                        </Button>
                    </CenterlizedBox>
                </Container>
            )
        }
        // Ui-sub-component
        const PasswordeSetting = () => {

            const handleShowPassword = () => {
                setSettingsLayoutStates({ ...settingslayoutStates, showpassword: !settingslayoutStates.showpassword });
            }
            const handleChange = (prop: keyof SettingsLayoutStates) => (event: React.ChangeEvent<HTMLInputElement>) => {
                setSettingsLayoutStates({ ...settingslayoutStates, [prop]: event.target.value });
            }
            const handleSubmit = () => { }
            return (
                <Container maxWidth='xs' sx={{ paddingTop: 10 }}>
                    <CenterlizedBox>
                        <FormControl variant='outlined'>
                            <InputLabel htmlFor='outlined-adornment-password'>{langConfigs.settings_password[lang]}</InputLabel>
                            <OutlinedInput
                                required
                                id={'outlined-adornment-password'}
                                label={langConfigs.settings_password[lang]}
                                type={settingslayoutStates.showpassword ? 'text' : 'password'}
                                value={settingslayoutStates.password}
                                onChange={handleChange('password')}
                                endAdornment={
                                    <InputAdornment position="end">
                                        <IconButton
                                            aria-label="toggle password visibility"
                                            onClick={handleShowPassword}
                                            edge="end"
                                        >
                                            {settingslayoutStates.showpassword ? <VisibilityIcon /> : <VisibilityOffIcon />}
                                        </IconButton>
                                    </InputAdornment>
                                }
                            />
                        </FormControl>
                    </CenterlizedBox>
                    <CenterlizedBox sx={{ mt: 1 }}>
                        <FormControl variant='outlined'>
                            <InputLabel htmlFor='outlined-adornment-repeat-password'>{langConfigs.settings_repeat_assword[lang]}</InputLabel>
                            <OutlinedInput
                                required
                                id={'outlined-adornment-repeat-password'}
                                label={langConfigs.settings_repeat_assword[lang]}
                                type={settingslayoutStates.showpassword ? 'text' : 'password'}
                                value={settingslayoutStates.repeatPassword}
                                onChange={handleChange('repeatPassword')}
                                endAdornment={
                                    <InputAdornment position="end">
                                        <IconButton
                                            aria-label="toggle password visibility"
                                            onClick={handleShowPassword}
                                            edge="end"
                                        >
                                            {settingslayoutStates.showpassword ? <VisibilityIcon /> : <VisibilityOffIcon />}
                                        </IconButton>
                                    </InputAdornment>
                                }
                            />
                        </FormControl>
                    </CenterlizedBox>
                    <CenterlizedBox sx={{ mt: 4 }}>
                        <Button variant='contained' size='small'>
                            <Typography>{langConfigs.submit[lang]}</Typography>
                        </Button>
                    </CenterlizedBox>
                </Container>
            )
        }
        // Ui-sub-component
        const BriefIntroSetting = () => {
            const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
                setSettingsLayoutStates({ ...settingslayoutStates, briefIntro: event.target.value });
            }
            const handleSubmit = () => { }
            return (
                <Container maxWidth='xs' sx={{ paddingTop: 14 }}>
                    <CenterlizedBox>
                        <TextField
                            required
                            label={langConfigs.settings_briefIntro[lang]}
                            multiline
                            rows={2}
                            value={settingslayoutStates.briefIntro}
                            placeholder={langConfigs.settings_introduceYourself[lang]}
                            onChange={handleChange}
                        />
                    </CenterlizedBox>
                    <CenterlizedBox sx={{ mt: 4 }}>
                        <Button variant='contained' size='small'>
                            <Typography>{langConfigs.submit[lang]}</Typography>
                        </Button>
                    </CenterlizedBox>
                </Container>
            )
        }
        // Ui-sub-component
        const GenderSetting = () => {
            const handleChange = (event: SelectChangeEvent) => {
                setSettingsLayoutStates({ ...settingslayoutStates, gender: parseInt(event.target.value) })
            };
            const handleSubmit = () => { };
            return (
                <Container maxWidth='xs' sx={{ paddingTop: 14 }}>
                    <CenterlizedBox>
                        <FormControl sx={{ width: 100 }}>
                            <InputLabel id="gender-select-label">{langConfigs.settings_gender[lang]}</InputLabel>
                            <Select
                                labelId="gender-select-label"
                                id="gender-select"
                                value={settingslayoutStates.gender.toString()}
                                label={langConfigs.settings_gender[lang]}
                                onChange={handleChange}
                            >
                                <MenuItem value={0}>{langConfigs.settings_female[lang]}</MenuItem>
                                <MenuItem value={1}>{langConfigs.settings_male[lang]}</MenuItem>
                                <MenuItem value={-1}>{langConfigs.settings_secret[lang]}</MenuItem>
                            </Select>
                        </FormControl>
                    </CenterlizedBox>
                    <CenterlizedBox sx={{ mt: 4 }}>
                        <Button variant='contained' size='small'>
                            <Typography>{langConfigs.submit[lang]}</Typography>
                        </Button>
                    </CenterlizedBox>
                </Container>
            )
        }
        // Ui-sub-component
        const BirthdaySetting = () => {
            const handleChange = (value: Dayjs | null) => {
                setSettingsLayoutStates({ ...settingslayoutStates, birthday: value });
            };
            const handleSubmit = () => { };
            return (
                <Container maxWidth='xs' sx={{ paddingTop: 14 }}>
                    <CenterlizedBox>
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <MobileDatePicker
                                label={langConfigs.settings_date[lang]}
                                inputFormat='MM/DD/YYYY'
                                value={settingslayoutStates.birthday}
                                onChange={handleChange}
                                renderInput={(params) => <TextField {...params} />}
                            />
                        </LocalizationProvider>
                    </CenterlizedBox>
                    <CenterlizedBox sx={{ mt: 4 }}>
                        <Button variant='contained' size='small'>
                            <Typography>{langConfigs.submit[lang]}</Typography>
                        </Button>
                    </CenterlizedBox>
                </Container>
            )
        }
        // Ui-sub-component
        const RegisterInfo = () => {
            return (
                <Container maxWidth='xs' sx={{ paddingTop: 14 }}>
                    <CenterlizedBox>
                        <Typography>{`${langConfigs.settings_memberId[lang]}: ${settingslayoutStates.memberId}`}</Typography>
                    </CenterlizedBox>
                    <CenterlizedBox>
                        <Typography>{`${langConfigs.settings_registerDate[lang]}: ${new Date(settingslayoutStates.registerDate).toLocaleDateString()}`}</Typography>
                    </CenterlizedBox>
                </Container>
            )
        }
        return (
            <Grid container>
                {/* left column (placeholder) */}
                <Grid item xs={0} sm={1} md={2} lg={3} xl={3}></Grid>
                {/* middle-left column */}
                <Grid item xs={4} sm={3} md={2} lg={2} xl={1}>
                    <Box sx={{ borderRadius: 1, boxShadow: { xs: 0, sm: 2 }, padding: { xs: 0, sm: 1 }, marginRight: 1, minHeight: 400 }}>
                        <MenuList>
                            {/* avatar */}
                            <MenuItem onClick={handleSettingSelect(0)} selected={0 === processStates.selectedSettingId} >
                                <ListItemIcon>
                                    <AccountCircleIcon />
                                </ListItemIcon>
                                <ListItemText>
                                    <Typography variant='body2'>
                                        {'头像'}
                                    </Typography>
                                </ListItemText>
                            </MenuItem>
                            {/* nickname */}
                            <MenuItem onClick={handleSettingSelect(1)} selected={1 === processStates.selectedSettingId}>
                                <ListItemIcon>
                                    <LabelIcon />
                                </ListItemIcon>
                                <ListItemText>
                                    <Typography variant='body2'>
                                        {'昵称'}
                                    </Typography>
                                </ListItemText>
                            </MenuItem>
                            {/* password */}
                            <MenuItem onClick={handleSettingSelect(2)} selected={2 === processStates.selectedSettingId}>
                                <ListItemIcon>
                                    <LockIcon />
                                </ListItemIcon>
                                <ListItemText>
                                    <Typography variant='body2'>
                                        {'密码'}
                                    </Typography>
                                </ListItemText>
                            </MenuItem>
                            {/* brief intro */}
                            <MenuItem onClick={handleSettingSelect(3)} selected={3 === processStates.selectedSettingId}>
                                <ListItemIcon>
                                    <InterestsIcon />
                                </ListItemIcon>
                                <ListItemText>
                                    <Typography variant='body2'>
                                        {'个人简介'}
                                    </Typography>
                                </ListItemText>
                            </MenuItem>
                            {/* gender */}
                            <MenuItem onClick={handleSettingSelect(4)} selected={4 === processStates.selectedSettingId}>
                                <ListItemIcon>
                                    <OpacityIcon />
                                </ListItemIcon>
                                <ListItemText>
                                    <Typography variant='body2'>
                                        {'性别'}
                                    </Typography>
                                </ListItemText>
                            </MenuItem>
                            {/* birthday */}
                            <MenuItem onClick={handleSettingSelect(5)} selected={5 === processStates.selectedSettingId}>
                                <ListItemIcon>
                                    <CakeIcon />
                                </ListItemIcon>
                                <ListItemText>
                                    <Typography variant='body2'>
                                        {'生日'}
                                    </Typography>
                                </ListItemText>
                            </MenuItem>
                            {/* register info */}
                            <MenuItem onClick={handleSettingSelect(9)} selected={9 === processStates.selectedSettingId}>
                                <ListItemIcon>
                                    <InfoIcon />
                                </ListItemIcon>
                                <ListItemText>
                                    <Typography variant='body2'>
                                        {'注册信息'}
                                    </Typography>
                                </ListItemText>
                            </MenuItem>
                        </MenuList>
                    </Box>
                </Grid>
                {/* middle-right column */}
                <Grid item xs={8} sm={7} md={6} lg={4} xl={5}>
                    {/* multi-display */}
                    <Box sx={{ borderRadius: 1, boxShadow: { xs: 0, sm: 2 }, minHeight: 400 }}>
                        {0 === processStates.selectedSettingId && <AvataSetting />}
                        {1 === processStates.selectedSettingId && <NicknameSetting />}
                        {2 === processStates.selectedSettingId && <PasswordeSetting />}
                        {3 === processStates.selectedSettingId && <BriefIntroSetting />}
                        {4 === processStates.selectedSettingId && <GenderSetting />}
                        {5 === processStates.selectedSettingId && <BirthdaySetting />}
                        {9 === processStates.selectedSettingId && <RegisterInfo />}
                    </Box>
                </Grid>
                {/* right column (placeholder) */}
                <Grid item xs={0} sm={1} md={2} lg={3} xl={3}>
                    {/* <Box sx={{ minHeight: 500, backgroundColor: 'pink' }}></Box> */}
                </Grid>
            </Grid>
        )
    }

    return (
        <>
            <Navbar />
            {/* member info */}
            <Box sx={{ minHeight: 200 }}>
                <Box>

                    {/* avatar */}
                    <CenterlizedBox sx={{ marginTop: 1 }}>
                        <Avatar alt='WebMaster' sx={{ height: { xs: 52, sm: 64 }, width: { xs: 52, sm: 64 } }} />
                    </CenterlizedBox>
                    {/* nickname */}
                    <CenterlizedBox>
                        <Typography variant='h6' textAlign={'center'}>{'WebMaster'}</Typography>

                    </CenterlizedBox>
                    {/* info */}
                    <CenterlizedBox>
                        <Box>
                            <CenterlizedBox>
                                <Typography variant='body1'>
                                    {'发帖'}
                                </Typography>
                            </CenterlizedBox>
                            <CenterlizedBox>
                                <Typography variant='body1'>
                                    {10}
                                </Typography>
                            </CenterlizedBox>
                        </Box>
                        <Box>
                            <CenterlizedBox>
                                <Typography variant='body1'>
                                    {'粉丝'}
                                </Typography>
                            </CenterlizedBox>
                            <CenterlizedBox>
                                <Typography variant='body1'>
                                    {10}
                                </Typography>
                            </CenterlizedBox>
                        </Box>
                        <Box>
                            <CenterlizedBox>
                                <Typography variant='body1'>
                                    {'收藏'}
                                </Typography>
                            </CenterlizedBox>
                            <CenterlizedBox>
                                <Typography variant='body1'>
                                    {10}
                                </Typography>
                            </CenterlizedBox>
                        </Box>
                        <Box>
                            <CenterlizedBox>
                                <Typography variant='body1'>
                                    {'获赞'}
                                </Typography>
                            </CenterlizedBox>
                            <CenterlizedBox>
                                <Typography variant='body1'>
                                    {10}
                                </Typography>
                            </CenterlizedBox>
                        </Box>
                    </CenterlizedBox>

                    {/* department select */}
                    <Stack spacing={1} direction='row'
                        sx={{
                            padding: 1,
                            justifyContent: 'center'
                        }}
                    >
                        <Button variant={'contained'} size='small' color={0 === processStates.selectedCategoryId ? 'primary' : 'inherit'} onClick={handleSelectCategory(0)}>
                            <Typography variant='body2' color={'dark' === theme.palette.mode ? 'black' : 'inherit'}>
                                {langConfigs.cat_message[lang]}
                            </Typography>
                        </Button>
                        <Button variant={'contained'} size='small' color={1 === processStates.selectedCategoryId ? 'primary' : 'inherit'} onClick={handleSelectCategory(1)}>
                            <Typography variant='body2' sx={{ display: { xs: 'block', sm: 'none' } }} color={'dark' === theme.palette.mode ? 'black' : 'inherit'}>
                                {langConfigs.cat_posts_short[lang]}
                            </Typography>
                            <Typography variant='body2' sx={{ display: { xs: 'none', sm: 'block' } }} color={'dark' === theme.palette.mode ? 'black' : 'inherit'}>
                                {langConfigs.cat_posts_long[lang]}
                            </Typography>
                        </Button>
                        <Button variant={'contained'} size='small' color={2 === processStates.selectedCategoryId ? 'primary' : 'inherit'} onClick={handleSelectCategory(2)}>
                            <Typography variant='body2' color={'dark' === theme.palette.mode ? 'black' : 'inherit'}>
                                {langConfigs.cat_saved[lang]}
                            </Typography>
                        </Button>
                        <Button variant={'contained'} size='small' color={3 === processStates.selectedCategoryId ? 'primary' : 'inherit'} onClick={handleSelectCategory(3)}>
                            {/* <Typography variant='body2' color={'dark' === theme.palette.mode ? 'black' : 'inherit'}> */}
                            {/* {langConfigs.cat_liked[lang]} */}
                            {/* </Typography> */}
                            <Typography variant='body2' sx={{ display: { xs: 'block', sm: 'none' } }} color={'dark' === theme.palette.mode ? 'black' : 'inherit'}>
                                {langConfigs.cat_history_short[lang]}
                            </Typography>
                            <Typography variant='body2' sx={{ display: { xs: 'none', sm: 'block' } }} color={'dark' === theme.palette.mode ? 'black' : 'inherit'}>
                                {langConfigs.cat_history_long[lang]}
                            </Typography>
                        </Button>
                        <Button variant={'contained'} size='small' color={4 === processStates.selectedCategoryId ? 'primary' : 'inherit'} onClick={handleSelectCategory(4)}>
                            <Typography variant='body2' color={'dark' === theme.palette.mode ? 'black' : 'inherit'} >
                                {langConfigs.cat_settings[lang]}
                            </Typography>
                        </Button>
                    </Stack>
                </Box>
            </Box>
            {/* multi-display */}
            {'messagelayout' === processStates.selectedLayout && <MessageLayout />}
            {'settingslayout' === processStates.selectedLayout && <SettingsLayout />}
            {/* post layout */}
            <Grid container display={'postlayout' === processStates.selectedLayout ? 'flex' : 'none'}>
                {/* left column (placeholder) */}
                <Grid item xs={0} sm={1} md={2} lg={2} xl={2}></Grid>
                {/* middle-left column */}
                <Grid item xs={0} sm={0} md={2} lg={2} xl={1}>
                    <Stack spacing={0} sx={{ marginX: 1, display: { xs: 'none', sm: 'none', md: 'block' } }} >
                        {/* the channel menu (desktop mode) */}
                        <ResponsiveCard sx={{ padding: 1 }}>
                            <MenuList>
                                {/* the "all" menu item */}
                                <MenuItem
                                    onClick={handleChannelSelect('all')}
                                    selected={processStates.selectedChannelId === 'all'}
                                >
                                    <ListItemIcon >
                                        <BubbleChartIcon />
                                    </ListItemIcon>
                                    <ListItemText>
                                        <Typography>
                                            {'全部'}
                                        </Typography>
                                    </ListItemText>
                                </MenuItem>
                                {/* other channels */}
                                {channelInfoList.map(channel => {
                                    return (
                                        <MenuItem key={channel.id} id={channel.id}
                                            onClick={handleChannelSelect(channel.id)}
                                            selected={processStates.selectedChannelId === channel.id}
                                        >
                                            <ListItemIcon >
                                                <SvgIcon>
                                                    <path d={channel.svgIconPath} />
                                                </SvgIcon>
                                            </ListItemIcon>
                                            <ListItemText>
                                                <Typography sx={{ marginTop: '1px' }}>
                                                    {channel.name[lang]}
                                                </Typography>
                                            </ListItemText>
                                        </MenuItem>
                                    )
                                })}
                            </MenuList>
                        </ResponsiveCard>
                        {/* hotest / newest switch */}
                        <ResponsiveCard >
                            <FormControlLabel
                                control={<StyledSwitch sx={{ ml: 1 }} checked={processStates.selectedHotPosts} />}
                                label={processStates.selectedHotPosts ? '最热' : '最新'}
                                onChange={handleSwitchChange}
                            />
                        </ResponsiveCard>
                    </Stack>
                </Grid>
                {/* middle-right column */}
                <Grid item xs={12} sm={10} md={6} lg={6} xl={6}>
                    {/* #1 the channel bar (mobile mode) */}
                    <Stack direction={'row'} id='channel-bar'
                        sx={{
                            padding: 1,
                            overflow: 'auto',
                            display: { sm: 'flex', md: 'none' }
                        }}
                    >
                        {/* hotest / newest switch */}
                        <Box minWidth={110}>
                            <FormControlLabel
                                control={<StyledSwitch sx={{ ml: 1 }} checked={processStates.selectedHotPosts} />}
                                label={processStates.selectedHotPosts ? '最热' : '最新'}
                                onChange={handleSwitchChange}
                            />
                        </Box>
                        {/* the "all" button */}
                        <Button variant={'all' === processStates.selectedChannelId ? 'contained' : 'text'} size='small' onClick={handleChannelSelect('all')}>
                            <Typography variant='body2' color={'all' === processStates.selectedChannelId ? 'white' : "text.secondary"} sx={{ backgroundColor: 'primary' }}>
                                {'全部'}
                            </Typography>
                        </Button>
                        {/* other channels */}
                        {channelInfoList.map(channel => {
                            return (
                                <Button variant={channel.id === processStates.selectedChannelId ? 'contained' : 'text'} key={channel.id} size='small' onClick={handleChannelSelect(channel.id)}>
                                    <Typography variant="body2" color={channel.id === processStates.selectedChannelId ? 'white' : "text.secondary"} sx={{ backgroundColor: 'primary' }}>
                                        {channel.name[lang]}
                                    </Typography>
                                </Button>
                            )
                        })}
                    </Stack>
                    {/* #2 the post mansoy */}
                    <Masonry columns={{ xs: 2, sm: 3, md: 3, lg: 3, xl: 4 }}>
                        {postList.length !== 0 && postList.map(post =>
                            <Paper key={post.id} id={post.id} sx={{ maxWidth: 300, '&:hover': { cursor: 'pointer' } }} onClick={handlePostCardClick(post.id)}>
                                <Stack>
                                    <Box component={'img'} src={post.imgUrl}></Box>
                                    {/* title */}
                                    <Box paddingTop={2} paddingX={2}>
                                        <Typography variant='body1'>{post.title}</Typography>
                                    </Box>
                                    {/* member info & member behaviour */}
                                    <Box paddingTop={1}>
                                        <Grid container>
                                            <Grid item flexGrow={1}>
                                                <Box display={'flex'} flexDirection={'row'}>
                                                    <IconButton onClick={handleIconButtonClick}>
                                                        <Avatar sx={{ bgcolor: 'grey', width: 25, height: 25, fontSize: 12 }}>
                                                            {'W'}
                                                        </Avatar>
                                                    </IconButton>
                                                    <Button variant='text' color='inherit' sx={{ textTransform: 'none' }} onClick={handleIconButtonClick}>
                                                        <Typography variant='body2'>{'WebMaster'}</Typography>
                                                    </Button>
                                                </Box>
                                            </Grid>
                                            <Grid item>
                                                <IconButton onClick={handleMultiProposeClick(processStates.selectedCategoryId)}>
                                                    {1 === processStates.selectedCategoryId && <CreateIcon color={'inherit'} />}
                                                    {2 === processStates.selectedCategoryId && <StarIcon color={true ? 'primary' : 'inherit'} />}
                                                    {3 === processStates.selectedCategoryId && <DeleteIcon color={'inherit'} />}
                                                </IconButton>
                                            </Grid>
                                        </Grid>
                                    </Box>
                                </Stack>
                            </Paper>
                        )}
                    </Masonry>
                </Grid>
                {/* right column (placeholder) */}
                <Grid item xs={0} sm={1} md={2} lg={2} xl={2}></Grid>
            </Grid>
        </>
    )
}

export default Member;