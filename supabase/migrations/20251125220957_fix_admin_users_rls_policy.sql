/*
  # Fix Admin Users RLS Policy

  1. Changes
    - Drop the existing SELECT policy that creates a circular dependency
    - Add new policy that allows users to check if THEY are an admin
    - Keep the restrictive policies for INSERT and DELETE
  
  2. Security
    - Users can only see their own admin record (if they have one)
    - Admin operations (adding/removing admins) still require admin status
*/

-- Drop the existing problematic policy
DROP POLICY IF EXISTS "Admins can view all admins" ON admin_users;

-- Create a new policy that allows users to check their own admin status
CREATE POLICY "Users can view own admin status"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Also allow admins to view all admins (for admin management UI)
CREATE POLICY "Admins can view all admin records"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users AS admin_check
      WHERE admin_check.user_id = auth.uid()
    )
  );
