import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useSID } from '../../contexts/SIDContext';
import { ArrowLeft } from 'lucide-react';

interface CampaignType {
  type_id: string;
  name: string;
  description: string;
}

interface CampaignTemplate {
  template_id: string;
  name: string;
  description: string;
  type_id: string;
}

export default function CampaignCreate() {
  const [types, setTypes] = useState<CampaignType[]>([]);
  const [templates, setTemplates] = useState<CampaignTemplate[]>([]);
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { sid } = useSID();

  useEffect(() => {
    fetchCampaignTypes();
  }, []);

  useEffect(() => {
    if (selectedType) {
      fetchTemplates(selectedType);
    }
  }, [selectedType]);

  async function fetchCampaignTypes() {
    try {
      const { data, error } = await supabase
        .from('campaign_types')
        .select('*')
        .order('name');

      if (error) throw error;
      setTypes(data || []);
    } catch (error) {
      console.error('Error fetching campaign types:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchTemplates(typeId: string) {
    try {
      const { data, error } = await supabase
        .from('campaign_templates')
        .select('*')
        .eq('type_id', typeId)
        .order('name');

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  }

  async function handleCreate() {
    if (!selectedTemplate) return;

    try {
      const { data, error } = await supabase
        .from('client_campaigns')
        .insert([
          {
            sid,
            template_id: selectedTemplate,
            status: 'draft'
          }
        ])
        .select()
        .single();

      if (error) throw error;

      // Create tasks from template
      const { data: templateTasks } = await supabase
        .from('campaign_task_templates')
        .select('*')
        .eq('template_id', selectedTemplate);

      if (templateTasks) {
        const taskInserts = templateTasks.map(task => ({
          campaign_id: data.campaign_id,
          task_template_id: task.task_template_id,
          status: 'pending'
        }));

        await supabase
          .from('client_campaign_tasks')
          .insert(taskInserts);
      }

      navigate(`/client/${sid}/campaigns/${data.campaign_id}`);
    } catch (error) {
      console.error('Error creating campaign:', error);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate(`/client/${sid}/campaigns`)}
          className="mr-4 text-gray-400 hover:text-gray-500"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-semibold text-gray-900">Create New Campaign</h2>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Campaign Type</label>
          <select
            value={selectedType}
            onChange={(e) => {
              setSelectedType(e.target.value);
              setSelectedTemplate('');
            }}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Select a campaign type</option>
            {types.map((type) => (
              <option key={type.type_id} value={type.type_id}>
                {type.name}
              </option>
            ))}
          </select>
        </div>

        {selectedType && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Campaign Template</label>
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Select a template</option>
              {templates.map((template) => (
                <option key={template.template_id} value={template.template_id}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={handleCreate}
            disabled={!selectedTemplate}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Campaign
          </button>
        </div>
      </div>
    </div>
  );
}