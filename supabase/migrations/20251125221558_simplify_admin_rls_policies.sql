/*
  # Simplify Admin Users RLS Policies

  1. Changes
    - Drop ALL existing policies on admin_users table
    - Create ONE simple policy: users can read their own admin record
    - Remove the circular dependency entirely
  
  2. Security
    - Users can ONLY see if THEY are an admin (their own record)
    - Cannot see other admins
    - Insert/Delete still restricted to existing admins
*/

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Admins can view all admins" ON admin_users;
DROP POLICY IF EXISTS "Users can view own admin status" ON admin_users;
DROP POLICY IF EXISTS "Admins can view all admin records" ON admin_users;
DROP POLICY IF EXISTS "Admins can add new admins" ON admin_users;
DROP POLICY IF EXISTS "Admins can remove admins" ON admin_users;

-- Create simple SELECT policy: users can only see their own admin record
CREATE POLICY "view_own_admin_record"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Allow admins to insert new admins (uses function to avoid circular dependency)
CREATE POLICY "insert_admin_records"
  ON admin_users
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

-- Allow admins to delete admin records
CREATE POLICY "delete_admin_records"
  ON admin_users
  FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()));
