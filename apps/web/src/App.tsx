import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { AgencyDashboard } from './pages/AgencyDashboard';
import { EventStudio } from './pages/EventStudio';
import { ClientGallery } from './pages/ClientGallery';
import { CreateEventModal } from './components/CreateEventModal';

export default function App() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-rose-500 selection:text-white">
        <Navbar onNewEventClick={() => setIsCreateModalOpen(true)} />

        <div className="flex-1 flex flex-col">
          <Routes>
            <Route
              path="/"
              element={
                <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
                  <AgencyDashboard />
                </main>
              }
            />
            <Route
              path="/events/:id"
              element={
                <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
                  <EventStudio />
                </main>
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
    </BrowserRouter>
  );
}
