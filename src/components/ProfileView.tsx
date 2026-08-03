import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Phone, Globe, Clock, Camera, Check, ShieldCheck, MapPin, Building, Briefcase } from 'lucide-react';

export const ProfileView: React.FC = () => {
  const { user, updateProfile, verifyEmail } = useAuth();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [address, setAddress] = useState(user?.address || '');
  const [city, setCity] = useState(user?.city || 'Paris');
  const [country, setCountry] = useState(user?.country || 'France');
  const [company, setCompany] = useState(user?.company || 'Fingerclic Technologies');
  const [jobTitle, setJobTitle] = useState(user?.jobTitle || 'Architecte Solution');
  const [language, setLanguage] = useState(user?.language || 'fr');
  const [timezone, setTimezone] = useState(user?.timezone || 'Europe/Paris');
  const [theme] = useState(user?.preferences?.theme || 'dark');
  const [securityAlerts, setSecurityAlerts] = useState(user?.preferences?.securityAlerts ?? true);
  const [marketingEmails, setMarketingEmails] = useState(user?.preferences?.marketingEmails ?? true);

  const [isSaving, setIsSaving] = useState(false);

  const presetAvatars = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=250',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await updateProfile({
      fullName,
      phone,
      avatarUrl,
      bio,
      address,
      city,
      country,
      company,
      jobTitle,
      language,
      timezone,
      preferences: {
        theme,
        securityAlerts,
        marketingEmails,
        twoFactorEnabled: user?.preferences?.twoFactorEnabled ?? false
      }
    });
    setIsSaving(false);
  };

  return (
    <div id="profile-view" className="max-w-4xl space-y-6">
      
      {/* Page Title Header */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <User className="h-5 w-5 text-indigo-400" />
          <span>Mon Profil Fingerclic Identify</span>
        </h1>
        <p className="text-xs text-neutral-400">
          Gérez votre identité universelle, vos coordonnées professionnelles et vos préférences de compte.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Avatar Section */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6">
          <h2 className="text-sm font-semibold text-white mb-4">Photo de Profil & Avatar</h2>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="relative">
              <img
                src={avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'}
                alt="Avatar"
                className="h-20 w-20 rounded-2xl border-2 border-indigo-500/30 object-cover shadow-lg"
              />
              <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-600 text-white shadow">
                <Camera className="h-3.5 w-3.5" />
              </div>
            </div>

            <div className="flex-1 space-y-3">
              <div>
                <label className="text-xs font-medium text-neutral-300">URL de l'avatar personnalisée</label>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://..."
                  className="mt-1 w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs text-white placeholder-neutral-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-neutral-400">Ou choisir parmi nos avatars prédéfinis :</label>
                <div className="mt-2 flex items-center gap-3">
                  {presetAvatars.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAvatarUrl(url)}
                      className={`h-10 w-10 overflow-hidden rounded-xl border-2 transition ${
                        avatarUrl === url ? 'border-indigo-500 ring-2 ring-indigo-500/30' : 'border-neutral-800 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={url} alt="Preset" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Basic Info Section */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-white">Informations Personnelles & Professionnelles</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Full Name */}
            <div>
              <label className="text-xs font-medium text-neutral-300">Nom Complet</label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-900 pl-9 pr-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Email (Read only + Verify Status) */}
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-neutral-300">Adresse E-mail (Identifiant Unifié)</label>
                {user?.emailVerified ? (
                  <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-400">
                    <ShieldCheck className="h-3 w-3" /> Vérifiée
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => verifyEmail('simulated_token')}
                    className="text-[10px] font-bold text-amber-400 hover:underline"
                  >
                    Vérifier l'e-mail
                  </button>
                )}
              </div>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-900/50 pl-9 pr-3 py-2 text-xs text-neutral-400 cursor-not-allowed"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="text-xs font-medium text-neutral-300">Numéro de téléphone</label>
              <div className="relative mt-1">
                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+33 6 12 34 56 78"
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-900 pl-9 pr-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Company */}
            <div>
              <label className="text-xs font-medium text-neutral-300">Entreprise / Organisation</label>
              <div className="relative mt-1">
                <Building className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Fingerclic Tech"
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-900 pl-9 pr-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Job Title */}
            <div>
              <label className="text-xs font-medium text-neutral-300">Intitulé de poste</label>
              <div className="relative mt-1">
                <Briefcase className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="Architecte Solution"
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-900 pl-9 pr-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Role */}
            <div>
              <label className="text-xs font-medium text-neutral-300">Rôle au sein de l'écosystème</label>
              <input
                type="text"
                disabled
                value={`${user?.role} (Fingerclic Identify)`}
                className="mt-1 w-full rounded-xl border border-neutral-800 bg-neutral-900/50 px-3 py-2 text-xs text-neutral-400 cursor-not-allowed font-mono"
              />
            </div>
          </div>

          {/* Address & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="text-xs font-medium text-neutral-300">Adresse</label>
              <div className="relative mt-1">
                <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="15 Av Champs-Élysées"
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-900 pl-9 pr-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-neutral-300">Ville</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Paris"
                className="mt-1 w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-neutral-300">Pays</label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="France"
                className="mt-1 w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="text-xs font-medium text-neutral-300">Bio / Description professionnelle</label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Présentez-vous aux équipes de l'écosystème..."
              className="mt-1 w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Regional & Localization Settings */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-white">Langue & Fuseau Horaire</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Language */}
            <div>
              <label className="text-xs font-medium text-neutral-300 flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-indigo-400" />
                <span>Langue de l'interface</span>
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="mt-1 w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="fr">Français (FR)</option>
                <option value="en">English (US)</option>
                <option value="es">Español (ES)</option>
                <option value="de">Deutsch (DE)</option>
              </select>
            </div>

            {/* Timezone */}
            <div>
              <label className="text-xs font-medium text-neutral-300 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-indigo-400" />
                <span>Fuseau Horaire</span>
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="mt-1 w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="Europe/Paris">Europe/Paris (UTC+01:00 / UTC+02:00)</option>
                <option value="UTC">UTC (Universal Coordinated Time)</option>
                <option value="America/New_York">America/New_York (Eastern Time)</option>
                <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Preferences & Notifications */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-white">Préférences de Compte</h2>

          <div className="space-y-3">
            
            <label className="flex items-center justify-between cursor-pointer rounded-xl border border-neutral-800/80 bg-neutral-900/50 p-3">
              <div>
                <p className="text-xs font-semibold text-white">Alertes de Sécurité par E-mail</p>
                <p className="text-[11px] text-neutral-400">Recevoir une notification lors d'une nouvelle connexion sur un nouvel appareil.</p>
              </div>
              <input
                type="checkbox"
                checked={securityAlerts}
                onChange={(e) => setSecurityAlerts(e.target.checked)}
                className="h-4 w-4 rounded border-neutral-700 bg-neutral-800 text-indigo-600 focus:ring-indigo-500"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer rounded-xl border border-neutral-800/80 bg-neutral-900/50 p-3">
              <div>
                <p className="text-xs font-semibold text-white">Communications & Nouveautés Fingerclic</p>
                <p className="text-[11px] text-neutral-400">Rester informé des mises à jour des 8 plateformes de l'écosystème.</p>
              </div>
              <input
                type="checkbox"
                checked={marketingEmails}
                onChange={(e) => setMarketingEmails(e.target.checked)}
                className="h-4 w-4 rounded border-neutral-700 bg-neutral-800 text-indigo-600 focus:ring-indigo-500"
              />
            </label>
          </div>
        </div>

        {/* Submit Action */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-500 disabled:opacity-50"
          >
            <Check className="h-4 w-4" />
            <span>{isSaving ? 'Enregistrement...' : 'Enregistrer les modifications'}</span>
          </button>
        </div>

      </form>
    </div>
  );
};
