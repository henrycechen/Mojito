import * as React from 'react';

import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from '@mui/material/Button';

import Copyright from "../ui/Copyright";
import Navbar from "../ui/Navbar";
import Terms from "../ui/Terms";

import { LangConfigs } from '../lib/types';
import { getRandomHexStr } from '../lib/utils';

type TProcessStates = {
    lang: string;
}

const defaultLang = process.env.NEXT_PUBLIC_APP_LANG ?? 'tw';
const langConfigs: LangConfigs = {
    title: {
        tw: '网络社区準則',
        cn: '網絡社區准则',
        en: 'Community Guidelines'
    },
    publishedDate: {
        tw: `更新日期：2023年2月13日`,
        cn: `更新日期：2023年2月13日`,
        en: `Updated: February 13, 2022`
    },
    terms: {
        tw: [
            '1. 尊重他人：我們希望社區的所有成員尊重和體諒他人，無論其種族、民族、宗教、性別、性取向或任何其他個人特徵如何。 不會容忍騷擾、仇恨言論和任何其他形式的歧視。',
            '2. 文明對話：我們鼓勵熱烈的辯論和討論，但所有成員都應進行建設性和相互尊重的對話。 不接受人身攻擊、辱罵和其他形式的不文明行為。',
            '3. 禁止垃圾郵件或自我推銷：不允許向社區發送不相關的內容或過度的自我推銷。 會員應保持他們的貢獻與手頭的主題相關，未經許可不得張貼鏈接或廣告。',
            '4. 版權合規：所有會員必須尊重他人的知識產權。 未經許可不得發布受版權保護的材料，我們保留刪除任何侵權內容的權利。',
            '5. 內容責任：會員對其發布的內容負全部責任，並且必須確保其符合所有適用的法律法規。 我們保留刪除任何非法、攻擊性或違反這些準則的內容的權利。',
            '6. 匿名發帖：本社區不允許匿名發帖。 會員必須使用真實姓名並提供有關自己的準確信息。',
            '7. 舉報違規行為：如果您遇到違反這些準則的帖子或評論，請向社區管理員舉報，以便他們採取適當的措施。',
            '參與此社區即表示您同意遵守這些準則。 如果您違反這些準則，您的帳戶可能會被暫停或終止。',
            '請記得讓我們的社區成為一個友好和尊重的地方，讓每個人都能參與和享受。',
        ],
        cn: [
            '1. 尊重他人：我们希望社区的所有成员尊重和体谅他人，无论其种族、民族、宗教、性别、性取向或任何其他个人特征如何。 不会容忍骚扰、仇恨言论和任何其他形式的歧视。',
            '2. 文明对话：我们鼓励热烈的辩论和讨论，但所有成员都应进行建设性和相互尊重的对话。 不接受人身攻击、辱骂和其他形式的不文明行为。',
            '3. 禁止垃圾邮件或自我推销：不允许向社区发送不相关的内容或过度的自我推销。 会员应保持他们的贡献与手头的主题相关，未经许可不得张贴链接或广告。',
            '4. 版权合规：所有会员必须尊重他人的知识产权。 未经许可不得发布受版权保护的材料，我们保留删除任何侵权内容的权利。',
            '5. 内容责任：会员对其发布的内容负全部责任，并且必须确保其符合所有适用的法律法规。 我们保留删除任何非法、攻击性或违反这些准则的内容的权利。',
            '6. 匿名发帖：本社区不允许匿名发帖。 会员必须使用真实姓名并提供有关自己的准确信息。',
            '7. 举报违规行为：如果您遇到违反这些准则的帖子或评论，请向社区管理员举报，以便他们采取适当的措施。',
            '参与此社区即表示您同意遵守这些准则。 如果您违反这些准则，您的帐户可能会被暂停或终止。',
            '请记得让我们的社区成为一个友好和尊重的地方，让每个人都能参与和享受。',
        ],
        en: [
            '1. Respect for others: We expect all members of the community to be respectful and considerate of others, regardless of their race, ethnicity, religion, gender, sexual orientation, or any other personal characteristic. Harassment, hate speech, and any other forms of discrimination will not be tolerated.',
            '2. Civility in discourse: We encourage lively debate and discussions, but all members should engage in constructive and respectful dialogue. Personal attacks, name-calling, and other forms of uncivil behavior are not acceptable.',
            '3. No spamming or self-promotion: Spamming the community with irrelevant content or excessive self-promotion is not permitted. Members should keep their contributions relevant to the topic at hand and refrain from posting links or advertisements without permission.',
            '4. Copyright compliance: All members must respect the intellectual property rights of others. Posting copyrighted material without permission is not allowed, and we reserve the right to remove any infringing content.',
            '5. Responsibility for content: Members are solely responsible for the content they post and must ensure that it complies with all applicable laws and regulations. We reserve the right to remove any content that is illegal, offensive, or violates these guidelines.',
            '6. Anonymous posting: Anonymous posting is not allowed on this community. Members must use their real names and provide accurate information about themselves.',
            '7. Reporting violations: If you encounter a post or comment that violates these guidelines, please report it to the moderators so that they can take appropriate action.',
            'By participating in this community, you agree to abide by these guidelines. If you violate these guidelines, your account may be suspended or terminated.',
            'Please remember to keep our community a friendly and respectful place for everyone to participate and enjoy.',
        ],
    }
}


export default function CommunityGidelines() {

    const [processStates, setProcessStates] = React.useState<TProcessStates>({
        lang: defaultLang
    })

    const setLang = () => {
        if ('tw' === processStates.lang) { setProcessStates({ ...processStates, lang: 'cn' }) }
        if ('cn' === processStates.lang) { setProcessStates({ ...processStates, lang: 'en' }) }
        if ('en' === processStates.lang) { setProcessStates({ ...processStates, lang: 'tw' }) }
    }

    return (
        <>
            <Navbar />
            <Container sx={{ minHeight: 600 }}>
                <Grid container>
                    <Grid item md={1}></Grid>
                    <Grid item md={3} sx={{ p: 1, paddingTop: 16 }}>
                        <Typography variant={'h5'}>{langConfigs.title[processStates.lang]}</Typography>
                        <Typography variant={'body2'}>{langConfigs.publishedDate[processStates.lang]}</Typography>
                        <Button variant='text' sx={{ textTransform: 'none' }} onClick={setLang}>
                            <Typography variant={'body2'}>{'简|繁|English'}</Typography>
                        </Button>
                    </Grid>
                    <Grid item md={7} sx={{ p: 1, paddingTop: { xs: 4, sm: 8, md: 16 } }}>
                        <Stack direction={'column'} spacing={2}>
                            {langConfigs.terms[processStates.lang].map((term: string) => <Typography key={getRandomHexStr()} variant={'body1'}>{term}</Typography>)}
                        </Stack>
                    </Grid>
                    <Grid item md={1}></Grid>
                </Grid>
            </Container>
            <Copyright sx={{ mt: 8 }} lang={processStates.lang} />
            <Terms sx={{ mb: 8 }} lang={processStates.lang} />
        </>
    )
}