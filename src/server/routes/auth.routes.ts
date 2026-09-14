import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import { SessionService } from '../services/session.service';
import { ApplicationService } from '../services/application.service';
import { SessionRepository } from '../repositories/session.repository';
import { authenticateJwt, AuthenticatedRequest } from '../middleware/auth.middleware';
import { authRateLimiter } from '../middleware/security.middleware';
import { validatePasswordPolicy } from '../auth/password';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../auth/jwt';
import { rotateRefreshToken } from '../auth/refresh';
import { logAudit } from '../security/audit';
import { prisma } from '../prisma';

export const authRouter = Router();

const authService = new AuthService();
const userService = new UserService();
const sessionService = new SessionService();
const appService = new ApplicationService();
const sessionRepo = new SessionRepository();

const RegisterSchema = z.object({
  email: z.string().email('Adresse email invalide'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  fullName: z.string().min(2, 'Le nom complet doit contenir au moins 2 caractères'),
  phone: z.string().optional()
});

const LoginSchema = z.object({
  email: z.string().email('Adresse email invalide'),
  password: z.string().min(1, 'Mot de passe requis')
});

const RefreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token requis')
});

const ForgotPasswordSchema = z.object({
  email: z.string().email('Adresse email invalide')
});

const ResetPasswordSchema = z.object({
  token: z.string().min(1, 'Code/Token de réinitialisation requis'),
  newPassword: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères')
});

const VerifyEmailSchema = z.object({
  token: z.string().min(1, 'Token de vérification requis')
});

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Mot de passe actuel requis'),
  newPassword: z.string().min(8, 'Le nouveau mot de passe doit contenir au moins 8 caractères')
});

function getClientMeta(req: Request) {
  const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || '127.0.0.1';
  const userAgent = req.headers['user-agent'] || 'Fingerclic Client';
  return { ipAddress, userAgent };
}

// 1. POST /api/register
authRouter.post('/register', authRateLimiter, async (req: Request, res: Response) => {
  try {
    const body = RegisterSchema.parse(req.body);
    const policy = validatePasswordPolicy(body.password);

    if (!policy.valid) {
      return res.status(400).json({
        error: 'Le mot de passe ne respecte pas les exigences de sécurité Enterprise',
        policyErrors: policy.errors
      });
    }

    const meta = getClientMeta(req);

    const result = await authService.register({
      ...body,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent
    });

    const authorizedApps = await appService.getAppsForUser(result.user.id);

    res.setHeader('Set-Cookie', `fingerclic_session=${result.tokens.accessToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`);

    return res.status(201).json({
      message: 'Inscription réussie',
      ...result,
      authorizedApps
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.issues[0].message, details: err.issues });
    }
    return res.status(400).json({ error: err.message || 'Erreur lors de l\'inscription' });
  }
});

// 2. POST /api/login
authRouter.post('/login', authRateLimiter, async (req: Request, res: Response) => {
  try {
    const body = LoginSchema.parse(req.body);
    const meta = getClientMeta(req);

    const result = await authService.login({
      ...body,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent
    });

    const authorizedApps = await appService.getAppsForUser(result.user.id);

    res.setHeader('Set-Cookie', `fingerclic_session=${result.tokens.accessToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`);

    return res.json({
      message: 'Connexion réussie',
      ...result,
      authorizedApps
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.issues[0].message });
    }
    return res.status(401).json({ error: err.message || 'Identifiants invalides' });
  }
});

// 3. POST /api/logout
authRouter.post('/logout', authenticateJwt, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const sessionId = req.user!.sessionId;
    const meta = getClientMeta(req);

    if (sessionId) {
      await sessionRepo.revokeSession(sessionId, userId);
    }

    res.setHeader('Set-Cookie', 'fingerclic_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');

    await logAudit(userId, 'auth.logout', 'Déconnexion manuelle de la session via Prisma', meta.ipAddress, meta.userAgent);
    return res.json({ message: 'Déconnexion réussie' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erreur lors de la déconnexion' });
  }
});

// 4. POST /api/refresh
authRouter.post('/refresh', async (req: Request, res: Response) => {
  try {
    const body = RefreshSchema.parse(req.body);
    const meta = getClientMeta(req);
    const result = await rotateRefreshToken(body.refreshToken, meta.ipAddress, meta.userAgent);
    return res.json(result);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.issues[0].message });
    }
    return res.status(401).json({ error: err.message || 'Échec du rafraîchissement des tokens' });
  }
});

