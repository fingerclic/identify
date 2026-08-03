import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  Mail,
  Lock,
  User,
  Phone,
  ArrowRight,
  Sparkles,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Eye,
  EyeOff
} from 'lucide-react';

export const AuthCard: React.FC = () => {
  const { login, register, forgotPassword, resetPassword, error, successMessage, clearNotifications } = useAuth();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'reset'>('login');

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [simulatedCodeDisplay, setSimulatedCodeDisplay] = useState<string | null>(null);

  // Password strength checker
  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const passStrength = getPasswordStrength(password);

  const handleQuickDemoLogin = async () => {
    setEmail('fingerclic@gmail.com');
    setPassword('Password123!');
    setIsSubmitting(true);
    await login('fingerclic@gmail.com', 'Password123!');
    setIsSubmitting(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (mode === 'login') {
      await login(email, password);
    } else if (mode === 'register') {
      const ok = await register(fullName, email, password, phone);
      if (ok) setMode('login');
    } else if (mode === 'forgot') {
      const res = await forgotPassword(email);
      if (res.success && res.simulatedCode) {
        setSimulatedCodeDisplay(res.simulatedCode);
        setResetCode(res.simulatedCode);
      }
    } else if (mode === 'reset') {
      const ok = await resetPassword(resetCode, newPassword);
      if (ok) setMode('login');
    }

    setIsSubmitting(false);
  };

  return (
    <div id="auth-portal" className="flex min-h-[80vh] items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        
        {/* Brand Header */}
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-500 p-0.5 shadow-xl shadow-indigo-500/20">
            <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-neutral-950">
              <ShieldCheck className="h-7 w-7 text-indigo-400" />
            </div>
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-white">
            Fingerclic Identify
          </h1>
          <p className="mt-1 text-xs text-neutral-400">
            Accès sécurisé unifié à l'ensemble des 8 plateformes Fingerclic
          </p>
        </div>

        {/* Auth Box Container */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950/90 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          
          {/* Quick Demo Account Banner */}
          {mode === 'login' && (
            <div className="mb-6 overflow-hidden rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-indigo-300">
                  <Sparkles className="h-4 w-4 shrink-0 text-indigo-400" />
                  <span className="text-xs font-semibold">Compte Démo Administrateur</span>
                </div>
                <button
                  type="button"
                  onClick={handleQuickDemoLogin}
                  disabled={isSubmitting}
                  className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-bold text-white shadow transition hover:bg-indigo-500"
                >
                  1-Clic Connexion
                </button>
              </div>
              <p className="mt-1 text-[11px] font-mono text-neutral-400">
                Email: fingerclic@gmail.com • Mdp: Password123!
              </p>
            </div>
          )}

          {/* Notifications Error / Success Messages */}
          {error && (
            <div className="mb-4 flex items-center justify-between gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
              <button onClick={clearNotifications} className="text-xs opacity-70 hover:opacity-100">✕</button>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 flex items-center justify-between gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                <span>{successMessage}</span>
              </div>
              <button onClick={clearNotifications} className="text-xs opacity-70 hover:opacity-100">✕</button>
            </div>
          )}

          {/* Simulated Password Reset Code Box */}
          {simulatedCodeDisplay && mode === 'forgot' && (
            <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 space-y-2 text-amber-200">
              <p className="text-xs font-semibold">Code de secours généré (simulation e-mail) :</p>
              <p className="font-mono text-sm font-bold bg-black/40 px-3 py-1.5 rounded text-amber-400 text-center select-all">
                {simulatedCodeDisplay}
              </p>
              <button
                onClick={() => setMode('reset')}
                className="w-full text-center text-xs font-bold text-indigo-300 hover:underline pt-1"
              >
                Accéder directement à la réinitialisation &rarr;
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* REGISTER: Full Name */}
            {mode === 'register' && (
              <div>
                <label className="text-xs font-medium text-neutral-300">Nom Complet</label>
                <div className="relative mt-1">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Alexandre Fingerclic"
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-900 pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* EMAIL (All modes except reset) */}
            {mode !== 'reset' && (
              <div>
                <label className="text-xs font-medium text-neutral-300">Adresse E-mail Unifiée</label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nom@exemple.com"
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-900 pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* REGISTER: Phone */}
            {mode === 'register' && (
              <div>
                <label className="text-xs font-medium text-neutral-300">Numéro de téléphone (optionnel)</label>
                <div className="relative mt-1">
                  <Phone className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+33 6 12 34 56 78"
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-900 pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* PASSWORD (Login & Register) */}
            {(mode === 'login' || mode === 'register') && (
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-neutral-300">Mot de Passe</label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => setMode('forgot')}
                      className="text-[11px] text-indigo-400 hover:underline"
                    >
                      Mot de passe oublié ?
                    </button>
                  )}
                </div>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-900 pl-9 pr-10 py-2 text-xs text-white placeholder-neutral-500 focus:border-indigo-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-neutral-500 hover:text-neutral-300"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {/* Password Strength Meter for Register */}
                {mode === 'register' && password.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <div className="flex h-1.5 w-full gap-1">
                      {[1, 2, 3, 4].map((step) => (
                        <div
                          key={step}
                          className={`h-full flex-1 rounded-full transition ${
                            passStrength >= step
                              ? passStrength <= 2 ? 'bg-amber-500' : 'bg-emerald-500'
                              : 'bg-neutral-800'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-[10px] text-neutral-400">
                      Force : {passStrength <= 2 ? 'Moyenne (Ajoutez majuscules ou chiffres)' : 'Excellente'}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* RESET MODE: Code & New Password */}
            {mode === 'reset' && (
              <>
                <div>
                  <label className="text-xs font-medium text-neutral-300">Code de Réinitialisation</label>
                  <div className="relative mt-1">
                    <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
                    <input
                      type="text"
                      required
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value)}
                      placeholder="Code reçu"
                      className="w-full rounded-xl border border-neutral-800 bg-neutral-900 pl-9 pr-3 py-2 font-mono text-xs text-white focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-neutral-300">Nouveau Mot de Passe</label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-neutral-800 bg-neutral-900 pl-9 pr-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              </>
            )}

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/25 transition hover:bg-indigo-500 disabled:opacity-50"
            >
              <span>
                {mode === 'login' && 'Se connecter'}
                {mode === 'register' && 'Créer mon compte Fingerclic'}
                {mode === 'forgot' && 'Envoyer le lien de réinitialisation'}
                {mode === 'reset' && 'Valider le nouveau mot de passe'}
              </span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* FOOTER SWITCHERS */}
          <div className="mt-6 border-t border-neutral-800/80 pt-4 text-center text-xs text-neutral-400">
            {mode === 'login' && (
              <p>
                Vous n'avez pas encore de compte ?{' '}
                <button
                  onClick={() => { clearNotifications(); setMode('register'); }}
                  className="font-semibold text-indigo-400 hover:underline"
                >
                  S'inscrire
                </button>
              </p>
            )}

            {mode === 'register' && (
              <p>
                Vous avez déjà un compte ?{' '}
                <button
                  onClick={() => { clearNotifications(); setMode('login'); }}
                  className="font-semibold text-indigo-400 hover:underline"
                >
                  Se connecter
                </button>
              </p>
            )}

            {(mode === 'forgot' || mode === 'reset') && (
              <button
                onClick={() => { clearNotifications(); setMode('login'); }}
                className="font-semibold text-indigo-400 hover:underline"
              >
                &larr; Retour à la connexion
              </button>
            )}
          </div>

        </div>

        {/* Security Assurance footer */}
        <p className="text-center text-[11px] text-neutral-500">
          Chiffrement JWT 256 bits • Compatible PostgreSQL & Prisma ORM • SSO Standard OIDC
        </p>

      </div>
    </div>
  );
};
