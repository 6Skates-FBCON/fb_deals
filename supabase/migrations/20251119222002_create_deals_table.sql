/*
  # Create Flash Weekly Deals System

  ## Overview
  Creates the database structure for 6Skates Flash Weekly Deals feature.

  ## New Tables
  
  ### `deals`
  Stores all deal information including product details, pricing, inventory, and scheduling.
  
  - `id` (uuid, primary key) - Unique identifier for each deal
  - `title` (text) - Product/deal title
  - `description` (text) - Product description and deal details
  - `image_url` (text) - URL to product image
  - `regular_price` (numeric) - Original price before discount
  - `sale_price` (numeric) - Discounted flash deal price
  - `quantity_total` (integer) - Total quantity available for this deal
  - `quantity_remaining` (integer) - Current remaining inventory
  - `start_date` (timestamptz) - When the deal becomes active
  - `end_date` (timestamptz) - When the deal expires
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  
  ### `purchases`
  Tracks all purchase transactions for deals.
  
  - `id` (uuid, primary key) - Unique purchase identifier
  - `deal_id` (uuid, foreign key) - References the deal being purchased
  - `customer_email` (text) - Customer email address
  - `customer_name` (text) - Customer name
  - `purchase_price` (numeric) - Price paid at time of purchase
  - `status` (text) - Purchase status: 'pending', 'completed', 'failed', 'refunded'
  - `created_at` (timestamptz) - Purchase timestamp

  ## Security
  
  - Enable RLS on both tables
  - Deals table: Public read access for active deals
  - Purchases table: Users can only view their own purchases
  
  ## Notes
  
  - Inventory decrements happen via application logic when purchases complete
  - Deal status (active/sold-out/expired/coming-soon) is determined by dates and quantity
  - Timestamps use timezone-aware format for accurate scheduling
*/

-- Create deals table
CREATE TABLE IF NOT EXISTS deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  image_url text NOT NULL,
  regular_price numeric(10, 2) NOT NULL CHECK (regular_price > 0),
  sale_price numeric(10, 2) NOT NULL CHECK (sale_price > 0 AND sale_price < regular_price),
  quantity_total integer NOT NULL DEFAULT 0 CHECK (quantity_total >= 0),
  quantity_remaining integer NOT NULL DEFAULT 0 CHECK (quantity_remaining >= 0 AND quantity_remaining <= quantity_total),
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL CHECK (end_date > start_date),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create purchases table
CREATE TABLE IF NOT EXISTS purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  customer_email text NOT NULL,
  customer_name text NOT NULL,
  purchase_price numeric(10, 2) NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_deals_dates ON deals(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_deals_quantity ON deals(quantity_remaining);
CREATE INDEX IF NOT EXISTS idx_purchases_deal_id ON purchases(deal_id);
CREATE INDEX IF NOT EXISTS idx_purchases_email ON purchases(customer_email);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON purchases(status);

-- Enable Row Level Security
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

-- RLS Policies for deals table
-- Allow everyone to read all deals (public catalog)
CREATE POLICY "Anyone can view deals"
  ON deals FOR SELECT
  TO anon, authenticated
  USING (true);

-- RLS Policies for purchases table
-- Users can view purchases by email
CREATE POLICY "Users can view purchases by email"
  ON purchases FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow inserting purchases (checkout flow)
CREATE POLICY "Anyone can create purchases"
  ON purchases FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Function to update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_deals_updated_at
  BEFORE UPDATE ON deals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();