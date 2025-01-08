import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { logAction, LogLevel } from '../lib/logger';
import { ArrowLeft, Building2, Package, Hash, ArrowRight, Link } from 'lucide-react';
import { useSID } from '../contexts/SIDContext';

interface Setting {
  id: string;
  sid: string;
  account_name: string;
  package: string;
  status: string;
}

interface CRMClient {
  id: string;
  sid: string;
  account_name: string;
  package: string;
  marketing_plan_url: string | null;
  brand_guidelines_url: string | null;
  brand_templates_url: string | null;
}

export default function ClientDashboard() {
  const { sid: urlSid } = useParams();
  const { sid, setSID } = useSID();
  const navigate = useNavigate();
  const [setting, setSetting] = useState<Setting | null>(null);
  const [crmClient, setCrmClient] = useState<CRMClient | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedPackage, setEditedPackage] = useState('');

  useEffect(() => {
    if (!urlSid) {
      navigate('/unauthorized');
      return;
    }

    async function validateAccess() {
      try {
        const { data: lookupData, error: lookupError } = await supabase
          .from('sid_lookup')
          .select('sid')
          .eq('sid', urlSid)
          .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

        if (lookupError || !lookupData?.length) {
          await logAction('sid_access_denied', 'settings', 
            { sid: urlSid }, 
            LogLevel.WARN,
            { rbam: { sidLookup: false } }
          );
          navigate('/unauthorized');
          return;
        }

        const [settingResult, crmResult] = await Promise.all([
          supabase
            .from('settings')
            .select('*')
            .eq('sid', urlSid)
            .single(),
          supabase
            .from('crm_client')
            .select('*')
            .eq('sid', urlSid)
            .single()
        ]);

        if (settingResult.error || !settingResult.data) {
          await logAction('setting_not_found', 'settings',
            { sid: urlSid },
            LogLevel.ERROR
          );
          navigate('/unauthorized');
          return;
        }

        if (urlSid !== sid) {
          await logAction('sid_context_change', 'settings', 
            { previous_sid: sid, new_sid: urlSid },
            LogLevel.INFO,
            { 
              rbam: { sidLookup: true },
              ccp: { sid: urlSid, contextValid: true }
            }
          );
          setSID(urlSid);
        }

        setSetting(settingResult.data);
        setCrmClient(crmResult.data);
        setEditedPackage(settingResult.data.package);
      } catch (error) {
        console.error('Error validating access:', error);
        await logAction('access_validation_error', 'settings',
          { sid: urlSid, error: String(error) },
          LogLevel.ERROR
        );
        navigate('/unauthorized');
      } finally {
        setLoading(false);
      }
    }

    validateAccess();
  }, [urlSid, sid, setSID, navigate]);

  const handleBack = async () => {
    try {
      await logAction('navigate_back', 'settings', 
        { from_sid: sid },
        LogLevel.INFO
      );
      setSID('');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error navigating back:', error);
      await logAction('navigate_back_error', 'settings',
        { from_sid: sid, error: String(error) },
        LogLevel.ERROR
      );
    }
  };

  const handlePackageUpdate = async () => {
    try {
      const [settingsUpdate, crmUpdate] = await Promise.all([
        supabase
          .from('settings')
          .update({ package: editedPackage })
          .eq('sid', setting?.sid),
        supabase
          .from('crm_client')
          .update({ package: editedPackage })
          .eq('sid', setting?.sid)
      ]);

      if (settingsUpdate.error) throw settingsUpdate.error;
      if (crmUpdate.error) throw crmUpdate.error;

      setSetting(prev => prev ? { ...prev, package: editedPackage } : null);
      setCrmClient(prev => prev ? { ...prev, package: editedPackage } : null);
      setIsEditing(false);

      await logAction('update_package', 'settings',
        { 
          sid: setting?.sid,
          old_package: setting?.package,
          new_package: editedPackage
        },
        LogLevel.INFO
      );
    } catch (error) {
      console.error('Error updating package:', error);
      await logAction('update_package_error', 'settings',
        { 
          sid: setting?.sid,
          error: String(error)
        },
        LogLevel.ERROR
      );
    }
  };

  const handleEnterProject2025 = async () => {
    try {
      await logAction('enter_project_2025', 'settings',
        { sid: setting?.sid },
        LogLevel.INFO,
        {
          ccp: { sid: setting?.sid, contextValid: true }
        }
      );
      navigate(`/client/${setting?.sid}/project-2025`);
    } catch (error) {
      console.error('Error navigating to Project 2025:', error);
      await logAction('enter_project_2025_error', 'settings',
        { sid: setting?.sid, error: String(error) },
        LogLevel.ERROR
      );
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

  if (!setting) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-white mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {setting.account_name}
                </h1>
                <p className="text-sm text-blue-100">SID: {setting.sid}</p>
              </div>
            </div>
            <button
              onClick={handleBack}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Account Details Container */}
          <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Account Details</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Account Name</label>
                <p className="mt-1 text-gray-900">{setting.account_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">SID</label>
                <p className="mt-1 text-gray-900">{setting.sid}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Package</label>
                {isEditing ? (
                  <div className="flex items-center space-x-2 mt-1">
                    <select
                      value={editedPackage}
                      onChange={(e) => setEditedPackage(e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                      <option value="Marketing Partner">Marketing Partner</option>
                      <option value="Marketing Essentials">Marketing Essentials</option>
                      <option value="Conversion Essentials">Conversion Essentials</option>
                      <option value="Legacy">Legacy</option>
                    </select>
                    <button
                      onClick={handlePackageUpdate}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setEditedPackage(setting.package);
                      }}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-gray-900">{setting.package}</p>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>
              {crmClient && (
                <>
                  {crmClient.marketing_plan_url && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Marketing Plan</label>
                      <a
                        href={crmClient.marketing_plan_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 flex items-center text-blue-600 hover:text-blue-800"
                      >
                        <Link className="w-4 h-4 mr-1" />
                        View Marketing Plan
                      </a>
                    </div>
                  )}
                  {crmClient.brand_guidelines_url && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Brand Guidelines</label>
                      <a
                        href={crmClient.brand_guidelines_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 flex items-center text-blue-600 hover:text-blue-800"
                      >
                        <Link className="w-4 h-4 mr-1" />
                        View Brand Guidelines
                      </a>
                    </div>
                  )}
                  {crmClient.brand_templates_url && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Brand Templates</label>
                      <a
                        href={crmClient.brand_templates_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 flex items-center text-blue-600 hover:text-blue-800"
                      >
                        <Link className="w-4 h-4 mr-1" />
                        View Brand Templates
                      </a>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Project 2025 Container */}
          <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Project 2025</h3>
            <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-gray-300 rounded-lg">
              <p className="text-gray-500 mb-4">View your Project 2025 progress</p>
              <button
                onClick={handleEnterProject2025}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Enter
                <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}