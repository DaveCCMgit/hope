import { useState, useEffect } from 'react';
import { X, Plus, Minus } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  sid: string;
  onSuccess: () => void;
}

interface CampaignType {
  type_id: string;
  name: string;
}

interface CampaignTemplate {
  template_id: string;
  name: string;
  type_id: string;
}

interface TaskTemplate {
  task_template_id: string;
  name: string;
  description: string;
}

export default function CreateCampaignModal({ isOpen, onClose, sid, onSuccess }: Props) {
  const [types, setTypes] = useState<CampaignType[]>([]);
  const [templates, setTemplates] = useState<CampaignTemplate[]>([]);
  const [tasks, setTasks] = useState<TaskTemplate[]>([]);
  const [selectedType, setSelectedType] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);

  useEffect(() => {
    fetchCampaignTypes();
  }, []);

  useEffect(() => {
    if (selectedType) {
      fetchTemplates(selectedType);
    }
  }, [selectedType]);

  useEffect(() => {
    if (selectedTemplate) {
      fetchTasks(selectedTemplate);
    }
  }, [selectedTemplate]);

  async function fetchCampaignTypes() {
    const { data } = await supabase
      .from('campaign_types')
      .select('type_id, name')
      .order('name');
    setTypes(data || []);
  }

  async function fetchTemplates(typeId: string) {
    const { data } = await supabase
      .from('campaign_templates')
      .select('template_id, name, type_id')
      .eq('type_id', typeId)
      .order('name');
    setTemplates(data || []);
    setSelectedTemplate('');
    setSelectedTasks([]);
  }

  async function fetchTasks(templateId: string) {
    const { data } = await supabase
      .from('campaign_task_templates')
      .select('task_template_id, name, description')
      .eq('template_id', templateId)
      .order('display_order');
    setTasks(data || []);
    setSelectedTasks([]);
  }

  async function handleSubmit() {
    try {
      // Create campaign
      const { data: campaign, error: campaignError } = await supabase
        .from('client_campaigns')
        .insert([{
          sid,
          template_id: selectedTemplate,
          status: 'draft'
        }])
        .select()
        .single();

      if (campaignError) throw campaignError;

      // Create selected tasks
      if (selectedTasks.length > 0) {
        const taskInserts = selectedTasks.map(taskTemplateId => ({
          campaign_id: campaign.campaign_id,
          task_template_id: taskTemplateId,
          status: 'pending'
        }));

        const { error: tasksError } = await supabase
          .from('client_campaign_tasks')
          .insert(taskInserts);

        if (tasksError) throw tasksError;
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating campaign:', error);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />

        <div className="relative inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium text-gray-900">Create New Campaign</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Campaign Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Campaign Type</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Select a type</option>
                {types.map((type) => (
                  <option key={type.type_id} value={type.type_id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Campaign Template Selection */}
            {selectedType && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Campaign</label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Select a campaign</option>
                  {templates.map((template) => (
                    <option key={template.template_id} value={template.template_id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Task Selection */}
            {selectedTemplate && tasks.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tasks</label>
                <div className="space-y-2">
                  {tasks.map((task) => (
                    <div key={task.task_template_id} className="flex items-center">
                      <input
                        type="checkbox"
                        id={task.task_template_id}
                        checked={selectedTasks.includes(task.task_template_id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTasks([...selectedTasks, task.task_template_id]);
                          } else {
                            setSelectedTasks(selectedTasks.filter(id => id !== task.task_template_id));
                          }
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor={task.task_template_id} className="ml-2 block text-sm text-gray-900">
                        {task.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!selectedTemplate || selectedTasks.length === 0}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Campaign
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}