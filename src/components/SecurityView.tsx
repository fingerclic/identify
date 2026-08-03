import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, KeyRound, Smartphone, Activity, Check, AlertCircle, History } from 'lucide-react';

export const SecurityView: React.FC = () => {
  const { changePassword, auditLogs, fetchAuditLogs, user, updateProfile } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChanging, setIsChanging] = useState(false);
  const [passError, setPassError] = useState<string | null>(null);

  const [twoFactor, setTwoFactor] = useState(user?.preferences?.twoFactorEnabled ?? false);

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);

    if (newPassword.length < 8) {
      setPassError('Le nouveau mot de passe doit contenir au moins 8 caractères.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPassError('Les deux nouveaux mots de passe ne correspondent pas.');
      return;
    }

    setIsChanging(true);
    const ok = await changePassword(currentPassword, newPassword);
    setIsChanging(false);

    if (ok) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const handleToggle2FA = async (enabled: boolean) => {
    setTwoFactor(enabled);
    if (user) {
      await updateProfile({
        preferences: {
          ...user.preferences,
          twoFactorEnabled: enabled
        }
      });
    }
  };

  return (
    <div id="security-view" className="max-w-4xl space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Shield className="h-5 w-5 text-indigo-400" />
          <span>Sécurité & Clés d'Accès</span>
        </h1>
        <p className="text-xs text-neutral-400">
          Protégez votre compte Fingerclic, modifiez vos mots de passe et inspectez l'historique d'audit.
        </p>
      </div>

      {/* Password Change Form */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-indigo-400" />
          <span>Changer le Mot de Passe Principal</span>
        </h2>

        {passError && (
          <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{passError}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-neutral-300">Mot de passe actuel</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1 w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-neutral-300">Nouveau mot de passe</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1 w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-neutral-300">Confirmer le mot de passe</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1 w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isChanging}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
            >
              <Check className="h-3.5 w-3.5" />
              <span>{isChanging ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Two Factor Authentication */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Double Authentification (2FA / TOTP)</h2>
              <p className="text-xs text-neutral-400">Exiger un code généré par Google Authenticator ou 1Password à chaque connexion.</p>
            </div>
          </div>

          <button
            onClick={() => handleToggle2FA(!twoFactor)}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
              twoFactor
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
            }`}
          >
            {twoFactor ? '✓ 2FA Activé' : 'Activer le 2FA'}
          </button>
        </div>
      </div>

      {/* Audit Trail Section */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <History className="h-4 w-4 text-indigo-400" />
            <span>Journal d'Audit de Sécurité ({auditLogs.length})</span>
          </h2>
          <button
            onClick={fetchAuditLogs}
            className="text-xs text-neutral-400 hover:text-white underline"
          >
            Actualiser
          </button>
        </div>

        <div className="space-y-2">
          {auditLogs.length === 0 ? (
            <p className="text-xs text-neutral-500 py-4 text-center">Aucun événement d'audit récent enregistre.</p>
          ) : (
            auditLogs.slice(0, 10).map((log) => (
              <div key={log.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] uppercase font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                      {log.action}
                    </span>
                    <span className="text-xs font-medium text-white">{log.details}</span>
                  </div>
                  <p className="mt-1 text-[11px] font-mono text-neutral-400">
                    IP: {log.ipAddress} • Client: {log.userAgent}
                  </p>
                </div>
                <span className="text-[10px] text-neutral-500 font-mono shrink-0">
                  {new Date(log.createdAt).toLocaleString('fr-FR')}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
};
