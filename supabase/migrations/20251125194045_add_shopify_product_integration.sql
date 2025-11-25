/*
  # Add Shopify Product Integration to Deals

  ## Overview
  Extends the deals table to integrate with Shopify products for the hybrid approach.
  
  ## Changes
  
  ### Modified Tables
  
  #### `deals` table additions
  - `shopify_product_id` (text) - Shopify product ID (e.g., "gid://shopify/Product/123456")
  - `shopify_variant_id` (text, nullable) - Specific variant ID if applicable
  - `shopify_handle` (text) - Product handle for URL routing
  
  ## Notes
  
  1. Shopify Integration
     - Deal timing and flash sale scheduling remain in Supabase
     - Product details (title, images, pricing, inventory) sync from Shopify
     - Checkout redirects to Shopify for secure payment processing
  
  2. Data Flow
     - Admin creates deal and links to Shopify product ID
     - App fetches real-time product data from Shopify Storefront API
     - Purchase tracking happens in Shopify, but deal metadata stays in Supabase
  
  3. Flexibility
     - `shopify_product_id` is NOT NULL to ensure every deal has a Shopify product
     - Regular/sale prices in deals table can override Shopify prices for flash deals
     - Image URL and description can be overridden for customized deal presentation
*/

-- Add Shopify integration columns to deals table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'deals' AND column_name = 'shopify_product_id'
  ) THEN
    ALTER TABLE deals ADD COLUMN shopify_product_id text NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'deals' AND column_name = 'shopify_variant_id'
  ) THEN
    ALTER TABLE deals ADD COLUMN shopify_variant_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'deals' AND column_name = 'shopify_handle'
  ) THEN
    ALTER TABLE deals ADD COLUMN shopify_handle text NOT NULL DEFAULT '';
  END IF;
END $$;

-- Create index for Shopify product lookups
CREATE INDEX IF NOT EXISTS idx_deals_shopify_product ON deals(shopify_product_id);
CREATE INDEX IF NOT EXISTS idx_deals_shopify_handle ON deals(shopify_handle);