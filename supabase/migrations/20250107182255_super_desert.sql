/*
  # Project 2025 Tables

  1. New Tables
    - `client_project_2025`
      - `sid` (text, required)
      - `milestone_id` (integer, required)
      - `status` (text, required)
    - `client_project_2025_notes`
      - `note_id` (integer, primary key)
      - `sid` (text, required)
      - `milestone_id` (integer, required) 
      - `note` (text, required)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their own data
*/

-- Create client_project_2025 table
CREATE TABLE IF NOT EXISTS client_project_2025 (
  sid text NOT NULL,
  milestone_id integer NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (sid, milestone_id)
);

-- Create client_project_2025_notes table
CREATE TABLE IF NOT EXISTS client_project_2025_notes (
  note_id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  sid text NOT NULL,
  milestone_id integer NOT NULL,
  note text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE client_project_2025 ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_project_2025_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for client_project_2025
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

-- RLS Policies for client_project_2025_notes
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

-- Create views to expose global template data
CREATE VIEW project_2025_stages AS
  SELECT * FROM global.project_2025_template_stages;

CREATE VIEW project_2025_milestones AS
  SELECT * FROM global.project_2025_template_milestones;