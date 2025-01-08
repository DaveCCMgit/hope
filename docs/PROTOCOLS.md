# Application Protocols

## RBAMv3 (Role-Based Access Management v3)
[Previous RBAMv3 content remains unchanged...]

## CCPv2 (Client Context Protocol v2)
[Previous CCPv2 content remains unchanged...]

## SIDMP (SID Module Protocol)

### Settings Module Protocol

1. **Database Schema Requirements**
   - Each settings module MUST have a corresponding database table
   - Table naming: `client_${module_name}_settings`
   - Required columns:
     - `sid` (text, PRIMARY KEY)
     - `config` (jsonb)
     - `created_at` (timestamptz)
     - `updated_at` (timestamptz)
   - Must enable RLS with appropriate policies

2. **Component Structure**
   - Location: `/components/settings/`
   - Naming: `${ModuleName}Settings.tsx`
   - Must implement standard settings interface
   - Must use SID context validation

3. **Route Integration**
   - Pattern: `/client/:sid/settings/*`
   - Must be wrapped in SIDProvider
   - Must be added to App.tsx router configuration
   - Must include navigation link in ClientDashboard

4. **Data Model**
   - Define TypeScript interfaces for all settings
   - Example:
     ```typescript
     interface ModuleSettings {
       sid: string;
       config: Record<string, unknown>;
       created_at: string;
       updated_at: string;
     }
     ```

5. **Error Handling**
   - Must implement loading states
   - Must handle validation errors
   - Must provide user feedback for all operations
   - Must log errors using the logging system

6. **Navigation**
   - Must provide clear navigation path
   - Must handle back navigation gracefully
   - Must maintain SID context throughout navigation

[Previous Component Integration Requirements content remains unchanged...]