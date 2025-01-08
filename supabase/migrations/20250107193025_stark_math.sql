/*
  # CRM Client Table Creation and Data Migration

  1. New Tables
    - `crm_client`
      - `id` (uuid, primary key)
      - `sid` (text, foreign key to settings)
      - `account_name` (text)
      - `package` (text)
      - `marketing_plan_url` (text, nullable)
      - `brand_guidelines_url` (text, nullable)
      - `brand_templates_url` (text, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `crm_client` table
    - Add policies for sid-based access control
    - Follows RBAMv3 protocol for client-specific data

  3. Data Migration
    - Combines data from settings and project_2025_orphan tables
    - Only migrates non-null and non-"N" values
*/

-- Create CRM Client table
CREATE TABLE IF NOT EXISTS crm_client (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sid text NOT NULL,
  account_name text NOT NULL,
  package text,
  marketing_plan_url text,
  brand_guidelines_url text,
  brand_templates_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE crm_client ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own client data"
  ON crm_client
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sid_lookup 
      WHERE sid_lookup.sid = crm_client.sid 
      AND sid_lookup.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own client data"
  ON crm_client
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sid_lookup 
      WHERE sid_lookup.sid = crm_client.sid 
      AND sid_lookup.user_id = auth.uid()
    )
  );

-- Migrate existing data
INSERT INTO crm_client (sid, account_name, package, marketing_plan_url, brand_guidelines_url, brand_templates_url)
SELECT 
  s.sid,
  s.account_name,
  s.package,
  NULLIF(NULLIF(p.milestone_6, ''), 'N'),
  NULLIF(NULLIF(p.milestone_10, ''), 'N'),
  NULLIF(NULLIF(p.milestone_11, ''), 'N')
FROM settings s
LEFT JOIN project_2025_orphan p ON s.sid = p.sid;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_crm_client_updated_at
  BEFORE UPDATE ON crm_client
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();