import React, { useState } from 'react';
import { Code, Key, Copy, Check, Server, ShieldCheck, RefreshCw } from 'lucide-react';

export const DeveloperSsoView: React.FC = () => {
  const [copiedId, setCopiedId] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);

  const clientId = 'fingerclic_client_id_live_994821a308ef';
  const clientSecret = 'fclic_sec_live_a89f213088190341cd991208';

  const copyText = (text: string, type: 'id' | 'secret') => {
    navigator.clipboard.writeText(text);
    if (type === 'id') {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } else {
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    }
  };

  return (
    <div id="developer-view" className="max-w-4xl space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Code className="h-5 w-5 text-indigo-400" />
          <span>Développeur & Intégration OAuth 2.0 / OIDC</span>
        </h1>
        <p className="text-xs text-neutral-400">
          Configurez l'authentification Fingerclic Identify comme Provider d'Identité pour vos applications.
        </p>
      </div>

      {/* OAuth Client Credentials */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <Key className="h-4 w-4 text-indigo-400" />
          <span>Clés Client OAuth 2.0 (Environnement Production & Sub-platforms)</span>
        </h2>

        <div className="space-y-3">
          
          <div>
            <label className="text-xs font-medium text-neutral-300">Client ID (Public)</label>
            <div className="mt-1 flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2">
              <input
                type="text"
                readOnly
                value={clientId}
                className="w-full bg-transparent font-mono text-xs text-indigo-300 focus:outline-none"
              />
              <button
                onClick={() => copyText(clientId, 'id')}
                className="text-neutral-400 hover:text-white"
              >
                {copiedId ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-neutral-300">Client Secret (Confidentiel)</label>
            <div className="mt-1 flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2">
              <input
                type="password"
                readOnly
                value={clientSecret}
                className="w-full bg-transparent font-mono text-xs text-neutral-400 focus:outline-none"
              />
              <button
                onClick={() => copyText(clientSecret, 'secret')}
                className="text-neutral-400 hover:text-white"
              >
                {copiedSecret ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Allowed Redirect URIs */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-white">URIs de Redirection Autorisées (Fingerclic Domains)</h2>

        <div className="space-y-2">
          {[
            'https://marketplace.fingerclic.com/auth/callback',
            'https://creator.fingerclic.com/auth/callback',
            'https://admin.fingerclic.com/auth/callback',
            'https://habitat.fingerclic.com/auth/callback',
            'https://academy.fingerclic.com/auth/callback',
            'https://org.fingerclic.com/auth/callback',
            'https://fip.fingerclic.com/auth/callback',
            'https://fingerclic.com/auth/callback'
          ].map((uri, idx) => (
            <div key={idx} className="flex items-center justify-between rounded-xl border border-neutral-800/80 bg-neutral-900/40 px-3 py-2">
              <span className="font-mono text-xs text-neutral-300">{uri}</span>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Autorisé
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Identity Discovery Endpoints */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <Server className="h-4 w-4 text-indigo-400" />
          <span>Endpoints REST & OpenID Configuration</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-3">
            <span className="font-mono text-[10px] text-indigo-400 uppercase font-bold">Authorize Endpoint</span>
            <p className="mt-1 font-mono text-neutral-200">POST /api/sso/authorize</p>
          </div>
          <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-3">
            <span className="font-mono text-[10px] text-indigo-400 uppercase font-bold">Token Endpoint</span>
            <p className="mt-1 font-mono text-neutral-200">POST /api/login & POST /api/refresh</p>
          </div>
          <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-3">
            <span className="font-mono text-[10px] text-indigo-400 uppercase font-bold">UserInfo Endpoint</span>
            <p className="mt-1 font-mono text-neutral-200">GET /api/me</p>
          </div>
          <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-3">
            <span className="font-mono text-[10px] text-indigo-400 uppercase font-bold">Revocation Endpoint</span>
            <p className="mt-1 font-mono text-neutral-200">DELETE /api/sessions</p>
          </div>
        </div>
      </div>

    </div>
  );
};
