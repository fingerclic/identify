import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Laptop, Smartphone, Tablet, Globe, Trash2, LogOut, ShieldAlert, CheckCircle2 } from 'lucide-react';

export const SessionsView: React.FC = () => {
  const { sessions, fetchSessions, revokeSession, revokeAllOtherSessions } = useAuth();

  useEffect(() => {
    fetchSessions();
  }, []);

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'Mobile': return Smartphone;
      case 'Tablet': return Tablet;
      default: return Laptop;
    }
  };

  return (
    <div id="sessions-view" className="max-w-4xl space-y-6">
      
      {/* Header & Global Revoke Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Laptop className="h-5 w-5 text-indigo-400" />
            <span>Appareils & Sessions Connectées ({sessions.length})</span>
          </h1>
          <p className="text-xs text-neutral-400">
            Contrôlez les navigateurs et appareils ayant un accès actif à votre compte Fingerclic.
          </p>
        </div>

        {sessions.length > 1 && (
          <button
            onClick={revokeAllOtherSessions}
            className="flex items-center gap-2 rounded-xl bg-red-600/20 px-4 py-2 text-xs font-semibold text-red-300 border border-red-500/30 transition hover:bg-red-600/30"
          >
            <LogOut className="h-4 w-4 text-red-400" />
            <span>Déconnexion de tous les appareils</span>
          </button>
        )}
      </div>

      {/* Security Info Card */}
      <div className="flex items-start gap-3 rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 text-indigo-200">
        <ShieldAlert className="h-5 w-5 shrink-0 text-indigo-400 mt-0.5" />
        <p className="text-xs leading-relaxed">
          Si vous ne reconnaissez pas un appareil ou une adresse IP, révoquez immédiatement la session correspondante. Cela déconnectera l'appareil sans altérer vos données.
        </p>
      </div>

      {/* Sessions List */}
      <div className="space-y-3">
        {sessions.map((session) => {
          const DeviceIcon = getDeviceIcon(session.deviceType);

          return (
            <div
              key={session.id}
              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border p-4 transition ${
                session.isCurrent
                  ? 'border-indigo-500/40 bg-indigo-950/20'
                  : 'border-neutral-800 bg-neutral-950'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
                  session.isCurrent ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-400' : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                }`}>
                  <DeviceIcon className="h-5 w-5" />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-semibold text-white">
                      {session.browser} sur {session.os}
                    </h3>
                    {session.isCurrent && (
                      <span className="flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="h-3 w-3" /> Appareil actuel
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] font-mono text-neutral-400 flex items-center gap-2">
                    <span>IP: {session.ipAddress}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Globe className="h-3 w-3 text-neutral-500" />
                      {session.location}
                    </span>
                  </p>

                  <p className="text-[10px] text-neutral-500">
                    Première connexion le {new Date(session.createdAt).toLocaleDateString('fr-FR')} • Dernier accès : {new Date(session.lastActive).toLocaleTimeString('fr-FR')}
                  </p>
                </div>
              </div>

              {!session.isCurrent && (
                <button
                  onClick={() => revokeSession(session.id)}
                  className="self-end sm:self-center flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs font-medium text-red-400 transition hover:border-red-500/30 hover:bg-red-500/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Révoquer</span>
                </button>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
};
