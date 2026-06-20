'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useStore } from '@/store';
import {
  LayoutDashboard, Building2, CreditCard, Bell, MessageCircle,
  Shield, BarChart3, Settings, LogOut, Menu, X, ChevronDown,
  Zap, AlertCircle
} from 'lucide-react';

const navItems = [
  { href: '/admin/dashboard', icon: LayoutDashboard, label: 'مركز القيادة' },
  { href: '/admin/companies', icon: Building2, label: 'إدارة الشركات' },
  { href: '/admin/subscriptions', icon: CreditCard, label: 'الاشتراكات' },
  { href: '/admin/notifications', icon: Bell, label: 'الإشعارات' },
  { href: '/admin/support', icon: MessageCircle, label: 'الدعم والرسائل' },
  { href: '/admin/security', icon: Shield, label: 'الأمان والسجلات' },
  { href: '/admin/reports', icon: BarChart3, label: 'التقارير' },
  { href: '/admin/settings', icon: Settings, label: 'إعدادات Kimichi' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { session, logout, companies, getUnreadSupportCount, securityLogs, hasHydrated } = useStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // See app/erp/layout.tsx for why this hydration check is necessary —
  // same Zustand persist race applies here.
  useEffect(() => {
    if (!hasHydrated) return;
    if (!session || session.user.role !== 'super_admin') {
      router.replace('/login');
    }
  }, [hasHydrated, session, router]);

  if (!hasHydrated) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: '#0a0f1e' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#3b82f6', borderTopColor: 'transparent' }} />
          <span className="text-sm text-slate-400">جاري التحميل...</span>
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== 'super_admin') return null;

  const unreadSupport = getUnreadSupportCount();
  const recentAlerts = securityLogs.filter(l => l.severity === 'warning' || l.severity === 'critical').length;

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#0a0f1e' }}>
      {/* Sidebar */}
      <aside
        className={`flex flex-col transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-16'}`}
        style={{
          background: 'linear-gradient(180deg, #0d1426 0%, #0a1020 100%)',
          borderLeft: '1px solid rgba(59,130,246,0.15)',
          flexShrink: 0,
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 p-4 border-b" style={{ borderColor: 'rgba(59,130,246,0.1)', minHeight: 64 }}>
          <div
            className="w-9 h-9 rounded-full flex-shrink-0 overflow-hidden"
            style={{ boxShadow: '0 0 12px rgba(59,130,246,0.4)', border: '1px solid rgba(59,130,246,0.3)' }}
          >
            <img src="https://i.imgur.com/1bmshnE.png" alt="K" className="w-full h-full object-cover" />
          </div>
          {sidebarOpen && (
            <div>
              <div className="font-bold text-sm" style={{ background: 'linear-gradient(135deg,#60a5fa,#34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Kimichi ERP
              </div>
              <div className="text-xs text-slate-500">Super Admin</div>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="mr-auto text-slate-400 hover:text-white transition-colors"
            style={{ marginRight: sidebarOpen ? 'auto' : 0 }}
          >
            {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            const badge = item.href === '/admin/support' && unreadSupport > 0 ? unreadSupport : 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-item ${isActive ? 'active' : ''} ${!sidebarOpen ? 'justify-center' : ''}`}
                title={!sidebarOpen ? item.label : undefined}
              >
                <Icon size={18} className="flex-shrink-0" />
                {sidebarOpen && (
                  <span className="flex-1">{item.label}</span>
                )}
                {sidebarOpen && badge > 0 && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full text-white font-bold" style={{ background: '#dc2626', minWidth: 18, textAlign: 'center' }}>{badge}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom user area */}
        <div className="p-3 border-t" style={{ borderColor: 'rgba(59,130,246,0.1)' }}>
          <div className={`flex items-center gap-2 p-2 rounded-lg ${sidebarOpen ? '' : 'justify-center'}`} style={{ background: 'rgba(59,130,246,0.06)' }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}>
              <span className="text-xs font-bold text-white">K</span>
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-slate-200 truncate">Kimichi Admin</div>
                <div className="text-xs text-slate-500">Super Admin</div>
              </div>
            )}
            {sidebarOpen && (
              <button onClick={handleLogout} className="text-slate-500 hover:text-red-400 transition-colors" title="تسجيل الخروج">
                <LogOut size={14} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header
          className="flex items-center justify-between px-6 border-b"
          style={{
            height: 64,
            background: 'rgba(13,20,38,0.98)',
            borderColor: 'rgba(59,130,246,0.1)',
            backdropFilter: 'blur(10px)',
            flexShrink: 0,
          }}
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#4ade80' }}></div>
              <span className="text-xs text-slate-400">النظام يعمل</span>
            </div>
            <div className="text-xs text-slate-600">|</div>
            <span className="text-xs text-slate-400">{companies.length} شركة مسجلة</span>
          </div>

          <div className="flex items-center gap-4">
            {recentAlerts > 0 && (
              <div className="flex items-center gap-1 text-xs px-2 py-1 rounded-full" style={{ background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.2)', color: '#facc15' }}>
                <AlertCircle size={12} />
                {recentAlerts} تنبيه أمني
              </div>
            )}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors"
                style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}
              >
                <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}>
                  <span className="text-xs font-bold text-white">K</span>
                </div>
                <span className="text-sm text-slate-300">Kimichi Admin</span>
                <ChevronDown size={14} className="text-slate-400" />
              </button>

              {userMenuOpen && (
                <div
                  className="absolute left-0 top-full mt-2 w-48 rounded-xl overflow-hidden z-50"
                  style={{ background: '#0d1426', border: '1px solid rgba(59,130,246,0.2)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}
                >
                  <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(59,130,246,0.1)' }}>
                    <div className="text-xs font-medium text-white">Kimichi Admin</div>
                    <div className="text-xs text-slate-500">kimichierp@gmail.com</div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full px-4 py-3 text-sm text-red-400 hover:bg-red-400/10 transition-colors"
                  >
                    <LogOut size={14} />
                    تسجيل الخروج
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>

      {/* Click outside to close user menu */}
      {userMenuOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
      )}
    </div>
  );
}
