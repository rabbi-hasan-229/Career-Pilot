import type { ExpertPayoutMethod } from '../../types';

export type PayoutProviderId =
  | 'bkash'
  | 'nagad'
  | 'rocket'
  | 'upay'
  | 'bank_transfer'
  | 'paypal'
  | 'payoneer';

export type MobileWalletAccountType = 'Personal' | 'Merchant' | 'Agent';

export interface PayoutProviderMeta {
  id: PayoutProviderId;
  label: string;
  subtitle: string;
  methodType: ExpertPayoutMethod['method_type'];
  brandColor: string;
  surfaceTint: string;
}

export const PAYOUT_PROVIDERS: PayoutProviderMeta[] = [
  {
    id: 'bkash',
    label: 'bKash',
    subtitle: 'Mobile Wallet',
    methodType: 'mobile_banking',
    brandColor: '#E2136E',
    surfaceTint: 'rgba(226, 19, 110, 0.08)',
  },
  {
    id: 'nagad',
    label: 'Nagad',
    subtitle: 'Mobile Wallet',
    methodType: 'mobile_banking',
    brandColor: '#F26522',
    surfaceTint: 'rgba(242, 101, 34, 0.08)',
  },
  {
    id: 'rocket',
    label: 'Rocket',
    subtitle: 'DBBL Mobile',
    methodType: 'mobile_banking',
    brandColor: '#8C3494',
    surfaceTint: 'rgba(140, 52, 148, 0.08)',
  },
  {
    id: 'upay',
    label: 'Upay',
    subtitle: 'UCB Fintech',
    methodType: 'mobile_banking',
    brandColor: '#0072BC',
    surfaceTint: 'rgba(0, 114, 188, 0.08)',
  },
  {
    id: 'bank_transfer',
    label: 'Bank Transfer',
    subtitle: 'BEFTN / Wire',
    methodType: 'bank_transfer',
    brandColor: '#123C69',
    surfaceTint: 'rgba(18, 60, 105, 0.08)',
  },
  {
    id: 'paypal',
    label: 'PayPal',
    subtitle: 'Global Payout',
    methodType: 'paypal',
    brandColor: '#003087',
    surfaceTint: 'rgba(0, 48, 135, 0.08)',
  },
  {
    id: 'payoneer',
    label: 'Payoneer',
    subtitle: 'USD Payout',
    methodType: 'paypal',
    brandColor: '#FF4800',
    surfaceTint: 'rgba(255, 72, 0, 0.08)',
  },
];

export const BANK_OPTIONS = [
  'BRAC Bank PLC',
  'The City Bank',
  'Dutch-Bangla Bank (DBBL)',
  'Eastern Bank PLC (EBL)',
  'Islami Bank Bangladesh',
  'Prime Bank PLC',
  'Mutual Trust Bank (MTB)',
  'HSBC / Standard Chartered',
  'Other Bank',
] as const;

export interface BuildPayoutCredentialsInput {
  provider: PayoutProviderId;
  accountHolderName: string;
  // Mobile banking fields
  mobileNumber?: string;
  mobileAccountType?: MobileWalletAccountType;
  // Bank transfer fields
  bankName?: string;
  customBankName?: string;
  bankAccountNumber?: string;
  bankBranch?: string;
  routingOrSwift?: string;
  // Email-based wallets (PayPal / Payoneer)
  walletEmail?: string;
}

export interface BuiltPayoutMethodPayload {
  methodType: ExpertPayoutMethod['method_type'];
  accountLabel: string;
  maskedDestination: string;
}

function clampLabel(text: string, maxLen: number): string {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  return cleaned.length > maxLen ? cleaned.slice(0, maxLen).trim() : cleaned;
}

export function maskMobileNumber(raw: string): string {
  const cleaned = raw.replace(/[\s\-()]/g, '');
  if (cleaned.length <= 6) return cleaned;
  const prefix = cleaned.slice(0, 5);
  const suffix = cleaned.slice(-3);
  return `${prefix}***${suffix}`;
}

export function maskBankAccountNumber(raw: string): string {
  const cleaned = raw.replace(/\s+/g, '');
  const tail = cleaned.slice(-4);
  return `A/C ****${tail}`;
}

