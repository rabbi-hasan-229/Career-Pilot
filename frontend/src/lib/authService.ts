// Re-export unified authentication service from features/auth/authService
export { authService } from '../features/auth/authService';

export type {
  AuthCredentials,
  AuthResult,
  SignUpParams,
  VerifySignUpOtpParams,
  SimpleAuthActionResult,
} from '../features/auth/authService';
