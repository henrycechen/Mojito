import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';

import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';

import ReCAPTCHA from 'react-google-recaptcha';

import { LangConfigs } from '../lib/types';
import { verifyEmailAddress, verifyId } from '../lib/utils/verify';

import Copyright from '../ui/Copyright';
import BackToHomeButtonGroup from '../ui/BackToHomeButtonGroup';
import FormControl from '@mui/material/FormControl';
import AddIcon from '@mui/icons-material/Add';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import ListItemText from '@mui/material/ListItemText';

import { useRouter } from 'next/router';
import { CentralizedBox } from '../ui/Styled';
import Divider from '@mui/material/Divider';
import Terms from '../ui/Terms';

const domain = process.env.NEXT_PUBLIC_APP_DOMAIN;
const recaptchaClientKey = process.env.NEXT_PUBLIC_INVISIABLE_RECAPTCHA_SITE_KEY ?? '';
const defaultLang = process.env.NEXT_PUBLIC_APP_LANG ?? 'tw';
const langConfigs: LangConfigs = {
    submit: {
        tw: '确认',
        cn: '确认',
        en: 'Confirm'
    },
    makeReport: {
        tw: '檢舉不當内容',
        cn: '举报不当内容',
        en: 'Report inappropriate content'
    },
    memberInfo: {
        tw: '用戶信息',
        cn: '用户信息',
        en: 'Member info'
    },
    referenceId: {
        tw: '内容 ID',
        cn: '内容 ID',
        en: 'Reference ID'
    },
    referenceContent: {
        tw: '評論內容或文章標題',
        cn: '评论内容或文章标题',
        en: 'Reference content or title'
    },
    selectCategory: {
        tw: '請選擇類目',
        cn: '请选择类目',
        en: 'Please select a category'
    },
    category: {
        tw: '類目',
        cn: '类目',
        en: 'Category'
    },
    cat0: {
        tw: 'Other',
        cn: 'Other',
        en: 'Other'
    },
    cat1: {
        tw: '仇恨言論',
        cn: '仇恨言论',
        en: 'Hate speech'
    },
    cat2: {
        tw: '騷擾和欺凌',
        cn: '骚扰和欺凌',
        en: 'Harassment and bullying'
    },
    cat3: {
        tw: '色情內容',
        cn: '色情内容',
        en: 'Pornography and sexually explicit content'
    },
    cat4: {
        tw: '非法活動',
        cn: '非法活动',
        en: 'Illegal activities'
    },
    cat5: {
        tw: '垃圾郵件和廣告',
        cn: '垃圾邮件和广告',
        en: 'Spam and advertising'
    },
    cat6: {
        tw: '暴力和血腥内容',
        cn: '暴力和血腥内容',
        en: 'Violence and graphic content'
    },
    cat7: {
        tw: '錯誤信息和假新聞',
        cn: '错误信息和假新闻',
        en: 'Misinformation and fake news'
    },
    emailAddress: {
        tw: '邮件地址',
        cn: '邮件地址',
        en: 'Email address'
    },
    provideAdditionalInfo: {
        tw: '如果您希望提供附加訊息',
        cn: '如果您希望提供附加信息',
        en: 'If you wish to provide additional info'
    },
    additionalInfo: {
        tw: '附加訊息（非必要）',
        cn: '附加信息（非必要）',
        en: 'Additional information (optional)'
    },
    recaptchaLang: {
        tw: 'zh-CN',
        cn: 'zh-CN',
        en: 'en'
    },
    recaptchaNotVerifiedError: {
        tw: '请告诉我们您不是机器人😎',
        cn: '请告诉我们您不是机器人😎',
        en: 'Please tell us if you are not a robot😎'
    },
    recaptchaError: {
        tw: '我们的人机验证系统出了些问题🤯...请尝试刷新或联系我们的管理员',
        cn: '我们的人机验证系统出了些问题🤯...请尝试刷新或联系我们的管理员',
        en: 'Something went wrong with our CAPTCHA🤯...Please try to refresh or contact our Webmaster'
    },
    goodResult: {
        tw: ['感謝您舉報我們平台上的不當內容。在幫助我們為所有成員維持安全和積極的環境方面，您的貢獻發揮著至關重要的作用。', '我們衷心感謝您，為維護安全和積極的社區環境所做的貢獻。'],
        cn: ['感谢您举报我们平台上的不当内容。在帮助我们为所有成员维持安全和积极的环境方面，您的贡献发挥着至关重要的作用。', '我们衷心感谢您，为维护安全和积极的社区环境所做的贡献。'],
        en: ['We want to extend our gratitude for your report of inappropriate content on our platform. Your effort in bringing this to our attention is greatly valued as it helps us ensure a safe and positive environment for all members.', ' Thank you for helping us maintain a safe and positive environment for our community.']
    },
    badResult: {
        tw: ['我們的服務器出了些問題🤯...請稍後重試或聯繫我們的管理員'],
        cn: ['我们的服务器出了些问题🤯...请稍后重试或联系我们的管理员'],
        en: ['Something went wrong with our server 🤯... Please try again later or contact our Webmaster']
    },
    defectiveAffairInfo: {
        tw: ['很抱歉，我們無法找到您檢舉的不當內容或發布這些內容的用戶，請仔細檢查內容並再次嘗試報告或聯繫我們的管理員。對於給您帶來的不便，我們深表歉意。', '我們衷心感謝您，為維護安全和積極的社區環境所做的貢獻。'],
        cn: ['很抱歉，我们无法找到您报告的不当内容或发布这些内容的用户，请仔细检查内容并再次尝试报告或联系我们的管理员。对于给您带来的不便，我们深表歉意。', '我们衷心感谢您，为维护安全和积极的社区环境所做的贡献。'],
        en: ['We apologize for the inconvenience, but we were unable to locate the inappropriate content you reported or the user who posted it. Please double-check the content and try reporting it again, or contact our Webmaster for further assistance.', ' Thank you for helping us maintain a safe and positive environment for our community.']
    },
};

