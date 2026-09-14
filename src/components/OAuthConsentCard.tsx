import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Lock,
  ArrowRight,
  X,
  Layers,
  AlertCircle
} from 'lucide-react';

interface OAuthConsentCardProps {
  clientId: string;
  redirectUri: string;
  scope?: string;
  state?: string;
  codeChallenge?: string;
  codeChallengeMethod?: string;
  nonce?: string;
}

export const OAuthConsentCard: React.FC<OAuthConsentCardProps> = ({
  clientId,
  redirectUri,
  scope = 'openid profile email',
  state,
  codeChallenge,
  codeChallengeMethod,
  nonce
}) => {
  const { user, token } = useAuth();
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const clientName = clientId.includes('nexus') ? 'Fingerclic NEXUS' : clientId;

  const handleAuthorize = async () => {
    setIsAuthorizing(true);
    setAuthError(null);

    try {
      const res = await fetch('/oauth/authorize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          client_id: clientId,
          redirect_uri: redirectUri,
          response_type: 'code',
          scope,
          state,
          code_challenge: codeChallenge,
          code_challenge_method: codeChallengeMethod,
          nonce
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error_description || data.error || 'Échec de l\'autorisation');
      }

      if (data.redirect_uri) {
        window.location.href = data.redirect_uri;
      } else if (data.code) {
        const target = new URL(redirectUri);
        target.searchParams.set('code', data.code);
        if (state) target.searchParams.set('state', state);
        window.location.href = target.toString();
      }
    } catch (err: any) {
      setAuthError(err.message || 'Erreur lors de la redirection');
      setIsAuthorizing(false);
    }
  };

  const handleCancel = () => {
    try {
      const target = new URL(redirectUri);
      target.searchParams.set('error', 'access_denied');
      target.searchParams.set('error_description', 'L\'utilisateur a annulé la demande d\'autorisation');
      if (state) target.searchParams.set('state', state);
      window.location.href = target.toString();
    } catch {
      window.location.href = '/';
    }
  };

  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-neutral-800 bg-neutral-900/90 p-6 shadow-2xl backdrop-blur-xl space-y-6">
      
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-indigo-500/30 bg-indigo-950/60 text-indigo-400 shadow-inner">
          <Layers className="h-7 w-7" />
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/20 bg-indigo-950/40 px-3 py-1 text-[11px] font-medium text-indigo-300">
          <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" />
          <span>Fournisseur d'Identité Centralisé (OIDC)</span>
        </div>
        <h1 className="text-xl font-bold text-white tracking-tight">
          Autoriser {clientName}
        </h1>
        <p className="text-xs text-neutral-400 max-w-sm mx-auto">
          L'application <span className="font-semibold text-white">{clientName}</span> souhaite se connecter à votre compte Fingerclic Identify.
        </p>
      </div>

      {authError && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-950/80 p-3 text-xs text-red-200">
          <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
          <span>{authError}</span>
        </div>
      )}

      {/* Authenticated Account Info */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-950/80 p-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 font-bold text-white text-sm shadow">
            {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <p className="text-xs font-semibold text-white">{user?.fullName || 'Utilisateur Fingerclic'}</p>
            <p className="text-[11px] text-neutral-400 font-mono">{user?.email}</p>
          </div>
        </div>
        <div className="text-right">
          <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/20 bg-emerald-950/40 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
            Vérifié
          </span>
        </div>
      </div>

      {/* Scopes Requested */}
      <div className="space-y-2.5">
        <p className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
          Données et autorisations demandées :
        </p>
        <div className="space-y-2 rounded-xl border border-neutral-800 bg-neutral-950/50 p-3 text-xs text-neutral-300">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white">Identifiant unique (openid)</span>
              <p className="text-[11px] text-neutral-400">Authentification fédérée et signature de jeton sécurisé</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white">Profil et rôles (profile)</span>
              <p className="text-[11px] text-neutral-400">Nom, avatar, fuseau horaire et permissions écosystème</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white">Adresse e-mail certifiée (email)</span>
              <p className="text-[11px] text-neutral-400">Accès en lecture à votre adresse ({user?.email})</p>
            </div>
          </div>
        </div>
      </div>

      {/* Security & Redirect Notice */}
      <div className="rounded-xl border border-neutral-800/80 bg-neutral-950/40 p-3 space-y-1 text-[11px] text-neutral-400">
        <div className="flex items-center gap-1.5 text-neutral-300">
          <Lock className="h-3.5 w-3.5 text-indigo-400" />
          <span className="font-medium">Redirection sécurisée vers :</span>
        </div>
        <p className="font-mono text-[10px] text-indigo-300 truncate">{redirectUri}</p>
        {codeChallenge && (
          <p className="text-[10px] text-emerald-400/90 flex items-center gap-1">
            <ShieldCheck className="h-3 w-3" />
            Protection cryptographique PKCE S256 active
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={handleCancel}
          disabled={isAuthorizing}
          className="flex-1 rounded-xl border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-xs font-semibold text-neutral-300 hover:bg-neutral-700 hover:text-white transition disabled:opacity-50"
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={handleAuthorize}
          disabled={isAuthorizing}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-500 bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-500 transition disabled:opacity-50"
        >
          {isAuthorizing ? (
            <>
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span>Autorisation en cours...</span>
            </>
          ) : (
            <>
              <span>Autoriser et continuer</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </>
          )}
        </button>
      </div>

    </div>
  );
};
