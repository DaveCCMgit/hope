import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useSID } from '../contexts/SIDContext';
import { logAction, LogLevel } from '../lib/logger';
import MilestoneModal from './MilestoneModal';

interface Stage {
  stage_id: number;
  stage_name: string;
}

interface Milestone {
  milestone_id: number;
  stage_id: number;
  description: string;
}

interface Note {
  note_id: number;
  note: string;
  created_at: string;
}

type MilestoneStatus = 'complete' | 'in_progress' | 'incomplete';

export default function Project2025() {
  const navigate = useNavigate();
  const { sid } = useSID();
  const [stages, setStages] = useState<Stage[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [milestoneStatuses, setMilestoneStatuses] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch stages and milestones from template tables
        const [stagesResult, milestonesResult, statusesResult] = await Promise.all([
          supabase.from('project_2025_stages').select('*'),
          supabase.from('project_2025_milestones').select('*'),
          supabase.from('project_2025_orphan').select('*').eq('sid', sid)
        ]);

        if (stagesResult.error) throw stagesResult.error;
        if (milestonesResult.error) throw milestonesResult.error;

        setStages(stagesResult.data || []);
        setMilestones(milestonesResult.data || []);

        // Process milestone statuses
        if (statusesResult.data?.[0]) {
          const statusMap: Record<number, string> = {};
          const orphanData = statusesResult.data[0];

          // Process Y/N milestones
          [1,2,3,4,5,7,8,9].forEach(id => {
            statusMap[id] = orphanData[`milestone_${id}`] === 'Y' ? 'complete' : 'incomplete';
          });

          // Process NULL/NOT NULL milestones
          [6,10,11,20,21].forEach(id => {
            const value = orphanData[`milestone_${id}`];
            statusMap[id] = value ? 'complete' : 'incomplete';
            
            if (value) {
              // Add note if value exists
              supabase.from('project_2025_notes').insert({
                sid,
                milestone_id: id,
                note: value
              }).then(({ error }) => {
                if (error) console.error('Error saving note:', error);
              });
            }
          });

          // Process meeting status (milestone 19)
          const meetingStatus = orphanData.milestone_19;
          statusMap[19] = meetingStatus === 'Had Meeting' || meetingStatus === 'Not Required' 
            ? 'complete' 
            : meetingStatus === 'Meeting Booked' || meetingStatus === 'Trying to Arrange'
              ? 'in_progress'
              : 'incomplete';

          // Process special dropdowns (milestones 8 and 9)
          [8,9].forEach(id => {
            const value = orphanData[`milestone_${id}`];
            statusMap[id] = value === 'Yes - Active' || value === 'Yes - Not Active'
              ? 'complete'
              : 'incomplete';
          });

          setMilestoneStatuses(statusMap);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        await logAction('fetch_project_2025_error', 'project_2025',
          { error: String(error) },
          LogLevel.ERROR
        );
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [sid]);

  const getMilestoneStatus = (milestoneId: number): MilestoneStatus => {
    return (milestoneStatuses[milestoneId] || 'incomplete') as MilestoneStatus;
  };

  const getStatusIcon = (status: MilestoneStatus) => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'in_progress':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const handleMilestoneClick = async (milestone: Milestone) => {
    setSelectedMilestone(milestone);
    try {
      const { data, error } = await supabase
        .from('project_2025_notes')
        .select('*')
        .eq('sid', sid)
        .eq('milestone_id', milestone.milestone_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  };

  const handleAddNote = async (note: string) => {
    if (!selectedMilestone) return;

    try {
      const { data, error } = await supabase
        .from('project_2025_notes')
        .insert({
          sid,
          milestone_id: selectedMilestone.milestone_id,
          note
        })
        .select()
        .single();

      if (error) throw error;
      setNotes([data, ...notes]);
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-2xl font-bold text-white">Project 2025</h1>
            <button
              onClick={() => navigate(`/client/${sid}`)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-4 gap-6">
          {stages.map((stage) => {
            const stageMilestones = milestones.filter(
              (milestone) => milestone.stage_id === stage.stage_id
            );
            const completedCount = stageMilestones.filter(
              (milestone) => getMilestoneStatus(milestone.milestone_id) === 'complete'
            ).length;

            return (
              <div key={stage.stage_id} className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex justify-between items-center mb-6 pb-4 border-b">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {stage.stage_name}
                  </h2>
                  <span className="text-sm font-medium text-gray-500">
                    {completedCount}/{stageMilestones.length}
                  </span>
                </div>
                <div className="space-y-4">
                  {stageMilestones.map((milestone) => {
                    const status = getMilestoneStatus(milestone.milestone_id);
                    return (
                      <div
                        key={milestone.milestone_id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => handleMilestoneClick(milestone)}
                      >
                        <div className="flex items-start space-x-3">
                          {getStatusIcon(status)}
                          <p className="text-sm text-gray-600">{milestone.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <MilestoneModal
        isOpen={!!selectedMilestone}
        onClose={() => setSelectedMilestone(null)}
        milestone={selectedMilestone}
        notes={notes}
        onAddNote={handleAddNote}
      />
    </div>
  );
}