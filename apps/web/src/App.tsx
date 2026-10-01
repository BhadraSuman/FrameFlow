import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Navbar } from './components/Navbar';
import { AgencyDashboard } from './pages/AgencyDashboard';
import { EventStudio } from './pages/EventStudio';
import { ClientGallery } from './pages/ClientGallery';
import { LoginPage } from './pages/LoginPage';
import { CreateEventModal } from './components/CreateEventModal';

export default function App() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-rose-500 selection:text-white">
          <Navbar onNewEventClick={() => setIsCreateModalOpen(true)} />

          <div className="flex-1 flex flex-col">
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
                      <AgencyDashboard />
                    </main>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/events/:id"
                element={
                  <ProtectedRoute>
                    <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
                      <EventStudio />
                    </main>
                  </ProtectedRoute>
                }
              />
              <Route path="/gallery/:slug" element={<ClientGallery />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>

          <CreateEventModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
          />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
