import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[contenteditable="true"]',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/** Keeps keyboard focus inside an open custom dialog and returns it to its trigger on close. */
export function useAccessibleDialog<T extends HTMLElement = HTMLDivElement>(
  isOpen: boolean,
  onClose?: () => void,
) {
  const dialogRef = useRef<T>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!isOpen || !dialog) return;

    const previousFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const previousOverflow = document.body.style.overflow;
    const getFocusableElements = () => Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
      .filter((element) => !element.matches(':disabled') && !element.hidden && element.getAttribute('aria-hidden') !== 'true' && element.getClientRects().length > 0);

    document.body.style.overflow = 'hidden';
    const preferredFocus = dialog.querySelector<HTMLElement>('[data-dialog-initial-focus]');
    const initialFocus = preferredFocus && preferredFocus.getClientRects().length > 0
      ? preferredFocus
      : getFocusableElements()[0] ?? dialog;
    initialFocus.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (onCloseRef.current) {
          event.preventDefault();
          onCloseRef.current();
        }
        return;
      }

      if (event.key !== 'Tab') return;
      const focusable = getFocusableElements();
      if (focusable.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog || !dialog.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialog || !dialog.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [isOpen]);

  return dialogRef;
}
