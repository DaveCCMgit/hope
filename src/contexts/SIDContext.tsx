import React, { createContext, useContext, useState } from 'react';
import { logAction, LogLevel } from '../lib/logger';

// Define the context type
type SIDContextType = {
  sid: string | null;
  setSID: (sid: string) => void;
};

// Create the context
const SIDContext = createContext<SIDContextType | undefined>(undefined);

// Provider component
export const SIDProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sid, setSID] = useState<string | null>(null);

  const handleSetSID = async (newSID: string) => {
    try {
      await logAction(
        'sid_context_switch',
        'settings',
        {
          previous_sid: sid,
          new_sid: newSID,
        },
        LogLevel.INFO
      );
      setSID(newSID);
    } catch (error) {
      console.error('Error setting SID:', error);
      await logAction(
        'sid_context_switch_error',
        'settings',
        {
          previous_sid: sid,
          new_sid: newSID,
          error: String(error),
        },
        LogLevel.ERROR
      );
    }
  };

  return (
    <SIDContext.Provider value={{ sid, setSID: handleSetSID }}>
      {children}
    </SIDContext.Provider>
  );
};

// Hook to use the SIDContext
export const useSID = (): SIDContextType => {
  const context = useContext(SIDContext);
  if (!context) {
    throw new Error('useSID must be used within an SIDProvider');
  }
  return context;
};