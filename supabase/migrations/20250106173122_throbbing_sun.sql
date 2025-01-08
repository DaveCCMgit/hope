/*
  # Create roles table and policies

  1. New Tables
    - `roles`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `role` (varchar, role type)
      - `assigned_at` (timestamp)

  2. Security
    - Enable RLS on `roles` table
    - Add policies for:
      - Authenticated users can read their own role
      - Only admin users can manage roles
*/

CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role varchar NOT NULL CHECK (role IN ('admin', 'agency', 'client')),
  assigned_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own role
CREATE POLICY "Users can read own role"
  ON roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow admins to manage all roles
CREATE POLICY "Admins can manage roles"
  ON roles
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );