import { defineConfig, loadEnv, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

function darajaDevPlugin(env: Record<string, string>): Plugin {
  const CONSUMER_KEY = env.MPESA_CONSUMER_KEY || '1G31byoFAcsZIwe9nRUMTN5cBTjI2dfUB0ooPzzzgYVChjAv';
  const CONSUMER_SECRET = env.MPESA_CONSUMER_SECRET || 'FAwXB3jkEXyscvj7RzoghFx43ZcaPVfswXAlCadh4iGKrNeWpsppGSSArXZMFEjN';
  const PASSKEY = env.MPESA_PASSKEY || 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919';
  const SHORTCODE = env.MPESA_SHORTCODE || '174379';
  const DARAJA_BASE_URL = 'https://sandbox.safaricom.co.ke';

  async function getAccessToken() {
    const authString = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');
    const res = await fetch(`${DARAJA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: { Authorization: `Basic ${authString}` },
    });
    const data = (await res.json()) as any;
    return data.access_token;
  }

  function getTimestampAndPassword() {
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
    return { timestamp, password };
  }

  return {
    name: 'daraja-dev-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/mpesa-')) {
          return next();
        }

        const readBody = async () => {
          return new Promise<any>((resolve) => {
            let data = '';
            req.on('data', (chunk) => { data += chunk; });
            req.on('end', () => {
              try { resolve(JSON.parse(data || '{}')); } catch { resolve({}); }
            });
          });
        };

        res.setHeader('Content-Type', 'application/json');

        if (req.url === '/api/mpesa-stk' && req.method === 'POST') {
          try {
            const body = await readBody();
            const { phone, amount, orderRef, orderId } = body;
            const accessToken = await getAccessToken();
            const { timestamp, password } = getTimestampAndPassword();

            const digits = (phone || '').replace(/\D/g, '');
            let formattedPhone = digits;
            if ((digits.startsWith('07') || digits.startsWith('01')) && digits.length === 10) {
              formattedPhone = '254' + digits.slice(1);
            } else if ((digits.startsWith('7') || digits.startsWith('1')) && digits.length === 9) {
              formattedPhone = '254' + digits;
            }

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
            const stkData = (await stkRes.json()) as any;
            if (stkData.ResponseCode === '0') {
              res.end(JSON.stringify({
                success: true,
                merchantRequestId: stkData.MerchantRequestID,
                checkoutRequestId: stkData.CheckoutRequestID,
                customerMessage: stkData.CustomerMessage,
                phone: formattedPhone,
              }));
            } else {
              res.statusCode = 400;
              res.end(JSON.stringify({ success: false, error: stkData.errorMessage || stkData.ResponseDescription, raw: stkData }));
            }
          } catch (err: any) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }

        if (req.url === '/api/mpesa-query' && req.method === 'POST') {
          try {
            const body = await readBody();
            const { checkoutRequestId } = body;
            const accessToken = await getAccessToken();
            const { timestamp, password } = getTimestampAndPassword();

            const queryRes = await fetch(`${DARAJA_BASE_URL}/mpesa/stkpushquery/v1/query`, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                BusinessShortCode: SHORTCODE,
                Password: password,
                Timestamp: timestamp,
                CheckoutRequestID: checkoutRequestId,
              }),
            });
            const queryData = (await queryRes.json()) as any;
            if (queryData.ResultCode === '0' || queryData.ResultCode === 0) {
              res.end(JSON.stringify({
                status: 'SUCCESS',
                resultCode: 0,
                resultDesc: queryData.ResultDesc,
                mpesaReceipt: `NLJ${Math.floor(1000000 + Math.random() * 9000000)}`,
              }));
            } else if (queryData.ResultCode === '1032' || queryData.ResultCode === 1032) {
              res.end(JSON.stringify({ status: 'CANCELLED', resultCode: 1032, resultDesc: 'Cancelled by user' }));
            } else if (queryData.ResultCode === '4999' || queryData.errorCode === '500.001.1001') {
              res.end(JSON.stringify({ status: 'PENDING', resultCode: 4999, resultDesc: 'Transaction under processing' }));
            } else {
              res.end(JSON.stringify({ status: 'FAILED', resultCode: queryData.ResultCode, resultDesc: queryData.ResultDesc || queryData.errorMessage }));
            }
          } catch (err: any) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }

        next();
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), darajaDevPlugin(env)],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5173,
      host: true,
    },
  };
});

