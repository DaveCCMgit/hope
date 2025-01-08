import { supabase } from './supabase';

export enum LogLevel {
  INFO = 'info',
  WARN = 'warn', 
  ERROR = 'error'
}

interface LogContext {
  rbam?: {
    sidLookup?: boolean;
    authStatus?: boolean;
    rlsPolicy?: {
      name: string;
      allowed: boolean;
      reason?: string;
    };
  };
  ccp?: {
    sid?: string | null;
    contextValid?: boolean;
  };
}

export async function logAction(
  action: string,
  tableName: string,
  details?: Record<string, any> | null,
  level: LogLevel = LogLevel.INFO,
  context?: LogContext
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    let sidLookupResult = null;
    let rlsPolicyResult = null;
    
    if (context?.ccp?.sid) {
      const { data: lookupData, error: lookupError } = await supabase.rpc('check_sid_lookup', { 
        sid_param: context.ccp.sid 
      });

      sidLookupResult = !!lookupData && !lookupError;

      if (sidLookupResult) {
        const { data: settingsData, error: settingsError } = await supabase
          .from('settings')
          .select('id')
          .eq('sid', context.ccp.sid)
          .single();

        rlsPolicyResult = {
          name: 'settings_access',
          allowed: !settingsError,
          reason: settingsError?.message
        };
      }
    }
    
    const logEntry = {
      action,
      table_name: tableName,
      level,
      user_id: user?.id,
      details: details ? JSON.stringify(details) : null,
      client_timestamp: new Date().toISOString(),
      rbam_status: context?.rbam?.authStatus ?? !!user,
      sid_lookup_result: sidLookupResult,
      ccp_context_valid: context?.ccp?.contextValid ?? false,
      rls_policy_result: rlsPolicyResult ? JSON.stringify(rlsPolicyResult) : null
    };

    const { error } = await supabase.from('access_log').insert([logEntry]);
    
    if (error) throw error;

    // Console logging in development
    if (import.meta.env.DEV) {
      console.group(`🔍 [${level.toUpperCase()}] ${action}`);
      console.log('Table:', tableName);
      console.log('User:', user?.id || 'Not authenticated');
      if (details) console.log('Details:', details);
      
      console.group('Access Control Status:');
      console.log('RBAM:', {
        authenticated: !!user,
        sidLookup: sidLookupResult,
        rlsPolicy: rlsPolicyResult?.allowed
      });
      console.log('CCP:', {
        sid: context?.ccp?.sid || null,
        contextValid: context?.ccp?.contextValid || false
      });
      console.groupEnd();
      
      console.groupEnd();
    }
  } catch (error) {
    console.error('Logging error:', error);
  }
}