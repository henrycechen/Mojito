
import NextAuth from "next-auth";
import GithubProvider from 'next-auth/providers/github';
import GoogleProvide from 'next-auth/providers/google';
import CredentialsProvider from "next-auth/providers/credentials"

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
      // The name to display on the sign in form (e.g. 'Sign in with...')
      name: 'Credentials',
      // The credentials is used to generate a suitable form on the sign in page.
      // You can specify whatever fields you are expecting to be submitted.
      // e.g. domain, username, password, 2FA token, etc.
      // You can pass any HTML attribute to the <input> tag through the object.
      credentials: {
        email: { label: "Email", type: "text", placeholder: "" },
        password: { label: "Password", type: "password" },
        tfakey: {}
        // tfatoken: { label: "TFAToken", type: "text" },
      },
      async authorize(credentials, req) {
        // You need to provide your own logic here that takes the credentials
        // submitted and returns either a object representing a user or value
        // that is false/null if the credentials are invalid.
        // e.g. return { id: 1, name: 'J Smith', email: 'jsmith@example.com' }
        // You can also use the `req` object to obtain additional parameters
        // (i.e., the request IP address)

        // Return null if user data could not be retrieved
        return checkPwd(credentials);
      }
    })
  ],
  pages: {
    signIn: '/signin',
    signOut: 'signout',
    error: '/error'
  },
  callbacks: {
    // async signIn({ user, account, profile, email, credentials }) {
    async signIn({ user, account, credentials }) {
      console.log(user, account, credentials);
      return true
    },
    async jwt({ token, user, account, profile, isNewUser }) {
        console.log(token);
        return token
      } 
  }
});

function checkPwd(credentials) {

  const user = {
    name: 'henrycechen',
    email: 'henrycechen@gmail.com',
    image: 'https://cdn.v2ex.com/avatar/39d1/8717/332407_large.png?m=1640071008'
  }

  return 'henrycechen' === credentials.email ? user : null;
  // return user
}