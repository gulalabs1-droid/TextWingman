import { useState, useCallback } from 'react';

export interface Toast {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((options: Toast) => {
    // Simple alert for now - can be replaced with a proper toast component later
    if (options.variant === 'destructive') {
      alert(`Error: ${options.title}\n${options.description || ''}`);
    } else {
      alert(`${options.title}\n${options.description || ''}`);
    }
    
    setToasts((prev) => [...prev, options]);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.slice(1));
    }, 5000);
  }, []);

  return { toast, toasts };
}
