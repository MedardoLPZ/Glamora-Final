import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '../../lib/utils';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

// Global variables to interact with the toast system
let toasts: Toast[] = [];
let setToastsState: React.Dispatch<React.SetStateAction<Toast[]>> | null = null;

export function toast(message: string, type: ToastType = 'info') {
  const id = Math.random().toString(36).substring(2, 9);
  const newToast = { id, message, type };
  
  toasts = [...toasts, newToast];
  if (setToastsState) {
    setToastsState([...toasts]);
  }

  // Auto remove toast after 5 seconds
  setTimeout(() => {
    removeToast(id);
  }, 5000);

  return id;
}

export function removeToast(id: string) {
  toasts = toasts.filter(toast => toast.id !== id);
  if (setToastsState) {
    setToastsState([...toasts]);
  }
}

export function Toaster() {
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null);
  const [visibleToasts, setVisibleToasts] = useState<Toast[]>([]);

  // Store the setter in our global variable
  setToastsState = setVisibleToasts;

  useEffect(() => {
    setMountNode(document.body);
    
    // Initialize with any existing toasts
    if (toasts.length > 0) {
      setVisibleToasts([...toasts]);
    }
    
    return () => {
      setToastsState = null;
    };
  }, []);

  if (!mountNode) return null;

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-success-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-error-500" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-primary-500" />;
    }
  };

  const getBgColor = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'bg-success-50 border-success-200';
      case 'error':
        return 'bg-error-50 border-error-200';
      case 'info':
      default:
        return 'bg-primary-50 border-primary-200';
    }
  };

  return createPortal(
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md">
      {visibleToasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'flex items-center py-3 px-4 rounded-lg border shadow-sm animate-fade-in',
            getBgColor(toast.type)
          )}
          role="alert"
        >
          <div className="flex-shrink-0 mr-3">{getIcon(toast.type)}</div>
          <div className="flex-1 mr-2 text-sm">{toast.message}</div>
          <button
            onClick={() => removeToast(toast.id)}
            className="flex-shrink-0 p-1 rounded-full hover:bg-gray-200 transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      ))}
    </div>,
    mountNode
  );
}