// 5. POST /api/forgot-password
authRouter.post('/forgot-password', authRateLimiter, async (req: Request, res: Response) => {
  try {
    const body = ForgotPasswordSchema.parse(req.body);
    const meta = getClientMeta(req);
    const user = await prisma.user.findUnique({ where: { email: body.email.toLowerCase().trim() } });

    if (!user) {
      return res.json({ message: 'Si l\'adresse e-mail existe, un lien de réinitialisation a été généré.' });
    }

    const resetToken = await sessionRepo.createVerificationToken(user.id, 'PASSWORD_RESET');
    await logAudit(user.id, 'auth.forgot_password', 'Demande de réinitialisation de mot de passe via Prisma', meta.ipAddress, meta.userAgent);

    return res.json({
      message: 'Un lien et un code de réinitialisation ont été générés.',
      simulatedResetCode: resetToken,
      resetUrl: `/reset-password?token=${resetToken}`
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.issues[0].message });
    }
    return res.status(500).json({ error: 'Erreur lors de la demande' });
  }
});

// 6. POST /api/reset-password
authRouter.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const body = ResetPasswordSchema.parse(req.body);

    const policy = validatePasswordPolicy(body.newPassword);
    if (!policy.valid) {
      return res.status(400).json({
        error: 'Le nouveau mot de passe ne respecte pas les exigences de sécurité',
        policyErrors: policy.errors
      });
    }

    const tokenRecord = await sessionRepo.findVerificationToken(body.token);

    if (!tokenRecord || tokenRecord.type !== 'PASSWORD_RESET') {
      return res.status(400).json({ error: 'Code ou token de réinitialisation invalide ou expiré' });
    }

    const user = await userService.getUserProfile(tokenRecord.userId);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur associé introuvable' });
    }

    const bcrypt = await import('bcryptjs');
    const newHash = await bcrypt.hash(body.newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash }
    });

    await sessionRepo.consumeVerificationToken(body.token);

    const meta = getClientMeta(req);
    await sessionService.revokeAllOtherSessions(user.id, '', meta.ipAddress, meta.userAgent);
    await logAudit(user.id, 'auth.reset_password', 'Mot de passe réinitialisé via code. Toutes les sessions révoquées.', meta.ipAddress, meta.userAgent);

    return res.json({ message: 'Mot de passe mis à jour avec succès. Veuillez vous connecter.' });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.issues[0].message });
    }
    return res.status(500).json({ error: 'Erreur lors de la réinitialisation du mot de passe' });
  }
});

// 7. POST /api/verify-email
authRouter.post('/verify-email', async (req: Request, res: Response) => {
  try {
    const body = VerifyEmailSchema.parse(req.body);
    const tokenRecord = await sessionRepo.findVerificationToken(body.token);

    if (!tokenRecord || tokenRecord.type !== 'EMAIL_VERIFY') {
      return res.status(400).json({ error: 'Token de vérification d\'email invalide ou expiré' });
    }

    const meta = getClientMeta(req);
    await userService.verifyEmail(tokenRecord.userId, meta.ipAddress, meta.userAgent);
    await sessionRepo.consumeVerificationToken(body.token);

    return res.json({ message: 'Adresse e-mail vérifiée avec succès' });
  } catch (err: any) {
    return res.status(400).json({ error: 'Erreur de vérification d\'e-mail' });
  }
});

// 8. POST /api/change-password & PUT /api/change-password
const handlePasswordChange = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const body = ChangePasswordSchema.parse(req.body);

    const policy = validatePasswordPolicy(body.newPassword);
    if (!policy.valid) {
      return res.status(400).json({
        error: 'Le nouveau mot de passe ne respecte pas les exigences de sécurité',
        policyErrors: policy.errors
      });
    }

    const meta = getClientMeta(req);

    await userService.changePassword(userId, body.currentPassword, body.newPassword, meta.ipAddress, meta.userAgent);
    return res.json({ message: 'Mot de passe modifié avec succès' });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.issues[0].message });
    }
    return res.status(400).json({ error: err.message || 'Erreur lors de la modification du mot de passe' });
  }
};

authRouter.post('/change-password', authenticateJwt, handlePasswordChange);
authRouter.put('/change-password', authenticateJwt, handlePasswordChange);
