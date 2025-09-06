/*
  # Initial Schema Setup for Adminium

  1. New Tables
    - `services`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `created_at` (timestamp)
    - `service_roles`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `service_id` (uuid, references services)
      - `role` (text, admin/user)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users based on service access
    - Create indexes for performance optimization

  3. Initial Data
    - Insert default services: "Adminium" and "RMS Analysis"
*/

-- Create services table
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create service_roles table
CREATE TABLE IF NOT EXISTS service_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  service_id uuid REFERENCES services(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('admin', 'user')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, service_id)
);

-- Enable RLS
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_roles ENABLE ROW LEVEL SECURITY;

-- Services policies
CREATE POLICY "Anyone can read services"
  ON services
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can manage services"
  ON services
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM service_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
      AND service_id IN (
        SELECT id FROM services WHERE name = 'Adminium'
      )
    )
  );

-- Service roles policies
CREATE POLICY "Users can read service roles"
  ON service_roles
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM service_roles sr
      WHERE sr.user_id = auth.uid() 
      AND sr.role = 'admin'
      AND sr.service_id IN (
        SELECT id FROM services WHERE name = 'Adminium'
      )
    )
  );

CREATE POLICY "Only admins can manage service roles"
  ON service_roles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM service_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
      AND service_id IN (
        SELECT id FROM services WHERE name = 'Adminium'
      )
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_service_roles_user_id ON service_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_service_roles_service_id ON service_roles(service_id);
CREATE INDEX IF NOT EXISTS idx_service_roles_role ON service_roles(role);

-- Insert default services
INSERT INTO services (name) VALUES 
  ('Adminium'),
  ('RMS Analysis')
ON CONFLICT (name) DO NOTHING;