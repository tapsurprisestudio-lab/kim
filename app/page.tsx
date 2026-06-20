'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store';

export default function HomePage() {
  const router = useRouter();
  const session = useStore(s => s.session);
  const hasHydrated = useStore(s => s.hasHydrated);

  useEffect(() => {
    // Don't decide where to redirect until the persisted session has
    // actually been read from localStorage — otherwise an already
    // logged-in user briefly sees `session === null` on every refresh
    // and gets bounced to /login instead of straight back to their
    // dashboard.
    if (!hasHydrated) return;
    if (!session) {
      router.replace('/login');
    } else if (session.user.role === 'super_admin') {
      router.replace('/admin/dashboard');
    } else {
      router.replace('/erp/dashboard');
    }
  }, [hasHydrated, session, router]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{background: '#0a0f1e'}}>
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-blue-400">جارٍ التحميل...</p>
      </div>
    </div>
  );
}
