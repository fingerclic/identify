import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, LogOut, Globe, User, Key, Cpu, Sparkles } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout, setCurrentTab, currentTab } = useAuth();

  return (
    <header id="fingerclic-navbar" className="sticky top-0 z-40 w-full border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Brand & Ecosystem Indicator */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-500 p-0.5 shadow-lg shadow-indigo-500/20">
            <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-neutral-950">
              <ShieldCheck className="h-5 w-5 text-indigo-400" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold tracking-tight text-white">Fingerclic</span>
              <span className="rounded-md bg-indigo-500/10 px-2 py-0.5 text-xs font-medium text-indigo-400 border border-indigo-500/20">
                Identify IdP
              </span>
            </div>
            <p className="text-xs text-neutral-400 hidden sm:block">
              Provider d'Identité Unifié & Service SSO
            </p>
          </div>
        </div>

        {/* Global Operational Status Badge */}
        <div className="hidden md:flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
          </span>
          <span className="font-medium">Écosystème Opérationnel (8 Plateformes)</span>
        </div>

        {/* User Account Quick Controls */}
        {user ? (
          <div className="flex items-center gap-3">
            <button
              id="navbar-language-btn"
              onClick={() => setCurrentTab('profile')}
              className="hidden sm:flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900 px-2.5 py-1.5 text-xs text-neutral-300 transition hover:bg-neutral-800 hover:text-white"
            >
              <Globe className="h-3.5 w-3.5 text-neutral-400" />
              <span>{user.language?.toUpperCase() || 'FR'}</span>
            </button>

            <div className="flex items-center gap-2 pl-2 border-l border-neutral-800">
              <button
                id="navbar-user-profile-btn"
                onClick={() => setCurrentTab('profile')}
                className="flex items-center gap-2.5 rounded-lg p-1.5 text-left transition hover:bg-neutral-900"
              >
                <div className="relative">
                  <img
                    src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'}
                    alt={user.fullName}
                    className="h-8 w-8 rounded-full border border-neutral-700 object-cover"
                  />
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-neutral-950 bg-emerald-500"></span>
                </div>
                <div className="hidden lg:block">
                  <p className="text-xs font-medium text-white leading-tight">{user.fullName}</p>
                  <p className="text-[10px] text-neutral-400">{user.email}</p>
                </div>
              </button>

              <button
                id="navbar-logout-btn"
                onClick={logout}
                title="Se déconnecter"
                className="rounded-lg p-2 text-neutral-400 transition hover:bg-neutral-900 hover:text-red-400"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentTab('auth')}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium text-white shadow-md shadow-indigo-600/20 transition hover:bg-indigo-500"
            >
              Se Connecter
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
