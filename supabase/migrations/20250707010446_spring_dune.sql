/*
  # Initial Database Schema Setup

  1. New Tables
    - `profiles` - User profile information
      - `id` (uuid, primary key, references auth.users)
      - `full_name` (text)
      - `email` (text, unique)
      - `avatar_url` (text, optional)
      - `is_active` (boolean, default true)
      - `last_active` (timestamptz, default now)
      - `created_at` (timestamptz, default now)
      - `updated_at` (timestamptz, default now)

    - `services` - Service definitions
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `description` (text, optional)
      - `status` (enum: active, inactive, maintenance)
      - `config` (jsonb, default {})
      - `metrics` (jsonb, default {})
      - `created_by` (uuid, references profiles)
      - `created_at` (timestamptz, default now)
      - `updated_at` (timestamptz, default now)

    - `user_service_roles` - User roles for services
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `service_id` (uuid, references services)
      - `role` (enum: admin, user)
      - `granted_by` (uuid, references profiles, optional)
      - `granted_at` (timestamptz, default now)

    - `service_metrics` - Service performance metrics
      - `id` (uuid, primary key)
      - `service_id` (uuid, references services)
      - `metric_name` (text)
      - `metric_value` (numeric)
      - `metric_unit` (text, optional)
      - `metadata` (jsonb, default {})
      - `recorded_at` (timestamptz, default now)

    - `activity_logs` - User activity tracking
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `service_id` (uuid, references services, optional)
      - `activity_type` (enum: login, logout, service_access, profile_update, admin_action)
      - `description` (text)
      - `metadata` (jsonb, default {})
      - `ip_address` (inet, optional)
      - `user_agent` (text, optional)
      - `created_at` (timestamptz, default now)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Add policies for admin users
    - Add trigger for profile creation on auth.users insert
    - Add trigger for updating last_active on activity
*/

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'user');
CREATE TYPE service_status AS ENUM ('active', 'inactive', 'maintenance');
CREATE TYPE activity_type AS ENUM ('login', 'logout', 'service_access', 'profile_update', 'admin_action');

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text UNIQUE NOT NULL,
  avatar_url text,
  is_active boolean DEFAULT true,
  last_active timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create services table
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  status service_status DEFAULT 'active',
  config jsonb DEFAULT '{}',
  metrics jsonb DEFAULT '{}',
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_service_roles table
CREATE TABLE IF NOT EXISTS user_service_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  granted_by uuid REFERENCES profiles(id),
  granted_at timestamptz DEFAULT now(),
  UNIQUE(user_id, service_id)
);

-- Create service_metrics table
CREATE TABLE IF NOT EXISTS service_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  metric_name text NOT NULL,
  metric_value numeric NOT NULL,
  metric_unit text,
  metadata jsonb DEFAULT '{}',
  recorded_at timestamptz DEFAULT now()
);

-- Create activity_logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  service_id uuid REFERENCES services(id) ON DELETE SET NULL,
  activity_type activity_type NOT NULL,
  description text NOT NULL,
  metadata jsonb DEFAULT '{}',
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_service_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can read all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_service_roles usr
      WHERE usr.user_id = auth.uid() AND usr.role = 'admin'
    )
  );

-- Services policies
CREATE POLICY "Users can read services they have access to"
  ON services
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_service_roles usr
      WHERE usr.service_id = id AND usr.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage services"
  ON services
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_service_roles usr
      WHERE usr.service_id = id AND usr.user_id = auth.uid() AND usr.role = 'admin'
    )
  );

CREATE POLICY "Service creators can manage their services"
  ON services
  FOR ALL
  TO authenticated
  USING (created_by = auth.uid());

-- User service roles policies
CREATE POLICY "Users can read their own roles"
  ON user_service_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage service roles"
  ON user_service_roles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_service_roles usr
      WHERE usr.service_id = service_id AND usr.user_id = auth.uid() AND usr.role = 'admin'
    )
  );

-- Service metrics policies
CREATE POLICY "Users can read metrics for their services"
  ON service_metrics
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_service_roles usr
      WHERE usr.service_id = service_id AND usr.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage service metrics"
  ON service_metrics
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_service_roles usr
      WHERE usr.service_id = service_id AND usr.user_id = auth.uid() AND usr.role = 'admin'
    )
  );

-- Activity logs policies
CREATE POLICY "Users can read their own activity"
  ON activity_logs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can read all activity"
  ON activity_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_service_roles usr
      WHERE usr.user_id = auth.uid() AND usr.role = 'admin'
    )
  );

CREATE POLICY "System can insert activity logs"
  ON activity_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create function to update last_active timestamp
CREATE OR REPLACE FUNCTION update_last_active()
RETURNS trigger AS $$
BEGIN
  UPDATE profiles 
  SET last_active = now(), updated_at = now()
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to update last_active on activity
DROP TRIGGER IF EXISTS on_activity_logged ON activity_logs;
CREATE TRIGGER on_activity_logged
  AFTER INSERT ON activity_logs
  FOR EACH ROW EXECUTE FUNCTION update_last_active();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_services_updated_at ON services;
CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();