import { UserRepository } from '../repositories/user.repository';
import { SessionRepository } from '../repositories/session.repository';
import { hashPassword, comparePassword } from '../auth/password';
import { generateAccessToken, generateRefreshToken } from '../auth/jwt';
import { logAudit } from '../security/audit';
import { logSecurityEvent } from '../security/events';

export class AuthService {
  private userRepo = new UserRepository();
  private sessionRepo = new SessionRepository();

  async register(data: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    ipAddress: string;
    userAgent: string;
  }) {
    const existing = await this.userRepo.findByEmail(data.email);
    if (existing) {
      throw new Error('Un compte avec cet e-mail existe déjà');
    }

    const passwordHash = await hashPassword(data.password);
    const user = await this.userRepo.create({
      email: data.email,
      passwordHash,
      fullName: data.fullName,
      phone: data.phone
    });

    if (!user) throw new Error('Échec de création de l\'utilisateur');

    const session = await this.sessionRepo.createSession({
      userId: user.id,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent
    });

    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.userRoles?.[0]?.role?.name || 'USER',
      sessionId: session.id
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      sessionId: session.id
    });

    await this.sessionRepo.saveRefreshToken(user.id, session.id, refreshToken);
    const verificationToken = await this.sessionRepo.createVerificationToken(user.id, 'EMAIL_VERIFY');

    await logAudit(user.id, 'auth.register', `Compte créé pour ${user.email} via Prisma`, data.ipAddress, data.userAgent);
    await logSecurityEvent(user.id, 'ACCOUNT_CREATED', 'INFO', 'Création d\'identité Fingerclic terminée', data.ipAddress, data.userAgent);

    const { passwordHash: _, ...publicUser } = user;

    return {
      user: publicUser,
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: 900
      },
      session,
      verificationTokenSimulated: verificationToken
    };
  }

  async login(data: {
    email: string;
    password: string;
    ipAddress: string;
    userAgent: string;
  }) {
    const user = await this.userRepo.findByEmail(data.email);
    if (!user) {
      throw new Error('Identifiants invalides (email ou mot de passe incorrect)');
    }

    const isValid = await comparePassword(data.password, user.passwordHash);
    if (!isValid) {
      await logAudit(user.id, 'auth.failed_login', `Tentative de connexion échouée pour ${user.email}`, data.ipAddress, data.userAgent);
      await logSecurityEvent(user.id, 'LOGIN_FAILED', 'MEDIUM', 'Tentative de connexion refusée', data.ipAddress, data.userAgent);
      throw new Error('Identifiants invalides (email ou mot de passe incorrect)');
    }

    const session = await this.sessionRepo.createSession({
      userId: user.id,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent
    });

    const roleName = user.userRoles?.[0]?.role?.name || 'USER';

    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: roleName,
      sessionId: session.id
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      sessionId: session.id
    });

    await this.sessionRepo.saveRefreshToken(user.id, session.id, refreshToken);

    await logAudit(user.id, 'auth.login', `Connexion réussie via Prisma depuis ${session.browser}`, data.ipAddress, data.userAgent);
    await logSecurityEvent(user.id, 'LOGIN_SUCCESS', 'INFO', `Connexion réussie (${session.browser} / ${session.os})`, data.ipAddress, data.userAgent);

    const { passwordHash: _, ...publicUser } = user;

    return {
      user: publicUser,
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: 900
      },
      session
    };
  }
}
