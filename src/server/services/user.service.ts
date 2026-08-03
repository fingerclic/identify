import { UserRepository } from '../repositories/user.repository';
import { logger } from '../security/logger';
import { comparePassword, hashPassword } from '../auth/password';

export class UserService {
  private userRepo = new UserRepository();

  async getUserProfile(userId: string) {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new Error('Utilisateur introuvable');
    const { passwordHash, ...publicUser } = user;
    return publicUser;
  }

  async updateProfile(userId: string, updates: any, ipAddress: string, userAgent: string) {
    const updated = await this.userRepo.updateProfile(userId, updates);
    if (!updated) throw new Error('Utilisateur introuvable');

    const fieldsUpdated = Object.keys(updates);
    await logger.logProfileUpdate({
      userId,
      fieldsUpdated,
      ipAddress,
      userAgent
    });
    const { passwordHash, ...publicUser } = updated;
    return publicUser;
  }

  async changePassword(userId: string, currentPass: string, newPass: string, ipAddress: string, userAgent: string) {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new Error('Utilisateur introuvable');

    const isValid = await comparePassword(currentPass, user.passwordHash);
    if (!isValid) throw new Error('Le mot de passe actuel est incorrect');

    const newHash = await hashPassword(newPass);
    await this.userRepo.updatePassword(userId, newHash);

    await logger.logProfileUpdate({
      userId,
      fieldsUpdated: ['password'],
      ipAddress,
      userAgent
    });
  }

  async verifyEmail(userId: string, ipAddress: string, userAgent: string) {
    await this.userRepo.verifyEmail(userId);
    await logger.logProfileUpdate({
      userId,
      fieldsUpdated: ['emailVerified'],
      ipAddress,
      userAgent
    });
  }
}
