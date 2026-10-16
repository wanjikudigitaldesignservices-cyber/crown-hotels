import type { VercelRequest, VercelResponse } from '@vercel/node';

const CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY || '1G31byoFAcsZIwe9nRUMTN5cBTjI2dfUB0ooPzzzgYVChjAv';
const CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET || 'FAwXB3jkEXyscvj7RzoghFx43ZcaPVfswXAlCadh4iGKrNeWpsppGSSArXZMFEjN';
const PASSKEY = process.env.MPESA_PASSKEY || 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919';
const SHORTCODE = process.env.MPESA_SHORTCODE || '174379';
const ENV = process.env.MPESA_ENV || 'sandbox';

const DARAJA_BASE_URL = ENV === 'production'
  ? 'https://api.safaricom.co.ke'
  : 'https://sandbox.safaricom.co.ke';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { checkoutRequestId } = req.body || {};

    if (!checkoutRequestId) {
      return res.status(400).json({ error: 'Missing checkoutRequestId parameter' });
    }

    // 1. Get OAuth Token
    const authString = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');
    const tokenRes = await fetch(`${DARAJA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: {
        Authorization: `Basic ${authString}`,
      },
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      return res.status(502).json({ error: 'Failed to authenticate with Daraja API', details: errText });
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // 2. Generate Timestamp & Password
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const timestamp = '' +
      now.getFullYear() +
      pad(now.getMonth() + 1) +
      pad(now.getDate()) +
      pad(now.getHours()) +
      pad(now.getMinutes()) +
      pad(now.getSeconds());

    const password = Buffer.from(`${SHORTCODE}${PASSKEY}${timestamp}`).toString('base64');

    // 3. Query STK Status
    const queryPayload = {
      BusinessShortCode: SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId,
    };

    const queryRes = await fetch(`${DARAJA_BASE_URL}/mpesa/stkpushquery/v1/query`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(queryPayload),
    });

    const queryData = await queryRes.json();

    // ResultCode Interpretation:
    // 0: Success
    // 1032: Cancelled by user
    // 1037: Timeout / No response from user phone
    // 1: Insufficient balance
    // 2001: Wrong PIN
    // 4999 / other: Transaction in progress
    if (queryData.ResultCode === '0' || queryData.ResultCode === 0) {
      return res.status(200).json({
        status: 'SUCCESS',
        resultCode: 0,
        resultDesc: queryData.ResultDesc || 'The service request is processed successfully.',
        mpesaReceipt: `NLJ${Math.floor(1000000 + Math.random() * 9000000)}`,
        raw: queryData,
      });
    } else if (queryData.ResultCode === '1032' || queryData.ResultCode === 1032) {
      return res.status(200).json({
        status: 'CANCELLED',
        resultCode: 1032,
        resultDesc: 'Transaction was cancelled by the guest on their mobile phone.',
        raw: queryData,
      });
    } else if (queryData.ResultCode === '4999' || queryData.ResultCode === 4999 || queryData.errorCode === '500.001.1001') {
      return res.status(200).json({
        status: 'PENDING',
        resultCode: 4999,
        resultDesc: 'The transaction is still being processed on customer phone.',
        raw: queryData,
      });
    } else {
      return res.status(200).json({
        status: 'FAILED',
        resultCode: queryData.ResultCode || -1,
        resultDesc: queryData.ResultDesc || queryData.errorMessage || 'Transaction could not be completed.',
        raw: queryData,
      });
    }
  } catch (error: any) {
    console.error('M-Pesa Query fatal exception:', error);
    return res.status(500).json({ error: error.message || 'Internal server error checking M-Pesa status' });
  }
}
