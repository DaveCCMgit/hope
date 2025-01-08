import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { logAction, LogLevel } from '../lib/logger';

type SIDContextType = {
  sid: string | null;
  setSID: (sid: string) => Promise<void>;
  clearSID: () => void;
  validateSID: (sid: string) => Promise<boolean>;
};

const SIDContext = createContext<SIDContextType | undefined>(undefined);

const STORAGE_KEY = 'current_sid';
const MAX_VALIDATION_ATTEMPTS = 3;
const VALIDATION_TIMEOUT = 5000; // 5 seconds

export const SIDProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sid, setSIDState] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error reading from sessionStorage:', error);
      return null;
    }
  });

  // Persist SID changes to sessionStorage
  useEffect(() => {
    if (sid) {
      try {
        sessionStorage.setItem(STORAGE_KEY, sid);
      } catch (error) {
        console.error('Error writing to sessionStorage:', error);
      }
    } else {
      try {
        sessionStorage.removeItem(STORAGE_KEY);
      } catch (error) {
        console.error('Error removing from sessionStorage:', error);
      }
    }
  }, [sid]);

  const validateSID = async (newSID: string, attempt = 1): Promise<boolean> => {
    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Validation timeout')), VALIDATION_TIMEOUT);
      });

      const validationPromise = Promise.all([
        // Check SID lookup
        supabase
          .from('sid_lookup')
          .select('sid')
          .eq('sid', newSID)
          .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
          .single(),
        
        // Check settings status
        supabase
          .from('settings')
          .select('status')
          .eq('sid', newSID)
          .single()
      ]);

      const [lookupResult, settingsResult] = await Promise.race([
        validationPromise,
        timeoutPromise
      ]) as any;

      if (lookupResult.error || !lookupResult.data) {
        throw new Error('SID lookup failed');
      }

      if (settingsResult.error || !settingsResult.data) {
        throw new Error('Settings lookup failed');
      }

      if (settingsResult.data.status !== 'active') {
        throw new Error('SID is not active');
      }

      await logAction(
        'sid_validation_success',
        'settings',
        { sid: newSID },
        LogLevel.INFO,
        {
          rbam: { sidLookup: true },
          ccp: { sid: newSID, contextValid: true }
        }
      );

      return true;
    } catch (error) {
      console.error('Error validating SID:', error);
      
      await logAction(
        'sid_validation_error',
        'settings',
        { 
          sid: newSID,
          attempt,
          error: String(error)
        },
        LogLevel.ERROR,
        {
          rbam: { sidLookup: false },
          ccp: { sid: newSID, contextValid: false }
        }
      );

      // Retry logic for transient failures
      if (attempt < MAX_VALIDATION_ATTEMPTS) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        return validateSID(newSID, attempt + 1);
      }

      return false;
    }
  };

  const setSID = async (newSID: string) => {
    try {
      const isValid = await validateSID(newSID);
      if (!isValid) {
        throw new Error('Invalid SID');
      }

      await logAction(
        'sid_context_switch',
        'settings',
        {
          previous_sid: sid,
          new_sid: newSID,
        },
        LogLevel.INFO,
        {
          rbam: { sidLookup: true },
          ccp: { sid: newSID, contextValid: true }
        }
      );

      setSIDState(newSID);
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
        LogLevel.ERROR,
        {
          rbam: { sidLookup: false },
          ccp: { sid: newSID, contextValid: false }
        }
      );
      throw error;
    }
  };

  const clearSID = () => {
    setSIDState(null);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing sessionStorage:', error);
    }
  };

  // Clear SID on unmount
  useEffect(() => {
    return () => {
      clearSID();
    };
  }, []);

  return (
    <SIDContext.Provider value={{ sid, setSID, clearSID, validateSID }}>
      {children}
    </SIDContext.Provider>
  );
};

export const useSID = (): SIDContextType => {
  const context = useContext(SIDContext);
  if (!context) {
    throw new Error('useSID must be used within an SIDProvider');
  }
  return context;
};