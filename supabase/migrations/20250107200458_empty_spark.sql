/*
  # Campaign Template Data Population

  1. Campaign Templates
    - Organized by campaign type
    - Each campaign has associated tasks
    - Maintains hierarchical structure

  2. Data Organization
    - Lead Generation: Baby, Toddler, Preschool, etc.
    - Themed Info: Curriculum, Extra Curricular, etc.
    - Internal: Parent Feedback, NPS Survey, etc.
    - And so on...
*/

-- Function to get type_id by name
CREATE OR REPLACE FUNCTION get_campaign_type_id(type_name text) 
RETURNS uuid AS $$
  SELECT type_id FROM campaign_types WHERE name = type_name;
$$ LANGUAGE SQL;

-- Lead Generation Campaigns
INSERT INTO campaign_templates (name, description, type_id) VALUES
  ('Baby', 'Lead generation for baby program', get_campaign_type_id('Lead Generation')),
  ('Toddler', 'Lead generation for toddler program', get_campaign_type_id('Lead Generation')),
  ('Preschool', 'Lead generation for preschool program', get_campaign_type_id('Lead Generation')),
  ('Funding', 'Lead generation for funding options', get_campaign_type_id('Lead Generation')),
  ('Theme', 'Themed lead generation campaigns', get_campaign_type_id('Lead Generation')),
  ('Event', 'Event-based lead generation', get_campaign_type_id('Lead Generation')),
  ('General Occupancy', 'General occupancy campaigns', get_campaign_type_id('Lead Generation'));

-- Themed Info Campaigns
INSERT INTO campaign_templates (name, description, type_id) VALUES
  ('Curriculum', 'Curriculum information campaign', get_campaign_type_id('Themed Info')),
  ('Extra Curricular', 'Extra curricular activities information', get_campaign_type_id('Themed Info')),
  ('A Day At Nursery', 'Daily nursery routine information', get_campaign_type_id('Themed Info')),
  ('Settling In', 'Information about settling in process', get_campaign_type_id('Themed Info')),
  ('Starting School Guide', 'Guide for starting school', get_campaign_type_id('Themed Info')),
  ('New Starters', 'Information for new starters', get_campaign_type_id('Themed Info'));

-- Internal Campaigns
INSERT INTO campaign_templates (name, description, type_id) VALUES
  ('Parent Feedback', 'Parent feedback collection campaign', get_campaign_type_id('Internal')),
  ('NPS Survey', 'Net Promoter Score survey campaign', get_campaign_type_id('Internal')),
  ('Existing Parent Support', 'Support campaign for existing parents', get_campaign_type_id('Internal'));

-- Engagement Campaigns
INSERT INTO campaign_templates (name, description, type_id) VALUES
  ('SM Mini Campaign', 'Social media mini engagement campaign', get_campaign_type_id('Engagement')),
  ('Testimonials', 'Testimonial collection campaign', get_campaign_type_id('Engagement')),
  ('Group Posting', 'Group engagement posting campaign', get_campaign_type_id('Engagement')),
  ('Reels Campaign', 'Social media reels campaign', get_campaign_type_id('Engagement'));

-- Reputation Campaigns
INSERT INTO campaign_templates (name, description, type_id) VALUES
  ('Reviews', 'Review collection campaign', get_campaign_type_id('Reputation'));

-- Conversion Campaigns
INSERT INTO campaign_templates (name, description, type_id) VALUES
  ('Flourish EM Workflow', 'Flourish engagement management workflow', get_campaign_type_id('Conversion')),
  ('Flourish Tools', 'Flourish tools implementation', get_campaign_type_id('Conversion')),
  ('Training', 'Conversion training campaign', get_campaign_type_id('Conversion'));

-- Branding & Design Campaigns
INSERT INTO campaign_templates (name, description, type_id) VALUES
  ('Brand Review', 'Brand review and analysis', get_campaign_type_id('Branding & Design')),
  ('Design Templates', 'Design templates creation', get_campaign_type_id('Branding & Design')),
  ('Brochure Design', 'Brochure design campaign', get_campaign_type_id('Branding & Design')),
  ('Leaflet design', 'Leaflet design campaign', get_campaign_type_id('Branding & Design'));