import NextAuth from "next-auth";
import GithubProvider from 'next-auth/providers/github';
import GoogleProvide from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import CryptoJS from 'crypto-js';

import AzureTableClient from '../../../modules/AzureTableClient';
import { verifyRecaptchaResponse, verifyEnvironmentVariable, getRandomStr, verifyEmailAddress, log } from '../../../lib/utils';
import { User } from 'next-auth';
import { IMemberIdIndex, IMemberInfo, IMemberLoginRecord, IMemberManagement, IMemberStatistics, IThirdPartyLoginCredentialMapping } from '../../../lib/interfaces';
import { VerifyAccountRequestInfo, EmailMessage, LangConfigs } from "../../../lib/types";
import { RestError } from "@azure/storage-blob";
import { composeVerifyAccountEmail } from "../../../lib/email";
import AzureEmailCommunicationClient from "../../../modules/AzureEmailCommunicationClient";
import AtlasDatabaseClient from "../../../modules/AtlasDatabaseClient";

type LoginRequestInfo = {
    recaptchaResponse: any;
    emailAddress: any;
    password: any;
}

type ProviderIdMapping = {
    [key: string]: string
}

interface MemberUser extends User {
    id: string;
    nickname?: string;
    emailAddress?: string;
    avatarImageUrl?: string;
}

const recaptchaServerSecret = process.env.INVISIABLE_RECAPTCHA_SECRET_KEY ?? '';
const salt = process.env.APP_PASSWORD_SALT ?? '';
const loginProviderIdMapping: ProviderIdMapping = { // [!] Every time add a new provider, update this dictionary
    github: 'GitHubOAuth',
    google: 'GoogleOAuth',
    // twitter
    // facebook
}

const appSecret = process.env.APP_AES_SECRET ?? '';
const domain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? '';
const lang = process.env.NEXT_PUBLIC_APP_LANG ?? 'ch';
const langConfigs: LangConfigs = {
    emailSubject: {
        ch: '验证您的 Mojito 账户',
        en: 'Verify your Mojito account'
    }
}

