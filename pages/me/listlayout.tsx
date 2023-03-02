  ////////////////////////   List Layout   ////////////////////////
  type TListLayoutStates = {
    selectedCategory: 'followedbyme' | 'followingme';
};

//////// STATES - list layout ////////
const [listLayoutStates, setListLayoutStates] = React.useState<TListLayoutStates>({
    selectedCategory: 'followedbyme', // 'followedbyme' | 'followingme'
});

const [memberInfoArr, setMemberInfoArr] = React.useState<IConciseMemberInfo[]>([]);

React.useEffect(() => { updateMemberInfoArr(); }, []);
React.useEffect(() => { updateMemberInfoArr(); }, [listLayoutStates.selectedCategory]);

const updateMemberInfoArr = async () => {
    const resp = await fetch(`/api/member/${listLayoutStates.selectedCategory}/${authorId}`);
    if (200 !== resp.status) {
        console.log(`Attempt to GET member info array of ${listLayoutStates.selectedCategory}`);
        return;
    }
    try {
        const arr = await resp.json();
        setMemberInfoArr([...arr]);
    } catch (e) {
        console.log(`Attempt to get member info array  of ${listLayoutStates.selectedCategory} from resp. ${e}`);
    }
};

const handleSelectListCategory = (categoryId: 'followedbyme' | 'followingme') => (event: React.MouseEvent<HTMLButtonElement>) => {
    setListLayoutStates({ ...listLayoutStates, selectedCategory: categoryId });
    setNoticeStatistics({ ...noticeStatistics, follow: 0 });
};

const handleUndoFollow = async (followedId: string) => {
    // delete element (member info) from the array
    const arr: IConciseMemberInfo[] = [...memberInfoArr];
    for (let i = 0; i < arr.length; i++) {
        if (followedId === arr[i].memberId) {
            arr.splice(i, 1);
            setMemberInfoArr([...arr]);
            break;
        }
    }
    const resp = await fetch(`/api/follow/${followedId}`, { method: 'POST' });
    if (200 !== resp.status) {
        console.log(`Attempt to undo follow for ${followedId}`);
    }
};

//////// COMPONENT - list layout ////////
const ListLayout = () => {
    return (
        <Grid container>

            {/* left column (placeholder) */}
            <Grid item xs={0} sm={2} md={3} lg={3}></Grid>

            {/* middle column */}
            <Grid item xs={12} sm={8} md={6} lg={6}>
                <ResponsiveCard>
                    <Stack>

                        {/* section select */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-evenly' }}>

                            {/* followed by me */}
                            <Button sx={{ color: 'followedbyme' === listLayoutStates.selectedCategory ? 'primary' : 'grey.600' }} onClick={handleSelectListCategory('followedbyme')}>
                                <Typography variant={'body2'} textAlign={'center'}>
                                    {memberId === authorId ? langConfigs.myFollowing[preferenceStates.lang] : langConfigs.authorsFollowing[preferenceStates.lang]}
                                </Typography>
                            </Button>

                            {/* following me */}
                            <Button sx={{ color: 'followingme' === listLayoutStates.selectedCategory ? 'primary' : 'grey.600' }} onClick={handleSelectListCategory('followingme')}>
                                <Typography variant={'body2'} textAlign={'center'}>
                                    {memberId === authorId ? langConfigs.myFollowedBy[preferenceStates.lang] : langConfigs.authorsFollowedBy[preferenceStates.lang]}
                                    {0 === noticeStatistics.follow ? '' : `+${noticeStatistics.follow}`}
                                </Typography>
                            </Button>
                        </Box>
                        <Box mt={{ xs: 1, sm: 2 }}><Divider /></Box>

                        {/* member info list */}
                        <Stack padding={{ xs: 0, sm: 2 }} spacing={{ xs: 4, sm: 4, md: 5 }}>
                            {0 !== memberInfoArr.length && memberInfoArr.map(info =>

                                <Box key={info.memberId} mt={{ xs: 3, sm: 2 }} sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }} >

                                    {/* initiate info */}
                                    <Stack direction={'row'} sx={{ maxHeight: 40 }}>
                                        <IconButton sx={{ padding: 0 }} onClick={handleClickOnInitiateInfo(info.memberId)}>
                                            <Avatar src={provideAvatarImageUrl(info.memberId, domain)} sx={{ width: 38, height: 38, bgcolor: 'grey' }}>{info.nickname?.charAt(0).toUpperCase()}</Avatar>
                                        </IconButton>
                                        <Box ml={1}>
                                            <TextButton color={'inherit'} onClick={handleClickOnInitiateInfo(info.memberId)}>

                                                {/* nickname */}
                                                <Typography variant={'body2'} align={'left'}>{getContentBrief(info.nickname, 13)}</Typography>

                                                {/* brief intro */}
                                                <Typography variant={'body2'} fontSize={{ xs: 12, align: 'left' }} >{getContentBrief(info.briefIntro, 13)}</Typography>
                                            </TextButton>
                                        </Box>
                                    </Stack>

                                    {/* undo follow button */}
                                    {'followedbyme' === listLayoutStates.selectedCategory && <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }} >
                                        <Button variant='text' color={'inherit'} onClick={async () => { await handleUndoFollow(info.memberId); }}>
                                            <Typography variant={'body2'} align={'right'}>{langConfigs.undoFollow[preferenceStates.lang]}</Typography>
                                        </Button>
                                    </Box>}

                                    {/* created time */}
                                    {'followingme' === listLayoutStates.selectedCategory && <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }} >
                                        <Typography variant={'body2'} align={'right'} sx={{ paddingRight: 1 }}>{timeToString(info.createdTimeBySecond, preferenceStates.lang)}</Typography>
                                    </Box>}
                                </Box>
                            )}
                            {0 === memberInfoArr.length &&
                                <Box minHeight={200} mt={10}>
                                    {'followedbyme' === listLayoutStates.selectedCategory && <Typography color={'text.secondary'} align={'center'}>
                                        {memberId === authorId ? langConfigs.noFollowingMemberInfoRecord[preferenceStates.lang] : langConfigs.authorNoFollowingMemberInfoRecord[preferenceStates.lang]}
                                    </Typography>}
                                    {'followingme' === listLayoutStates.selectedCategory && <Typography color={'text.secondary'} align={'center'}>
                                        {memberId === authorId ? langConfigs.noFollowedByMemberInfoRecord[preferenceStates.lang] : langConfigs.authorNoFollowedByMemberInfoRecord[preferenceStates.lang]}
                                    </Typography>}
                                </Box>
                            }
                        </Stack>

                    </Stack>
                </ResponsiveCard>
            </Grid>

            {/* right column (placeholder) */}
            <Grid item xs={0} sm={2} md={3} lg={3}></Grid>
        </Grid >
    );
};




export default ListLayout