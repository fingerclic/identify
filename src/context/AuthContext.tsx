import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, SessionInfo, FingerclicApp, AuditLogItem } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  accessToken: string | null;
  refreshToken: string | null;
  currentSession: SessionInfo | null;
  sessions: SessionInfo[];
  authorizedApps: FingerclicApp[];
  auditLogs: AuditLogItem[];
  isLoading: boolean;
  error: string | null;
  successMessage: string | null;
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  login: (email: string, password: string) => Promise<boolean>;
  register: (fullName: string, email: string, password: string, phone?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<{ success: boolean; simulatedCode?: string }>;
  resetPassword: (token: string, newPassword: string) => Promise<boolean>;
  verifyEmail: (token: string) => Promise<boolean>;
  updateProfile: (data: Partial<UserProfile>) => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  fetchSessions: () => Promise<void>;
  revokeSession: (sessionId: string) => Promise<boolean>;
  revokeAllOtherSessions: () => Promise<boolean>;
  fetchAuditLogs: () => Promise<void>;
  authorizeAppSso: (appCode: string) => Promise<string | null>;
  clearNotifications: () => void;
  setError: (msg: string | null) => void;
  setSuccessMessage: (msg: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(localStorage.getItem('fingerclic_access_token'));
  const [refreshToken, setRefreshToken] = useState<string | null>(localStorage.getItem('fingerclic_refresh_token'));
  const [currentSession, setCurrentSession] = useState<SessionInfo | null>(null);
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [authorizedApps, setAuthorizedApps] = useState<FingerclicApp[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  const clearNotifications = () => {
    setError(null);
    setSuccessMessage(null);
  };

  // Check auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      if (!accessToken) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/me', {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        });

        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          setSessions(data.sessions || []);
          setAuthorizedApps(data.authorizedApps || []);
          const curr = data.sessions?.find((s: SessionInfo) => s.id === data.currentSessionId) || data.sessions?.[0] || null;
          setCurrentSession(curr);
        } else if (refreshToken) {
          // Try refresh
          const refreshed = await doRefreshToken();
          if (!refreshed) {
            handleLocalLogout();
          }
        } else {
          handleLocalLogout();
        }
      } catch (err) {
        console.error('Failed to init auth', err);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const doRefreshToken = async (): Promise<boolean> => {
    if (!refreshToken) return false;
    try {
      const res = await fetch('/api/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });

      if (res.ok) {
        const data = await res.json();
        setAccessToken(data.accessToken);
        setRefreshToken(data.refreshToken);
        localStorage.setItem('fingerclic_access_token', data.accessToken);
        localStorage.setItem('fingerclic_refresh_token', data.refreshToken);
        return true;
      }
    } catch (err) {
      console.error('Refresh failed', err);
    }
    return false;
  };

  const handleLocalLogout = () => {
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    setCurrentSession(null);
    setSessions([]);
    setAuthorizedApps([]);
    setAuditLogs([]);
    localStorage.removeItem('fingerclic_access_token');
    localStorage.removeItem('fingerclic_refresh_token');
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    clearNotifications();
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Erreur lors de la connexion');
        setIsLoading(false);
        return false;
      }

      setUser(data.user);
      setAccessToken(data.tokens.accessToken);
      setRefreshToken(data.tokens.refreshToken);
      setCurrentSession(data.session);
      setAuthorizedApps(data.authorizedApps || []);
      
      localStorage.setItem('fingerclic_access_token', data.tokens.accessToken);
      localStorage.setItem('fingerclic_refresh_token', data.tokens.refreshToken);

      setSuccessMessage(`Bienvenue sur Fingerclic Identify, ${data.user.fullName} !`);
      setIsLoading(false);
      return true;
    } catch (err: any) {
      setError('Impossible de se connecter au serveur d\'authentification.');
      setIsLoading(false);
      return false;
    }
  };

  const register = async (fullName: string, email: string, password: string, phone?: string): Promise<boolean> => {
    setIsLoading(true);
    clearNotifications();
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, password, phone })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Erreur lors de l\'inscription');
        setIsLoading(false);
        return false;
      }

      setUser(data.user);
      setAccessToken(data.tokens.accessToken);
      setRefreshToken(data.tokens.refreshToken);
      setCurrentSession(data.session);
      setAuthorizedApps(data.authorizedApps || []);

      localStorage.setItem('fingerclic_access_token', data.tokens.accessToken);
      localStorage.setItem('fingerclic_refresh_token', data.tokens.refreshToken);

      setSuccessMessage('Compte Fingerclic créé avec succès !');
      setIsLoading(false);
      return true;
    } catch (err) {
      setError('Erreur lors de la création du compte.');
      setIsLoading(false);
      return false;
    }
  };

  const logout = async () => {
    setIsLoading(true);
    if (accessToken) {
      try {
        await fetch('/api/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}` }
        });
      } catch (err) {
        // ignore network error on logout
      }
    }
    handleLocalLogout();
    setSuccessMessage('Vous avez été déconnecté avec succès.');
    setIsLoading(false);
  };

  const forgotPassword = async (email: string) => {
    clearNotifications();
    try {
      const res = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMessage(data.message);
        return { success: true, simulatedCode: data.simulatedResetCode };
      } else {
        setError(data.error || 'Erreur lors de la demande');
        return { success: false };
      }
    } catch (err) {
      setError('Erreur réseau lors de la demande');
      return { success: false };
    }
  };

  const resetPassword = async (token: string, newPassword: string) => {
    clearNotifications();
    try {
      const res = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMessage(data.message);
        return true;
      } else {
        setError(data.error || 'Échec de la réinitialisation');
        return false;
      }
    } catch (err) {
      setError('Erreur réseau');
      return false;
    }
  };

  const verifyEmail = async (token: string) => {
    clearNotifications();
    try {
      const res = await fetch('/api/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMessage(data.message);
        if (user) {
          setUser({ ...user, emailVerified: true });
        }
        return true;
      } else {
        setError(data.error || 'Échec de la vérification');
        return false;
      }
    } catch (err) {
      setError('Erreur réseau');
      return false;
    }
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!accessToken) return false;
    clearNotifications();
    try {
      const res = await fetch('/api/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify(data)
      });
      const resData = await res.json();
      if (res.ok) {
        setUser(resData.user);
        setSuccessMessage('Profil mis à jour avec succès');
        return true;
      } else {
        setError(resData.error || 'Échec de la mise à jour du profil');
        return false;
      }
    } catch (err) {
      setError('Erreur lors de la mise à jour');
      return false;
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!accessToken) return false;
    clearNotifications();
    try {
      const res = await fetch('/api/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMessage('Mot de passe mis à jour avec succès');
        return true;
      } else {
        setError(data.error || 'Mot de passe actuel incorrect');
        return false;
      }
    } catch (err) {
      setError('Erreur lors du changement de mot de passe');
      return false;
    }
  };

  const fetchSessions = async () => {
    if (!accessToken) return;
    try {
      const res = await fetch('/api/sessions', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      }
    } catch (err) {
      console.error('Fetch sessions failed', err);
    }
  };

  const revokeSession = async (sessionId: string) => {
    if (!accessToken) return false;
    clearNotifications();
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMessage(data.message);
        await fetchSessions();
        return true;
      } else {
        setError(data.error || 'Échec de la révocation');
        return false;
      }
    } catch (err) {
      setError('Erreur réseau lors de la révocation');
      return false;
    }
  };

  const revokeAllOtherSessions = async () => {
    if (!accessToken) return false;
    clearNotifications();
    try {
      const res = await fetch('/api/sessions', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMessage(data.message);
        await fetchSessions();
        return true;
      } else {
        setError(data.error || 'Échec de la déconnexion globale');
        return false;
      }
    } catch (err) {
      setError('Erreur réseau');
      return false;
    }
  };

  const fetchAuditLogs = async () => {
    if (!accessToken) return;
    try {
      const res = await fetch('/api/audit-logs', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.auditLogs || []);
      }
    } catch (err) {
      console.error('Audit logs error', err);
    }
  };

  const authorizeAppSso = async (appCode: string) => {
    if (!accessToken) return null;
    clearNotifications();
    try {
      const res = await fetch('/api/sso/authorize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ appCode })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMessage(`Token SSO généré pour la plateforme ${appCode}`);
        return data.ssoToken;
      } else {
        setError(data.error || 'Erreur lors de l\'autorisation SSO');
        return null;
      }
    } catch (err) {
      setError('Erreur réseau SSO');
      return null;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        refreshToken,
        currentSession,
        sessions,
        authorizedApps,
        auditLogs,
        isLoading,
        error,
        successMessage,
        currentTab,
        setCurrentTab,
        login,
        register,
        logout,
        forgotPassword,
        resetPassword,
        verifyEmail,
        updateProfile,
        changePassword,
        fetchSessions,
        revokeSession,
        revokeAllOtherSessions,
        fetchAuditLogs,
        authorizeAppSso,
        clearNotifications,
        setError,
        setSuccessMessage
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
