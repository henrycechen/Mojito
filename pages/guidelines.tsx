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
import { getRandomHexStr } from '../lib/utils/create';

const defaultLang = process.env.NEXT_PUBLIC_APP_LANG ?? 'tw';
const langConfigs: LangConfigs = {
    title0: {
        tw: '網絡社區準則',
        cn: '网络社区准则',
        en: 'Community Guidelines'
    },
    title1: {
        tw: '頭像相片設定規則',
        cn: '头像图片设置规则',
        en: 'Guidelines for avatar images'
    },
    title2: {
        tw: '暱稱設定規則',
        cn: '昵称设置规则',
        en: 'Guidelines for nicknames'
    },
    title3: {
        tw: '簡介設定規則',
        cn: '简介设置规则',
        en: 'Guidelines for brief intros'
    },
    publishedDate0: {
        tw: `更新日期：2023年2月13日`,
        cn: `更新日期：2023年2月13日`,
        en: `Updated: February 13, 2023`
    },
    publishedDate1: {
        tw: `更新日期：2023年2月16日`,
        cn: `更新日期：2023年2月16日`,
        en: `Updated: February 16, 2023`
    },
    publishedDate2: {
        tw: `更新日期：2023年2月16日`,
        cn: `更新日期：2023年2月16日`,
        en: `Updated: February 13, 2023`
    },
    publishedDate3: {
        tw: `更新日期：2023年2月16日`,
        cn: `更新日期：2023年2月16日`,
        en: `Updated: February 13, 2023`
    },
    terms0: {
        tw: [
            '1. 尊重他人：我們希望社區的所有成員尊重和體諒他人，無論其種族、民族、宗教、性別、性取向或任何其他個人特徵如何。 不會容忍騷擾、仇恨言論和任何其他形式的歧視。',
            '2. 文明對話：我們鼓勵熱烈的辯論和討論，但所有成員都應進行建設性和相互尊重的對話。 不接受人身攻擊、辱罵和其他形式的不文明行為。',
            '3. 禁止垃圾郵件或自我推銷：不允許向社區發送不相關的內容或過度的自我推銷。 用戶應保持他們的貢獻與手頭的主題相關，未經許可不得張貼鏈接或廣告。',
            '4. 版權合規：所有用戶必須尊重他人的知識產權。 未經許可不得發布受版權保護的材料，我們保留刪除任何侵權內容的權利。',
            '5. 內容責任：用戶對其發布的內容負全部責任，並且必須確保其符合所有適用的法律法規。 我們保留刪除任何非法、攻擊性或違反這些準則的內容的權利。',
            '6. 匿名發帖：本社區不允許匿名發帖。 用戶必須使用真實姓名並提供有關自己的準確信息。',
            '7. 舉報違規行為：如果您遇到違反這些準則的帖子或評論，請向社區管理員舉報，以便他們採取適當的措施。',
            '參與此社區即表示您同意遵守這些準則。 如果您違反這些準則，您的帳戶可能會被暫停或終止。',
            '請記得讓我們的社區成為一個友好和尊重的地方，讓每個人都能參與和享受。',
        ],
        cn: [
            '1. 尊重他人：我们希望社区的所有成员尊重和体谅他人，无论其种族、民族、宗教、性别、性取向或任何其他个人特征如何。 不会容忍骚扰、仇恨言论和任何其他形式的歧视。',
            '2. 文明对话：我们鼓励热烈的辩论和讨论，但所有成员都应进行建设性和相互尊重的对话。 不接受人身攻击、辱骂和其他形式的不文明行为。',
            '3. 禁止垃圾邮件或自我推销：不允许向社区发送不相关的内容或过度的自我推销。 用户应保持他们的贡献与手头的主题相关，未经许可不得张贴链接或广告。',
            '4. 版权合规：所有用户必须尊重他人的知识产权。 未经许可不得发布受版权保护的材料，我们保留删除任何侵权内容的权利。',
            '5. 内容责任：用户对其发布的内容负全部责任，并且必须确保其符合所有适用的法律法规。 我们保留删除任何非法、攻击性或违反这些准则的内容的权利。',
            '6. 匿名发帖：本社区不允许匿名发帖。 用户必须使用真实姓名并提供有关自己的准确信息。',
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
    },
    terms1: {
        tw: [
            '1. 尊重：頭像圖像不應包含任何可能被視為有害、歧視或歧視個人或團體的冒犯性或不當內容。',
            '2. 非欺騙性：頭像圖像不應用於冒充或歪曲個人或團體。',
            '3. 適當的尺寸：頭像圖像應具有適當的尺寸和分辨率，以避免像素化或失真。',
            '4. 商業用途：頭像圖片不得宣傳或宣傳任何商業產品、服務或品牌，除非獲得許可。',
            '5. 受版權保護的圖像：頭像圖像不應是受知識產權保護的受版權保護的圖像、商標或徽標。',
            '6. 無個人信息：頭像圖像不應包含任何個人信息，例如聯繫方式、電話號碼或地址。',
        ],
        cn: [
            '1. 尊重：头像图像不应包含任何可能被视为有害、歧视或歧视个人或团体的冒犯性或不当内容。',
            '2. 非欺骗性：头像图像不应用于冒充或歪曲个人或团体。',
            '3. 适当的尺寸：头像图像应具有适当的尺寸和分辨率，以避免像素化或失真。',
            '4. 非商业用途：头像图片不得宣传或宣传任何商业产品、服务或品牌，除非获得许可。',
            '5.  受版权保护的图像：头像图像不应是受知识产权保护的受版权保护的图像、商标或徽标。',
            '6. 无个人信息：头像图像不应包含任何个人信息，例如联系方式、电话号码或地址。',
        ],
        en: [
            '1. Respectful: Avatar images should not contain any offensive or inappropriate content that could be considered harmful, discriminatory, or discriminatory towards individuals or groups.',
            '2. Non-Deceptive: Avatar images should not be used to impersonate or misrepresent individuals or groups.',
            '3. Appropriate Size: Avatar images should be of an appropriate size and resolution to avoid pixelation or distortion.',
            '4. Non-Commercial: Avatar images should not promote or advertise any commercial products, services or brands unless permitted.',
            '5. Copyrighted Images: Avatar images should not be copyrighted images, trademarks, or logos that are protected by intellectual property rights.',
            '6. No Personal Information: Avatar images should not contain any personal information such as contact details, phone numbers, or addresses.',
        ],
    },
    terms2: {
        en: [
            '1. Respectful: Nicknames should not contain offensive or derogatory language, including racial slurs, gender-based slurs, or hate speech. Nicknames also should not contain profanity or vulgar language.',
            '2. Non-Deceptive: Nicknames should not impersonate or misrepresent the identity of other members, individuals, or organizations.',
            '3. No Personal Information: Nicknames should not contain personal privacy, such as full names, addresses, or contact information.',
            '4. Non-Commercial: Nicknames should not promote or advertise any products, services, or websites unless permitted.',
            '5. Compliance with Laws: Nicknames should not violate any local, national, or international laws.',
            '6. High-Readability: Nicknames should not be no longer than 13 characters or difficult to read or type.',
            '7. Minimize Confusion: Nicknames should not contain excessive punctuation or symbols that may cause confusion or disrupt communication.',
        ],
        tw: [
            '1. 尊重：暱稱不應包含攻擊性或貶損性語言，包括種族歧視、性別歧視或仇恨言論。暱稱也不應包含褻瀆或粗俗的語言。',
            '2. 非欺騙性：暱稱不得冒充或歪曲其他用戶、個人或組織的身份。',
            '3. 無個人信息：暱稱不得包含個人隱私，如全名、地址或聯繫方式。',
            '4. 非商業：暱稱不得宣傳或宣傳任何產品、服務或網站，除非獲得許可。',
            '5. 遵守法律：暱稱不得違反任何地方、國家或國際法律。',
            '6. 高可讀性：暱稱不得超過13個字符或使用難以閱讀或輸入的文字。',
            '7. 減少混淆：暱稱不應包含過多的標點符號或可能導致混淆或乾擾交流的符號。',
        ],
        cn: [
            '1. 尊重：昵称不应包含攻击性或贬损性语言，包括种族歧视、基于性别的歧视或仇恨言论。 昵称也不应包含亵渎或粗俗的语言。',
            '2. 非欺骗性：昵称不得冒充或歪曲其他用户、个人或组织的身份。',
            '3. 无个人信息：昵称不得包含个人隐私，如全名、地址或联系方式。',
            '4. 非商业：昵称不得宣传或宣传任何产品、服务或网站，除非获得许可。',
            '5. 遵守法律：昵称不得违反任何地方、国家或国际法律。',
            '6. 高可读性：昵称不得超过13个字符或使用难以阅读或输入的文字。',
            '7. 减少混淆：昵称不应包含过多的标点符号或可能导致混淆或干扰交流的符号。',
        ],
    },
    terms3: {
        en: [
            '1. Brief intros should be brief and to the point, containing only relevant information about the member, such as their name, interests, and why they joined the community.',
            '2. Brief intros should not contain any personal information that could compromise the member\'s privacy or security, such as their full address, phone number, or email address.',
            '3. Brief intros should be respectful and appropriate, avoiding any offensive or inappropriate language, including hate speech, profanity, or derogatory comments.',
            '4. Brief intros should not include any advertising or promotion of products or services unless permitted.',
            '5. Brief intros should comply with all applicable laws and regulations, including those related to data privacy and protection.',
        ],
        tw: [
            '1. 簡介应簡明扼要，只包含用戶的相關信息，如姓名、興趣愛好、加入社區的原因等。',
            '2. 簡介不應包含任何可能危及用戶隱私或安全的個人信息，例如完整地址、電話號碼或電子郵件地址。',
            '3. 簡介應尊重和適當，避免任何攻擊性或不適當的語言，包括仇恨言論、褻瀆或貶損性評論。',
            '4. 簡介不得包含任何產品或服務的廣告或促銷，除非獲得許可。 ',
            '5. 簡介應遵守所有適用的法律法規，包括與數據隱私和保護相關的法律法規。',
        ],
        cn: [
            '1. 简介应简明扼要，只包含用户的相关信息，如姓名、兴趣爱好、加入社区的原因等。',
            '2. 简介不应包含任何可能危及用户隐私或安全的个人信息，例如完整地址、电话号码或电子邮件地址。',
            '3. 简介应尊重和适当，避免任何攻击性或不适当的语言，包括仇恨言论、亵渎或贬损性评论。',
            '4. 简介不得包含任何产品或服务的广告或促销，除非获得许可。',
            '5. 简介应遵守所有适用的法律法规，包括与数据隐私和保护相关的法律法规。',
        ],
    },
}

export default function CommunityGidelines() {

    type TProcessStates = {
        lang: string;
    }

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
                        <Typography variant={'h5'}>{langConfigs.title0[processStates.lang]}</Typography>
                        <Typography variant={'body2'}>{langConfigs.publishedDate0[processStates.lang]}</Typography>
                        <Button variant='text' sx={{ textTransform: 'none' }} onClick={setLang}>
                            <Typography variant={'body2'}>{'繁|简|English'}</Typography>
                        </Button>
                    </Grid>
                    <Grid item md={7} sx={{ p: 1, paddingTop: { xs: 4, sm: 8, md: 16 } }}>
                        <Stack direction={'column'} spacing={2}>
                            {langConfigs.terms0[processStates.lang].map((term: string) => <Typography key={getRandomHexStr()} variant={'body1'}>{term}</Typography>)}
                        </Stack>
                    </Grid>
                    <Grid item md={1}></Grid>
                </Grid>
                <Grid container>
                    <Grid item md={1}></Grid>
                    <Grid item md={3} sx={{ p: 1, paddingTop: 16 }}>
                        <Typography variant={'h5'}>{langConfigs.title1[processStates.lang]}</Typography>
                        <Typography variant={'body2'}>{langConfigs.publishedDate1[processStates.lang]}</Typography>
                    </Grid>
                    <Grid item md={7} sx={{ p: 1, paddingTop: { xs: 4, sm: 8, md: 16 } }}>
                        <Stack direction={'column'} spacing={2}>
                            {langConfigs.terms1[processStates.lang].map((term: string) => <Typography key={getRandomHexStr()} variant={'body1'}>{term}</Typography>)}
                        </Stack>
                    </Grid>
                    <Grid item md={1}></Grid>
                </Grid>
                <Grid container>
                    <Grid item md={1}></Grid>
                    <Grid item md={3} sx={{ p: 1, paddingTop: 16 }}>
                        <Typography variant={'h5'}>{langConfigs.title2[processStates.lang]}</Typography>
                        <Typography variant={'body2'}>{langConfigs.publishedDate2[processStates.lang]}</Typography>
                    </Grid>
                    <Grid item md={7} sx={{ p: 1, paddingTop: { xs: 4, sm: 8, md: 16 } }}>
                        <Stack direction={'column'} spacing={2}>
                            {langConfigs.terms2[processStates.lang].map((term: string) => <Typography key={getRandomHexStr()} variant={'body1'}>{term}</Typography>)}
                        </Stack>
                    </Grid>
                    <Grid item md={1}></Grid>
                </Grid>
                <Grid container>
                    <Grid item md={1}></Grid>
                    <Grid item md={3} sx={{ p: 1, paddingTop: 16 }}>
                        <Typography variant={'h5'}>{langConfigs.title3[processStates.lang]}</Typography>
                        <Typography variant={'body2'}>{langConfigs.publishedDate2[processStates.lang]}</Typography>
                    </Grid>
                    <Grid item md={7} sx={{ p: 1, paddingTop: { xs: 4, sm: 8, md: 16 } }}>
                        <Stack direction={'column'} spacing={2}>
                            {langConfigs.terms3[processStates.lang].map((term: string) => <Typography key={getRandomHexStr()} variant={'body1'}>{term}</Typography>)}
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