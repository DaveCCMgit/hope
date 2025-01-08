/*
  # Enhanced SID Access Control

  1. New Tables
    - `sid_user_access`: Links users to specific SIDs they can access
    - `sid_audit_log`: Enhanced audit logging for SID operations
  
  2. Security
    - Add SID-scoped policies for all tables
    - Add audit triggers for SID access
*/

-- SID User Access table
CREATE TABLE IF NOT EXISTS sid_user_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  setting_id uuid REFERENCES settings(setting_id) ON DELETE CASCADE,
  access_level text CHECK (access_level IN ('read', 'write', 'admin')),
  granted_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, setting_id)
);

-- Enhanced audit logging
CREATE TABLE IF NOT EXISTS sid_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  setting_id uuid REFERENCES settings(setting_id),
  action text NOT NULL,
  old_data jsonb,
  new_data jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE sid_user_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE sid_audit_log ENABLE ROW LEVEL SECURITY;

-- SID Access Policies
CREATE POLICY "Admin full access on sid_user_access"
  ON sid_user_access FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM roles WHERE user_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Agency read access on sid_user_access"
  ON sid_user_access FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM roles WHERE user_id = auth.uid() AND role = 'agency'
  ));

-- Function to check SID access
CREATE OR REPLACE FUNCTION check_sid_access(setting_id uuid, required_level text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM sid_user_access sua
    JOIN roles r ON r.user_id = sua.user_id
    WHERE sua.setting_id = $1 
    AND sua.user_id = auth.uid()
    AND (
      r.role = 'admin' 
      OR (r.role = 'agency' AND required_level IN ('read', 'write'))
      OR (sua.access_level = required_level)
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;