import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useSID } from '../../contexts/SIDContext';
import { ArrowLeft, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface Campaign {
  campaign_id: string;
  template_id: string;
  status: string;
  template: {
    name: string;
    description: string;
    type: {
      name: string;
    }
  }
}

interface Task {
  task_id: string;
  status: string;
  template: {
    name: string;
    description: string;
  }
  subtasks: Subtask[];
}

interface Subtask {
  subtask_id: string;
  status: string;
  template: {
    name: string;
    description: string;
  }
}

export default function CampaignDetail() {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { campaignId } = useParams();
  const navigate = useNavigate();
  const { sid } = useSID();

  useEffect(() => {
    fetchCampaignDetails();
  }, [campaignId]);

  async function fetchCampaignDetails() {
    try {
      const [campaignResult, tasksResult] = await Promise.all([
        supabase
          .from('client_campaigns')
          .select(`
            *,
            template:campaign_templates(
              name,
              description,
              type:campaign_types(name)
            )
          `)
          .eq('campaign_id', campaignId)
          .single(),
        supabase
          .from('client_campaign_tasks')
          .select(`
            *,
            template:campaign_task_templates(name, description),
            subtasks:client_campaign_subtasks(
              *,
              template:campaign_subtask_templates(name, description)
            )
          `)
          .eq('campaign_id', campaignId)
          .order('created_at')
      ]);

      if (campaignResult.error) throw campaignResult.error;
      if (tasksResult.error) throw tasksResult.error;

      setCampaign(campaignResult.data);
      setTasks(tasksResult.data || []);
    } catch (error) {
      console.error('Error fetching campaign details:', error);
    } finally {
      setLoading(false);
    }
  }

  async function updateTaskStatus(taskId: string, status: string) {
    try {
      const { error } = await supabase
        .from('client_campaign_tasks')
        .update({ status })
        .eq('task_id', taskId);

      if (error) throw error;
      await fetchCampaignDetails();
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  }

  async function updateSubtaskStatus(subtaskId: string, status: string) {
    try {
      const { error } = await supabase
        .from('client_campaign_subtasks')
        .update({ status })
        .eq('subtask_id', subtaskId);

      if (error) throw error;
      await fetchCampaignDetails();
    } catch (error) {
      console.error('Error updating subtask status:', error);
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'in_progress':
        return <Clock className="w-5 h-5 text-blue-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!campaign) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate(`/client/${sid}/campaigns`)}
          className="mr-4 text-gray-400 hover:text-gray-500"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{campaign.template.name}</h2>
          <p className="text-sm text-gray-500">{campaign.template.description}</p>
        </div>
      </div>

      <div className="space-y-6">
        {tasks.map((task) => (
          <div key={task.task_id} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                {getStatusIcon(task.status)}
                <h3 className="text-lg font-medium text-gray-900">{task.template.name}</h3>
              </div>
              <select
                value={task.status}
                onChange={(e) => updateTaskStatus(task.task_id, e.target.value)}
                className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            {task.subtasks && task.subtasks.length > 0 && (
              <div className="ml-8 space-y-3">
                {task.subtasks.map((subtask) => (
                  <div key={subtask.subtask_id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(subtask.status)}
                      <span className="text-sm text-gray-700">{subtask.template.name}</span>
                    </div>
                    <select
                      value={subtask.status}
                      onChange={(e) => updateSubtaskStatus(subtask.subtask_id, e.target.value)}
                      className="text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}