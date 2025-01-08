/*
  # Core Tables Implementation

  1. New Tables
    - billing_accounts: Billing entities
    - groups: Groups multiple settings
    - settings: Individual client settings
    - clients: Client user information
    - permission_definitions: RBAM permissions
    - role_hierarchies: Role inheritance structure
    - sid_access_logs: Access audit trail

  2. Security
    - RLS enabled on all tables
    - Role-based policies
*/

-- Billing Accounts
CREATE TABLE IF NOT EXISTS billing_accounts (
  billing_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact_email text NOT NULL,
  company_name text NOT NULL,
  address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Groups
CREATE TABLE IF NOT EXISTS groups (
  group_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  billing_id uuid REFERENCES billing_accounts(billing_id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Settings (SID)
CREATE TABLE IF NOT EXISTS settings (
  setting_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  group_id uuid REFERENCES groups(group_id),
  status text CHECK (status IN ('active', 'inactive', 'suspended')) DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Clients
CREATE TABLE IF NOT EXISTS clients (
  client_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  setting_id uuid REFERENCES settings(setting_id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Permission Definitions
CREATE TABLE IF NOT EXISTS permission_definitions (
  permission_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Role Hierarchies (now references the role column directly)
CREATE TABLE IF NOT EXISTS role_hierarchies (
  parent_role varchar CHECK (parent_role IN ('admin', 'agency', 'client')),
  child_role varchar CHECK (child_role IN ('admin', 'agency', 'client')),
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (parent_role, child_role)
);

-- SID Access Logs
CREATE TABLE IF NOT EXISTS sid_access_logs (
  log_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  setting_id uuid REFERENCES settings(setting_id),
  action text NOT NULL,
  accessed_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE billing_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE permission_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_hierarchies ENABLE ROW LEVEL SECURITY;
ALTER TABLE sid_access_logs ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies
CREATE POLICY "Admin full access on billing_accounts" ON billing_accounts
FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admin full access on groups" ON groups
FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admin full access on settings" ON settings
FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admin full access on clients" ON clients
FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admin full access on permission_definitions" ON permission_definitions
FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admin full access on role_hierarchies" ON role_hierarchies
FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admin full access on sid_access_logs" ON sid_access_logs
FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Agency Read Access
CREATE POLICY "Agency read access on billing_accounts" ON billing_accounts
FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM roles WHERE user_id = auth.uid() AND role = 'agency'));

CREATE POLICY "Agency read access on groups" ON groups
FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM roles WHERE user_id = auth.uid() AND role = 'agency'));

CREATE POLICY "Agency read access on settings" ON settings
FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM roles WHERE user_id = auth.uid() AND role = 'agency'));

CREATE POLICY "Agency read access on clients" ON clients
FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM roles WHERE user_id = auth.uid() AND role = 'agency'));

-- Client Access
CREATE POLICY "Clients read own data" ON clients
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM roles 
    WHERE user_id = auth.uid() 
    AND role = 'client'
    AND auth.uid()::text = clients.client_id::text
  )
);