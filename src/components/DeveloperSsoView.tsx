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
          <span>Endpoints Standard OpenID Connect & OAuth 2.0 (RFC 6749 / OIDC Core 1.0)</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-3">
            <span className="font-mono text-[10px] text-indigo-400 uppercase font-bold">OIDC Discovery</span>
            <p className="mt-1 font-mono text-neutral-200">GET /.well-known/openid-configuration</p>
          </div>
          <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-3">
            <span className="font-mono text-[10px] text-indigo-400 uppercase font-bold">JWKS Key Set</span>
            <p className="mt-1 font-mono text-neutral-200">GET /.well-known/jwks.json</p>
          </div>
          <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-3">
            <span className="font-mono text-[10px] text-indigo-400 uppercase font-bold">Authorize Endpoint (PKCE)</span>
            <p className="mt-1 font-mono text-neutral-200">GET/POST /oauth/authorize</p>
          </div>
          <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-3">
            <span className="font-mono text-[10px] text-indigo-400 uppercase font-bold">Token Exchange (Single-use Code)</span>
            <p className="mt-1 font-mono text-neutral-200">POST /oauth/token</p>
          </div>
          <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-3">
            <span className="font-mono text-[10px] text-indigo-400 uppercase font-bold">UserInfo Endpoint (Claims)</span>
            <p className="mt-1 font-mono text-neutral-200">GET /oauth/userinfo</p>
          </div>
          <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-3">
            <span className="font-mono text-[10px] text-indigo-400 uppercase font-bold">RP-Initiated Logout</span>
            <p className="mt-1 font-mono text-neutral-200">GET /oauth/logout</p>
          </div>
        </div>
      </div>

      {/* Dedicated NEXUS Client Card */}
      <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-b from-indigo-950/40 to-neutral-950 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600/30 text-indigo-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Client OIDC Officiel : Fingerclic NEXUS</h3>
              <p className="text-[11px] text-neutral-400">Identifiants configurés pour la relying party NEXUS</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-950/60 px-2.5 py-1 text-[10px] font-semibold text-emerald-300">
            Prêt pour intégration
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/60 p-3">
            <span className="text-[10px] font-semibold text-neutral-400 uppercase">Client ID</span>
            <p className="mt-0.5 font-mono text-indigo-300 font-bold select-all">fingerclic-nexus</p>
            <p className="text-[10px] text-neutral-500 mt-1">Alias supporté : nexus</p>
          </div>
          <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/60 p-3">
            <span className="text-[10px] font-semibold text-neutral-400 uppercase">Type d'application</span>
            <p className="mt-0.5 font-mono text-neutral-200">SPA / Web Server (PKCE S256)</p>
            <p className="text-[10px] text-emerald-400 mt-1">Authentification stricte sans fallback</p>
          </div>
        </div>
      </div>

    </div>
  );
};
