import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { DashboardSidebar } from './DashboardSidebar';
import { CreateEventModal } from './CreateEventModal';
import { StudioSettingsModal } from './StudioSettingsModal';
import { useAuth } from '../context/AuthContext';

export interface DashboardLayoutContextType {
  activeFilter: string;
  setActiveFilter: (filter: string) => void;
  openCreateEventModal: () => void;
  openSettingsModal: () => void;
  triggerRefresh: () => void;
  refreshKey: number;
}

export const DashboardLayout: React.FC = () => {
  const { authFetch } = useAuth();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [storageMB, setStorageMB] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchStorageUsage = async () => {
    try {
      const res = await authFetch('/api/events');
      if (res.ok) {
        const events = await res.json();
        const total = events.reduce((sum: number, e: any) => sum + Number(e.totalBytes || 0), 0);
        setStorageMB(total / (1024 * 1024));
      }
    } catch {
      // Non-fatal
    }
  };

  useEffect(() => {
    fetchStorageUsage();
  }, [refreshKey]);

  const triggerRefresh = () => {
    setRefreshKey((k) => k + 1);
  };

  const contextValue: DashboardLayoutContextType = {
    activeFilter,
    setActiveFilter,
    openCreateEventModal: () => setIsCreateModalOpen(true),
    openSettingsModal: () => setIsSettingsOpen(true),
    triggerRefresh,
    refreshKey
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col lg:flex-row text-zinc-900 font-sans selection:bg-iris-600 selection:text-white">
      {/* Sidebar with Navigation & Controls */}
      <DashboardSidebar
        onNewEventClick={() => setIsCreateModalOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        storageMB={storageMB}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          <Outlet context={contextValue} />
        </main>
      </div>

      {/* Global Modals for Studio */}
      <CreateEventModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onEventCreated={() => {
          triggerRefresh();
        }}
      />

      <StudioSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};
