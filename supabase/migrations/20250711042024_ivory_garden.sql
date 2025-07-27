/*
  # Final Backend-Only Migration

  1. Schema Fixes
    - Fix user creation triggers and constraints
    - Ensure proper RLS policies for backend operations
    - Remove any edge function dependencies

  2. Backend-Only Operations
    - All operations go through Express.js backend
    - No edge functions or client-side database access
    - Proper authentication flow through backend

  3. User Creation Fix
    - Fix profile creation trigger
    - Handle auth user creation properly
    - Ensure no conflicts with existing data
*/

-- Drop and recreate the profile creation trigger to fix user creation issues
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Create improved function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Only create profile if it doesn't already exist
  INSERT INTO profiles (id, full_name, email, is_active, last_active, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    true,
    now(),
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = now();
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Ensure profiles table has proper constraints
ALTER TABLE profiles 
  ALTER COLUMN full_name SET NOT NULL,
  ALTER COLUMN email SET NOT NULL,
  ALTER COLUMN is_active SET DEFAULT true,
  ALTER COLUMN last_active SET DEFAULT now(),
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN updated_at SET DEFAULT now();

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_active ON profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_user_service_roles_user_service ON user_service_roles(user_id, service_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_created ON activity_logs(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_app_users_user_active ON app_users(user_id, is_active);

-- Update RLS policies to work better with backend operations
-- These policies allow the backend (using service role key) to perform operations

-- Profiles policies update
DROP POLICY IF EXISTS "Backend can manage all profiles" ON profiles;
CREATE POLICY "Backend can manage all profiles"
  ON profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Services policies update  
DROP POLICY IF EXISTS "Backend can manage all services" ON services;
CREATE POLICY "Backend can manage all services"
  ON services
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- User service roles policies update
DROP POLICY IF EXISTS "Backend can manage all user service roles" ON user_service_roles;
CREATE POLICY "Backend can manage all user service roles"
  ON user_service_roles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Activity logs policies update
DROP POLICY IF EXISTS "Backend can manage all activity logs" ON activity_logs;
CREATE POLICY "Backend can manage all activity logs"
  ON activity_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Service metrics policies update
DROP POLICY IF EXISTS "Backend can manage all service metrics" ON service_metrics;
CREATE POLICY "Backend can manage all service metrics"
  ON service_metrics
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- App users policies update
DROP POLICY IF EXISTS "Backend can manage all app users" ON app_users;
CREATE POLICY "Backend can manage all app users"
  ON app_users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Function to safely create user profile (for backend use)
CREATE OR REPLACE FUNCTION create_user_profile(
  user_id uuid,
  user_email text,
  user_full_name text
)
RETURNS profiles AS $$
DECLARE
  new_profile profiles;
BEGIN
  INSERT INTO profiles (id, full_name, email, is_active, last_active, created_at, updated_at)
  VALUES (user_id, user_full_name, user_email, true, now(), now(), now())
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    is_active = EXCLUDED.is_active,
    updated_at = now()
  RETURNING * INTO new_profile;
  
  RETURN new_profile;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to safely grant app access
CREATE OR REPLACE FUNCTION grant_app_access(
  target_user_id uuid,
  user_role app_user_role,
  granted_by_user_id uuid
)
RETURNS app_users AS $$
DECLARE
  new_app_user app_users;
BEGIN
  INSERT INTO app_users (user_id, role, granted_by, granted_at, is_active)
  VALUES (target_user_id, user_role, granted_by_user_id, now(), true)
  ON CONFLICT (user_id) DO UPDATE SET
    role = EXCLUDED.role,
    granted_by = EXCLUDED.granted_by,
    granted_at = EXCLUDED.granted_at,
    is_active = true,
    updated_at = now()
  RETURNING * INTO new_app_user;
  
  RETURN new_app_user;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the super admin user exists and has proper access
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
    -- Ensure profile exists
    INSERT INTO profiles (id, full_name, email, is_active, last_active, created_at, updated_at)
    VALUES (admin_user_id, 'Tamil Admin', 'mr.tamil003@gmail.com', true, now(), now(), now())
    ON CONFLICT (id) DO UPDATE SET
      full_name = 'Tamil Admin',
      email = 'mr.tamil003@gmail.com',
      is_active = true,
      updated_at = now();

    -- Ensure app access exists
    INSERT INTO app_users (user_id, role, granted_by, granted_at, is_active)
    VALUES (admin_user_id, 'super_admin', admin_user_id, now(), true)
    ON CONFLICT (user_id) DO UPDATE SET
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

    RAISE NOTICE 'Super admin user setup completed successfully';
  ELSE
    RAISE NOTICE 'User mr.tamil003@gmail.com not found in auth.users. Please create the user first.';
  END IF;
END $$;

-- Add helpful comments
COMMENT ON FUNCTION handle_new_user() IS 'Automatically creates profile when new auth user is created';
COMMENT ON FUNCTION create_user_profile(uuid, text, text) IS 'Backend function to safely create user profiles';
COMMENT ON FUNCTION grant_app_access(uuid, app_user_role, uuid) IS 'Backend function to safely grant app access';