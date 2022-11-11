
import type { NextApiRequest, NextApiResponse } from 'next';
import CryptoJS from 'crypto-js';

import AzureTableClient from '../../../../../modules/AzureTableClient';
import { verifyRecaptchaResponse, verifyEnvironmentVariable, response405, response500 } from '../../../../../lib/utils';
import { ResetPasswordToken, PasswordHash } from '../../../../../lib/types';
import { RestError } from '@azure/data-tables';

const recaptchaServerSecret = process.env.INVISIABLE_RECAPTCHA_SECRET_KEY ?? '';
const salt = process.env.APP_PASSWORD_SALT ?? '';

export default async function ResetPassword(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;
    if ('POST' !== method) {
        response405(req, res);
        return;
    }
    try {
        // Step #0 verify environment variables
        const environmentVariable = verifyEnvironmentVariable({ recaptchaServerSecret, salt });
        if (!!environmentVariable) {
            response500(res, `${environmentVariable} not found`);
            return;
        }
        const { recaptchaResponse } = req.query;
        // Step #1 verify if it is bot
        const { status, message } = await verifyRecaptchaResponse(recaptchaServerSecret, recaptchaResponse);
        if (200 !== status) {
            if (403 === status) {
                res.status(403).send(message);
                return;
            }
            if (500 === status) {
                response500(res, message);
                return;
            }
        }
        const { memberId, resetPasswordToken, password } = JSON.parse(req.body);
        // Step #2 verify memberId and token
        if ('string' !== typeof resetPasswordToken || '' === resetPasswordToken) {
            res.status(403).send('Invalid reset password token');
            return;
        }
        const memeberLoginTableClient = AzureTableClient('MemberLogin');
        // Step #3.1 look up reset password token from [Table] MemberLogin
        const tokenQuery = memeberLoginTableClient.listEntities({ queryOptions: { filter: `PartitionKey eq '${memberId}' and RowKey eq 'ResetPasswordToken'` } });
        // [!] attemp to reterieve entity makes the probability of causing RestError
        const tokenQueryResult = await tokenQuery.next();
        if (!tokenQueryResult.value) {
            res.status(404).send('Reset password token not found');
            return;
        }
        const { Timestamp: timestamp, IsActive: isActive, ResetPasswordTokenStr: resetPasswordTokenReference } = tokenQueryResult.value;
        // Step #3.2 match reset password tokens
        if (resetPasswordTokenReference !== resetPasswordToken) {
            res.status(403).send('Invalid reset password token (not match)');
            return;
        }
        if (!isActive) {
            res.status(403).send('Token has been used');
            return;
        }
        if (15 * 60 * 1000 < new Date().getTime() - new Date(timestamp).getTime()) {
            res.status(403).send('Reset password token has expired');
            return;
        }
        const passwordHash: PasswordHash = {
            partitionKey: memberId,
            rowKey: 'PasswordHash',
            PasswordHashStr: CryptoJS.SHA256(password + salt).toString()
        }
        // Step #4.1 update PasswordHash to [Table] MemberLogin
        await memeberLoginTableClient.upsertEntity(passwordHash, 'Replace');
        res.status(200).send('Password upserted');
        // Step #4.2 update ResetPasswordToken to [Table] MemberLogin
        const resetPasswordTokenUpdate: ResetPasswordToken = {
            partitionKey: memberId,
            rowKey: 'ResetPasswordToken',
            IsActive: false
        }
        await memeberLoginTableClient.upsertEntity(resetPasswordTokenUpdate, 'Merge');
    } catch (e) {
        if (e instanceof RestError) {
            response500(res, `Was trying communicating with db. ${e}`);
        }
        else {
            response500(res, `Uncategorized Error occurred. ${e}`);
        }
        return;
    }
}