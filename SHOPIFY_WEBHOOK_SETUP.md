# Shopify Webhook Setup Guide

This guide explains how to configure Shopify webhooks to automatically track orders and sync inventory in your FBDeals app.

## Overview

The webhook system automatically:
- Captures completed orders from Shopify
- Creates purchase records in the database
- Updates deal inventory quantities in real-time
- Links orders to authenticated users

## Webhook Configuration

### Step 1: Get Your Webhook URL

Your webhook endpoint URL is:
```
https://[your-project-ref].supabase.co/functions/v1/shopify-order-webhook
```

Replace `[your-project-ref]` with your actual Supabase project reference (found in your Supabase project settings).

### Step 2: Configure Shopify Webhook

1. Log in to your Shopify Admin Panel
2. Navigate to **Settings** > **Notifications**
3. Scroll down to the **Webhooks** section
4. Click **Create webhook**
5. Configure the webhook:
   - **Event**: Select `Order payment`
   - **Format**: `JSON`
   - **URL**: Paste your webhook URL from Step 1
   - **API Version**: `2024-10` (or latest stable version)

6. Click **Save webhook**

### Step 3: Test the Webhook

1. Make a test purchase through your app
2. Check the Supabase function logs:
   - Go to your Supabase dashboard
   - Navigate to **Edge Functions** > **shopify-order-webhook**
   - Click on **Logs** to see webhook activity

3. Verify in your database:
   - Check the `purchases` table for the new order
   - Check the `deals` table to confirm inventory was decremented

## How It Works

### Order Flow

1. User clicks "Buy Now" in the app
2. App creates Shopify checkout with user ID attached
3. User completes payment on Shopify
4. Shopify sends webhook to your endpoint
5. Webhook function:
   - Matches products to deals using Shopify product ID
   - Creates purchase records with user information
   - Decrements deal inventory
   - Links order to user account

### User Identification

The system identifies users through:
1. **Cart Attributes**: User ID passed during checkout creation
2. **Customer Email**: Matches email to authenticated users
3. **Guest Purchases**: Tracked even without user account

### Real-Time Updates

The app uses Supabase real-time subscriptions to automatically update:
- Admin dashboard shows live inventory changes
- Deal detail pages reflect current stock
- Orders page shows new purchases immediately

## Troubleshooting

### Orders Not Appearing

1. **Check webhook is active**:
   - Go to Shopify Admin > Settings > Notifications > Webhooks
   - Ensure webhook status is "Active"

2. **Verify webhook URL is correct**:
   - URL should match your Supabase project
   - Function name must be `shopify-order-webhook`

3. **Check function logs**:
   - Supabase Dashboard > Edge Functions > shopify-order-webhook > Logs
   - Look for errors or missing webhook events

### Inventory Not Updating

1. **Verify deal setup**:
   - Deal must have matching `shopify_product_id`
   - Product ID format: `gid://shopify/Product/[id]`

2. **Check real-time subscriptions**:
   - Ensure app has active database connection
   - Refresh the page to trigger subscription

3. **Database permissions**:
   - Purchases table RLS policies allow webhook inserts
   - Deals table allows authenticated updates

### User Orders Not Showing

1. **Verify user is logged in**:
   - Orders page only shows purchases for authenticated users
   - Guest purchases won't appear until user logs in with matching email

2. **Check user_id in purchases**:
   - Query purchases table to confirm user_id is set
   - If null, cart attributes may not be passing correctly

## Database Schema

The webhook system uses these tables:

### purchases
- `id`: UUID primary key
- `user_id`: Links to auth.users (nullable for guest orders)
- `deal_id`: Links to deals table
- `shopify_order_id`: Shopify order ID
- `shopify_order_number`: Human-readable order number
- `quantity`: Number of items purchased
- `customer_email`: Customer email
- `customer_name`: Customer name
- `purchase_price`: Price paid
- `status`: Order status (completed, pending, failed, refunded)
- `created_at`: Timestamp

### deals
- `quantity_remaining`: Automatically decremented when orders are received
- `updated_at`: Updated when inventory changes

## Security

- Webhook endpoint is public (doesn't require JWT verification)
- Future enhancement: Add HMAC signature verification
- Service role key used for database operations
- RLS policies protect user data access

## Monitoring

Monitor webhook health by:
1. Checking Supabase function logs regularly
2. Setting up alerts for failed webhook processing
3. Comparing Shopify order counts with database records
4. Monitoring inventory sync accuracy

## Support

If you encounter issues:
1. Check function logs for detailed error messages
2. Verify all environment variables are set
3. Test with a small order first
4. Contact support with log output and error details
