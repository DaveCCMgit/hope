import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../core/auth/AuthProvider';
import Login from '../features/auth/Login';
import AgencyDashboard from '../features/agency/AgencyDashboard';
import SettingsTable from '../features/settings/SettingsTable';
import ClientDashboard from '../features/client/ClientDashboard';
import Unauthorized from '../components/Unauthorized';

export default function AppRoutes() {
  const { user, loading, isAgencyUser } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={
        isAgencyUser ? <Navigate to="/agency" replace /> : <Navigate to="/settings" replace />
      } />
      <Route path="/agency" element={<AgencyDashboard />} />
      <Route path="/settings" element={<SettingsTable />} />
      <Route path="/client/:sid/*" element={<ClientDashboard />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
    </Routes>
  );
}