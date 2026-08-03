export interface PasswordPolicyResult {
  valid: boolean;
  score: number; // 0 to 4 strength score
  errors: string[];
}

/**
 * Enterprise Password Policy Evaluator
 * Checks for:
 * - Minimum 8 characters
 * - At least 1 uppercase letter (A-Z)
 * - At least 1 lowercase letter (a-z)
 * - At least 1 digit (0-9)
 * - At least 1 special character (!@#$%^&*...)
 * - Strength Score calculation (0 to 4)
 */
export function validatePasswordPolicy(password: string): PasswordPolicyResult {
  const errors: string[] = [];
  let score = 0;

  if (password.length < 8) {
    errors.push('Le mot de passe doit contenir au moins 8 caractères');
  } else {
    score++;
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Le mot de passe doit inclure au moins une lettre majuscule (A-Z)');
  } else {
    score++;
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Le mot de passe doit inclure au moins une lettre minuscule (a-z)');
  } else {
    score++;
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Le mot de passe doit inclure au moins un chiffre (0-9)');
  } else {
    score++;
  }

  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  if (hasSpecial) {
    score++;
  } else {
    errors.push('Le mot de passe doit inclure au moins un caractère spécial (!@#$%^&*)');
  }

  return {
    valid: errors.length === 0,
    score: Math.min(score, 4),
    errors
  };
}
