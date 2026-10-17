import React from 'react';
import { LogOut, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirmSignOut: () => void;
}

export const SignOutModal: React.FC<Props> = ({ isOpen, onClose, onConfirmSignOut }) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2500,
        background: 'rgba(15, 23, 42, 0.72)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out',
        fontFamily: "'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
      onClick={onClose}
    >
      {/* Modal Dialog Window */}
      <div
        className="signout-modal-card"
        style={{
          width: '100%',
          maxWidth: '740px',
          background: '#FFFFFF',
          borderRadius: '24px',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'row',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button at top right */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'rgba(241, 245, 249, 0.85)',
            border: 'none',
            borderRadius: '9999px',
            padding: '6px',
            cursor: 'pointer',
            color: '#64748B',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Cancel"
        >
          <X size={16} />
        </button>

        {/* ======================================================== */}
        {/* LEFT PANEL: MOUNTAIN LANDSCAPE WITH WOODEN SIGNPOST       */}
        {/* ======================================================== */}
        <div
          className="signout-left-panel"
          style={{
            width: '42%',
            position: 'relative',
            background: '#0B1E38',
            overflow: 'hidden',
            minHeight: '360px',
            flexShrink: 0,
          }}
        >
          <img
            src="/assets/signout-mountain-desktop.png"
            alt="Signpost on mountain road"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
            }}
          />
        </div>

        {/* Mobile Header Graphic (Only visible on screens < 640px) */}
        <div
          className="signout-mobile-header"
          style={{
            display: 'none',
            position: 'relative',
            width: '100%',
            height: '140px',
            background: '#0B1E38',
            overflow: 'hidden',
          }}
        >
          <img
            src="/assets/signout-mountain-mobile.png"
            alt="Signpost on mountain road"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
            }}
          />
        </div>

        {/* ======================================================== */}
        {/* RIGHT PANEL: SIGN OUT CONFIRMATION CARD                  */}
        {/* ======================================================== */}
        <div
          className="signout-right-panel"
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 36px',
            textAlign: 'center',
            background: '#FFFFFF',
          }}
        >
          {/* Circular Blue Badge with Logout Icon */}
          <div
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: '#EFF6FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '18px',
              boxShadow: '0 4px 14px rgba(29, 104, 242, 0.15)',
            }}
          >
            <LogOut size={26} color="#1D68F2" strokeWidth={2.4} style={{ marginLeft: '3px' }} />
          </div>

          {/* Heading */}
          <h2
            style={{
              fontSize: '24px',
              fontWeight: 800,
              color: '#0F172A',
              letterSpacing: '-0.02em',
              margin: '0 0 10px 0',
            }}
          >
            Sign out?
          </h2>

          {/* Description */}
          <p
            style={{
              fontSize: '13.5px',
              color: '#64748B',
              lineHeight: 1.5,
              maxWidth: '300px',
              margin: '0 0 28px 0',
            }}
          >
            You'll need to sign in again to access your career roadmaps and progress.
          </p>

          {/* Buttons */}
          <div style={{ width: '100%', maxWidth: '300px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              type="button"
              onClick={onConfirmSignOut}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                border: 'none',
                background: '#1D68F2',
                color: '#FFFFFF',
                fontSize: '13.5px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(29, 104, 242, 0.35)',
                transition: 'background 0.15s ease',
              }}
            >
              Yes, sign out
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                border: '1px solid #E2E8F0',
                background: '#FFFFFF',
                color: '#334155',
                fontSize: '13.5px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background 0.15s ease, border-color 0.15s ease',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
