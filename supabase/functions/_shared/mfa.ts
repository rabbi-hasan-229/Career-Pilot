import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';

export async function hasMfaAssurance(
  admin: SupabaseClient,
  userId: string,
  accessToken: string,
): Promise<boolean> {
  const [{ data: assurance, error: assuranceError }, { data: factors, error: factorsError }] = await Promise.all([
    admin.auth.mfa.getAuthenticatorAssuranceLevel(accessToken),
    admin.auth.admin.mfa.listFactors({ userId }),
  ]);
  if (assuranceError || factorsError) {
    throw new Error('Could not verify the account multi-factor state.');
  }
  const hasVerifiedFactor = factors.factors.some((factor) =>
    factor.status === 'verified' && ['totp', 'phone', 'webauthn'].includes(factor.factor_type)
  );
  return !hasVerifiedFactor || assurance.currentLevel === 'aal2';
}
