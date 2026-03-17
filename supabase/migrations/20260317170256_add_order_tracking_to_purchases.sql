/*
  # Add Order Tracking to Purchases Table

  1. Schema Changes
    - Add `user_id` column to link purchases to authenticated users
    - Add `shopify_order_id` column to track Shopify order references
    - Add `shopify_order_number` column for human-readable order numbers
    - Add `quantity` column to track number of items purchased
    - Add indexes for efficient queries

  2. Security
    - Update RLS policies to allow users to view only their own purchases
    - Allow webhook function to insert purchases using service role
*/

-- Add new columns to purchases table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'purchases' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE purchases ADD COLUMN user_id uuid REFERENCES auth.users(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'purchases' AND column_name = 'shopify_order_id'
  ) THEN
    ALTER TABLE purchases ADD COLUMN shopify_order_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'purchases' AND column_name = 'shopify_order_number'
  ) THEN
    ALTER TABLE purchases ADD COLUMN shopify_order_number text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'purchases' AND column_name = 'quantity'
  ) THEN
    ALTER TABLE purchases ADD COLUMN quantity integer DEFAULT 1 NOT NULL;
  END IF;
END $$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS purchases_user_id_idx ON purchases(user_id);
CREATE INDEX IF NOT EXISTS purchases_shopify_order_id_idx ON purchases(shopify_order_id);
CREATE INDEX IF NOT EXISTS purchases_created_at_idx ON purchases(created_at DESC);

-- Update RLS policies
DROP POLICY IF EXISTS "Users can view own purchases" ON purchases;
DROP POLICY IF EXISTS "Admins can view all purchases" ON purchases;
DROP POLICY IF EXISTS "Service role can insert purchases" ON purchases;

-- Users can view their own purchases
CREATE POLICY "Users can view own purchases"
  ON purchases
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can view all purchases
CREATE POLICY "Admins can view all purchases"
  ON purchases
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- Allow authenticated service (webhooks) to insert purchases
CREATE POLICY "Service can insert purchases"
  ON purchases
  FOR INSERT
  TO authenticated
  WITH CHECK (true);