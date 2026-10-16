import type { VercelRequest, VercelResponse } from '@vercel/node';

const CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY || '1G31byoFAcsZIwe9nRUMTN5cBTjI2dfUB0ooPzzzgYVChjAv';
const CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET || 'FAwXB3jkEXyscvj7RzoghFx43ZcaPVfswXAlCadh4iGKrNeWpsppGSSArXZMFEjN';
const PASSKEY = process.env.MPESA_PASSKEY || 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919';
const SHORTCODE = process.env.MPESA_SHORTCODE || '174379';
const ENV = process.env.MPESA_ENV || 'sandbox';

const DARAJA_BASE_URL = ENV === 'production'
  ? 'https://api.safaricom.co.ke'
  : 'https://sandbox.safaricom.co.ke';

function normaliseKenyanPhone(input: string): string {
  const digits = input.replace(/\D/g, '');
  if (digits.startsWith('254') && digits.length === 12) return digits;
  if ((digits.startsWith('07') || digits.startsWith('01')) && digits.length === 10) {
    return '254' + digits.slice(1);
  }
  if ((digits.startsWith('7') || digits.startsWith('1')) && digits.length === 9) {
    return '254' + digits;
  }
  return digits;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
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
    const { phone, amount, orderRef, orderId } = req.body || {};

    if (!phone || !amount) {
      return res.status(400).json({ error: 'Missing phone or amount parameter' });
    }

    const formattedPhone = normaliseKenyanPhone(phone);
    if (!/^254(7|1)\d{8}$/.test(formattedPhone)) {
      return res.status(400).json({ error: 'Invalid Kenyan mobile phone number for M-Pesa. Acceptable formats: 07xx..., 01xx..., +254...' });
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
      console.error('Daraja OAuth failure:', errText);
      return res.status(502).json({ error: 'Failed to authenticate with Safaricom Daraja API', details: errText });
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

    // 3. Trigger STK Push
    const stkPayload = {
      BusinessShortCode: SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.max(1, Math.round(Number(amount))),
      PartyA: formattedPhone,
      PartyB: SHORTCODE,
      PhoneNumber: formattedPhone,
      CallBackURL: 'https://crown-hotels.vercel.app/api/mpesa-callback',
      AccountReference: (orderRef || 'CrownHotels').replace(/[^a-zA-Z0-9]/g, '').slice(0, 12),
      TransactionDesc: `Crown Dining ${orderId ? orderId.slice(0, 6) : ''}`.trim(),
    };

    const stkRes = await fetch(`${DARAJA_BASE_URL}/mpesa/stkpush/v1/processrequest`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(stkPayload),
    });

    const stkData = await stkRes.json();

    if (stkData.ResponseCode === '0') {
      return res.status(200).json({
        success: true,
        merchantRequestId: stkData.MerchantRequestID,
        checkoutRequestId: stkData.CheckoutRequestID,
        customerMessage: stkData.CustomerMessage || 'STK Push sent to customer phone.',
        phone: formattedPhone,
      });
    } else {
      console.error('STK push error from Daraja:', stkData);
      return res.status(400).json({
        success: false,
        error: stkData.errorMessage || stkData.ResponseDescription || 'M-Pesa STK push rejected by Safaricom',
        raw: stkData,
      });
    }
  } catch (error: any) {
    console.error('M-Pesa STK handler fatal exception:', error);
    return res.status(500).json({ error: error.message || 'Internal server error while initiating M-Pesa STK Push' });
  }
}
