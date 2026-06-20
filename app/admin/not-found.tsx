import Link from 'next/link';
import { Compass } from 'lucide-react';

export default function AdminNotFound() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="max-w-md w-full text-center kimichi-card p-8">
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(59,130,246,0.12)' }}>
          <Compass size={28} className="text-blue-400" />
        </div>
        <h1 className="text-lg font-bold text-white mb-2">الصفحة غير موجودة</h1>
        <p className="text-sm text-slate-400 mb-6">الرابط الذي حاولت الوصول إليه غير موجود في لوحة الإدارة.</p>
        <Link href="/admin/dashboard" className="btn-primary inline-flex">العودة للوحة التحكم</Link>
      </div>
    </div>
  );
}
