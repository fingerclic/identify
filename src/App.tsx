import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { AuthCard } from './components/AuthCard';
import { DashboardView } from './components/DashboardView';
import { ProfileView } from './components/ProfileView';
import { SecurityView } from './components/SecurityView';
import { SessionsView } from './components/SessionsView';
import { AppsView } from './components/AppsView';
import { DeveloperSsoView } from './components/DeveloperSsoView';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

const AppContent: React.FC = () => {
  const { user, isLoading, currentTab, error, successMessage, clearNotifications } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
          <p className="text-xs font-semibold text-neutral-400">Chargement de Fingerclic Identify...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans antialiased selection:bg-indigo-500 selection:text-white">
      <Navbar />

      {/* Global Toast Notifications */}
      <div className="fixed top-20 right-4 z-50 max-w-sm space-y-2">
        {error && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-red-500/30 bg-red-950/90 p-3 text-xs text-red-200 shadow-xl backdrop-blur-md">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={clearNotifications} className="text-neutral-400 hover:text-white">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {successMessage && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-500/30 bg-emerald-950/90 p-3 text-xs text-emerald-200 shadow-xl backdrop-blur-md">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
            <button onClick={clearNotifications} className="text-neutral-400 hover:text-white">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {!user ? (
        <main className="mx-auto max-w-7xl px-4 py-8">
          <AuthCard />
        </main>
      ) : (
        <div className="mx-auto flex max-w-7xl flex-col lg:flex-row min-h-[calc(100vh-4rem)]">
          <Sidebar />
          
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
            {currentTab === 'dashboard' && <DashboardView />}
            {currentTab === 'profile' && <ProfileView />}
            {currentTab === 'security' && <SecurityView />}
            {currentTab === 'sessions' && <SessionsView />}
            {currentTab === 'apps' && <AppsView />}
            {currentTab === 'developer' && <DeveloperSsoView />}
          </main>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
