# Paystack Webhook Setup Guide

Your backend now has webhook support to receive real-time payment confirmations from Paystack. This provides an extra layer of security and ensures orders are created even if the client-side verification fails.

## Webhook Endpoint

Your webhook endpoint is available at:
```
https://your-replit-domain.replit.dev/functions/v1/paystack-webhook
```

Replace `your-replit-domain` with your actual Replit project domain.

## How to Configure in Paystack Dashboard

1. **Log in to Paystack Dashboard**
   - Go to https://dashboard.paystack.com
   - Sign in with your account

2. **Navigate to Webhooks**
   - In the left sidebar, go to **Settings** → **Webhooks**
   - Or directly visit: https://dashboard.paystack.com/settings/webhooks

3. **Add Your Webhook URL**
   - Click the **"Add URL"** button
   - Paste your webhook endpoint URL from above
   - Click **"Create Webhook"**

4. **Select Events to Subscribe To**
   - Check the following event:
     - ✅ **charge.success** (recommended - fires when payment is confirmed)
   - You can optionally also subscribe to:
     - **charge.failed** (fires when payment fails)
     - **charge.dispute** (fires if customer disputes the charge)

5. **Test Your Webhook**
   - Make a test payment from your app
   - Go back to the webhooks page
   - You should see the webhook event listed with status ✅ Delivered

## How It Works

1. **User completes payment** in the checkout modal
2. **Frontend verifies payment** with Paystack (existing flow)
3. **Paystack sends webhook** to your backend automatically
4. **Webhook creates/updates** the order in your database
5. **Dual confirmation**: Orders are confirmed both by client and server

## Security

The webhook signature is verified using SHA-512 HMAC with your Paystack secret key. This ensures only legitimate Paystack webhooks are processed.

## Environment Variables Required

The following must be set in your Replit environment:
- `PAYSTACK_SECRET_KEY` - Your Paystack secret API key
- `SUPABASE_URL` - Your Supabase URL
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key

## Testing Webhook Locally (Optional)

To test during development:
1. Use a tunneling service like ngrok: `ngrok http 5000`
2. Use the public ngrok URL as your webhook endpoint
3. Add it to Paystack webhooks settings

## Troubleshooting

**Webhook not showing as delivered?**
- Verify your webhook URL is correct and publicly accessible
- Check that your PAYSTACK_SECRET_KEY environment variable is set
- Make sure "charge.success" event is selected

**Orders creating multiple times?**
- The webhook checks if an order already exists for a reference
- If it exists, it updates the status instead of creating a duplicate

**Testing payment doesn't trigger webhook?**
- Test payments on Paystack require actual payment flow completion
- Use Paystack test mode with test cards provided in their documentation

## Additional Resources

- [Paystack Webhook Documentation](https://paystack.com/developers/api#webhook)
- [Webhook Event Reference](https://paystack.com/developers/api#event-object)
