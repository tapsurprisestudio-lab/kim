'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useStore } from '@/store';
import {
  LayoutDashboard, Users, Package, Warehouse, FileText, Wallet,
  Truck, ShoppingCart, Receipt, UserCheck, BarChart3, Bot,
  UserCog, Settings, MessageCircle, LogOut, Menu, X, ChevronDown, Bell
} from 'lucide-react';
import { ROLE_LABELS } from '@/lib/utils';
import { isRoleAllowedForPath, getFallbackRouteForRole } from '@/lib/roleAccess';

const allNavItems = [
  { href: '/erp/dashboard', icon: LayoutDashboard, label: 'لوحة التحكم', roles: ['owner', 'admin', 'accountant', 'salesman', 'warehouse'] },
  { href: '/erp/customers', icon: Users, label: 'العملاء', roles: ['owner', 'admin', 'accountant', 'salesman'] },
  { href: '/erp/products', icon: Package, label: 'المنتجات', roles: ['owner', 'admin', 'accountant', 'salesman', 'warehouse'] },
  { href: '/erp/inventory', icon: Warehouse, label: 'المخزون', roles: ['owner', 'admin', 'warehouse'] },
  { href: '/erp/invoices', icon: FileText, label: 'الفواتير', roles: ['owner', 'admin', 'accountant', 'salesman'] },
  { href: '/erp/debt', icon: Wallet, label: 'تحصيل الديون', roles: ['owner', 'admin', 'accountant'] },
  { href: '/erp/suppliers', icon: Truck, label: 'الموردين', roles: ['owner', 'admin', 'accountant'] },
  { href: '/erp/purchases', icon: ShoppingCart, label: 'المشتريات', roles: ['owner', 'admin', 'warehouse'] },
  { href: '/erp/expenses', icon: Receipt, label: 'المصروفات', roles: ['owner', 'admin', 'accountant'] },
  { href: '/erp/salesmen', icon: UserCheck, label: 'المندوبين', roles: ['owner', 'admin'] },
  { href: '/erp/reports', icon: BarChart3, label: 'التقارير', roles: ['owner', 'admin', 'accountant'] },
  { href: '/erp/assistant', icon: Bot, label: 'المساعد الذكي', roles: ['owner', 'admin'] },
  { href: '/erp/employees', icon: UserCog, label: 'الموظفين', roles: ['owner', 'admin'] },
  { href: '/erp/settings', icon: Settings, label: 'الإعدادات', roles: ['owner', 'admin'] },
  { href: '/erp/support', icon: MessageCircle, label: 'الدعم', roles: ['owner', 'admin', 'accountant', 'salesman', 'warehouse'] },
];

