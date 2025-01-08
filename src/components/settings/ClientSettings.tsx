import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useSID } from '../../contexts/SIDContext';
import { logAction, LogLevel } from '../../lib/logger';
import { Settings, Save, AlertCircle } from 'lucide-react';

interface ClientConfig {
  notification_preferences: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  display_preferences: {
    theme: 'light' | 'dark' | 'system';
    language: string;
  };
}

export default function ClientSettings() {
  const { sid, validateSID } = useSID();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<ClientConfig | null>(null);

  useEffect(() => {
    let mounted = true;

    async function validateAndLoad() {
      try {
        if (!sid) {
          navigate('/unauthorized');
          return;
        }

        const isValid = await validateSID(sid);
        if (!isValid) {
          throw new Error('Invalid SID');
        }

        const { data, error: fetchError } = await supabase
          .from('client_settings')
          .select('*')
          .eq('sid', sid)
          .single();

        if (fetchError) throw fetchError;
        
        if (mounted) {
          setConfig(data?.config || {
            notification_preferences: {
              email: true,
              sms: false,
              push: false
            },
            display_preferences: {
              theme: 'system',
              language: 'en'
            }
          });
          setError(null);
        }
      } catch (error) {
        console.error('Error loading settings:', error);
        if (mounted) {
          setError('Failed to load settings');
          await logAction(
            'load_settings_error',
            'client_settings',
            { error: String(error) },
            LogLevel.ERROR,
            { ccp: { sid, contextValid: false } }
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    validateAndLoad();
    return () => { mounted = false; };
  }, [sid, validateSID, navigate]);

  const handleSave = async () => {
    if (!config || !sid) return;

    setSaving(true);
    try {
      const { error: saveError } = await supabase
        .from('client_settings')
        .upsert({ sid, config });

      if (saveError) throw saveError;

      await logAction(
        'save_settings',
        'client_settings',
        { sid },
        LogLevel.INFO,
        { ccp: { sid, contextValid: true } }
      );
    } catch (error) {
      console.error('Error saving settings:', error);
      setError('Failed to save settings');
      await logAction(
        'save_settings_error',
        'client_settings',
        { error: String(error) },
        LogLevel.ERROR,
        { ccp: { sid, contextValid: false } }
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!config) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Settings className="w-6 h-6 text-blue-600 mr-2" />
          <h2 className="text-xl font-semibold text-gray-900">Client Settings</h2>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save Changes
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 rounded-md flex items-center text-red-700">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Preferences</h3>
          <div className="space-y-4">
            {Object.entries(config.notification_preferences).map(([key, value]) => (
              <div key={key} className="flex items-center">
                <input
                  type="checkbox"
                  id={key}
                  checked={value}
                  onChange={(e) => setConfig({
                    ...config,
                    notification_preferences: {
                      ...config.notification_preferences,
                      [key]: e.target.checked
                    }
                  })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor={key} className="ml-2 block text-sm text-gray-900 capitalize">
                  {key} Notifications
                </label>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Display Preferences</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="theme" className="block text-sm font-medium text-gray-700">
                Theme
              </label>
              <select
                id="theme"
                value={config.display_preferences.theme}
                onChange={(e) => setConfig({
                  ...config,
                  display_preferences: {
                    ...config.display_preferences,
                    theme: e.target.value as 'light' | 'dark' | 'system'
                  }
                })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
            </div>

            <div>
              <label htmlFor="language" className="block text-sm font-medium text-gray-700">
                Language
              </label>
              <select
                id="language"
                value={config.display_preferences.language}
                onChange={(e) => setConfig({
                  ...config,
                  display_preferences: {
                    ...config.display_preferences,
                    language: e.target.value
                  }
                })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}