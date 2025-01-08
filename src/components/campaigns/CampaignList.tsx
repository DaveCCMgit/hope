import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { PlusCircle, Calendar, CheckCircle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSID } from '../../contexts/SIDContext';

interface Campaign {
  campaign_id: string;
  template_id: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  created_at: string;
  template: {
    name: string;
    description: string;
    type: {
      name: string;
    }
  }
}

export default function CampaignList() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { sid } = useSID();

  useEffect(() => {
    fetchCampaigns();
  }, [sid]);

  async function fetchCampaigns() {
    try {
      const { data, error } = await supabase
        .from('client_campaigns')
        .select(`
          *,
          template:campaign_templates(
            name,
            description,
            type:campaign_types(name)
          )
        `)
        .eq('sid', sid)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(false);
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'active':
        return <Clock className="w-5 h-5 text-blue-500" />;
      default:
        return <Calendar className="w-5 h-5 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Campaigns</h2>
        <button
          onClick={() => navigate(`/client/${sid}/campaigns/new`)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          New Campaign
        </button>
      </div>

      <div className="overflow-hidden">
        <div className="grid grid-cols-1 gap-4">
          {campaigns.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No campaigns</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating a new campaign.</p>
            </div>
          ) : (
            campaigns.map((campaign) => (
              <div
                key={campaign.campaign_id}
                onClick={() => navigate(`/client/${sid}/campaigns/${campaign.campaign_id}`)}
                className="relative rounded-lg border border-gray-200 bg-white px-6 py-5 shadow-sm hover:shadow-md flex items-center space-x-3 cursor-pointer"
              >
                <div className="flex-shrink-0">
                  {getStatusIcon(campaign.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {campaign.template.name}
                    </p>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {campaign.template.type.name}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 truncate">{campaign.template.description}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}