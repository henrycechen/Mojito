import NextAuth from "next-auth";
import GithubProvider from 'next-auth/providers/github';
import GoogleProvide from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import CryptoJS from 'crypto-js';

import AzureTableClient from '../../../modules/AzureTableClient';
import { verifyRecaptchaResponse, verifyEnvironmentVariable } from '../../../lib/utils';
import { User } from 'next-auth';

type LoginCredentials = {
    recaptchaResponse: any;
    emailAddress: any;
    password: any;
}

interface Member extends User {
    id: string;
    nickname?: string;
    emailAddress?: string;
    avatarImageUrl?: string;
}

const recaptchaServerSecret = process.env.INVISIABLE_RECAPTCHA_SECRET_KEY ?? '';
const salt = process.env.APP_PASSWORD_SALT ?? '';

export default NextAuth({
    session: {
        strategy: 'jwt',
        maxAge: 15 * 24 * 60 * 60, // 15 days
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
            name: 'Credentials',
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
        // Step #3.1 look up account status from [Table] MemberManagement
        const memberManagementTableClient = AzureTableClient('MemberManagement');
        const accountStatusQuery = memberManagementTableClient.listEntities({ queryOptions: { filter: `PartitionKey eq '${memberId}' and RowKey eq 'AccountStatus'` } });
        const accountStatusQueryResult = await accountStatusQuery.next();
        if (!accountStatusQueryResult.value) {
            return null;
        }
        // Step #3.2 verify account status
        const { AccountStatusValue: accountStatusValue } = accountStatusQueryResult.value;
        if ([-1, 0].includes(accountStatusValue)) { //// TODO: will introduce strategy of account status here
            return null;
        }
        // Step #3.2 look up password hash (reference) from [Table] MemberLogin
        const memeberLoginTableClient = AzureTableClient('MemberLogin');
        const loginReferenceQuery = memeberLoginTableClient.listEntities({ queryOptions: { filter: `PartitionKey eq '${memberId}' and RowKey eq 'PasswordHash'` } });
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
            emailAddress: emailAddress,
            nickname: !nicknameQueryResult.value ? '' : nicknameQueryResult.value.NicknameStr,
            avatarImageUrl: !avatarImageUrlQueryResult.value ? '' : avatarImageUrlQueryResult.value.AvatarImgUrlStr,
        }
    } catch (e) {
        console.log(e);
        throw new Error('Error occurred when trying to signin');

    }
}