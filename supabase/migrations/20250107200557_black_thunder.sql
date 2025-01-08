/*
  # Add Standard Campaign Tasks and Subtasks

  1. New Tasks
    - Content Review
    - Branding templates review
    - Funnel page
    - Blogs
    - Social Media posts
    - Paid Ads

  2. Each task will have relevant subtasks
*/

-- Insert standard tasks for all campaign templates
DO $$
DECLARE
    template_record RECORD;
    task_id uuid;
    display_order integer := 10;
BEGIN
    FOR template_record IN SELECT template_id FROM campaign_templates LOOP
        -- Content Review
        INSERT INTO campaign_task_templates (template_id, name, description, display_order)
        VALUES (template_record.template_id, 'Content Review', 'Review and prepare campaign content', display_order)
        RETURNING task_template_id INTO task_id;
        
        -- Branding templates review
        INSERT INTO campaign_task_templates (template_id, name, description, display_order)
        VALUES (template_record.template_id, 'Branding templates review', 'Review and ensure brand consistency', display_order + 10);

        -- Funnel page
        INSERT INTO campaign_task_templates (template_id, name, description, display_order)
        VALUES (template_record.template_id, 'Funnel page', 'Set up and optimize funnel pages', display_order + 20);

        -- Blogs
        INSERT INTO campaign_task_templates (template_id, name, description, display_order)
        VALUES (template_record.template_id, 'Blogs', 'Create and publish blog content', display_order + 30);

        -- Social Media posts
        INSERT INTO campaign_task_templates (template_id, name, description, display_order)
        VALUES (template_record.template_id, 'Social Media posts', 'Create and schedule social media content', display_order + 40);

        -- Paid Ads
        INSERT INTO campaign_task_templates (template_id, name, description, display_order)
        VALUES (template_record.template_id, 'Paid Ads', 'Set up and manage paid advertising', display_order + 50);
    END LOOP;
END $$;

-- Add standard subtasks for each task type
DO $$
DECLARE
    task_record RECORD;
    display_order integer := 10;
BEGIN
    FOR task_record IN SELECT task_template_id, name FROM campaign_task_templates LOOP
        CASE task_record.name
            WHEN 'Content Review' THEN
                INSERT INTO campaign_subtask_templates (task_template_id, name, description, display_order) VALUES
                    (task_record.task_template_id, 'Initial content audit', 'Review existing content', display_order),
                    (task_record.task_template_id, 'Content planning', 'Plan new content creation', display_order + 10),
                    (task_record.task_template_id, 'Quality check', 'Final content quality review', display_order + 20);

            WHEN 'Branding templates review' THEN
                INSERT INTO campaign_subtask_templates (task_template_id, name, description, display_order) VALUES
                    (task_record.task_template_id, 'Brand guidelines check', 'Review against brand guidelines', display_order),
                    (task_record.task_template_id, 'Template updates', 'Update templates as needed', display_order + 10),
                    (task_record.task_template_id, 'Final approval', 'Get final brand approval', display_order + 20);

            WHEN 'Funnel page' THEN
                INSERT INTO campaign_subtask_templates (task_template_id, name, description, display_order) VALUES
                    (task_record.task_template_id, 'Page setup', 'Initial funnel page setup', display_order),
                    (task_record.task_template_id, 'Content population', 'Add content to funnel pages', display_order + 10),
                    (task_record.task_template_id, 'Testing', 'Test funnel functionality', display_order + 20);

            WHEN 'Blogs' THEN
                INSERT INTO campaign_subtask_templates (task_template_id, name, description, display_order) VALUES
                    (task_record.task_template_id, 'Topic research', 'Research blog topics', display_order),
                    (task_record.task_template_id, 'Content writing', 'Write blog content', display_order + 10),
                    (task_record.task_template_id, 'SEO optimization', 'Optimize for search engines', display_order + 20);

            WHEN 'Social Media posts' THEN
                INSERT INTO campaign_subtask_templates (task_template_id, name, description, display_order) VALUES
                    (task_record.task_template_id, 'Content calendar', 'Create posting schedule', display_order),
                    (task_record.task_template_id, 'Asset creation', 'Create social media assets', display_order + 10),
                    (task_record.task_template_id, 'Scheduling', 'Schedule posts', display_order + 20);

            WHEN 'Paid Ads' THEN
                INSERT INTO campaign_subtask_templates (task_template_id, name, description, display_order) VALUES
                    (task_record.task_template_id, 'Ad strategy', 'Define advertising strategy', display_order),
                    (task_record.task_template_id, 'Campaign setup', 'Set up ad campaigns', display_order + 10),
                    (task_record.task_template_id, 'Performance monitoring', 'Monitor ad performance', display_order + 20);
        END CASE;
    END LOOP;
END $$;