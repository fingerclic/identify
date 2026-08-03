import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  User,
  Shield,
  Laptop,
  Grid3X3,
  Code,
  LogOut,
  ChevronRight,
  Sparkles
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { currentTab, setCurrentTab, logout, sessions, user } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard, badge: null },
    { id: 'profile', label: 'Mon Profil', icon: User, badge: null },
    { id: 'security', label: 'Sécurité & Accès', icon: Shield, badge: user?.emailVerified ? null : 'À vérifier' },
    { id: 'sessions', label: 'Sessions Actives', icon: Laptop, badge: sessions.length ? `${sessions.length}` : '1' },
    { id: 'apps', label: 'Plateformes Fingerclic', icon: Grid3X3, badge: '8 SSO' },
    { id: 'developer', label: 'Développeur & API', icon: Code, badge: 'OAuth 2.0' }
  ];

  return (
    <aside id="fingerclic-sidebar" className="w-full lg:w-64 shrink-0 border-r border-neutral-800/80 bg-neutral-950 p-4">
      
      {/* User Context Card */}
      {user && (
        <div className="mb-6 rounded-xl border border-neutral-800/80 bg-neutral-900/50 p-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'}
                alt={user.fullName}
                className="h-10 w-10 rounded-lg border border-neutral-700 object-cover"
              />
              <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 text-[8px] font-bold text-black">
                ✓
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-white">{user.fullName}</p>
              <p className="truncate text-[11px] text-neutral-400">{user.email}</p>
              <div className="mt-1 flex items-center gap-1.5">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                <span className="text-[10px] text-emerald-400 font-medium">Compte Universel Single Sign-On</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation List */}
      <nav className="space-y-1">
        <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-500">
          Menu Principal
        </p>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              id={`nav-item-${item.id}`}
              onClick={() => setCurrentTab(item.id)}
              className={`group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-medium transition ${
                isActive
                  ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-sm'
                  : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`h-4 w-4 transition ${isActive ? 'text-indigo-400' : 'text-neutral-500 group-hover:text-neutral-300'}`} />
                <span>{item.label}</span>
              </div>

              <div className="flex items-center gap-1.5">
                {item.badge && (
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    item.badge === 'À vérifier' 
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : 'bg-neutral-800 text-neutral-300'
                  }`}>
                    {item.badge}
                  </span>
                )}
                <ChevronRight className={`h-3 w-3 opacity-0 transition group-hover:opacity-100 ${isActive ? 'opacity-100 text-indigo-400' : 'text-neutral-600'}`} />
              </div>
            </button>
          );
        })}
      </nav>

      {/* Fingerclic Identity Info Card */}
      <div className="mt-8 rounded-xl border border-neutral-800 bg-gradient-to-b from-neutral-900/60 to-neutral-950 p-3.5 text-left">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-200">
          <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
          <span>Fingerclic Account</span>
        </div>
        <p className="mt-1 text-[11px] leading-relaxed text-neutral-400">
          Ce compte unique sécurise vos accès sur Marketplace, Creator, Admin, Habitat, Academy, Org, FIP & Website.
        </p>
      </div>

      {/* Logout Action */}
      <div className="mt-6 border-t border-neutral-800/80 pt-4">
        <button
          id="sidebar-logout-btn"
          onClick={logout}
          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-neutral-400 transition hover:bg-red-500/10 hover:text-red-400 border border-transparent hover:border-red-500/20"
        >
          <LogOut className="h-4 w-4 text-neutral-500 group-hover:text-red-400" />
          <span>Se déconnecter</span>
        </button>
      </div>
    </aside>
  );
};
