/*
  # Add simple RLS policy for admin_users

  1. Changes
    - Re-enable RLS on admin_users
    - Add single simple policy: any authenticated user can read the table
  
  2. Security
    - Read-only access for checking admin status
    - No write access from clients
*/

-- Re-enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read admin_users (read-only for checking status)
CREATE POLICY "Authenticated users can read admin_users"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (true);
