export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'DEVELOPER' | 'USER' | 'MEMBER';

export type FingerclicAppCode = 
  | 'MARKETPLACE'
  | 'CREATOR'
  | 'ADMIN'
  | 'HABITAT'
  | 'ACADEMY'
  | 'ORGANISATION'
  | 'FIP'
  | 'WEBSITE';

export interface FingerclicApp {
  id: string;
  code: FingerclicAppCode;
  name: string;
  description: string;
  url: string;
  iconName: string;
  color: string;
  isSystem?: boolean;
  isAuthorized?: boolean;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  marketingEmails: boolean;
  securityAlerts: boolean;
  twoFactorEnabled: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  phone?: string;
  bio?: string;
  address?: string;
  city?: string;
  country?: string;
  company?: string;
  jobTitle?: string;
  role: Role;
  emailVerified: boolean;
  language: string;
  timezone: string;
  preferences: UserPreferences;
  createdAt: string;
  updatedAt: string;
}

export interface SessionInfo {
  id: string;
  userId: string;
  ipAddress: string;
  userAgent: string;
  deviceType: 'Desktop' | 'Mobile' | 'Tablet';
  browser: string;
  os: string;
  city?: string;
  country?: string;
  location: string;
  isCurrent: boolean;
  lastActive: string;
  createdAt: string;
}

export interface AuditLogItem {
  id: string;
  userId?: string;
  action: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}

export interface ApiKeyItem {
  id: string;
  userId: string;
  name: string;
  prefix: string;
  keyHash: string;
  lastUsed?: string;
  expiresAt?: string;
  createdAt: string;
}

export interface SecurityEventItem {
  id: string;
  userId: string;
  eventType: string;
  severity: 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}

export interface DeviceItem {
  id: string;
  userId: string;
  deviceId: string;
  name: string;
  type: string;
  os: string;
  browser: string;
  ipAddress: string;
  lastActive: string;
  createdAt: string;
}

export interface OrganizationItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  role: Role;
  joinedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthSuccessResponse {
  user: UserProfile;
  tokens: AuthTokens;
  session: SessionInfo;
  authorizedApps: FingerclicApp[];
}

export interface SystemHealth {
  status: 'operational' | 'degraded' | 'maintenance';
  service: string;
  version: string;
  activeUsersCount: number;
  totalSessionsCount: number;
  uptimeSeconds: number;
}
