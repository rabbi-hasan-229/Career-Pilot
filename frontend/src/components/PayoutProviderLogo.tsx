import React from 'react';
import type { PayoutProviderId } from '../features/experts/payoutProviders';
import { getPayoutProviderMeta } from '../features/experts/payoutProviders';

interface Props {
  provider: PayoutProviderId;
  size?: number;
}

/**
 * Renders crisp inline brand SVG icons/logos for each payout provider
 * (bKash, Nagad, Rocket, Upay, Bank Transfer, PayPal, Payoneer).
 */
export const PayoutProviderLogo: React.FC<Props> = ({ provider, size = 34 }) => {
  const meta = getPayoutProviderMeta(provider);
  const radius = Math.max(7, Math.round(size * 0.24));

  const renderGlyph = () => {
    switch (provider) {
      case 'bkash':
        // Origami hummingbird silhouette emblem
        return (
          <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M4 5.5L13.5 11.2L10.2 15.8L4 5.5Z"
              fill="#FFFFFF"
            />
            <path
              d="M13.5 11.2L20.5 7.5L15.6 14.5L10.2 15.8L13.5 11.2Z"
              fill="rgba(255,255,255,0.82)"
            />
            <path
              d="M10.2 15.8L15.6 14.5L12.4 19.5L10.2 15.8Z"
              fill="rgba(255,255,255,0.68)"
            />
          </svg>
        );
      case 'nagad':
        // Geometric flame / crescent mark
        return (
          <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M12.5 3.5C16.2 6.4 18 9.6 18 12.8C18 16.6 15.1 19.5 11.4 19.5C8.3 19.5 6 17.3 6 14.2C6 11.3 8.1 9.1 11.4 8.2C10.5 10 11 11.9 12.6 12.6C13.9 13.1 15 11.8 14.4 9.7C14 8.1 13.2 5.9 12.5 3.5Z"
              fill="#FFFFFF"
            />
          </svg>
        );
      case 'rocket':
        // Stylized DBBL rocket icon
        return (
          <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M14.5 4.2C17.4 4.2 19.8 6.6 19.8 9.5C19.8 12.1 17.2 15.1 14 17.6L11.2 14.8L6.4 10C8.9 6.8 11.9 4.2 14.5 4.2Z"
              fill="#FFFFFF"
            />
            <circle cx="14.5" cy="9.5" r="2" fill="#8C3494" />
            <path d="M5 19L8.8 15.2L10.4 16.8L6.6 20.6L5 19Z" fill="rgba(255,255,255,0.8)" />
          </svg>
        );
      case 'upay':
        // Upay U-shield with warm yellow accent spark
        return (
          <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M6.5 6.5V13.2C6.5 16.4 8.9 18.8 12 18.8C15.1 18.8 17.5 16.4 17.5 13.2V6.5H14.5V13.1C14.5 14.6 13.4 15.8 12 15.8C10.6 15.8 9.5 14.6 9.5 13.1V6.5H6.5Z"
              fill="#FFFFFF"
            />
            <circle cx="17.5" cy="5.5" r="2.2" fill="#FACC15" />
          </svg>
        );
      case 'bank_transfer':
        // Architectural bank pediment & pillars
        return (
          <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M3.5 9L12 4L20.5 9H3.5Z" fill="#FFFFFF" />
            <rect x="5.5" y="10.5" width="2.2" height="7" rx="0.5" fill="rgba(255,255,255,0.9)" />
            <rect x="10.9" y="10.5" width="2.2" height="7" rx="0.5" fill="rgba(255,255,255,0.9)" />
            <rect x="16.3" y="10.5" width="2.2" height="7" rx="0.5" fill="rgba(255,255,255,0.9)" />
            <rect x="3.5" y="18.5" width="17" height="2" rx="1" fill="#FFFFFF" />
          </svg>
        );
      case 'paypal':
        // Interlocking double-P PayPal monogram
        return (
          <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M7.5 5H13.2C15.8 5 17.2 6.4 16.8 8.9C16.3 11.7 14.2 13 11.4 13H9.5L8.6 18H6L7.5 5Z"
              fill="#FFFFFF"
            />
            <path
              d="M10.2 8.2H15.2C17.4 8.2 18.6 9.5 18.2 11.7C17.7 14.2 15.8 15.4 13.4 15.4H11.6L10.8 19.6H8.4L10.2 8.2Z"
              fill="#38BDF8"
              fillOpacity="0.9"
            />
          </svg>
        );
      case 'payoneer':
        // Payoneer multi-tone ring emblem
        return (
          <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle
              cx="12"
              cy="12"
              r="6.8"
              stroke="#FFFFFF"
              strokeWidth="3.2"
            />
            <path
              d="M12 5.2A6.8 6.8 0 0 1 18.8 12"
              stroke="#FACC15"
              strokeWidth="3.2"
              strokeLinecap="round"
            />
          </svg>
        );
    }
  };

  return (
    <span
      title={meta.label}
      style={{
        width: size,
        height: size,
        borderRadius: `${radius}px`,
        background: meta.brandColor,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        boxShadow: '0 2px 6px rgba(15, 23, 42, 0.14)',
      }}
    >
      {renderGlyph()}
    </span>
  );
};
