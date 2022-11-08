import { EmailClient } from '@azure/communication-email';

const connectionString = process.env.AZURE_EMAIL_SERVICE_CONNECTION_STRING ?? '';

export default function () {
    return new EmailClient(connectionString);
}