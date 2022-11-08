import { EmailClient } from '@azure/communication-email';
import type { NextApiRequest, NextApiResponse } from 'next';

const connectionString = `${process.env.AZURE_EMAIL_SERVICE_CONNECTION_STRING}`;
const mailClient = new EmailClient(connectionString);

export default async function mail(req: NextApiRequest, res: NextApiResponse) {
    const { method, url } = req;
    switch (method) {
        case 'GET':
            const emailMessage = {
                sender: "<donotreply@mojito.co.nz>",
                content: {
                  subject: "Reset your password",
                  plainText: "No need to worry, you can reset your Mojito account password by clicking the link below: http://localhost"
                },
                recipients: {
                  to: [
                    {
                      email: "<henrycechen@gmail.com>",
                    },
                  ],
                },
              };
              const resp = await mailClient.send(emailMessage);
              res.send(resp);
        case 'POST':
            res.send(`${method} ${url}`);
            break;
    }
}