/*
  # Fix App Users RLS Policies

  1. Issues Fixed
    - Infinite recursion in app_users RLS policies
    - Policies now use the SECURITY DEFINER function to bypass RLS

  2. Changes
    - Update "Super admins can manage all app users" policy
    - Update "Admins can read all app users" policy
    - Use get_user_app_role() function to prevent recursive calls
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Super admins can manage all app users" ON app_users;
DROP POLICY IF EXISTS "Admins can read all app users" ON app_users;

-- Recreate policies using the SECURITY DEFINER function to avoid recursion
CREATE POLICY "Super admins can manage all app users"
  ON app_users
  FOR ALL
  TO authenticated
  USING (get_user_app_role(auth.uid()) = 'super_admin');

CREATE POLICY "Admins can read all app users"
  ON app_users
  FOR SELECT
  TO authenticated
  USING (get_user_app_role(auth.uid()) IN ('super_admin', 'admin'));