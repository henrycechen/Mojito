
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
        const { status, msg } = await verifyRecaptchaResponse(recaptchaServerSecret, recaptchaResponse);
        if (200 !== status) {
            if (403 === status) {
                res.status(403).send(msg);
                return;
            }
            if (500 === status) {
                response500(res, msg);
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
        const tokenQuery = memeberLoginTableClient.listEntities({ queryOptions: { filter: `PartitionKey eq '${memberId}' and RowKey eq 'ResetPasswordToken'` } });
        // [!] attemp to reterieve entity makes the probability of causing RestError
        const tokenQueryResult = await tokenQuery.next();
        if (!tokenQueryResult.value) {
            res.status(404).send('Reset password token not found');
            return;
        }
        const { Timestamp: timestamp, IsActive: isActive, ResetPasswordTokenStr: resetPasswordTokenReference } = tokenQueryResult.value;
        if (resetPasswordTokenReference !== resetPasswordToken) {
            res.status(403).send('Invalid reset password token (not match)');
            return;
        }
        if (!isActive) {
            res.status(403).send('Current reset password token has been used');
            return;
        }
        if (15 * 60 * 1000 < new Date().getTime() - new Date(timestamp).getTime()) {
            res.status(403).send('Reset password token has expired');
            return;
        }
        // step #3 update DB
        const passwordHash: PasswordHash = {
            partitionKey: memberId,
            rowKey: 'PasswordHash',
            PasswordHashStr: CryptoJS.SHA256(password + salt).toString()
        }
        // step #3.1 update PasswordHash
        const { clientRequestId } = await memeberLoginTableClient.upsertEntity(passwordHash, 'Replace');
        if (!clientRequestId) {
            response500(res, 'Was trying upserting passwordHash (Table Operation)');
        } else {
            res.status(200).send('Password upserted');
            // step #3.2 update ResetPasswordToken
            const resetPasswordToken: ResetPasswordToken = {
                partitionKey: memberId,
                rowKey: 'ResetPasswordToken',
                IsActive: false
            }
            await memeberLoginTableClient.upsertEntity(resetPasswordToken, 'Merge');
        }
    } catch (e) {
        if (e instanceof RestError) {
            response500(res, `Was trying querying entity. ${e}`);
        }
        else {
            response500(res, `Uncategorized Error occurred. ${e}`);
        }
        return;
    }
}