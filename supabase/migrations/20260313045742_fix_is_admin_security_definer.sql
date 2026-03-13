/*
  # Fix is_admin function infinite recursion

  ## Problem
  The is_admin() function queries the admin_users table, but admin_users has RLS policies
  that also call is_admin(), creating infinite recursion and causing loading timeouts.

  ## Fix
  Recreate is_admin() with SECURITY DEFINER so it runs with elevated privileges and
  bypasses RLS entirely, breaking the recursive loop.
*/

CREATE OR REPLACE FUNCTION is_admin(check_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = check_user_id
  );
END;
$$;
