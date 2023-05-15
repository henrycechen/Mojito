import NextAuth from 'next-auth';
import GithubProvider from 'next-auth/providers/github';
import GoogleProvide from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import CryptoJS from 'crypto-js';

import { User } from 'next-auth';

import AzureTableClient from '../../../modules/AzureTableClient';
import AtlasDatabaseClient from '../../../modules/AtlasDatabaseClient';
import AzureEmailCommunicationClient from '../../../modules/AzureEmailCommunicationClient';
import { EmailMessage } from '@azure/communication-email';
import { RestError } from '@azure/storage-blob';
import { MongoError } from 'mongodb';

import { LangConfigs, TVerifyEmailAddressRequestInfo } from '../../../lib/types';
import { composeVerifyEmailAddressEmailContent } from '../../../lib/email';
import AzureBlobClient from '../../../modules/AzureBlobClient';
import Jimp from 'jimp';
import { logWithDate } from '../../../lib/utils/general';
import { ILoginJournal, IMemberComprehensive, IMinimumMemberComprehensive } from '../../../lib/interfaces/member';
import { getRandomHexStr, getRandomIdStr, getTimeBySecond } from '../../../lib/utils/create';
import { ILoginCredentials, IVerifyEmailAddressCredentials } from '../../../lib/interfaces/credentials';
import { verifyEnvironmentVariable, verifyRecaptchaResponse } from '../../../lib/utils/verify';

type TLoginRequestInfo = {
    recaptchaResponse: any;
    emailAddress: any;
    password: any;
};

type TProviderIdMapping = {
    [key: string]: string;
};

interface IMemberUser extends User {
    id: string;
    emailAddress?: string;
}

const recaptchaServerSecret = process.env.INVISIABLE_RECAPTCHA_SECRET_KEY ?? '';
const salt = process.env.APP_PASSWORD_SALT ?? '';
export const loginProviderIdMapping: TProviderIdMapping = {
    //// [!] Every time add a new provider, update this dictionary ////
    mojito: 'MojitoMemberSystem',
    github: 'GitHubOAuth',
    google: 'GoogleOAuth',
    // instagram
    // twitter
    // facebook
};

