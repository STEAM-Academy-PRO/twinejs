import * as React from 'react';
import classNames from 'classnames';
import { IconX } from '@tabler/icons';
import { Toast as ToastType } from './toast.types';
import './toast-container.css';

interface ToastProps extends ToastType {
  onDismiss: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({
  id,
  type = 'info',
  message,
  duration = 5000,
  onDismiss,
}) => {
  const timerRef = React.useRef<NodeJS.Timeout>();

  React.useEffect(() => {
    if (duration) {
      timerRef.current = setTimeout(() => {
        onDismiss(id);
      }, duration);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [duration, id, onDismiss]);

  const toastClasses = classNames('toast', `toast-${type}`);

  return (
    <div className={toastClasses} role="alert">
      <div className="toast-message">{message}</div>
      <button
        type="button"
        className="toast-close"
        onClick={() => onDismiss(id)}
        aria-label="Dismiss message"
      >
        <IconX size={16} />
      </button>
    </div>
  );
};
