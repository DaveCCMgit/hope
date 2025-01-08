/*
  # Project 2025 Schema

  1. New Tables
    - project_2025_template_stages
      - stage_id (int, primary key)
      - stage_name (text)
      - display_order (int)
    
    - project_2025_template_milestones
      - milestone_id (int, primary key)
      - stage_id (int, references stages)
      - description (text)
      - display_order (int)
    
    - client_project_2025
      - sid (text)
      - milestone_id (int, references milestones)
      - status (text: pending/in_progress/completed)
      - created_at (timestamptz)
      - updated_at (timestamptz)
      - Primary key (sid, milestone_id)
    
    - client_project_2025_notes
      - note_id (bigint, primary key)
      - sid (text)
      - milestone_id (int)
      - note (text)
      - created_at (timestamptz)

  2. Security
    - Template tables have no RLS (globally readable)
    - Client tables have RLS policies based on sid_lookup
*/

-- Template Tables (No RLS)
CREATE TABLE IF NOT EXISTS project_2025_template_stages (
  stage_id int PRIMARY KEY,
  stage_name text NOT NULL,
  display_order int NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS project_2025_template_milestones (
  milestone_id int PRIMARY KEY,
  stage_id int REFERENCES project_2025_template_stages(stage_id),
  description text NOT NULL,
  display_order int NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Client Tables (With RLS)
CREATE TABLE IF NOT EXISTS client_project_2025 (
  sid text NOT NULL,
  milestone_id int REFERENCES project_2025_template_milestones(milestone_id),
  status text NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (sid, milestone_id)
);

CREATE TABLE IF NOT EXISTS client_project_2025_notes (
  note_id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  sid text NOT NULL,
  milestone_id int REFERENCES project_2025_template_milestones(milestone_id),
  note text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on client tables
ALTER TABLE client_project_2025 ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_project_2025_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own project data"
  ON client_project_2025
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sid_lookup 
      WHERE sid_lookup.sid = client_project_2025.sid 
      AND sid_lookup.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their own project notes"
  ON client_project_2025_notes
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sid_lookup 
      WHERE sid_lookup.sid = client_project_2025_notes.sid 
      AND sid_lookup.user_id = auth.uid()
    )
  );

-- Insert template data
INSERT INTO project_2025_template_stages (stage_id, stage_name, display_order) VALUES
(1, 'Discovery', 10),
(2, 'Planning', 20),
(3, 'Implementation', 30),
(4, 'Review', 40);

INSERT INTO project_2025_template_milestones (milestone_id, stage_id, description, display_order) VALUES
(1, 1, 'Initial consultation completed', 10),
(2, 1, 'Business goals documented', 20),
(3, 1, 'Current marketing audit completed', 30),
(4, 2, 'Strategy outline approved', 10),
(5, 2, 'Resource allocation finalized', 20),
(6, 2, 'Marketing plan created', 30),
(7, 3, 'Campaign setup completed', 10),
(8, 3, 'Content calendar established', 20),
(9, 3, 'Initial campaigns launched', 30),
(10, 3, 'Brand guidelines documented', 40),
(11, 3, 'Brand templates created', 50),
(12, 4, 'Performance metrics reviewed', 10),
(13, 4, 'Strategy adjustments documented', 20),
(14, 4, '2025 roadmap finalized', 30);