import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardLayout } from './components/DashboardLayout';
import { LandingPage } from './pages/LandingPage';
import { AgencyDashboard } from './pages/AgencyDashboard';
import { EventStudio } from './pages/EventStudio';
import { ClientGallery } from './pages/ClientGallery';
import { LoginPage } from './pages/LoginPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-[#FAFAFA] text-zinc-900 flex flex-col font-sans selection:bg-iris-600 selection:text-white">
          <Routes>
            {/* Public Landing & Auth */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage initialMode="LOGIN" />} />
            <Route path="/signup" element={<LoginPage initialMode="REGISTER" />} />

            {/* Authenticated Studio Portal with Sidebar */}
            <Route
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<AgencyDashboard />} />
              <Route path="/events/:id" element={<EventStudio />} />
            </Route>

            {/* Client Gallery PIN Proofing */}
            <Route path="/gallery/:slug" element={<ClientGallery />} />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
