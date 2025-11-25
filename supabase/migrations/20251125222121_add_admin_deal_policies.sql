/*
  # Add Admin Policies for Deals Management

  1. Changes
    - Add INSERT policy: Admins can create new deals
    - Add UPDATE policy: Admins can update existing deals
    - Add DELETE policy: Admins can delete deals
  
  2. Security
    - All policies check if user is an admin using is_admin() function
    - Only admins can modify deals
    - Everyone can still read deals (existing policy)
*/

-- Allow admins to insert new deals
CREATE POLICY "admins_can_insert_deals"
  ON deals
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

-- Allow admins to update deals
CREATE POLICY "admins_can_update_deals"
  ON deals
  FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Allow admins to delete deals
CREATE POLICY "admins_can_delete_deals"
  ON deals
  FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()));
