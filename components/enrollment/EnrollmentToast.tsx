'use client';

import { useEffect } from 'react';
import { CheckCircle2, X } from 'lucide-react';

interface ToastProps {
  open: boolean;
  message: string;
  onClose: () => void;
}

export default function EnrollmentToast({ open, message, onClose }: ToastProps) {
  useEffect(() => {
    if (open) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[60] animate-fade-in">
      <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-white px-4 py-3 shadow-lg">
        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
        <p className="text-sm font-medium text-slate-800">{message}</p>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}