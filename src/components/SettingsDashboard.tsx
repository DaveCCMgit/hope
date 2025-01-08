import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { logAction, LogLevel } from '../lib/logger';
import { PlusCircle, Edit } from 'lucide-react';

interface Setting {
  id: string;
  sid: string;
  account_name: string; // Updated field
  package: string;
  status: string;
}

export default function SettingsDashboard() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      await logAction(
        'fetch_settings',
        'settings',
        null,
        LogLevel.INFO,
        {
          rbam: {
            authStatus: true,
          },
        }
      );

      const { data, error } = await supabase
        .from('settings')
        .select('id, sid, account_name, package, status') // Explicitly select columns
        .order('sid');

      if (error) throw error;
      setSettings(data || []);
    } catch (error) {
      console.error('Error fetching settings:', error);
      await logAction(
        'fetch_settings_error',
        'settings',
        { error: String(error) },
        LogLevel.ERROR
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleRowClick(setting: Setting) {
    try {
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
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
                      Account Name {/* Updated header */}
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
                        {setting.account_name} {/* Updated field */}
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