export default NextAuth({
    session: {
        strategy: 'jwt',
        maxAge: 15 * 24 * 60 * 60, // [!] 15 days
    },
    providers: [
        GithubProvider({
            clientId: process.env.GITHUB_ID ?? '',
            clientSecret: process.env.GITHUB_SECRET ?? ''
        }),
        GoogleProvide({
            clientId: process.env.GOOGLE_CLIENT_ID ?? '',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? ''
        }),
        CredentialsProvider({
            id: 'mojito',
            credentials: {
                recaptchaResponse: { label: "RecaptchaResponse", type: "text", placeholder: "" },
                emailAddress: { label: "EmailAddress", type: "text", placeholder: "" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials, req) {
                if (!credentials) {
                    return null;
                }
                return await verifyLoginCredentials(credentials);
            }
        })
    ],
    pages: {
        signIn: '/signin',
        signOut: 'signout',
        error: '/error'
    },
    callbacks: {
        async jwt({ token, user, account, profile }: any) {
            const provider = account?.provider;
            console.log('jwt call back' + account);
            // On token update (second call)
            if (!provider) {
                return token;
            }
            // On login with Mojito member system (first call)
            if ('mojito' === provider) {
                token.id = token.sub;
                return token;
            }
            // On login with third party login provider
            try {
                // Step #1.1 prepare account id
                const { providerAccountId: accountId } = account;
                // Step #1.1 prepare provider id
                const providerId = loginProviderIdMapping[provider];
                // Step #2 look up login credential mapping in [RL] LoginCredentialsMapping 
                const loginCredentialsMappingTableClient = AzureTableClient('LoginCredentialsMapping');
                const mappingQuery = loginCredentialsMappingTableClient.listEntities({ queryOptions: { filter: `PartitionKey eq '${providerId}' and RowKey eq '${accountId}'` } });
                // [!] attemp to reterieve entity makes the probability of causing RestError
                const mappingQueryResult = await mappingQuery.next();
                if (!mappingQueryResult.value) {
                    throw new Error('Login credentials mapping record not found');
                } else {
                    const { MemberId: memberId } = mappingQueryResult.value; // Update 6/12/2022: column name changed, MemberIdStr => MemberId
                    token.id = memberId;
                }
                return token;
            } catch (e) {
                throw e;
            }
        },
        async signIn({ user, account, profile, email, credentials }) {
            const provider = account?.provider;
            if (!provider) {
                return false;
            }
            if ('mojito' === provider) {
                //// #1 Login with Mojito member system
                try {
                    // Step #1 prepare member id
                    const { providerAccountId: memberId } = account;
                    // Step #2.1 look up member status in [T] MemberComprehensive.Management
                    const memberManagementTableClient = AzureTableClient('MemberComprehensive'); // Update 6/12/2022: applied new table layout, MemberManagement -> MemberComprehensive.Management
                    const memberManagementQuery = memberManagementTableClient.listEntities({ queryOptions: { filter: `PartitionKey eq '${memberId}' and RowKey eq 'Management'` } });
                    const memberManagementQueryResult = await memberManagementQuery.next();
                    if (!memberManagementQueryResult.value) {
                        // [!] member management record not found deemed member deactivated / suspended
                        return false;
                    }
                    // Step #2.2 verify member status
                    const { MemberStatus: memberStatus } = memberManagementQueryResult.value; // Update 6/12/2022: column name changed, MemberStatusValue => MemberStatus
                    // Step #2.2.A member has been suspended or deactivated
                    if ([-2, -1].includes(memberStatus)) {
                        return '/error?error=MemberSuspendedOrDeactivated';
                    }
                    const atlasDbClient = AtlasDatabaseClient();
                    await atlasDbClient.connect();
                    const memberLoginRecordsCollectionClient = atlasDbClient.db('mojito-records-dev').collection('memberLoginRecords');
                    // Step #2.2.B email address not verified
                    if (0 === memberStatus) {
                        const loginRecord: IMemberLoginRecord = {
                            category: 'error',
                            providerId: 'MojitoMemberSystem',
                            timestamp: new Date().toISOString(),
                            message: 'Attempted login while email address not verified.'
                        }
                        await memberLoginRecordsCollectionClient.updateOne({ memberId }, { $addToSet: { recordsArr: loginRecord } }, { upsert: true });
                        atlasDbClient.close();
                        return '/signin?error=EmailAddressUnverified';
                    }
                    // Step #2.2.C normal
                    const loginRecord: IMemberLoginRecord = {
                        category: 'success',
                        providerId: 'MojitoMemberSystem',
                        timestamp: new Date().toISOString(),
                        message: 'Login.'
                    }
                    await memberLoginRecordsCollectionClient.updateOne({ memberId }, { $addToSet: { recordsArr: loginRecord } }, { upsert: true });
                    atlasDbClient.close();
                    return true;
                } catch (e) {
                    let msg: string;
                    if (e instanceof RestError) {
                        msg = `Was trying communicating with table storage. '/api/auth/[...nextauth]/default/callbacks/signIn'`
                    }
                    else {
                        msg = `Uncategorized Error occurred. '/api/auth/[...nextauth]/default/callbacks/signIn'`;
                    }
                    log(msg, e);
                    return false;
                }
            } else {
                //// #2 Login with third party login provider
                try {
                    // Step #1.1 prepare account id
                    const { providerAccountId: accountId } = account;
                    // Step #1.2 prepare provider id
                    const providerId = loginProviderIdMapping[provider];
                    // Step #2 look up login credential mapping in [RL] LoginCredentialsMapping 
                    const loginCredentialsMappingTableClient = AzureTableClient('LoginCredentialsMapping');
                    const mappingQuery = loginCredentialsMappingTableClient.listEntities({ queryOptions: { filter: `PartitionKey eq '${providerId}' and RowKey eq '${accountId}'` } });
                    // [!] attemp to reterieve entity makes the probability of causing RestError
                    const mappingQueryResult = await mappingQuery.next();
                    //// Step #3A login credential mapping record NOOOOOOT found, create a new mojito member substitute
                    if (!mappingQueryResult.value) {
                        const { email: emailAddressRef, name: nickName, image: avatarImageUrl } = user;
                        // Step #3A.0 verify email address
                        const emailAddress = emailAddressRef ?? '';
                        if (verifyEmailAddress(emailAddress)) {
                            // lack of email address or not valid
                            return `/signin?error=InappropriateEmailAddress&provider=${provider}`;
                        }
                        // Step #3A.1 create a new member id
                        const memberId = getRandomStr(true); // use UPPERCASE
                        // Step #3A.2 create a new third party login credential mapping
                        const loginCredentialsMapping: IThirdPartyLoginCredentialMapping = {
                            partitionKey: providerId,
                            rowKey: accountId,
                            MemberId: memberId,
                            IsActive: true
                        }
                        await loginCredentialsMappingTableClient.createEntity(loginCredentialsMapping);
                        // Step #3A.3 upsertEntity (memberInfo) to [T] MemberComprehensive.Info (create a new member)
                        const currentDateStr = new Date().toISOString();
                        const memberInfo: IMemberInfo = {
                            partitionKey: memberId,
                            rowKey: 'Info',
                            RegisteredTimestamp: currentDateStr,
                            VerifiedTimestamp: currentDateStr,
                            EmailAddress: emailAddress // assume the provided (by third party login provider) email address is a valid way to reach out to this third party login member
                        }
                        const memberComprehensiveTableClient = AzureTableClient('MemberComprehensive'); // Update: 6/12/2022: applied new table layout (Info & Management merged)
                        await memberComprehensiveTableClient.upsertEntity(memberInfo, 'Replace');
                        // Step #3A.4 create member management
                        const memberManagement: IMemberManagement = {
                            partitionKey: memberId,
                            rowKey: 'Management',
                            MemberStatus: 0, // Established, email address not verified
                            AllowPosting: false,
                            AllowCommenting: false
                        }
                        await memberComprehensiveTableClient.upsertEntity(memberManagement, 'Replace');
                        // Step #3A.5 compose email to send verification link
                        const info: VerifyAccountRequestInfo = { memberId };
                        const emailMessage: EmailMessage = {
                            sender: '<donotreply@mojito.co.nz>',
                            content: {
                                subject: langConfigs.emailSubject[lang],
                                html: composeVerifyAccountEmail(domain, Buffer.from(CryptoJS.AES.encrypt(JSON.stringify(info), appSecret).toString()).toString('base64'), lang)
                            },
                            recipients: {
                                to: [{ email: emailAddress }]
                            }
                        }
                        const mailClient = AzureEmailCommunicationClient();
                        const { messageId } = await mailClient.send(emailMessage);
                        if (!messageId) {
                            log('Was tring sending verification email', {});
                            return '/error'
                        }
                        // Step #3A.6 write log
                        const atlasDbClient = AtlasDatabaseClient();
                        await atlasDbClient.connect();
                        const memberLoginRecordsCollectionClient = atlasDbClient.db('mojito-records-dev').collection('memberLoginRecords');
                        const loginRecord: IMemberLoginRecord = {
                            category: 'success',
                            providerId: providerId,
                            timestamp: new Date().toISOString(),
                            message: 'Member established, email address verification required to get full access.'
                        }
                        await memberLoginRecordsCollectionClient.updateOne({ memberId }, { $addToSet: { recordsArr: loginRecord } }, { upsert: true });
                        atlasDbClient.close();
                        return '/signup?info=ThirdPartySignupSuccess';
                    }
                    //// Step #3B login credential mapping record is found
                    else {
                        const { MemberId: memberId } = mappingQueryResult.value;
                        // Step #3B.1 look up member status in [T] MemberComprehensive.Management
                        const memberManagementTableClient = AzureTableClient('MemberComprehensive'); // Update 6/12/2022: applied new table layout, MemberManagement => MemberComprehensive.Management
                        const memberManagementQuery = memberManagementTableClient.listEntities({ queryOptions: { filter: `PartitionKey eq '${memberId}' and RowKey eq 'Management'` } });
                        // Step #3B.2 verify member status
                        const memberManagementQueryResult = await memberManagementQuery.next();
                        // Step #3B.2.A member management record not found deemed account deactivated / suspended
                        if (!memberManagementQueryResult.value) {
                            // [!] member management record not found deemed account deactivated / suspended
                            return '/signin?error=MemberSuspendedOrDeactivated';
                        }
                        const { MemberStatus: memberStatus } = memberManagementQueryResult.value; // Update 6/12/2022: MemberStatusValue => MemberStatus
                        // Step #3B.2.B member has been suspended or deactivated
                        if ([-2, -1].includes(memberStatus)) {
                            return '/signin?error=MemberSuspendedOrDeactivated';
                        }
                        const atlasDbClient = AtlasDatabaseClient();
                        await atlasDbClient.connect();
                        const memberStatisticsCollectionClient = atlasDbClient.db('mojito-records-dev').collection('memberLoginRecords');
                        // Step #3B.2.C email address not verified
                        if (0 === memberStatus) {
                            const loginRecord: IMemberLoginRecord = {
                                category: 'error',
                                providerId: providerId,
                                timestamp: new Date().toISOString(),
                                message: 'Attempted login while email address not verified.'
                            }
                            await memberStatisticsCollectionClient.updateOne({ memberId }, { $addToSet: { recordsArr: loginRecord } }, { upsert: true });
                            atlasDbClient.close();
                            return '/signin?error=EmailAddressUnverified';
                        }
                        // Step #3B.2.D normal
                        const loginRecord: IMemberLoginRecord = {
                            category: 'success',
                            providerId: providerId,
                            timestamp: new Date().toISOString(),
                            message: 'Login.'
                        }
                        await memberStatisticsCollectionClient.updateOne({ memberId }, { $addToSet: { recordsArr: loginRecord } }, { upsert: true });
                        atlasDbClient.close();
                        return true;
                    }
                } catch (e) {
                    let msg: string;
                    if (e instanceof RestError) {
                        msg = `Was trying communicating with table storage. '/api/auth/[...nextauth]/default/callbacks/signIn/third-party-login?provider=${provider}'`
                    }
                    else {
                        msg = `Uncategorized Error occurred. '/api/auth/[...nextauth]/default/callbacks/signIn/third-party-login?provider=${provider}'`;
                    }
                    log(msg, e);
                    return false;
                }
            }
        },
        async session({ session, user, token }: any) {
            session.user.id = token.id;
            return session;
        }
    }
})

async function verifyLoginCredentials(credentials: LoginRequestInfo): Promise<MemberUser | null> {
    // Step #0 verify environment variables
    const environmentVariable = verifyEnvironmentVariable({ recaptchaServerSecret, salt });
    if (!!environmentVariable) {
        throw new Error(`${environmentVariable} not found`);
    }
    try {
        const { recaptchaResponse } = credentials;
        // Step #1 verify if it is bot
        const { status } = await verifyRecaptchaResponse(recaptchaServerSecret, recaptchaResponse);
        if (200 !== status) {
            return null;
        }
        const { emailAddress, password } = credentials;
        // Step #2 look up member id in [RL] LoginCredentialsMapping
        const loginCredentialsMappingTableClient = AzureTableClient('LoginCredentialsMapping');
        const mappingQuery = loginCredentialsMappingTableClient.listEntities({ queryOptions: { filter: `PartitionKey eq 'EmailAddress' and RowKey eq '${emailAddress}'` } });
        // [!] attemp to reterieve entity makes the probability of causing RestError
        const mappingQueryResult = await mappingQuery.next();
        if (!mappingQueryResult.value) {
            return null;
        }
        const { MemberId: memberId } = mappingQueryResult.value; // Update 6/12/2022: MemberIdStr -> MemberId
        if ('string' !== typeof memberId || '' === memberId) {
            return null;
        }
        // Step #3 look up password hash (reference) from [T] MemberLogin
        const memberLoginTableClient = AzureTableClient('MemberLogin');
        const loginReferenceQuery = memberLoginTableClient.listEntities({ queryOptions: { filter: `PartitionKey eq '${memberId}' and RowKey eq 'PasswordHash'` } });
        const loginReferenceQueryResult = await loginReferenceQuery.next();
        if (!loginReferenceQueryResult.value) {
            return null;
        }
        const { PasswordHash: passwordHashReference } = loginReferenceQueryResult.value; // Update 6/12/2022: PasswordHashStr -> PasswordHash
        // Step #4 match the password hashes
        const passwordHash = CryptoJS.SHA256(password + salt).toString();
        if (passwordHashReference !== passwordHash) {
            return null;
        }
        // Step #5 look up {nickname, avatarImage} in in [T] MemberComprehensive.Info
        const memberComprehensiveTableClient = AzureTableClient('MemberComprehensive');
        const memberInfoQuery = memberComprehensiveTableClient.listEntities({ queryOptions: { filter: `PartitionKey eq '${memberId}' and RowKey eq 'Info'` } });
        const memberInfoQueryResult = await memberInfoQuery.next();
        return {
            id: memberId,
            email: emailAddress,
            name: !memberInfoQueryResult.value ? '' : memberInfoQueryResult.value.Nickname,
            image: !memberInfoQueryResult.value ? '' : memberInfoQueryResult.value.AvatarImageUrl,
        }
    } catch (e) {
        let msg: string;
        if (e instanceof RestError) {
            msg = `Was trying communicating with table storage. '/api/auth/[...nextauth]/veriftLoginCredentials'`
        }
        else {
            msg = `Uncategorized Error occurred. '/api/auth/[...nextauth]/veriftLoginCredentials'`;
        }
        log(msg, e);
        return null;
    }
}