export default function ERPLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { session, logout, getCompanyUnreadNotifications, hasHydrated } = useStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Wait for the persisted store to actually finish loading from
  // localStorage before making any auth decision. Without this, `session`
  // briefly reads as `null` on every hard refresh (even for an already
  // logged-in user), which could either bounce them to /login by mistake
  // or, worse, let child pages run with `session` still null and throw on
  // `session!.company!.id`. This directly fixes that hydration race.
  useEffect(() => {
    if (!hasHydrated) return;
    if (!session || session.user.role === 'super_admin') {
      router.replace('/login');
      return;
    }
    // Real, path-level role enforcement — not just hiding the sidebar
    // link. A salesman typing /erp/employees into the address bar is
    // bounced to a route their role can actually use, instead of being
    // able to view/operate owner-only pages.
    if (!isRoleAllowedForPath(session.user.role, pathname)) {
      router.replace(getFallbackRouteForRole(session.user.role));
    }
  }, [hasHydrated, session, pathname, router]);

  // Loading state while the persisted store hydrates. Shown instead of a
  // blank screen / a flash of the login page / a crash on session!.x.
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

  if (!session || session.user.role === 'super_admin' || !session.company) return null;
  if (!isRoleAllowedForPath(session.user.role, pathname)) return null;

  const navItems = allNavItems.filter(item => item.roles.includes(session.user.role));
  const unreadNotifs = getCompanyUnreadNotifications(session.company.id);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#0a0f1e' }}>
      {/* Sidebar */}
      <aside
        className={`flex flex-col transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-16'}`}
        style={{ background: 'linear-gradient(180deg, #0d1426 0%, #0a1020 100%)', borderLeft: '1px solid rgba(59,130,246,0.15)', flexShrink: 0 }}
      >
        <div className="flex items-center gap-3 p-4 border-b" style={{ borderColor: 'rgba(59,130,246,0.1)', minHeight: 64 }}>
          <div className="w-9 h-9 rounded-full flex-shrink-0 overflow-hidden" style={{ boxShadow: '0 0 12px rgba(59,130,246,0.4)', border: '1px solid rgba(59,130,246,0.3)' }}>
            <img src="https://i.imgur.com/1bmshnE.png" alt="K" className="w-full h-full object-cover" />
          </div>
          {sidebarOpen && (
            <div className="min-w-0">
              <div className="font-bold text-sm truncate" style={{ background: 'linear-gradient(135deg,#60a5fa,#34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {session.company.name}
              </div>
              <div className="text-xs text-slate-500">{ROLE_LABELS[session.user.role]}</div>
            </div>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-slate-400 hover:text-white transition-colors" style={{ marginRight: sidebarOpen ? 'auto' : 0 }}>
            {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            const badge = item.href === '/erp/dashboard' && unreadNotifs > 0 ? unreadNotifs : 0;
            return (
              <Link key={item.href} href={item.href} className={`sidebar-item ${isActive ? 'active' : ''} ${!sidebarOpen ? 'justify-center' : ''}`} title={!sidebarOpen ? item.label : undefined}>
                <Icon size={18} className="flex-shrink-0" />
                {sidebarOpen && <span className="flex-1">{item.label}</span>}
                {sidebarOpen && badge > 0 && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full text-white font-bold" style={{ background: '#dc2626', minWidth: 18, textAlign: 'center' }}>{badge}</span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t" style={{ borderColor: 'rgba(59,130,246,0.1)' }}>
          <div className={`flex items-center gap-2 p-2 rounded-lg ${sidebarOpen ? '' : 'justify-center'}`} style={{ background: 'rgba(59,130,246,0.06)' }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg,#22c55e,#0ea5e9)' }}>
              <span className="text-xs font-bold text-white">{session.user.name.charAt(0)}</span>
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-slate-200 truncate">{session.user.name}</div>
                <div className="text-xs text-slate-500">{ROLE_LABELS[session.user.role]}</div>
              </div>
            )}
            {sidebarOpen && (
              <button onClick={handleLogout} className="text-slate-500 hover:text-red-400 transition-colors" title="تسجيل الخروج"><LogOut size={14} /></button>
            )}
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="flex items-center justify-between px-6 border-b" style={{ height: 64, background: 'rgba(13,20,38,0.98)', borderColor: 'rgba(59,130,246,0.1)', backdropFilter: 'blur(10px)', flexShrink: 0 }}>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#4ade80' }}></div>
              <span className="text-xs text-slate-400">{session.company.name}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/erp/dashboard" className="relative text-slate-400 hover:text-white">
              <Bell size={18} />
              {unreadNotifs > 0 && <span className="absolute -top-1 -left-1 w-4 h-4 rounded-full text-[10px] flex items-center justify-center text-white font-bold" style={{ background: '#dc2626' }}>{unreadNotifs}</span>}
            </Link>
            <div className="relative">
              <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}>
                <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#22c55e,#0ea5e9)' }}>
                  <span className="text-xs font-bold text-white">{session.user.name.charAt(0)}</span>
                </div>
                <span className="text-sm text-slate-300">{session.user.name}</span>
                <ChevronDown size={14} className="text-slate-400" />
              </button>
              {userMenuOpen && (
                <div className="absolute left-0 top-full mt-2 w-48 rounded-xl overflow-hidden z-50" style={{ background: '#0d1426', border: '1px solid rgba(59,130,246,0.2)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
                  <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(59,130,246,0.1)' }}>
                    <div className="text-xs font-medium text-white">{session.user.name}</div>
                    <div className="text-xs text-slate-500">{ROLE_LABELS[session.user.role]}</div>
                  </div>
                  <button onClick={handleLogout} className="flex items-center gap-2 w-full px-4 py-3 text-sm text-red-400 hover:bg-red-400/10 transition-colors">
                    <LogOut size={14} /> تسجيل الخروج
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>

      {userMenuOpen && <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />}
    </div>
  );
}
