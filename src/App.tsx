import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import ClientDashboard from './components/ClientDashboard';
import Project2025 from './components/Project2025';
import Unauthorized from './components/Unauthorized';
import DebugLogger from './components/DebugLogger';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SIDProvider } from './contexts/SIDContext';

export default function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route
            path="/client/:sid"
            element={
              <SIDProvider>
                <ClientDashboard />
              </SIDProvider>
            }
          />
          <Route
            path="/client/:sid/project-2025"
            element={
              <SIDProvider>
                <Project2025 />
              </SIDProvider>
            }
          />
          <Route path="/unauthorized" element={<Unauthorized />} />
        </Routes>
        <DebugLogger />
      </Router>
    </ErrorBoundary>
  );
}