const Affair = () => {

    let recaptcha: any;

    React.useEffect(() => { recaptcha?.execute(); }, []);

    const router = useRouter();

    type TAffairPageProcessStates = {
        lang: string;
        componentOnDisplay: string;
        recaptchaResponse: string;
        errorContent: string;
        displayError: boolean;
        displayCircularProgress: boolean;
        resultContent: string[];
    };

    // States - process ////////
    const [processStates, setProcessStates] = React.useState<TAffairPageProcessStates>({
        lang: defaultLang,
        /**
         * component list:
         * - reportrequestform
         * - reportrequestresult
         */
        componentOnDisplay: 'reportrequestform',
        recaptchaResponse: '',
        errorContent: '',
        displayError: false,
        displayCircularProgress: false,
        resultContent: [],
    });

    const setLang = () => {
        if ('tw' === processStates.lang) { setProcessStates({ ...processStates, lang: 'cn' }); }
        if ('cn' === processStates.lang) { setProcessStates({ ...processStates, lang: 'en' }); }
        if ('en' === processStates.lang) { setProcessStates({ ...processStates, lang: 'tw' }); }
    };

    type TAffairInfo = {
        category: string;
        // '0' 'other' (unavailable)
        // '1' 'hatespeech'
        // '2' 'harassment+bullying'
        // '3' 'pornography'
        // '4' 'illegalactivities'
        // '5' 'spam+advertising'
        // '6' 'violence'
        // '7' 'misinformation',
        memberId: string;
        nickname: string;
        referenceId: string;
        referenceContent: string;
        additionalInfo: string;
    };

    // States - affair info ////////
    const [affairInfoStates, setAffairInfoStates] = React.useState<TAffairInfo>({
        category: '1',
        memberId: '',
        nickname: '',
        referenceId: '',
        referenceContent: '',
        additionalInfo: ''
    });

    React.useEffect(() => {
        if ('object' === typeof router.query && '' !== processStates.recaptchaResponse) {
            initializeAffairInfo();
        }
    }, [router, processStates.recaptchaResponse]);

    const initializeAffairInfo = async () => {
        try {
            const { isValid: isValidMemberId, category: c0, id: memberId } = verifyId(router.query.memberId);
            if (!(isValidMemberId && 'member' === c0)) {
                throw new Error(`Invalid member id`);
            }
            const { isValid: isValidReferenceId, category: c1, id: referenceId } = verifyId(router.query.referenceId);
            if (!(isValidReferenceId && ['post', 'comment', 'subcomment'].includes(c1))) {
                throw new Error(`Invalid reference id`);
            }
            const affairInfoResp = await fetch(`/api/affair/info?memberId=${memberId}&referenceId=${referenceId}&recaptchaResponse=${processStates.recaptchaResponse}`);
            if (200 !== affairInfoResp.status) {
                throw new Error(`Fetch affair info failed`);
            }
            // [!] attemp to parse JSON string makes the probability of causing SyntaxError
            const affairInfo = await affairInfoResp.json();
            setAffairInfoStates({
                ...affairInfoStates,
                memberId,
                nickname: affairInfo.nickname,
                referenceId,
                referenceContent: affairInfo.referenceContent
            });
        } catch (e: any) {
            setProcessStates({ ...processStates, componentOnDisplay: 'reportrequestresult', resultContent: langConfigs.defectiveAffairInfo[processStates.lang] });
            console.log(e);
        }
    };

    const handleTextFieldChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setAffairInfoStates({ ...affairInfoStates, additionalInfo: event.target.value });
    };

    // Handle reset password request form submit
    const handleSubmit = async () => {
        if ('' === processStates.recaptchaResponse) {
            setProcessStates({
                ...processStates,
                errorContent: langConfigs.recaptchaNotVerifiedError[processStates.lang],
                displayError: true,
            });
            setTimeout(() => {
                recaptcha?.execute();
            }, 1000);
            return;
        }

        const resp = await fetch(`/api/affair/report?recaptchaResponse=${processStates.recaptchaResponse}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                memberId: affairInfoStates.memberId,
                nickname: affairInfoStates.nickname,
                referenceId: affairInfoStates.referenceId,
                referenceContent: affairInfoStates.referenceContent,
                category: affairInfoStates.category,
                additionalInfo: affairInfoStates.additionalInfo
            })
        });

        if (200 === resp.status) {
            setProcessStates({
                ...processStates,
                componentOnDisplay: 'reportrequestresult',
                displayCircularProgress: false,
                resultContent: langConfigs.goodResult[processStates.lang]
            });
        } else if (404 === resp.status) {
            setProcessStates({
                ...processStates,
                componentOnDisplay: 'reportrequestresult',
                displayCircularProgress: false,
                resultContent: langConfigs.defectiveAffairInfo[processStates.lang]
            });
        } else {
            setProcessStates({
                ...processStates,
                componentOnDisplay: 'reportrequestresult',
                displayCircularProgress: false,
                resultContent: langConfigs.badResult[processStates.lang]
            });
        }

    };

    // Handle ReCAPTCHA challenge
    const handleRecaptchaChange = (value: any) => {
        if (!!value) {
            setProcessStates({ ...processStates, recaptchaResponse: value });
        } else {
            setProcessStates({ ...processStates });
        }
    };

    return (
        <>
            <Container component='main' maxWidth={'xs'} >
                {/* reportrequestform */}
                <Stack sx={{ mt: '5rem', display: 'reportrequestform' === processStates.componentOnDisplay ? 'block' : 'none' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <Link href='/'>
                            <Avatar src={`${domain}/favicon.ico`} sx={{ width: 56, height: 56 }} />
                        </Link>
                    </Box>

                    {/* title */}
                    <Typography component='h1' variant='h5' sx={{ mt: 2, textAlign: 'center' }}>{langConfigs.makeReport[defaultLang]}</Typography>

                    <Stack spacing={2} sx={{ mt: 4 }} >
                        <Box sx={{ display: processStates.displayError ? 'block' : 'none' }}>
                            <Alert severity='error' >
                                <strong>{processStates.errorContent}</strong>
                            </Alert>
                        </Box>

                        {/* nickname & member id */}
                        <Typography>{`${langConfigs.memberInfo[processStates.lang]}: ${affairInfoStates.nickname} (ID: ${affairInfoStates.memberId})`}</Typography>

                        {/* reference id */}
                        <Typography>{`${langConfigs.referenceId[processStates.lang]}: ${affairInfoStates.referenceId}`}</Typography>

                        {/* reference content */}
                        <Typography>{`${langConfigs.referenceContent[processStates.lang]}: "${affairInfoStates.referenceContent}"`}</Typography>
                        <Divider />

                        {/* select */}
                        <Typography>{langConfigs.selectCategory[processStates.lang]}</Typography>
                        <FormControl fullWidth disabled={false} required>
                            <InputLabel id={'categoryselect'}>{langConfigs.category[processStates.lang]}</InputLabel>
                            <Select
                                labelId={'categoryselect'}
                                value={affairInfoStates.category}
                                label={langConfigs.category[processStates.lang]}
                                onChange={(event: SelectChangeEvent) => { setAffairInfoStates({ ...affairInfoStates, category: event.target.value as string }); }}
                                SelectDisplayProps={{ style: { display: 'flex', alignItems: 'center' } }}
                                MenuProps={{ style: { maxHeight: 240 } }}
                            >
                                {[1, 2, 3, 4, 5, 6, 7].map(cat =>
                                    <MenuItem key={cat} value={cat}>
                                        <ListItemText>
                                            <Typography sx={{ marginTop: '1px' }}>{langConfigs[`cat${cat}`][processStates.lang]}</Typography>
                                        </ListItemText>
                                    </MenuItem>
                                )}

                            </Select>
                        </FormControl>

                        {/* additional info */}
                        <Typography>{langConfigs.provideAdditionalInfo[processStates.lang]}</Typography>
                        <TextField
                            label={langConfigs.additionalInfo[processStates.lang]}
                            value={affairInfoStates.additionalInfo}
                            onChange={handleTextFieldChange}
                        />

                        {/* submit */}
                        <Box>
                            <Button fullWidth variant='contained' onClick={async () => { await handleSubmit(); }}>
                                <Typography sx={{ display: !processStates.displayCircularProgress ? 'block' : 'none' }}>
                                    {langConfigs.submit[processStates.lang]}
                                </Typography>
                                <CircularProgress sx={{ color: 'white', display: processStates.displayCircularProgress ? 'block' : 'none' }} />
                            </Button>
                        </Box>
                    </Stack>
                </Stack >

                {/* reportrequestresult */}
                < Box sx={{ mt: { xs: '14rem', sm: '18rem' }, mb: '10rem', display: 'reportrequestresult' === processStates.componentOnDisplay ? 'block' : 'none' }}>
                    {processStates.resultContent.map((content, i) =>
                        <Typography key={i} mt={0 === i ? 0 : 2} textAlign={'center'}>{content}</Typography>
                    )}
                    <BackToHomeButtonGroup />
                </Box >

                <Copyright sx={{ mt: 8 }} lang={processStates.lang} />
                <Terms lang={processStates.lang} />

                <CentralizedBox sx={{ mb: 8 }} >
                    <Button variant='text' sx={{ textTransform: 'none' }} onClick={setLang}>
                        <Typography variant={'body2'}>{'繁|简|English'}</Typography>
                    </Button>
                </CentralizedBox>
            </Container >

            <ReCAPTCHA
                sitekey={recaptchaClientKey}
                size={'invisible'}
                hl={langConfigs.recaptchaLang[processStates.lang]}
                ref={(ref: any) => ref && (recaptcha = ref)}
                onChange={handleRecaptchaChange}
            />
        </>
    );
};

export default Affair;