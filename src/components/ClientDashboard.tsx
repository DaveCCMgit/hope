import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { logAction, LogLevel } from '../lib/logger';
import { ArrowLeft, Building2, Package, Hash, ArrowRight, Link, Settings } from 'lucide-react';
import { useSID } from '../contexts/SIDContext';

interface Setting {
  id: string;
  sid: string;
  account_name: string;
  package: string;
  status: string;
}

interface CRMClient {
  id: string;
  sid: string;
  account_name: string;
  package: string;
  marketing_plan_url: string | null;
  brand_guidelines_url: string | null;
  brand_templates_url: string | null;
}

// Rest of the component remains the same until the grid
[Previous component code...]

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
            {/* Account Details content remains the same */}
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-4">
              <button
                onClick={handleEnterProject2025}
                className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:text-blue-600 transition-colors"
              >
                <span className="flex items-center">
                  <Package className="w-5 h-5 mr-2" />
                  Project 2025
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => navigate(`/client/${sid}/settings`)}
                className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:text-blue-600 transition-colors"
              >
                <span className="flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  Settings
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Rest of the component remains the same */}
[Rest of the component code...]