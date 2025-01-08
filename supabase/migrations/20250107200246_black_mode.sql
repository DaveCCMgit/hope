/*
  # Campaign Structure Implementation

  1. New Template Tables
    - campaign_templates (campaign definitions)
    - campaign_task_templates (task definitions)
    - campaign_subtask_templates (subtask definitions)
    - campaign_types (lookup table for types)

  2. Client Tables
    - client_campaigns (client-specific campaigns)
    - client_campaign_tasks (client-specific tasks)
    - client_campaign_subtasks (client-specific subtasks)

  3. Security
    - Template tables: No RLS (public access)
    - Client tables: RLS enabled with sid-based policies
*/

-- Campaign Types Lookup
CREATE TABLE IF NOT EXISTS campaign_types (
  type_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Template Tables (No RLS)
CREATE TABLE IF NOT EXISTS campaign_templates (
  template_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  type_id uuid REFERENCES campaign_types(type_id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS campaign_task_templates (
  task_template_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES campaign_templates(template_id),
  name text NOT NULL,
  description text,
  display_order integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS campaign_subtask_templates (
  subtask_template_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_template_id uuid REFERENCES campaign_task_templates(task_template_id),
  name text NOT NULL,
  description text,
  display_order integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Client Tables (With RLS)
CREATE TABLE IF NOT EXISTS client_campaigns (
  campaign_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sid text NOT NULL,
  template_id uuid REFERENCES campaign_templates(template_id),
  status text NOT NULL CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS client_campaign_tasks (
  task_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES client_campaigns(campaign_id),
  task_template_id uuid REFERENCES campaign_task_templates(task_template_id),
  status text NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS client_campaign_subtasks (
  subtask_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES client_campaign_tasks(task_id),
  subtask_template_id uuid REFERENCES campaign_subtask_templates(subtask_template_id),
  status text NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on client tables
ALTER TABLE client_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_campaign_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_campaign_subtasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own campaigns"
  ON client_campaigns
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sid_lookup 
      WHERE sid_lookup.sid = client_campaigns.sid 
      AND sid_lookup.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their own campaign tasks"
  ON client_campaign_tasks
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM client_campaigns
      WHERE client_campaigns.campaign_id = client_campaign_tasks.campaign_id
      AND EXISTS (
        SELECT 1 FROM sid_lookup
        WHERE sid_lookup.sid = client_campaigns.sid
        AND sid_lookup.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage their own campaign subtasks"
  ON client_campaign_subtasks
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM client_campaign_tasks
      JOIN client_campaigns ON client_campaigns.campaign_id = client_campaign_tasks.campaign_id
      WHERE client_campaign_tasks.task_id = client_campaign_subtasks.task_id
      AND EXISTS (
        SELECT 1 FROM sid_lookup
        WHERE sid_lookup.sid = client_campaigns.sid
        AND sid_lookup.user_id = auth.uid()
      )
    )
  );

-- Insert campaign types
INSERT INTO campaign_types (name, description) VALUES
  ('Lead Generation', 'Campaigns focused on generating new leads'),
  ('Themed Info', 'Information-based themed campaigns'),
  ('Internal', 'Internal company campaigns'),
  ('Engagement', 'Customer engagement campaigns'),
  ('Reputation', 'Brand reputation management campaigns'),
  ('Conversion', 'Sales conversion focused campaigns'),
  ('Branding & Design', 'Brand development and design campaigns');