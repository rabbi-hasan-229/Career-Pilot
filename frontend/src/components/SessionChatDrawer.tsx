import React from 'react';
import type { ExpertBooking } from '../types';
import { useAccessibleDialog } from '../hooks/useAccessibleDialog';
import { SessionChatThread } from './SessionChatThread';

interface Props {
  booking: ExpertBooking | null;
  currentUserId: string;
  currentUserName: string;
  isDemo?: boolean;
  onClose: () => void;
  onToast: (msg: string) => void;
}

export const SessionChatDrawer: React.FC<Props> = ({
  booking,
  currentUserId,
  currentUserName,
  isDemo = false,
  onClose,
  onToast,
}) => {
  const dialogRef = useAccessibleDialog(Boolean(booking), onClose);

  if (!booking) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1550,
        background: 'rgba(15, 23, 42, 0.56)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        justifyContent: 'flex-end',
      }}
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="1-on-1 Session Coordination Chat"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '460px',
          height: '100%',
          background: 'var(--md-surface)',
          color: 'var(--md-text-primary)',
          borderLeft: '1px solid var(--md-outline)',
          boxShadow: '-12px 0 36px rgba(15, 23, 42, 0.16)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <SessionChatThread
          key={booking.id}
          booking={booking}
          currentUserId={currentUserId}
          currentUserName={currentUserName}
          isDemo={isDemo}
          onClose={onClose}
          onToast={onToast}
        />
      </div>
    </div>
  );
};
