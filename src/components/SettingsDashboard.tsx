import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { logAction, LogLevel } from '../lib/logger';
import { PlusCircle, Edit } from 'lucide-react';

interface Setting {
  id: string;
  sid: string;
  account_name: string;
  package: string;
  status: string;
}

export default function SettingsDashboard() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    
    async function fetchSettings() {
      try {
        // First verify user authentication
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('User not authenticated');
        }

        // Log the fetch attempt
        await logAction(
          'fetch_settings',
          'settings',
          null,
          LogLevel.INFO,
          {
            rbam: { authStatus: true },
            ccp: { contextValid: true }
          }
        );

        // Fetch settings with proper RLS policies
        const { data, error: fetchError } = await supabase
          .from('settings')
          .select('id, sid, account_name, package, status')
          .order('account_name');

        if (fetchError) throw fetchError;
        
        if (isMounted) {
          setSettings(data || []);
          setError(null);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
        if (isMounted) {
          setError('Failed to load settings');
          setLoading(false);
        }
        
        await logAction(
          'fetch_settings_error',
          'settings',
          { error: String(error) },
          LogLevel.ERROR,
          {
            rbam: { authStatus: false },
            ccp: { contextValid: false }
          }
        );
      }
    }

    fetchSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleRowClick(setting: Setting) {
    try {
      // Verify access before navigation
      const { data: lookupData, error: lookupError } = await supabase
        .from('sid_lookup')
        .select('sid')
        .eq('sid', setting.sid)
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (lookupError || !lookupData) {
        throw new Error('Access denied');
      }

      await logAction(
        'select_setting',
        'settings',
        { sid: setting.sid },
        LogLevel.INFO,
        {
          ccp: {
            sid: setting.sid,
            contextValid: true,
          },
        }
      );

      navigate(`/client/${setting.sid}`);
    } catch (error) {
      console.error('Error selecting setting:', error);
      setError('Access denied');
      
      await logAction(
        'select_setting_error',
        'settings',
        { sid: setting.sid, error: String(error) },
        LogLevel.ERROR,
        {
          ccp: {
            sid: setting.sid,
            contextValid: false,
          },
        }
      );
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-6">
        <p className="text-red-600">{error}</p>
        <button
          onClick={() => {
            setLoading(true);
            setError(null);
            fetchSettings();
          }}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all settings in your account
          </p>
        </div>
      </div>
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      SID
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Account Name
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Package
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {settings.map((setting) => (
                    <tr
                      key={setting.sid}
                      onClick={() => handleRowClick(setting)}
                      className="cursor-pointer hover:bg-gray-50"
                    >
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                        {setting.sid}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {setting.account_name}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {setting.package}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            setting.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {setting.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}