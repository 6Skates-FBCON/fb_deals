/*
  # Create Admin Users Table

  1. New Tables
    - `admin_users`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users) - Links to Supabase auth user
      - `email` (text) - Admin user email
      - `created_at` (timestamptz) - When admin was added
      - `created_by` (uuid) - Who added this admin
  
  2. Security
    - Enable RLS on `admin_users` table
    - Add policy for admins to read admin list
    - Add policy for admins to add new admins
    - Only authenticated users in this table can perform admin actions
  
  3. Important Notes
    - To make someone an admin, insert their user_id into this table
    - First admin must be added manually via SQL
    - Example: INSERT INTO admin_users (user_id, email) VALUES ('user-uuid-here', 'admin@example.com');
*/

-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view all admin users
CREATE POLICY "Admins can view all admins"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- Policy: Admins can add new admins
CREATE POLICY "Admins can add new admins"
  ON admin_users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- Policy: Admins can remove other admins
CREATE POLICY "Admins can remove admins"
  ON admin_users
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON admin_users(user_id);

-- Create helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(check_user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = check_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
