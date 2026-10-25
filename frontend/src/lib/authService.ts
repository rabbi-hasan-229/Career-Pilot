// Re-export unified authentication service from features/auth/authService
export {
  authService,
  demoAccounts,
  generateDeterministicUserId,
} from '../features/auth/authService';

export type {
  AuthCredentials,
  AuthResult,
  SendOtpResult,
  VerifyOtpResult,
} from '../features/auth/authService';
