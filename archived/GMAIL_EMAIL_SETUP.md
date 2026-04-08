# Gmail Email Setup Guide

This guide walks you through setting up automatic email sending using your Gmail account with Nodemailer.

## Step 1: Enable Gmail App Password

1. Go to your Google Account: [myaccount.google.com](https://myaccount.google.com)
2. Go to **Security** → **2-Step Verification** (must be enabled)
3. Under "Signing in to Google", click **App passwords**
4. Select:
   - App: **Mail**
   - Device: **Other (Custom name)**
   - Name: `Makmex Orders`
5. Click **Generate** and copy the 16-character password

## Step 2: Add Secrets to Supabase

Go to **Supabase Dashboard** → **Settings** → **Edge Functions** and add these secrets:

```
GMAIL_USER=emkaustinen@gmail.com
GMAIL_APP_PASSWORD=your_16_character_app_password_here
PROJECT_URL=https://your-project.supabase.co
SERVICE_ROLE_KEY=your_service_role_key_here
```

## Step 3: Deploy the Edge Function

### Option A: Using Supabase CLI
```bash
supabase functions deploy send-order-email
```

### Option B: Using Supabase Dashboard
1. Go to **Edge Functions** in your Supabase Dashboard
2. Click **New Function**
3. Name it: `send-order-email`
4. Copy the code from `supabase/functions/send-order-email/index.ts`
5. Click **Save** and **Deploy**

## Step 4: Test the Setup

1. Place a test order on your website
2. Check the console logs for email sending status
3. Verify that:
   - Customer receives confirmation email
   - You receive internal notification email

## Features

✅ **Automatic Email Sending** - No customer action required
✅ **Professional HTML Emails** - Beautiful order confirmations
✅ **Dual Notifications** - Customer + internal emails
✅ **Gmail Integration** - Uses your existing email account
✅ **Error Handling** - Graceful fallback if email fails

## Email Content

### Customer Receives:
- Order confirmation with order number
- Order details and total
- Professional HTML template
- Contact information

### You Receive:
- New order notification
- Customer details
- Order summary
- Quick reference for order management

## Troubleshooting

### "Invalid credentials" error:
- Double-check your app password (no spaces)
- Ensure 2-Step Verification is enabled
- Verify Gmail address is correct

### "Function not found" error:
- Deploy the Edge Function
- Check function name is exactly `send-order-email`

### Email not sending:
- Check Supabase function logs
- Verify all secrets are set correctly
- Check Gmail spam folder

## Security Notes

- Your app password is stored securely in Supabase secrets
- Emails are sent from your Gmail account
- No passwords are exposed in the frontend code
- Use app-specific passwords, not your main Gmail password

## Cost

- **Free!** - Uses your existing Gmail account
- Gmail allows ~100-150 emails/day via SMTP
- Perfect for small to medium businesses