export function maskWalletEmail(raw: string): string {
  const trimmed = raw.trim().toLowerCase();
  const [local, domain] = trimmed.split('@');
  if (!local || !domain) return trimmed;
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local.slice(0, 2)}***@${domain}`;
}

/**
 * Validates provider-specific payout credentials and formats clean DB-safe
 * `account_label` and `masked_destination` fields (within 2-80 / 3-80 chars).
 */
export function buildPayoutMethodPayload(
  input: BuildPayoutCredentialsInput
): BuiltPayoutMethodPayload {
  const meta = PAYOUT_PROVIDERS.find((p) => p.id === input.provider) ?? PAYOUT_PROVIDERS[0];
  const holder = input.accountHolderName.trim();
  if (holder.length < 2) {
    throw new Error('Enter the account holder full name.');
  }

  if (
    input.provider === 'bkash' ||
    input.provider === 'nagad' ||
    input.provider === 'rocket' ||
    input.provider === 'upay'
  ) {
    const normalizedDigits = (input.mobileNumber ?? '').replace(/[\s\-()]/g, '');
    const stripped = normalizedDigits.startsWith('+88')
      ? normalizedDigits.slice(3)
      : normalizedDigits.startsWith('880')
        ? normalizedDigits.slice(2)
        : normalizedDigits;

    const isBdNumber = /^01[3-9]\d{8}$/.test(stripped);
    const isIntlNumber = /^\+?\d{10,15}$/.test(normalizedDigits);

    if (!isBdNumber && !isIntlNumber) {
      throw new Error(`Enter a valid 11-digit ${meta.label} number (e.g. 01712345678).`);
    }

    const walletType: MobileWalletAccountType = input.mobileAccountType || 'Personal';
    const displayPhone = maskMobileNumber(isBdNumber ? stripped : normalizedDigits);

    return {
      methodType: 'mobile_banking',
      accountLabel: clampLabel(`${meta.label} (${walletType}) · ${holder}`, 80),
      maskedDestination: clampLabel(`${displayPhone} · ${meta.label} ${walletType}`, 80),
    };
  }

  if (input.provider === 'bank_transfer') {
    const chosenBank =
      input.bankName === 'Other Bank'
        ? (input.customBankName ?? '').trim()
        : (input.bankName ?? '').trim();
    if (chosenBank.length < 2) {
      throw new Error('Select or enter your bank name.');
    }

    const cleanAcct = (input.bankAccountNumber ?? '').replace(/[\s-]/g, '');
    if (!/^[A-Za-z0-9]{6,24}$/.test(cleanAcct)) {
      throw new Error('Enter a valid bank account number (6 to 24 digits/characters).');
    }

    const branch = (input.bankBranch ?? '').trim();
    const routing = (input.routingOrSwift ?? '').trim().toUpperCase();
    const destParts = [
      maskBankAccountNumber(cleanAcct),
      branch || null,
      routing ? `Rt/SWIFT ${routing}` : null,
    ].filter((part): part is string => Boolean(part));

    return {
      methodType: 'bank_transfer',
      accountLabel: clampLabel(`${chosenBank} · ${holder}`, 80),
      maskedDestination: clampLabel(destParts.join(' · '), 80),
    };
  }

  // PayPal / Payoneer
  const email = (input.walletEmail ?? '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error(`Enter a valid ${meta.label} email address.`);
  }

  return {
    methodType: 'paypal',
    accountLabel: clampLabel(`${meta.label} · ${holder}`, 80),
    maskedDestination: clampLabel(maskWalletEmail(email), 80),
  };
}

/**
 * Infers the exact payout provider brand from a saved payout method or withdrawal summary
 * so every row displays an accurate logo badge.
 */
export function inferPayoutProvider(
  source: Pick<ExpertPayoutMethod, 'method_type' | 'account_label' | 'masked_destination'> | string
): PayoutProviderId {
  const text =
    typeof source === 'string'
      ? source.toLowerCase()
      : `${source.account_label} ${source.masked_destination}`.toLowerCase();

  if (text.includes('bkash')) return 'bkash';
  if (text.includes('nagad')) return 'nagad';
  if (text.includes('rocket')) return 'rocket';
  if (text.includes('upay')) return 'upay';
  if (text.includes('payoneer')) return 'payoneer';
  if (text.includes('paypal')) return 'paypal';

  if (typeof source !== 'string') {
    if (source.method_type === 'paypal') return 'paypal';
    if (source.method_type === 'mobile_banking') return 'bkash';
  }
  return 'bank_transfer';
}

export function getPayoutProviderMeta(providerId: PayoutProviderId): PayoutProviderMeta {
  return PAYOUT_PROVIDERS.find((p) => p.id === providerId) ?? PAYOUT_PROVIDERS[0];
}
