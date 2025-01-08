import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, isAdmin } from '../lib/supabase';
import { LogOut, LayoutDashboard, Users } from 'lucide-react';
import SettingsDashboard from './SettingsDashboard';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [isAdminUser, setIsAdminUser] = useState<boolean>(false);
  const [activeModule, setActiveModule] = useState<string>('welcome');

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/');
      } else {
        setUser(user);
        const adminStatus = await isAdmin();
        setIsAdminUser(adminStatus);
      }
    };
    getUser();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-semibold text-white">CMS Dashboard</h1>
              <div className="hidden md:flex space-x-4">
                <button
                  onClick={() => setActiveModule('welcome')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    activeModule === 'welcome'
                      ? 'bg-blue-500 text-white'
                      : 'text-blue-100 hover:text-white hover:bg-blue-500'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Welcome</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveModule('settings')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    activeModule === 'settings'
                      ? 'bg-blue-500 text-white'
                      : 'text-blue-100 hover:text-white hover:bg-blue-500'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4" />
                    <span>Clients</span>
                  </div>
                </button>
              </div>
            </div>
            <div className="flex items-center">
              <span className="mr-4 text-blue-100">
                {user?.email} ({isAdminUser ? 'Admin' : 'User'})
              </span>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {activeModule === 'welcome' ? (
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-white rounded-xl shadow-sm p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Welcome to your Dashboard
              </h2>
              <p className="text-gray-600">
                You are logged in as: {isAdminUser ? 'Admin' : 'User'}
              </p>
            </div>
          </div>
        ) : (
          <SettingsDashboard />
        )}
      </main>
    </div>
  );
}