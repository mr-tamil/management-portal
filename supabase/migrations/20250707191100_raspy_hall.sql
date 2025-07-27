/*
  # App Management System

  1. New Tables
    - `app_users` - Users who have access to this management portal
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `role` (enum: super_admin, admin, user)
      - `granted_by` (uuid, references profiles)
      - `granted_at` (timestamptz, default now)
      - `is_active` (boolean, default true)

  2. Security
    - Enable RLS on app_users table
    - Add policies for app access control
    - Insert initial super admin user (mr.tamil003@gmail.com)

  3. Updates
    - Update existing policies to check app_users access
    - Add app-level activity logging
*/

-- Create app user role enum
CREATE TYPE app_user_role AS ENUM ('super_admin', 'admin', 'user');

-- Create app_users table for management portal access
CREATE TABLE IF NOT EXISTS app_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role app_user_role NOT NULL DEFAULT 'user',
  granted_by uuid REFERENCES profiles(id),
  granted_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on app_users
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;

-- App users policies
CREATE POLICY "App users can read their own access"
  ON app_users
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Super admins can manage all app users"
  ON app_users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM app_users au
      WHERE au.user_id = auth.uid() 
      AND au.role = 'super_admin' 
      AND au.is_active = true
    )
  );

CREATE POLICY "Admins can read all app users"
  ON app_users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM app_users au
      WHERE au.user_id = auth.uid() 
      AND au.role IN ('super_admin', 'admin') 
      AND au.is_active = true
    )
  );

-- Update profiles policies to include app access check
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
CREATE POLICY "App admins can read all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM app_users au
      WHERE au.user_id = auth.uid() 
      AND au.role IN ('super_admin', 'admin') 
      AND au.is_active = true
    )
  );

-- Update services policies to include app access check
DROP POLICY IF EXISTS "Admins can manage services" ON services;
CREATE POLICY "App admins can manage services"
  ON services
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM app_users au
      WHERE au.user_id = auth.uid() 
      AND au.role IN ('super_admin', 'admin') 
      AND au.is_active = true
    )
  );

-- Update user_service_roles policies
DROP POLICY IF EXISTS "Admins can manage service roles" ON user_service_roles;
CREATE POLICY "App admins can manage service roles"
  ON user_service_roles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM app_users au
      WHERE au.user_id = auth.uid() 
      AND au.role IN ('super_admin', 'admin') 
      AND au.is_active = true
    )
  );

-- Update service_metrics policies
DROP POLICY IF EXISTS "Admins can manage service metrics" ON service_metrics;
CREATE POLICY "App admins can manage service metrics"
  ON service_metrics
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM app_users au
      WHERE au.user_id = auth.uid() 
      AND au.role IN ('super_admin', 'admin') 
      AND au.is_active = true
    )
  );

-- Update activity_logs policies
DROP POLICY IF EXISTS "Admins can read all activity" ON activity_logs;
CREATE POLICY "App admins can read all activity"
  ON activity_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM app_users au
      WHERE au.user_id = auth.uid() 
      AND au.role IN ('super_admin', 'admin') 
      AND au.is_active = true
    )
  );

-- Function to check if user has app access
CREATE OR REPLACE FUNCTION has_app_access(user_uuid uuid, required_role app_user_role DEFAULT 'user')
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM app_users au
    WHERE au.user_id = user_uuid 
    AND au.is_active = true
    AND (
      au.role = 'super_admin' OR
      (required_role = 'admin' AND au.role IN ('super_admin', 'admin')) OR
      (required_role = 'user' AND au.role IN ('super_admin', 'admin', 'user'))
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's app role
CREATE OR REPLACE FUNCTION get_user_app_role(user_uuid uuid)
RETURNS app_user_role AS $$
DECLARE
  user_role app_user_role;
BEGIN
  SELECT role INTO user_role
  FROM app_users
  WHERE user_id = user_uuid AND is_active = true;
  
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for app_users updated_at
DROP TRIGGER IF EXISTS update_app_users_updated_at ON app_users;
CREATE TRIGGER update_app_users_updated_at
  BEFORE UPDATE ON app_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Insert the initial super admin user (mr.tamil003@gmail.com)
-- First, we need to ensure the profile exists
DO $$
DECLARE
  admin_user_id uuid;
  admin_profile_exists boolean;
BEGIN
  -- Check if user exists in auth.users and get the ID
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'mr.tamil003@gmail.com'
  LIMIT 1;

  IF admin_user_id IS NOT NULL THEN
    -- Check if profile exists
    SELECT EXISTS(
      SELECT 1 FROM profiles WHERE id = admin_user_id
    ) INTO admin_profile_exists;

    -- Create profile if it doesn't exist
    IF NOT admin_profile_exists THEN
      INSERT INTO profiles (id, full_name, email)
      VALUES (
        admin_user_id,
        'Tamil Admin',
        'mr.tamil003@gmail.com'
      );
    END IF;

    -- Insert or update app_users record
    INSERT INTO app_users (user_id, role, granted_by, granted_at)
    VALUES (admin_user_id, 'super_admin', admin_user_id, now())
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      role = 'super_admin',
      is_active = true,
      updated_at = now();

    -- Make this user admin of all existing services
    INSERT INTO user_service_roles (user_id, service_id, role, granted_by, granted_at)
    SELECT admin_user_id, s.id, 'admin', admin_user_id, now()
    FROM services s
    WHERE NOT EXISTS (
      SELECT 1 FROM user_service_roles usr
      WHERE usr.user_id = admin_user_id AND usr.service_id = s.id
    );

    RAISE NOTICE 'Super admin user mr.tamil003@gmail.com has been set up successfully';
  ELSE
    RAISE NOTICE 'User mr.tamil003@gmail.com not found in auth.users. Please create the user first in Supabase Auth.';
  END IF;
END $$;