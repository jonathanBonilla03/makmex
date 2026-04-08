# Resend Email Setup (Archived)

This document contains the complete setup for using Resend with Supabase Edge Functions for order confirmation emails.

## Overview
This was the original implementation using Resend API for sending automated order confirmation emails.

## Files Involved
- `supabase/functions/send-order-email/index.ts` - Edge Function code
- `emails/OrderConfirmation.tsx` - React Email template (archived)
- `src/pages/CheckoutPage.jsx` - Frontend integration

## Setup Instructions

### 1. Resend Account Setup
1. Sign up at [resend.com](https://resend.com)
2. Get your API Key from the dashboard
3. For production: Verify a custom domain at resend.com/domains

### 2. Supabase Secrets
Set these secrets in Supabase Dashboard → Settings → Edge Functions:
```
RESEND_API_KEY=your_resend_api_key_here
PROJECT_URL=https://your-project.supabase.co
SERVICE_ROLE_KEY=your_service_role_key_here
```

### 3. Deploy Edge Function
1. Go to Supabase Dashboard → Edge Functions
2. Create new function: `send-order-email`
3. Copy the code from `supabase/functions/send-order-email/index.ts`

### 4. Email Limitations
**Free Tier:**
- Can only send emails to your account email
- Use `onboarding@resend.dev` as sender
- Cannot send to customer emails directly

**Production:**
- Must verify a custom domain
- Use your domain email as sender (e.g., `orders@yourdomain.com`)
- Can send to any email address

### 5. Frontend Integration
The checkout page calls the function after successful order creation:
```javascript
const { data: emailResult, error: emailError } = await supabase.functions.invoke(
  "send-order-email",
  {
    body: { orderId: orderResult.data.id }
  }
);
```

## To Restore This Implementation
1. Move `supabase/functions/send-order-email/` back to active location
2. Update checkout page to call the Edge Function
3. Set up Resend secrets
4. Deploy the function
5. Test with orders

## Why This Was Archived
- Resend free tier limitations prevent sending to customer emails
- Requires domain verification for production use
- Simpler alternatives available for basic confirmation needs
