import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
};

const colors = {
  success: 'bg-success/20 border-success text-success',
  error: 'bg-danger/20 border-danger text-danger',
  warning: 'bg-yellow-500/20 border-yellow-500 text-yellow-500',
  info: 'bg-accent/20 border-accent text-accent',
};

export function Toast({ message, type, onClose, duration = 3000 }: ToastProps) {
  const Icon = icons[type];

  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-5 py-4 rounded-2xl border-2 backdrop-blur-xl shadow-2xl ${colors[type]}`}
    >
      <Icon size={24} />
      <span className="font-medium text-white">{message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-70 transition">
        <X size={18} />
      </button>
    </motion.div>
  );
}

interface ToastState {
  id: number;
  message: string;
  type: ToastType;
}

let toastId = 0;
let addToastFn: ((message: string, type: ToastType) => void) | null = null;

export function showToast(message: string, type: ToastType = 'info') {
  if (addToastFn) {
    addToastFn(message, type);
  }
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastState[]>([]);

  useEffect(() => {
    addToastFn = (message: string, type: ToastType) => {
      const id = ++toastId;
      setToasts((prev) => [...prev, { id, message, type }]);
    };

    return () => {
      addToastFn = null;
    };
  }, []);

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <>
      {children}
      <AnimatePresence>
        {toasts.map((toast, index) => (
          <div
            key={toast.id}
            style={{ top: `${16 + index * 80}px` }}
            className="fixed left-1/2 -translate-x-1/2 z-[100]"
          >
            <Toast
              message={toast.message}
              type={toast.type}
              onClose={() => removeToast(toast.id)}
            />
          </div>
        ))}
      </AnimatePresence>
    </>
  );
}
