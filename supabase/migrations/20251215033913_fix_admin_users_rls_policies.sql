/*
  # Fix Admin Users RLS Policies

  1. Changes
    - Drop existing restrictive policies on admin_users table
    - Add new simple policy that allows authenticated users to check if they are admins
    - This fixes the issue where admin status check was failing
  
  2. Security
    - Users can only check their own admin status
    - Still secure but more performant
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can view all admins" ON admin_users;
DROP POLICY IF EXISTS "Admins can add new admins" ON admin_users;
DROP POLICY IF EXISTS "Admins can remove admins" ON admin_users;

-- Allow authenticated users to check if they are an admin
CREATE POLICY "Users can check own admin status"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Allow admins to view all admin users (using the is_admin function)
CREATE POLICY "Admins can view all admins"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (
    (SELECT is_admin(auth.uid()))
  );

-- Allow admins to add new admins
CREATE POLICY "Admins can add new admins"
  ON admin_users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT is_admin(auth.uid()))
  );

-- Allow admins to remove other admins
CREATE POLICY "Admins can remove admins"
  ON admin_users
  FOR DELETE
  TO authenticated
  USING (
    (SELECT is_admin(auth.uid()))
  );
