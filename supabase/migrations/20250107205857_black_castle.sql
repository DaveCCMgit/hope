/*
  # Fix access log schema

  1. Changes
    - Add new columns to access_log table for enhanced logging
      - validation_attempts (integer)
      - recovery_attempted (boolean)
  
  2. Security
    - Maintains existing RLS policies
*/

-- Add new columns to access_log table
ALTER TABLE access_log 
ADD COLUMN IF NOT EXISTS validation_attempts integer,
ADD COLUMN IF NOT EXISTS recovery_attempted boolean DEFAULT false;