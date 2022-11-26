import NextAuth from "next-auth";
import GithubProvider from 'next-auth/providers/github';
import GoogleProvide from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import CryptoJS from 'crypto-js';

import AzureTableClient from '../../../modules/AzureTableClient';
import { verifyRecaptchaResponse, verifyEnvironmentVariable, getRandomStr } from '../../../lib/utils';
import { User } from 'next-auth';
import { LoginCredentialsMapping, AzureTableEntity } from "../../../lib/types";
import { RestError } from "@azure/storage-blob";

type LoginCredentials = {
    recaptchaResponse: any;
    emailAddress: any;
    password: any;
}

type ProviderIdMapping = {
    [key: string]: string
}

interface Member extends User {
    id: string;
    nickname?: string;
    emailAddress?: string;
    avatarImageUrl?: string;
}

const recaptchaServerSecret = process.env.INVISIABLE_RECAPTCHA_SECRET_KEY ?? '';
const salt = process.env.APP_PASSWORD_SALT ?? '';
const providerIdMapping: ProviderIdMapping = { // [!] Every time add a new provider, update this dictionary
    github: 'GitHubOAuth',
    google: 'GoogleOAuth',
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
            if (!provider) {
                return token;
            }
            if ('mojito' === provider) {
                token.id = token.sub;
                return token;
            }
            try {
                const { providerAccountId } = account;
                const providerId = providerIdMapping[provider];
                const loginCredentialsMappingTableClient = AzureTableClient('LoginCredentialsMapping');
                const mappingQuery = loginCredentialsMappingTableClient.listEntities({ queryOptions: { filter: `PartitionKey eq '${providerId}' and RowKey eq '${providerAccountId}'` } });
                // [!] attemp to reterieve entity makes the probability of causing RestError
                const mappingQueryResult = await mappingQuery.next();
                // Step #2 look up login credential mapping in db
                if (!mappingQueryResult.value) {
                    throw new Error('Login credentials mapping not found');
                } else {
                    const { MemberIdStr: memberId } = mappingQueryResult.value;
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
            // Step #1 verify if provider is Mojito account system
            if ('mojito' === provider) {
                // Step #2.1 look up account status from [Table] MemberManagement
                try {
                    const { providerAccountId: memberId } = account;
                    const memberManagementTableClient = AzureTableClient('MemberManagement');
                    const memberStatusQuery = memberManagementTableClient.listEntities({ queryOptions: { filter: `PartitionKey eq '${memberId}' and RowKey eq 'MemberStatus'` } });
                    const memberStatusQueryResult = await memberStatusQuery.next();
                    if (!memberStatusQueryResult.value) { // [!] member status not found deemed account deactivated / suspended
                        return false;
                    }
                    // Step #2.2 verify account status
                    const { MemberStatusValue: memberStatusValue } = memberStatusQueryResult.value;
                    if ([-1, 0].includes(memberStatusValue)) {
                        return false;
                    }
                    return true;
                } catch (e) {
                    if (e instanceof RestError) {
                        console.log(`SignIn callback - MojitoCredentialProvider - Was trying communicating with db. ${e}`);
                    }
                    return false;
                }
            } else {
                try {
                    const { providerAccountId } = account;
                    const providerId = providerIdMapping[provider];
                    const loginCredentialsMappingTableClient = AzureTableClient('LoginCredentialsMapping');
                    const mappingQuery = loginCredentialsMappingTableClient.listEntities({ queryOptions: { filter: `PartitionKey eq '${providerId}' and RowKey eq '${providerAccountId}'` } });
                    // [!] attemp to reterieve entity makes the probability of causing RestError
                    const mappingQueryResult = await mappingQuery.next();
                    // Step #2 look up login credential mapping in db
                    if (!mappingQueryResult.value) {
                        // Step #3 mapping not found, create Mojito account
                        const { email: emailAddress, name: nickName, image: avatarImageUrl } = user;
                        const memberId = getRandomStr(true); // use UPPERCASE
                        // Step #3.1 create login credential mapping
                        const loginCredentialsMapping: LoginCredentialsMapping = {
                            partitionKey: providerId,
                            rowKey: providerAccountId,
                            MemberIdStr: memberId,
                            IsActive: true
                        }
                        await loginCredentialsMappingTableClient.createEntity(loginCredentialsMapping);
                        // Step #3.2 create member info
                        const memberInfoEmailAddress: AzureTableEntity = {
                            partitionKey: memberId,
                            rowKey: 'EmailAddress',
                            EmailAddressStr: emailAddress
                        }
                        const memberInfoNickname: AzureTableEntity = {
                            partitionKey: memberId,
                            rowKey: 'Nickname',
                            NicknameStr: nickName
                        }
                        const memberInfoAvatarImageUrl: AzureTableEntity = {
                            partitionKey: memberId,
                            rowKey: 'AvatarImageUrl',
                            AvatarImageUrlStr: avatarImageUrl
                        }
                        const memberInfoTableClient = AzureTableClient('MemberInfo');
                        await memberInfoTableClient.createEntity(memberInfoEmailAddress);
                        await memberInfoTableClient.createEntity(memberInfoNickname);
                        await memberInfoTableClient.createEntity(memberInfoAvatarImageUrl);
                        // Step #3.3 create member management
                        const memberManagementMemberStatus: AzureTableEntity = {
                            partitionKey: memberId,
                            rowKey: 'MemberStatus',
                            MemberStatusValue: 200 // Email address verified, normal
                        }
                        const memberManagementTableClient = AzureTableClient('MemberManagement');
                        await memberManagementTableClient.createEntity(memberManagementMemberStatus);
                    }
                    else {
                        const { MemberId: memberId } = mappingQueryResult.value;
                        // Step #4 verify member status
                        const memberManagementTableClient = AzureTableClient('MemberManagement');
                        const memberStatusQuery = memberManagementTableClient.listEntities({ queryOptions: { filter: `PartitionKey eq '${memberId}' and RowKey eq 'MemberStatus'` } });
                        const memberStatusQueryResult = await memberStatusQuery.next();
                        if (!memberStatusQueryResult.value) { // [!] member status not found deemed account deactivated / suspended
                            return false;
                        }
                        const { MemberStatusValue: memberStatusValue } = memberStatusQueryResult.value;
                        if (-1 === memberStatusValue) {
                            return false;
                        }
                    }
                    return true;
                } catch (e) {
                    if (e instanceof RestError) {
                        console.log(`SignIn callback - ${providerIdMapping[provider]}Provider - Was trying communicating with db. ${e}`);
                    }
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

async function verifyLoginCredentials(credentials: LoginCredentials): Promise<Member | null> {
    // Step #0 verify environment variables
    const environmentVariable = verifyEnvironmentVariable({ recaptchaServerSecret, salt });
    if (!!environmentVariable) {
        console.log(`${environmentVariable} not found`);
        throw new Error('Internal server error')
    }
    try {
        const { recaptchaResponse } = credentials;
        // Step #1 verify if it is bot
        const { status } = await verifyRecaptchaResponse(recaptchaServerSecret, recaptchaResponse);
        if (200 !== status) {
            return null;
        }
        const { emailAddress, password } = credentials;
        // Step #2 look up memberId from [Table] LoginCredentialsMapping
        const loginCredentialsMappingTableClient = AzureTableClient('LoginCredentialsMapping');
        const mappingQuery = loginCredentialsMappingTableClient.listEntities({ queryOptions: { filter: `PartitionKey eq 'EmailAddress' and RowKey eq '${emailAddress}'` } });
        // [!] attemp to reterieve entity makes the probability of causing RestError
        const mappingQueryResult = await mappingQuery.next();
        if (!mappingQueryResult.value) {
            return null;
        }
        const { MemberIdStr: memberId } = mappingQueryResult.value;
        if ('string' !== typeof memberId || '' === memberId) {
            return null;
        }
        // Update 15/11/2022 MemberStatus verification moved to signin callback
        // Step #3 look up password hash (reference) from [Table] MemberLogin
        const memberLoginTableClient = AzureTableClient('MemberLogin');
        const loginReferenceQuery = memberLoginTableClient.listEntities({ queryOptions: { filter: `PartitionKey eq '${memberId}' and RowKey eq 'PasswordHash'` } });
        const loginReferenceQueryResult = await loginReferenceQuery.next();
        if (!loginReferenceQueryResult.value) {
            return null;
        }
        const { PasswordHashStr: passwordHashReference } = loginReferenceQueryResult.value;
        // Step #4 match the password hashes
        const passwordHash = CryptoJS.SHA256(password + salt).toString();
        if (passwordHashReference !== passwordHash) {
            return null;
        }
        // Step #5 look up {nickname, avatarImage} from [Table] MemberInfo
        const memberInfoTableClient = AzureTableClient('MemberInfo');
        const nicknameQuery = memberInfoTableClient.listEntities({ queryOptions: { filter: `PartitionKey eq '${memberId}' and RowKey eq 'Nickname'` } });
        const nicknameQueryResult = await nicknameQuery.next();
        const avatarImageUrlQuery = memberInfoTableClient.listEntities({ queryOptions: { filter: `PartitionKey eq '${memberId}' and RowKey eq 'Nickname'` } });
        const avatarImageUrlQueryResult = await avatarImageUrlQuery.next();
        return {
            id: memberId,
            email: emailAddress,
            name: !nicknameQueryResult.value ? '' : nicknameQueryResult.value.NicknameStr,
            image: !avatarImageUrlQueryResult.value ? '' : avatarImageUrlQueryResult.value.AvatarImgUrlStr,
        }
    } catch (e) {
        console.log(e);
        throw new Error('Error occurred when trying to signin');
    }
}