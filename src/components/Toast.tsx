import React, { useState, useCallback, useEffect } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { Toast } from '../types';

let toastEmitter: ((t: Toast) => void) | null = null;

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    toastEmitter = (t: Toast) => setToasts(prev => [...prev, t]);
    return () => { toastEmitter = null; };
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return { toasts, dismiss };
}

export function toast(type: Toast['type'], message: string) {
  const t: Toast = { id: Math.random().toString(36).slice(2), type, message };
  if (toastEmitter) toastEmitter(t);
}

const ICONS = {
  success: <CheckCircle2 size={16} className="text-green-400 shrink-0" />,
  error: <XCircle size={16} className="text-red-400 shrink-0" />,
  warning: <AlertTriangle size={16} className="text-yellow-400 shrink-0" />,
  info: <Info size={16} className="text-blue-400 shrink-0" />,
};

const COLORS = {
  success: 'border-green-500/40 bg-green-950/60',
  error: 'border-red-500/40 bg-red-950/60',
  warning: 'border-yellow-500/40 bg-yellow-950/60',
  info: 'border-blue-500/40 bg-blue-950/60',
};

function ToastItem({ t, onDismiss }: { t: Toast; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 3500);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 60, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.9 }}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-md shadow-xl max-w-sm text-sm ${COLORS[t.type]}`}
    >
      {ICONS[t.type]}
      <span className="flex-1 text-white">{t.message}</span>
      <button onClick={onDismiss} className="text-gray-400 hover:text-white transition-colors">
        <X size={14} />
      </button>
    </motion.div>
  );
}

export function ToastContainer({ toasts, dismiss }: { toasts: Toast[]; dismiss: (id: string) => void }) {
  return (
    <div className="fixed bottom-8 right-4 z-[200] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem t={t} onDismiss={() => dismiss(t.id)} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
