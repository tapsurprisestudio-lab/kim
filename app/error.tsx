'use client';
import { useEffect } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

export default function RootError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Logged client-side only; this app has no backend/error-reporting
    // service to forward this to. See README "Known limitations".
    console.error('Kimichi ERP runtime error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#0a0f1e' }}>
      <div className="max-w-md w-full text-center kimichi-card p-8">
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(220,38,38,0.12)' }}>
          <AlertTriangle size={28} className="text-red-400" />
        </div>
        <h1 className="text-lg font-bold text-white mb-2">حدث خطأ غير متوقع</h1>
        <p className="text-sm text-slate-400 mb-6">
          نأسف على هذا الخطأ. يمكنك المحاولة مرة أخرى أو العودة إلى الصفحة الرئيسية. إذا استمرت المشكلة، يرجى التواصل مع الدعم.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button onClick={reset} className="btn-primary">
            <RotateCcw size={16} /> إعادة المحاولة
          </button>
          <a href="/" className="btn-ghost">
            <Home size={16} /> الصفحة الرئيسية
          </a>
        </div>
      </div>
    </div>
  );
}