const domain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? '';
const lang = process.env.NEXT_PUBLIC_APP_LANG ?? 'tw';
const langConfigs: LangConfigs = {
    emailSubject: {
        tw: '验证您的 Mojito 账户',
        cn: '验证您的 Mojito 账户',
        en: 'Verify your Mojito Member'
    }
};

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
                recaptchaResponse: { label: 'RecaptchaResponse', type: 'text', placeholder: '' },
                emailAddress: { label: 'EmailAddress', type: 'text', placeholder: '' },
                password: { label: 'Password', type: 'password' },
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
            return token;
        },
        async signIn({ user, account, profile, email, credentials }) {
            // For this callback, three variable shall be retrieved from the parameters
            // {id, email} from user, {provider} from account
            //// Verify login provider ////
            const provider: string = account?.provider ?? '';
            if (!Object.keys(loginProviderIdMapping).includes(provider)) {
                return '/signin?error=UnrecognizedProvider';
            }
            const providerId: string = loginProviderIdMapping[provider];
            //// Declare DB client ////
            const atlasDbClient = AtlasDatabaseClient();
            //// [1] Login with Mojito member system ////
            if ('mojito' === provider) {
                try {
                    // #1 prepare member id
                    const { id: memberId, email: emailAddress } = user;
                    // #2.1 look up member status (IMemberComprehensive) in [C] memberComprehensive
                    await atlasDbClient.connect();
                    const memberComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IMemberComprehensive>('member');
                    const memberComprehensiveQueryResult = await memberComprehensiveCollectionClient.findOne<IMemberComprehensive>({ memberId, providerId });
                    if (null === memberComprehensiveQueryResult) {
                        //// [!] member comprehensive not found ////
                        return `/signin?error=DefectiveMember&providerId=${providerId}`;
                    }
                    const { status } = memberComprehensiveQueryResult;
                    if ('number' !== typeof status) {
                        //// [!] member status not found or status code error ////
                        return `/signin?error=DefectiveMember&providerId=${providerId}`;
                    }
                    // #2.2 verify member status
                    if (200 > status) {
                        if (0 > status) {
                            //// [!] member suspended or deactivated ////
                            return `/signin?error=MemberSuspendedOrDeactivated&providerId=${providerId}`;
                        }
                        if (0 === status) {
                            // [!] email address verification required
                            return `/signin?error=EmailAddressVerificationRequired&providerId=${providerId}&emailAddressB64=${Buffer.from(emailAddress ?? '').toString('base64')}`;
                        }
                        //// [!] member status code error ////
                        return `/signin?error=DefectiveMember&providerId=${providerId}`;
                    }
                    // #3 write journal (ILoginJournal) in [C] loginJournal
                    const loginJournalCollectionClient = atlasDbClient.db('journal').collection<ILoginJournal>('login');
                    await loginJournalCollectionClient.insertOne({
                        memberId,
                        category: 'success',
                        providerId,
                        timestamp: new Date().toISOString(),
                        message: 'Login.'
                    });
                    await atlasDbClient.close();
                    // Update: 14/02/2023: exclude name & image from the JWT, manually retrieve nickname & avatar image every time
                    // Update: 13/05/2023: avatar images are now provided by API via the memberId
                    // #4 complete session (jwt) info 
                    // const { nickname: name, avatarImageUrl: image } = memberComprehensiveQueryResult;
                    // user.name = name;
                    // user.image = image;
                    return true;
                } catch (e: any) {
                    let msg;
                    if (e instanceof MongoError) {
                        msg = `Attempt to communicate with atlas mongodb.`;
                        await atlasDbClient.close();
                    } else {
                        msg = `Uncategorized. ${e?.msg}`;
                    }
                    logWithDate(msg, e, 'SignIn Callback (MojitoMemberSystem)');
                    return '/error';
                }
            }
            //// [2] Login with third party login provider ////
            try {
                const { name: nickname, email: emailAddress, image: avatarImageUrl } = user;
                if ('string' !== typeof emailAddress || '' === emailAddress) {
                    // [!] an invalid email address was provided by third-party login provider
                    logWithDate(`Attempt to login with ${providerId}, retrieved an invalid email address`, `SignIn Callback`);
                    return `/signin?error=InappropriateEmailAddress&providerId=${providerId}`;
                }
                const emailAddressHash = CryptoJS.SHA1(emailAddress).toString();
                // #1 look up email address hash in [RL] Credentials
                const credentialsTableClient = AzureTableClient('Credentials');
                const loginCredentialsQuery = credentialsTableClient.listEntities<ILoginCredentials>({ queryOptions: { filter: `PartitionKey eq '${emailAddressHash}' and RowKey eq '${providerId}'` } });
                //// [!] attemp to reterieve entity makes the probability of causing RestError ////
                const loginCredentialsQueryResult = await loginCredentialsQuery.next();
                if (loginCredentialsQueryResult.done) {
                    //// (Situation A) [!] login credential record not found deemed unregistered ////
                    // #A2.1 create a new member id
                    const memberId = getRandomIdStr(true);
                    // #A2.2 upsert entity (ILoginCredentials) in [RL] Credentials
                    credentialsTableClient.upsertEntity<ILoginCredentials>({
                        partitionKey: emailAddressHash,
                        rowKey: providerId,
                        MemberId: memberId,
                        PasswordHash: '',
                        LastUpdatedTimeBySecond: getTimeBySecond()
                    }, 'Replace');
                    // #A2.3 create a new email address verification token
                    const verifyEmailAddressToken = getRandomHexStr(true);
                    // #A2.4 upsert entity (IVerifyEmailAddressCredentials) in [RL] Credentials
                    credentialsTableClient.upsertEntity<IVerifyEmailAddressCredentials>({
                        partitionKey: emailAddressHash,
                        rowKey: 'VerifyEmailAddress',
                        VerifyEmailAddressToken: verifyEmailAddressToken,
                        CreatedTimeBySecond: getTimeBySecond()
                    }, 'Replace');
                    // #A2.5 (cond.) retrieve avatar image
                    if ('string' === typeof avatarImageUrl) {
                        try {
                            const resp = await fetch(avatarImageUrl);
                            if (resp.status === 200) {
                                const contentType = resp.headers.get('Content-Type');
                                if ('string' === typeof contentType && ['image/jpeg', 'image/png'].includes(contentType)) {
                                    const contianerClient = AzureBlobClient('avatar');
                                    const blockClient = contianerClient.getBlockBlobClient(`${memberId}.png`);
                                    if ('image/png' === contentType) {
                                        await blockClient.uploadData(await resp.arrayBuffer());
                                    } else {
                                        const initialBuf = Buffer.concat([new Uint8Array(await resp.arrayBuffer())]);
                                        const handledFile = await Jimp.read(initialBuf);
                                        const convertedBuf = await handledFile.getBufferAsync(Jimp.MIME_PNG);
                                        await blockClient.uploadData(convertedBuf);
                                    }
                                }
                            }
                        } catch (e: any) {
                            logWithDate(`Attempt to fetch avatar image from login provider`, e, `SignIn Callback (${providerId})`);
                        }
                    }
                    await atlasDbClient.connect();
                    // #A2.6 create document (MemberComprehensive) in [C] memberComprehensive
                    const memberComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IMinimumMemberComprehensive>('member');
                    let memberComprehensiveCollectionInsertResult = await memberComprehensiveCollectionClient.insertOne({
                        memberId,
                        providerId,
                        registeredTimeBySecond: getTimeBySecond(),
                        emailAddress,
                        nickname: nickname ?? '',
                        status: 0, // email address not verified
                        allowPosting: false,
                        allowCommenting: false
                    });
                    if (!memberComprehensiveCollectionInsertResult.acknowledged) {
                        logWithDate(`Attempt to insert document (MemberComprehensive) for registering with ${providerId}`, `SignIn Callback`);
                        return `/signin?error=ThirdPartyProviderSignin&providerId=${providerId}`;
                    }
                    // #A2.7 write journal in [C] loginJournal
                    const loginJournalCollectionClient = atlasDbClient.db('journal').collection<ILoginJournal>('login');
                    await loginJournalCollectionClient.insertOne({
                        memberId,
                        category: 'success',
                        providerId,
                        timestamp: new Date().toISOString(),
                        message: 'Registered.'
                    });
                    await atlasDbClient.close();
                    // #A3 send email
                    const info: TVerifyEmailAddressRequestInfo = { emailAddress, providerId, verifyEmailAddressToken };
                    const emailMessage: EmailMessage = {
                        senderAddress: '<donotreply@mojito.co.nz>',
                        content: {
                            subject: langConfigs.emailSubject[lang],
                            html: composeVerifyEmailAddressEmailContent(domain, Buffer.from(JSON.stringify(info)).toString('base64'), lang)
                        },
                        recipients: {
                            to: [{ address: emailAddress }]
                        }
                    };
                    const mailClient = AzureEmailCommunicationClient();
                    await mailClient.beginSend(emailMessage);
                    return `/signin?error=EmailAddressVerificationRequired&providerId=${providerId}&emailAddressB64=${Buffer.from(emailAddress ?? '').toString('base64')}`;
                } else {
                    //// (Situation B) [!] login credential record is found ////
                    const { MemberId: memberId } = loginCredentialsQueryResult.value;
                    // #B2.1 member status (IMemberComprehensive) in [C] memberComprehensive
                    await atlasDbClient.connect();
                    const memberComprehensiveCollectionClient = atlasDbClient.db('comprehensive').collection<IMemberComprehensive>('member');
                    const memberComprehensiveQueryResult = await memberComprehensiveCollectionClient.findOne<IMemberComprehensive>({ memberId, providerId });
                    if (null === memberComprehensiveQueryResult) {
                        //// [!] member comprehensive document not found ////
                        return `/signin?error=DefectiveMember&providerId=${providerId}`;
                    }
                    const { status } = memberComprehensiveQueryResult;
                    if ('number' !== typeof status) {
                        //// [!] member status (property of IMemberComprehensive) not found or status (code) error ////
                        return `/signin?error=DefectiveMember&providerId=${providerId}`;
                    }
                    // #2.2 verify member status
                    if (200 > status) {
                        if (0 > status) {
                            //// [!] member suspended or deactivated ////
                            return `/signin?error=MemberSuspendedOrDeactivated&providerId=${providerId}`;
                        }
                        if (0 === status) {
                            //// [!] email address verification required ////
                            return `/signin?error=EmailAddressVerificationRequired&providerId=${providerId}&emailAddressB64=${Buffer.from(emailAddress ?? '').toString('base64')}`;
                        }
                        //// [!] member status code error ////
                        return `/signin?error=DefectiveMember&providerId=${providerId}`;
                    }
                    // FIXME: update: 14/02/2023 exclude name & image from the JWT, manually retrieve nickname & avatar image every time
                    // const { nickname: name, avatarImageUrl: image } = memberComprehensiveQueryResult;
                    // user.name = name;
                    // user.image = image;
                    // #4 write journal (ILoginJournal) in [C] loginJournal
                    const loginJournalCollectionClient = atlasDbClient.db('journal').collection<ILoginJournal>('login');
                    await loginJournalCollectionClient.insertOne({
                        memberId,
                        category: 'success',
                        providerId,
                        timestamp: new Date().toISOString(),
                        message: 'Login.'
                    });
                    await atlasDbClient.close();
                    // #3 complete session (jwt) info
                    user.id = memberId;
                    return true;
                }
            } catch (e: any) {
                let msg;
                if (e instanceof RestError) {
                    msg = `Attempt to communicate with azure table storage.` + msg;
                } else if (e instanceof MongoError) {
                    msg = `Attempt to communicate with atlas mongodb.` + msg;
                } else {
                    msg = `Uncategorized. ${e?.msg}` + msg;
                }
                logWithDate(msg, e, `SignIn Callback (${providerId})`);
                await atlasDbClient.close();
                return false;
            }
        },
        async session({ session, user, token }: any) {
            session.user.id = token.sub;
            return session;
        }
    }
});

