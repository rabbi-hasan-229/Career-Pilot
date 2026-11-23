import { describe, expect, it } from 'vitest';
import {
  buildPayoutMethodPayload,
  inferPayoutProvider,
  maskBankAccountNumber,
  maskMobileNumber,
  maskWalletEmail,
} from './payoutProviders';

describe('payoutProviders', () => {
  it('validates and formats bKash and Nagad mobile banking credentials', () => {
    const bkash = buildPayoutMethodPayload({
      provider: 'bkash',
      accountHolderName: 'Rabbi Hasan',
      mobileNumber: '01712345678',
      mobileAccountType: 'Personal',
    });

    expect(bkash.methodType).toBe('mobile_banking');
    expect(bkash.accountLabel).toBe('bKash (Personal) · Rabbi Hasan');
    expect(bkash.maskedDestination).toBe('01712***678 · bKash Personal');
    expect(inferPayoutProvider({ method_type: bkash.methodType, account_label: bkash.accountLabel, masked_destination: bkash.maskedDestination })).toBe('bkash');

    const nagad = buildPayoutMethodPayload({
      provider: 'nagad',
      accountHolderName: 'Amina Rahman',
      mobileNumber: '+880 1812-345678',
      mobileAccountType: 'Merchant',
    });
    expect(nagad.maskedDestination).toBe('01812***678 · Nagad Merchant');
    expect(inferPayoutProvider({ method_type: nagad.methodType, account_label: nagad.accountLabel, masked_destination: nagad.maskedDestination })).toBe('nagad');

    expect(() =>
      buildPayoutMethodPayload({
        provider: 'bkash',
        accountHolderName: 'Rabbi',
        mobileNumber: '12345',
      })
    ).toThrow(/11-digit bKash number/);
  });

  it('validates and formats Bank Transfer credentials with routing/branch info within DB bounds', () => {
    const bank = buildPayoutMethodPayload({
      provider: 'bank_transfer',
      accountHolderName: 'Md. Rabbi Hasan',
      bankName: 'BRAC Bank PLC',
      bankAccountNumber: '15012044821001',
      bankBranch: 'Gulshan Avenue',
      routingOrSwift: '060261726',
    });

    expect(bank.methodType).toBe('bank_transfer');
    expect(bank.accountLabel).toBe('BRAC Bank PLC · Md. Rabbi Hasan');
    expect(bank.accountLabel.length).toBeLessThanOrEqual(80);
    expect(bank.maskedDestination).toBe('A/C ****1001 · Gulshan Avenue · Rt/SWIFT 060261726');
    expect(bank.maskedDestination.length).toBeLessThanOrEqual(80);
    expect(inferPayoutProvider({ method_type: bank.methodType, account_label: bank.accountLabel, masked_destination: bank.maskedDestination })).toBe('bank_transfer');
  });

  it('validates PayPal and Payoneer emails and masks destinations cleanly', () => {
    const paypal = buildPayoutMethodPayload({
      provider: 'paypal',
      accountHolderName: 'Rabbi Hasan',
      walletEmail: 'rabbi.dev@example.com',
    });
    expect(paypal.methodType).toBe('paypal');
    expect(paypal.maskedDestination).toBe('ra***@example.com');
    expect(inferPayoutProvider({ method_type: paypal.methodType, account_label: paypal.accountLabel, masked_destination: paypal.maskedDestination })).toBe('paypal');

    const payoneer = buildPayoutMethodPayload({
      provider: 'payoneer',
      accountHolderName: 'Rabbi Hasan',
      walletEmail: 'payouts@studio.io',
    });
    expect(inferPayoutProvider({ method_type: payoneer.methodType, account_label: payoneer.accountLabel, masked_destination: payoneer.maskedDestination })).toBe('payoneer');

    expect(maskMobileNumber('01712345678')).toBe('01712***678');
    expect(maskBankAccountNumber('15012044821001')).toBe('A/C ****1001');
    expect(maskWalletEmail('ab@test.com')).toBe('a***@test.com');
  });
});
