import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  UserCheck,
  Laptop,
  ArrowUpRight,
  Sparkles,
  ShoppingBag,
  Video,
  Shield,
  Home,
  GraduationCap,
  Building2,
  TrendingUp,
  Globe,
  Clock,
  AlertTriangle,
  KeyRound
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const { user, currentSession, sessions, authorizedApps, setCurrentTab, revokeAllOtherSessions, verifyEmail } = useAuth();

  const getAppIcon = (code: string) => {
    switch (code) {
      case 'MARKETPLACE': return ShoppingBag;
      case 'CREATOR': return Video;
      case 'ADMIN': return Shield;
      case 'HABITAT': return Home;
      case 'ACADEMY': return GraduationCap;
      case 'ORGANISATION': return Building2;
      case 'FIP': return TrendingUp;
      default: return Globe;
    }
  };

  // Calculate Security Health Score
  let score = 50;
  if (user?.emailVerified) score += 25;
  if (user?.preferences?.twoFactorEnabled) score += 15;
  if (sessions.length <= 3) score += 10;

  return (
    <div id="dashboard-view" className="space-y-6">
      
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-neutral-800 bg-gradient-to-r from-neutral-900 via-indigo-950/40 to-neutral-900 p-6 sm:p-8">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl"></div>
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          
          <div className="flex items-center gap-4">
            <img
              src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'}
              alt={user?.fullName}
              className="h-16 w-16 rounded-2xl border-2 border-indigo-500/30 object-cover shadow-xl"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  Bonjour, {user?.fullName}
                </h1>
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                  Compte Actif
                </span>
              </div>
              <p className="mt-1 text-xs text-neutral-400">
                Compte Universel Fingerclic Identify ({user?.email}) • Rôle : <span className="font-mono text-indigo-300">{user?.role}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setCurrentTab('apps')}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/25 transition hover:bg-indigo-500 active:scale-95"
            >
              <Sparkles className="h-4 w-4" />
              <span>Accéder aux Plateformes (8)</span>
            </button>
            <button
              onClick={() => setCurrentTab('profile')}
              className="rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-2.5 text-xs font-medium text-neutral-200 transition hover:bg-neutral-800"
            >
              Modifier le profil
            </button>
          </div>
        </div>
      </div>

      {/* Email Verification Banner Alert if not verified */}
      {!user?.emailVerified && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-200">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400" />
            <div>
              <p className="text-xs font-semibold">Votre adresse e-mail n'est pas encore vérifiée</p>
              <p className="text-[11px] text-amber-300/80">
                Consultez vos e-mails ou effectuez la vérification en un clic pour sécuriser totalement votre compte.
              </p>
            </div>
          </div>
          <button
            onClick={() => verifyEmail('simulated_token')}
            className="shrink-0 rounded-lg bg-amber-500 px-3.5 py-1.5 text-xs font-bold text-black transition hover:bg-amber-400"
          >
            Vérifier maintenant
          </button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Security Score */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span>Score de Sécurité</span>
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{score}%</span>
            <span className="text-xs text-emerald-400 font-medium">Très Bon</span>
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-neutral-800 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-400" style={{ width: `${score}%` }}></div>
          </div>
        </div>

        {/* Sessions Count */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span>Sessions Connectées</span>
            <Laptop className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{sessions.length}</span>
            <span className="text-xs text-neutral-400">appareil(s)</span>
          </div>
          <button
            onClick={() => setCurrentTab('sessions')}
            className="mt-2 text-[11px] text-indigo-400 font-medium hover:underline flex items-center gap-1"
          >
            Gérer les appareils &rarr;
          </button>
        </div>

        {/* Authorized Apps */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span>Services Fingerclic</span>
            <UserCheck className="h-4 w-4 text-blue-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{authorizedApps.length}</span>
            <span className="text-xs text-neutral-400">sur 8 plateformes</span>
          </div>
          <p className="mt-2 text-[11px] text-neutral-400 truncate">
            Single Sign-On Actif
          </p>
        </div>

        {/* Current IP & Location */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span>Session Actuelle</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-3">
            <p className="text-sm font-semibold text-white truncate">{currentSession?.browser} sur {currentSession?.os}</p>
            <p className="text-xs text-neutral-400 truncate font-mono mt-0.5">{currentSession?.ipAddress} ({currentSession?.location})</p>
          </div>
        </div>
      </div>

      {/* Ecosystem Apps Grid */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-white">Écosystème Fingerclic (Accès SSO Unifié)</h2>
            <p className="text-xs text-neutral-400">Connectez-vous directement à n'importe quelle plateforme avec votre jeton unifié.</p>
          </div>
          <button
            onClick={() => setCurrentTab('apps')}
            className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
          >
            Voir tout <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {authorizedApps.map((app) => {
            const Icon = getAppIcon(app.code);
            return (
              <div
                key={app.id}
                onClick={() => setCurrentTab('apps')}
                className="group cursor-pointer rounded-xl border border-neutral-800 bg-neutral-900/40 p-3.5 transition hover:border-indigo-500/40 hover:bg-neutral-900"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-800 border border-neutral-700">
                    <Icon className="h-4 w-4" style={{ color: app.color }} />
                  </div>
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                    SSO Prêt
                  </span>
                </div>
                <p className="mt-3 text-xs font-semibold text-white group-hover:text-indigo-300">{app.name}</p>
                <p className="mt-1 text-[11px] text-neutral-400 line-clamp-1">{app.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Security & Sessions Summary Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Active Sessions Overview */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Laptop className="h-4 w-4 text-indigo-400" />
              <span>Sessions Actives ({sessions.length})</span>
            </h2>
            {sessions.length > 1 && (
              <button
                onClick={revokeAllOtherSessions}
                className="text-xs font-semibold text-red-400 hover:text-red-300 underline"
              >
                Déconnexion des autres appareils
              </button>
            )}
          </div>

          <div className="space-y-3">
            {sessions.map((sess) => (
              <div key={sess.id} className="flex items-center justify-between rounded-xl border border-neutral-800/80 bg-neutral-900/50 p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-800 text-neutral-300">
                    <Laptop className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold text-white">{sess.browser} • {sess.os}</p>
                      {sess.isCurrent && (
                        <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-[10px] font-bold text-indigo-300">
                          Session actuelle
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] font-mono text-neutral-400">{sess.ipAddress} ({sess.location})</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Security Actions */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6">
          <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-indigo-400" />
            <span>Actions de Sécurité Rapides</span>
          </h2>

          <div className="space-y-3">
            <button
              onClick={() => setCurrentTab('security')}
              className="flex w-full items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900/50 p-3 text-left transition hover:bg-neutral-900"
            >
              <div>
                <p className="text-xs font-semibold text-white">Changer le mot de passe</p>
                <p className="text-[11px] text-neutral-400">Mettre à jour le mot de passe principal Fingerclic</p>
              </div>
              <ArrowUpRight className="h-4 w-4 text-neutral-400" />
            </button>

            <button
              onClick={() => setCurrentTab('security')}
              className="flex w-full items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900/50 p-3 text-left transition hover:bg-neutral-900"
            >
              <div>
                <p className="text-xs font-semibold text-white">Double Authentification (2FA)</p>
                <p className="text-[11px] text-neutral-400">Activer l'application d'authentification TOTP</p>
              </div>
              <ArrowUpRight className="h-4 w-4 text-neutral-400" />
            </button>

            <button
              onClick={() => setCurrentTab('developer')}
              className="flex w-full items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900/50 p-3 text-left transition hover:bg-neutral-900"
            >
              <div>
                <p className="text-xs font-semibold text-white">Gestionnaire de Tokens API & Client OAuth</p>
                <p className="text-[11px] text-neutral-400">Gérer les autorisations d'applications tierces</p>
              </div>
              <ArrowUpRight className="h-4 w-4 text-neutral-400" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
