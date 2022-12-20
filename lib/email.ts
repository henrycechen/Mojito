export function composeResetPasswordEmailContent(domain: string, info: string, lang: string = 'ch'): string {
    const isCh = 'ch' === lang;
    return `
<head>
    <style>
        body {
            font-family: 'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS', sans-serif;
            font-size: 16px;
            padding: 0.5rem;
        }

        img.light {
            width: 104.09px;
            height: 38px;
        }

        img.dark {
            width: 104.09px;
            height: 38px;
        }

        .p {
            padding: 0.5rem;
        }

        .mt {
            margin-top: 1.5rem;
        }

        .ms {
            margin-left: 0.25rem;
        }

        div.row {
            margin-bottom: 1rem;
        }

        div.signature {
            margin-top: 5rem;
            margin-right: 1rem;
        }

        @media (prefers-color-scheme: dark) {
            body {
                color: aliceblue;
                background-color: #1c1c1e
            }

            img.light {
                display: none;
            }

            a {
                color: darkturquoise;
            }
        }

        @media (prefers-color-scheme: light) {
            img.dark {
                display: none;
            }
        }

        @media (max-width: 25rem) {
            div.signature {
                text-align: end;
            }
        }
    </style>
</head>

<body>
    <img class="light mt ms" src="https://raw.githubusercontent.com/henrycechen/MojitoNZStaticPage/master/mojito_bright_removebg.png" alt="logo">
    <img class="dark mt ms" src="https://raw.githubusercontent.com/henrycechen/MojitoNZStaticPage/master/mojito_dark_removebg.png" alt="logo">
    <div class="mt p">
        <div class="row">${isCh ? '您可以通过单击以下链接重置您的 Mojito 账户密码：' : 'You can reset your Mojito account password by clicking the link below:'}</div>
        <div class="row">
            <a href="${domain}/forgot/resetpassword?requestInfo=${info}">${domain}/forgot/resetpassword</a>
        </div>
        <div class="row">${isCh ? '链接在您收到这封邮件的15分钟内有效。如果链接过期，请您重新发起修改密码请求。如果您无意执行此操作请忽略本邮件。' : 'The link is valid for 15 minutes after you receive this email. If the link expires, please re-initiate the password change request. Please ignore this message if you do not intend to do so.'}</div>
        <div class="row">${isCh ? '如果您有对于您的账户安全的顾虑请联系我们的管理员。' : 'If you have concerns about the security of your account please contact our Webmaster.'}</div>
        <div class="signature">Mojito New Zealand</div>
    </div>
</body>
`
}

export function composeVerifyEmailAddressEmailContent(domain: string, info: string, lang: string = 'ch'): string {
    const isCh = 'ch' === lang;
    return `
<head>
    <style>
        body {
            font-family: 'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS', sans-serif;
            font-size: 16px;
            padding: 0.5rem;
        }

        img.light {
            width: 104.09px;
            height: 38px;
        }

        img.dark {
            width: 104.09px;
            height: 38px;
        }

        .p {
            padding: 0.5rem;
        }

        .mt {
            margin-top: 1.5rem;
        }

        .ms {
            margin-left: 0.25rem;
        }

        div.row {
            margin-bottom: 1rem;
        }

        div.signature {
            margin-top: 5rem;
            margin-right: 1rem;
        }

        @media (prefers-color-scheme: dark) {
            body {
                color: aliceblue;
                background-color: #1c1c1e
            }

            img.light {
                display: none;
            }

            a {
                color: darkturquoise;
            }
        }

        @media (prefers-color-scheme: light) {
            img.dark {
                display: none;
            }
        }

        @media (max-width: 25rem) {
            div.signature {
                text-align: end;
            }
        }
    </style>
</head>

<body>
    <img class="light mt ms" src="https://raw.githubusercontent.com/henrycechen/MojitoNZStaticPage/master/mojito_bright_removebg.png" alt="logo">
    <img class="dark mt ms" src="https://raw.githubusercontent.com/henrycechen/MojitoNZStaticPage/master/mojito_dark_removebg.png" alt="logo">
    <div class="mt p">
        <div class="row">${isCh ? '您可以通过单击以下链接验证您的 Mojito 账户：' : 'You can verify your Mojito account by clicking the link below:'}</div>
        <div class="row">
            <a href="${domain}/me/verifyemailaddress?requestInfo=${info}">${domain}/me/verifyaccount</a>
        </div>
        <div class="row">${isCh ? '链接长期有效。如果您无意执行此操作请忽略本邮件。' : 'The link is valid forever. Please ignore this message if you do not intend to do so.'}</div>
        <div class="signature">Mojito New Zealand</div>
    </div>
</body>
`
}