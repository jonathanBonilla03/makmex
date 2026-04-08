# Email Functionality Setup

This document explains how to set up email functionality for order confirmations using Resend and Supabase Edge Functions.

## Prerequisites

1. **Resend Account**: Sign up at [resend.com](https://resend.com)
2. **Resend API Key**: Create an API key in your Resend dashboard
3. **Verified Domain**: Verify your sending domain in Resend (or use the provided email for testing)

## Setup Steps

### 1. Install Dependencies

The required packages are already installed:
- `@react-email/components` - For email templates
- `resend` - For sending emails

### 2. Configure Supabase Secrets

Run the PowerShell script (Windows) or Bash script (Mac/Linux):

**Windows:**
```powershell
.\setup-email-secrets.ps1
```

**Mac/Linux:**
```bash
chmod +x setup-email-secrets.sh
./setup-email-secrets.sh
```

Or set the secrets manually:

```bash
supabase secrets set RESEND_API_KEY=your_resend_api_key
supabase secrets set SUPABASE_URL=https://your-project.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Deploy the Edge Function

```bash
supabase functions deploy send-order-email
```

### 4. Test the Setup

1. Complete a test order through your checkout process
2. Check the customer email for the confirmation
3. Check your internal email for the new order notification

## Configuration

### Email Settings

- **From Email**: `busters1125@gmail.com` (configured in the Edge Function)
- **Internal Notifications**: Sent to `busters1125@gmail.com`

To change these, edit `supabase/functions/send-order-email/index.ts`:

```typescript
// Change these lines
from: "Makmex Orders <your-email@domain.com>",
to: "internal-notification@domain.com", // Internal notification
```

### Email Template

The email template is located at `emails/OrderConfirmation.tsx` and includes:
- Customer name and order number
- Order details with items, quantities, and prices
- Total amount
- Contact information
- Professional styling with your brand colors

## Database Schema Updates

The Edge Function expects these additional fields in your `orders` table:

```sql
ALTER TABLE orders 
ADD COLUMN confirmation_email_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN confirmation_email_sent_at TIMESTAMP NULL;
```

## How It Works

1. **Order Creation**: When a customer places an order, it's saved to the database
2. **Email Trigger**: The checkout process calls the `send-order-email` Edge Function
3. **Data Fetching**: The function fetches order details, customer info, and order items
4. **Email Generation**: Uses React Email to generate a professional HTML email
5. **Email Sending**: Sends via Resend API
6. **Status Update**: Marks the order as confirmed and records email sent status

## Security Features

- **API Keys**: Stored securely in Supabase secrets, never exposed to the browser
- **Service Role Key**: Only used in Edge Functions, not client-side
- **CORS Headers**: Properly configured for secure cross-origin requests

## Troubleshooting

### Common Issues

1. **Email not sending**: Check Supabase Function logs
   ```bash
   supabase functions logs send-order-email
   ```

2. **Secrets not found**: Verify secrets are set correctly
   ```bash
   supabase secrets list
   ```

3. **Domain not verified**: Ensure your sending domain is verified in Resend

4. **Function not deploying**: Check your Supabase CLI authentication
   ```bash
   supabase login
   ```

### Error Messages

- **"Missing orderId"**: The function wasn't called with an order ID
- **"Order not found"**: The order ID doesn't exist in the database
- **"No items found"**: The order exists but has no associated items

## Production Considerations

1. **Domain Verification**: Use a proper domain like `orders@yourdomain.com`
2. **Error Handling**: The system logs errors but doesn't fail orders if emails fail
3. **Retry Logic**: Consider implementing retry logic for failed emails
4. **Email Templates**: Create additional templates for shipping updates, etc.

## Next Steps

1. **Payment Integration**: Trigger emails after successful payment confirmation
2. **Order Status Updates**: Send emails when order status changes
3. **Marketing Emails**: Add promotional emails for customer engagement
4. **Email Analytics**: Track open rates and engagement through Resend dashboard

## Support

- **Resend Documentation**: [docs.resend.com](https://docs.resend.com)
- **Supabase Edge Functions**: [supabase.com/docs/guides/functions](https://supabase.com/docs/guides/functions)
- **React Email**: [react.email](https://react.email)
