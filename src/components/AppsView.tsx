import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Grid3X3,
  ShoppingBag,
  Video,
  ShieldCheck,
  Home,
  GraduationCap,
  Building2,
  TrendingUp,
  Globe,
  Layers,
  ExternalLink,
  Key,
  Copy,
  Check,
  Sparkles
} from 'lucide-react';

export const AppsView: React.FC = () => {
  const { authorizedApps, authorizeAppSso } = useAuth();
  const [selectedAppToken, setSelectedAppToken] = useState<{ appCode: string; appName: string; token: string; redirectUrl: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const getAppIcon = (code: string) => {
    switch (code) {
      case 'MARKETPLACE': return ShoppingBag;
      case 'CREATOR': return Video;
      case 'ADMIN': return ShieldCheck;
      case 'HABITAT': return Home;
      case 'ACADEMY': return GraduationCap;
      case 'ORGANISATION': return Building2;
      case 'FIP': return TrendingUp;
      case 'NEXUS': return Layers;
      default: return Globe;
    }
  };

  const handleLaunchSso = async (appCode: string, appName: string, url: string) => {
    const token = await authorizeAppSso(appCode);
    if (token) {
      const redirectUrl = `${url}/auth/callback?sso_token=${token}`;
      setSelectedAppToken({ appCode, appName, token, redirectUrl });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="apps-view" className="max-w-5xl space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Grid3X3 className="h-5 w-5 text-indigo-400" />
          <span>Plateformes de l'Écosystème Fingerclic (8)</span>
        </h1>
        <p className="text-xs text-neutral-400">
          Votre compte Fingerclic Identify est automatiquement configuré pour un accès Single Sign-On (SSO) instantané sur tous ces services.
        </p>
      </div>

      {/* Apps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {authorizedApps.map((app) => {
          const Icon = getAppIcon(app.code);

          return (
            <div
              key={app.id}
              className="flex flex-col justify-between rounded-2xl border border-neutral-800 bg-neutral-950 p-5 transition hover:border-indigo-500/30"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-xl border border-neutral-800"
                      style={{ backgroundColor: `${app.color}15` }}
                    >
                      <Icon className="h-5 w-5" style={{ color: app.color }} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">{app.name}</h3>
                      <p className="font-mono text-[10px] text-neutral-400">Code: {app.code}</p>
                    </div>
                  </div>

                  <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                    SSO Unifié
                  </span>
                </div>

                <p className="mt-3 text-xs leading-relaxed text-neutral-400">
                  {app.description}
                </p>
              </div>

              <div className="mt-5 flex items-center gap-2 border-t border-neutral-900 pt-4">
                <button
                  onClick={() => handleLaunchSso(app.code, app.name, app.url)}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-indigo-600/20 py-2 text-xs font-semibold text-indigo-300 border border-indigo-500/30 transition hover:bg-indigo-600/30"
                >
                  <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Ouvrir avec SSO</span>
                </button>

                <a
                  href={app.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-neutral-400 transition hover:text-white"
                  title="Visiter le site"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* SSO Token Assertion Modal */}
      {selectedAppToken && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-400">
                <Key className="h-5 w-5" />
                <h3 className="text-sm font-bold text-white">Jeton SSO Généré pour {selectedAppToken.appName}</h3>
              </div>
              <button
                onClick={() => setSelectedAppToken(null)}
                className="text-xs text-neutral-500 hover:text-white"
              >
                ✕ Fermer
              </button>
            </div>

            <p className="text-xs text-neutral-400">
              Ce jeton d'assertion JWT est valide 5 minutes. Il transmet de manière sécurisée votre identité unifiée à la plateforme <strong>{selectedAppToken.appName}</strong>.
            </p>

            <div>
              <label className="text-[10px] font-mono text-neutral-400 uppercase">Jeton JWT Assertion SSO :</label>
              <div className="mt-1 flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900 p-2.5">
                <input
                  type="text"
                  readOnly
                  value={selectedAppToken.token}
                  className="w-full bg-transparent font-mono text-xs text-indigo-300 focus:outline-none"
                />
                <button
                  onClick={() => copyToClipboard(selectedAppToken.token)}
                  className="rounded-lg bg-neutral-800 p-1.5 text-neutral-300 hover:text-white"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-mono text-neutral-400 uppercase">URL de redirection SSO Callback :</label>
              <div className="mt-1 rounded-xl border border-neutral-800 bg-neutral-900/60 p-2.5">
                <p className="font-mono text-xs text-neutral-300 break-all">{selectedAppToken.redirectUrl}</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedAppToken(null)}
                className="rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-2 text-xs font-semibold text-neutral-300 hover:bg-neutral-800"
              >
                Terminer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
