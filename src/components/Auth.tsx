import { useEffect, useState } from 'react';
import { Auth as SupabaseAuth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Building2, Lock } from 'lucide-react';

export default function Auth() {
  const [isAgencyLogin, setIsAgencyLogin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate('/dashboard');
      }
    });
  }, [navigate]);

  const handleGoogleLogin = async () => {
    try {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
    } catch (error) {
      console.error('Error signing in with Google:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Building2 className="h-12 w-12 text-blue-600" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in to your account
        </h2>
        <div className="mt-8 bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
          <div className="flex justify-center space-x-4 mb-6">
            <button
              className={`px-4 py-2 rounded-md ${
                !isAgencyLogin
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } transition-colors duration-200`}
              onClick={() => setIsAgencyLogin(false)}
            >
              Client Login
            </button>
            <button
              className={`px-4 py-2 rounded-md ${
                isAgencyLogin
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } transition-colors duration-200`}
              onClick={() => setIsAgencyLogin(true)}
            >
              Agency Login
            </button>
          </div>

          {isAgencyLogin ? (
            <div className="space-y-6">
              <button
                onClick={handleGoogleLogin}
                className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Lock className="w-4 h-4 mr-2" />
                Sign in with Google
              </button>
            </div>
          ) : (
            <SupabaseAuth
              supabaseClient={supabase}
              appearance={{
                theme: ThemeSupa,
                variables: {
                  default: {
                    colors: {
                      brand: '#2563eb',
                      brandAccent: '#1d4ed8',
                    },
                  },
                },
              }}
              providers={[]}
              showLinks={false}
              view="sign_in"
            />
          )}
        </div>
      </div>
    </div>
  );
}