# Application Protocols

## RBAMv3 (Role-Based Access Management v3)

### Definition
RBAMv3 provides a streamlined framework for managing data access and visibility, focusing on simplicity and security through clear template and client-specific data separation.

### Data Categories

1. **Template Tables (Public, No RLS)**
   - Contain universally accessible reference data
   - Stored in public schema
   - No RLS applied
   - Example: project_2025_template_stages

2. **Client-Specific Tables (Public with RLS)**
   - Contain client-specific data
   - Stored in public schema
   - RLS policies enforce sid-based access
   - Example: client_project_2025

### Access Rules
- Template tables are globally accessible without RLS
- Client-specific tables enforce RLS based on sid
- All tables reside in the public schema for simplicity
- Frontend queries remain simple, relying on RLS for access control

### Implementation Guidelines
1. **Template Tables**
   - Create in public schema
   - Explicitly disable RLS
   - No sid dependency

2. **Client Tables**
   - Create in public schema
   - Enable RLS
   - Enforce sid-based policies
   - Include appropriate foreign keys to template tables

## CCPv2 (Client Context Protocol v2)

### Objective
Establish a robust and reusable Client Context Protocol to manage client-specific operations and navigation throughout the application. This ensures that all interactions within a "client setting" are scoped, parameterized, and consistent.

### Core Concepts

1. **Client Context Wrapper**
   - Definition: Context mechanism applied ONLY when a user enters a client-specific setting (defined by sid)
   - Context boundary established at the routing level
   - All client-specific operations inherit this context
   - Features:
     - Centralized management of sid value
     - Automatic scoping of API calls and queries
     - Simplified parameterization for child components

2. **Context Scoping**
   - Global routes (dashboard, settings) must remain context-free
   - SID context only present in client-specific routes
   - Context boundary established at the routing level
   - Clear separation between global and client-specific views

3. **Context Initialization**
   - SID context initialized only when navigating to client-specific views
   - Settings/Dashboard views remain context-free
   - Context transition occurs during client selection
   - Clean context teardown when returning to global views

4. **Hierarchical Context Enforcement**
   - Scope: Any navigation, query, or action from a "client setting" must respect the sid context
   - Ensures users cannot access resources outside their assigned sid
   - Context boundaries strictly enforced at routing level

### Implementation Guidelines

1. **Context Management**
   - Use React Context (SIDContext) for client-specific sid propagation
   - Wrap only client-specific routes in SID Provider
   - Validate context presence in client-specific components
   - Keep global components context-free

2. **Navigation Structure**
   - Include sid in client-specific routes
   - Example paths:
     - /dashboard (no context)
     - /settings (no context)
     - /client/:sid/* (with context)
   - Redirect to Settings Dashboard if sid is missing

3. **Query Patterns**
   - Scoped Queries (sid-dependent):
     - Must include current sid
     - Used for client-specific resources
   - Unscoped Queries (global):
     - No sid requirement
     - Used for template resources

### Security Requirements
1. **Access Control**
   - Validate sid context before operations in client views
   - Enforce RLS policies at database level
   - Log all context switches and access attempts

2. **Data Protection**
   - Scope all queries to current sid in client views
   - Prevent cross-client data access
   - Maintain audit trail of context usage