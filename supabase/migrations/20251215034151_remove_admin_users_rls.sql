/*
  # Remove RLS from admin_users table

  1. Changes
    - Disable RLS on admin_users table
    - Drop all policies
    - The is_admin() function with SECURITY DEFINER handles all authorization
  
  2. Security
    - The is_admin() function is SECURITY DEFINER and bypasses RLS
    - All access control is done through the is_admin() function in other tables
    - This prevents circular dependency issues
*/

-- Drop all existing policies on admin_users
DROP POLICY IF EXISTS "Users can check own admin status" ON admin_users;
DROP POLICY IF EXISTS "Admins can view all admins" ON admin_users;
DROP POLICY IF EXISTS "Admins can add new admins" ON admin_users;
DROP POLICY IF EXISTS "Admins can remove admins" ON admin_users;

-- Disable RLS on admin_users table
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;
