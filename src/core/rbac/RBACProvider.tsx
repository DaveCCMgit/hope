import { createContext, useContext } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { supabase } from '../supabase';

interface RBACContextType {
  checkAccess: (resource: string, action: string) => Promise<boolean>;
}

const RBACContext = createContext<RBACContextType | undefined>(undefined);

export function RBACProvider({ children }: { children: React.ReactNode }) {
  const { user, isAgencyUser } = useAuth();

  const checkAccess = async (resource: string, action: string): Promise<boolean> => {
    if (!user) return false;
    
    // Agency users have full access
    if (isAgencyUser) return true;

    // Check specific permissions for client users
    const { data, error } = await supabase
      .rpc('check_permission', {
        resource_name: resource,
        action_name: action
      });

    if (error) {
      console.error('Error checking permission:', error);
      return false;
    }

    return !!data;
  };

  return (
    <RBACContext.Provider value={{ checkAccess }}>
      {children}
    </RBACContext.Provider>
  );
}

export function useRBAC() {
  const context = useContext(RBACContext);
  if (context === undefined) {
    throw new Error('useRBAC must be used within a RBACProvider');
  }
  return context;
}