'use client';
import { useEffect } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Kimichi ERP (admin segment) runtime error:', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center py-24">
      <div className="max-w-md w-full text-center kimichi-card p-8">
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(220,38,38,0.12)' }}>
          <AlertTriangle size={28} className="text-red-400" />
        </div>
        <h1 className="text-lg font-bold text-white mb-2">حدث خطأ في هذه الصفحة</h1>
        <p className="text-sm text-slate-400 mb-6">حاول إعادة تحميل الصفحة.</p>
        <button onClick={reset} className="btn-primary inline-flex">
          <RotateCcw size={16} /> إعادة المحاولة
        </button>
      </div>
    </div>
  );
}
