import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
  }

  try {
    const callbackData = req.body?.Body?.stkCallback;
    console.log('Received M-Pesa Callback:', JSON.stringify(callbackData, null, 2));

    if (callbackData) {
      const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = callbackData;

      if (ResultCode === 0 && CallbackMetadata?.Item) {
        let mpesaReceipt = '';
        let amount = 0;
        let phone = '';

        for (const item of CallbackMetadata.Item) {
          if (item.Name === 'MpesaReceiptNumber') mpesaReceipt = String(item.Value);
          if (item.Name === 'Amount') amount = Number(item.Value);
          if (item.Name === 'PhoneNumber') phone = String(item.Value);
        }

        console.log(`✓ M-Pesa Payment Success: Receipt ${mpesaReceipt}, Amount ${amount}, Phone ${phone}`);
      } else {
        console.warn(`✗ M-Pesa Callback Non-Zero Code: ${ResultCode} - ${ResultDesc}`);
      }
    }

    // Always acknowledge Safaricom immediately
    return res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (err: any) {
    console.error('Error in M-Pesa callback handler:', err);
    return res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
  }
}