async function verifyLoginCredentials(credentials: TLoginRequestInfo): Promise<IMemberUser | null> {
    //// Verify environment variables ////
    const environmentVariable = verifyEnvironmentVariable({ recaptchaServerSecret, salt });
    if ('string' === typeof environmentVariable) {
        throw new ReferenceError(`${environmentVariable} not found`);
    }
    try {
        const { recaptchaResponse } = credentials;
        // #1 verify if requested by human
        const { status } = await verifyRecaptchaResponse(recaptchaServerSecret, recaptchaResponse);
        if (200 !== status) {
            return null;
        }
        const { emailAddress, password } = credentials;
        // #2 look up email address hash-sh1 in [RL] Credentials
        const credentialsTableClient = AzureTableClient('Credentials');
        const loginCredentialsQuery = credentialsTableClient.listEntities({ queryOptions: { filter: `PartitionKey eq '${CryptoJS.SHA1(emailAddress).toString()}' and RowKey eq 'MojitoMemberSystem'` } });
        //// [!] attemp to reterieve entity makes the probability of causing RestError ////
        const loginCredentialsQueryResult = await loginCredentialsQuery.next();
        if (!loginCredentialsQueryResult.value) {
            //// [!] login credential mapping record not found deemed member deactivated / suspended / not registered ////
            return null;
        }
        const { MemberId: memberId, PasswordHash: passwordHashReference } = loginCredentialsQueryResult.value;
        // #4 match the password hashes
        const passwordHash = CryptoJS.SHA256(password + salt).toString();
        if (passwordHashReference !== passwordHash) {
            //// [!] password hashes not match ///
            return null;
        }
        return {
            id: memberId,
            email: emailAddress
        };
    } catch (e: any) {
        let msg: string;
        if (e instanceof ReferenceError) {
            msg = `${environmentVariable} not found.`;
        } else if (e instanceof RestError) {
            msg = `Attempt to communicate with azure table storage.`;
        } else {
            msg = `Uncategorized.`;
        }
        logWithDate(msg, e, 'verifyLoginCredentials');
        return null;
    }
}