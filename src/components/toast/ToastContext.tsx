import * as React from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Toast as ToastType, ToastType as ToastTypeEnum } from './toast.types';
import { ToastContainer } from './ToastContainer';

interface ToastContextType {
  showToast: (message: string, type?: ToastTypeEnum, duration?: number) => void;
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = React.useState<ToastType[]>([]);

  const showToast = (
    message: string,
    type: ToastTypeEnum = 'info',
    duration: number = 5000,
  ) => {
    const id = uuidv4();
    setToasts((prevToasts) => [
      ...prevToasts,
      { id, message, type, duration },
    ]);
  };

  const dismissToast = (id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  };

  const contextValue = React.useMemo(
    () => ({
      showToast,
      showSuccess: (message: string, duration?: number) =>
        showToast(message, 'success', duration),
      showError: (message: string, duration?: number) =>
        showToast(message, 'error', duration),
      showInfo: (message: string, duration?: number) =>
        showToast(message, 'info', duration),
      showWarning: (message: string, duration?: number) =>
        showToast(message, 'warning', duration),
    }),
    [],
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = React.useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
