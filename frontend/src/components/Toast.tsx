/**
 * Toast notification system — fixed bottom-right notifications.
 *
 * Provides ToastProvider context and useToast hook for triggering
 * toast notifications from any component in the tree.
 *
 * Features:
 *   - Three types: success (green), error (red/accent), info (blue)
 *   - Auto-dismiss after 5 seconds with ref-based cleanup (AP-009)
 *   - Manual dismiss via X button
 *   - Optional transaction ID with ExplorerLink
 *   - Animated slide-in from right
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from 'react';

import { ExplorerLink } from './ExplorerLink';
import { cn } from '../lib/utils';

import type { ReactNode } from 'react';

/** Auto-dismiss delay in milliseconds. */
const TOAST_DISMISS_MS = 5000;

/** Toast notification type. */
export type ToastType = 'success' | 'error' | 'info';

/** Individual toast item. */
export interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
  txId?: string;
}

/** Options for showing a toast. */
export interface ShowToastOptions {
  type: ToastType;
  message: string;
  txId?: string;
}

/** Context value exposed by ToastProvider. */
interface ToastContextValue {
  showToast: (options: ShowToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * Hook to access the toast notification system.
 *
 * Must be used within a ToastProvider.
 */
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}

interface ToastProviderProps {
  children: ReactNode;
}

/**
 * Toast context provider — manages toast state and auto-dismiss timers.
 *
 * Wraps the application and renders the toast container overlay.
 * All setTimeout IDs are tracked in refs and cleaned up on unmount (AP-009).
 */
export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextIdRef = useRef(1);
  const timerMapRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  // Cleanup all timers on unmount (AP-009)
  useEffect(() => {
    return () => {
      timerMapRef.current.forEach((timerId) => clearTimeout(timerId));
      timerMapRef.current.clear();
    };
  }, []);

  /**
   * Remove a toast by its ID and clear its timer.
   */
  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timerId = timerMapRef.current.get(id);
    if (timerId !== undefined) {
      clearTimeout(timerId);
      timerMapRef.current.delete(id);
    }
  }, []);

  /**
   * Show a new toast notification.
   * Auto-dismisses after TOAST_DISMISS_MS.
   */
  const showToast = useCallback(
    (options: ShowToastOptions) => {
      const id = nextIdRef.current++;
      const item: ToastItem = {
        id,
        type: options.type,
        message: options.message,
        txId: options.txId,
      };

      setToasts((prev) => [...prev, item]);

      // Schedule auto-dismiss with ref cleanup (AP-009)
      const timerId = setTimeout(() => {
        dismissToast(id);
      }, TOAST_DISMISS_MS);
      timerMapRef.current.set(id, timerId);
    },
    [dismissToast],
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast container — fixed bottom-right */}
      <div
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm"
        aria-live="polite"
        aria-relevant="additions removals"
      >
        {toasts.map((toast) => (
          <ToastNotification
            key={toast.id}
            toast={toast}
            onDismiss={dismissToast}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

interface ToastNotificationProps {
  toast: ToastItem;
  onDismiss: (id: number) => void;
}

/**
 * Individual toast notification with type-based styling.
 */
function ToastNotification({ toast, onDismiss }: ToastNotificationProps) {
  const typeStyles: Record<ToastType, string> = {
    success: 'border-stream-green/40 bg-stream-green/10',
    error: 'border-accent/40 bg-accent/10',
    info: 'border-blue-400/40 bg-blue-400/10',
  };

  const iconColors: Record<ToastType, string> = {
    success: 'text-stream-green',
    error: 'text-accent',
    info: 'text-blue-400',
  };

  return (
    <div
      className={cn(
        'glass rounded-xl p-4 border shadow-lg',
        'animate-slide-in-right',
        typeStyles[toast.type],
      )}
      role="alert"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <span className={cn('text-lg mt-0.5 shrink-0', iconColors[toast.type])}>
          {toast.type === 'success' && '\u2713'}
          {toast.type === 'error' && '\u2717'}
          {toast.type === 'info' && '\u2139'}
        </span>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-text-light">{toast.message}</p>
          {toast.txId && (
            <div className="mt-1.5">
              <ExplorerLink txId={toast.txId} label="View transaction" />
            </div>
          )}
        </div>

        {/* Dismiss button */}
        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          className="shrink-0 text-text-light/40 hover:text-text-light transition-colors"
          aria-label="Dismiss notification"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            fill="currentColor"
            className="w-4 h-4"
          >
            <path
              d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
