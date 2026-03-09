import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';
import type { ModalConfig } from '../types';

let modalEmitter: ((cfg: ModalConfig | null) => void) | null = null;

export function useModal() {
  const [modal, setModal] = useState<ModalConfig | null>(null);
  useEffect(() => {
    modalEmitter = setModal;
    return () => { modalEmitter = null; };
  }, []);
  return { modal, setModal };
}

export function showAlert(title: string, message: string): Promise<void> {
  return new Promise(resolve => {
    modalEmitter?.({
      type: 'alert', title, message,
      onConfirm: () => { modalEmitter?.(null); resolve(); }
    });
  });
}

export function showConfirm(title: string, message: string): Promise<boolean> {
  return new Promise(resolve => {
    modalEmitter?.({
      type: 'confirm', title, message,
      onConfirm: () => { modalEmitter?.(null); resolve(true); },
      onCancel: () => { modalEmitter?.(null); resolve(false); }
    });
  });
}

export function showPrompt(title: string, message: string, defaultValue = ''): Promise<string | null> {
  return new Promise(resolve => {
    modalEmitter?.({
      type: 'prompt', title, message, defaultValue,
      onConfirm: (value) => { modalEmitter?.(null); resolve(value ?? ''); },
      onCancel: () => { modalEmitter?.(null); resolve(null); }
    });
  });
}

export function Modal({ modal, setModal }: { modal: ModalConfig | null; setModal: (m: ModalConfig | null) => void }) {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (modal?.type === 'prompt') {
      setInputValue(modal.defaultValue || '');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [modal]);

  if (!modal) return null;

  const handleConfirm = () => modal.onConfirm(modal.type === 'prompt' ? inputValue : undefined);
  const handleCancel = () => { modal.onCancel?.(); setModal(null); };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[300] flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
        onClick={modal.type !== 'prompt' ? handleCancel : undefined}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={e => e.stopPropagation()}
          className="bg-[#1e293b] border border-[#334155] rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
        >
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <AlertTriangle size={18} className="text-blue-400" />
              </div>
              <h3 className="font-bold text-white text-base">{modal.title}</h3>
            </div>
            <button onClick={handleCancel} className="text-gray-500 hover:text-white p-1 rounded-lg hover:bg-white/10">
              <X size={16} />
            </button>
          </div>

          <div className="px-5 pb-2">
            <p className="text-gray-400 text-sm leading-relaxed">{modal.message}</p>
          </div>

          {modal.type === 'prompt' && (
            <div className="px-5 pb-2">
              <input
                ref={inputRef}
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleConfirm()}
                className="w-full bg-[#0f172a] border border-[#334155] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors mt-2"
              />
            </div>
          )}

          <div className="flex gap-2 px-5 pb-5 pt-3">
            {modal.type !== 'alert' && (
              <button
                onClick={handleCancel}
                className="flex-1 py-2.5 rounded-xl border border-[#334155] text-gray-400 hover:text-white hover:bg-white/5 text-sm font-medium transition-all"
              >
                Cancel
              </button>
            )}
            <button
              onClick={handleConfirm}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-all"
            >
              {modal.type === 'confirm' ? 'Confirm' : 'OK'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
