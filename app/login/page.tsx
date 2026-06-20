'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store';
import { Eye, EyeOff, Shield, Building2, Zap } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, session, hasHydrated } = useStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Wait for hydration so we don't briefly render the login form for an
    // already-authenticated user before bouncing them onward.
    if (!hasHydrated) return;
    if (session) {
      if (session.user.role === 'super_admin') router.replace('/admin/dashboard');
      else router.replace('/erp/dashboard');
    }
  }, [hasHydrated, session, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    const result = login(username, password);
    setLoading(false);
    if (result.success) {
      const s = useStore.getState().session;
      if (s?.user.role === 'super_admin') router.push('/admin/dashboard');
      else router.push('/erp/dashboard');
    } else {
      setError(result.error || 'خطأ في تسجيل الدخول');
    }
  };

  const quickFill = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError('');
  };

  const quickAccounts = [
    { label: 'مشرف Kimichi', username: 'admin', password: '123456', icon: '👑', color: 'border-purple-500/40 hover:border-purple-400' },
    { label: 'مالك شركة', username: 'owner', password: '123456', icon: '🏢', color: 'border-blue-500/40 hover:border-blue-400' },
    { label: 'محاسب', username: 'accountant', password: '123456', icon: '📊', color: 'border-green-500/40 hover:border-green-400' },
    { label: 'مندوب مبيعات', username: 'salesman', password: '123456', icon: '💼', color: 'border-yellow-500/40 hover:border-yellow-400' },
    { label: 'مستودع', username: 'warehouse', password: '123456', icon: '📦', color: 'border-orange-500/40 hover:border-orange-400' },
  ];

  return (
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg, #030712 0%, #0a0f1e 50%, #0d1426 100%)' }}>
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex flex-1 flex-col items-center justify-center p-16 relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-green-500/8 rounded-full blur-3xl"></div>
          <div className="absolute top-3/4 left-1/2 w-48 h-48 bg-blue-400/5 rounded-full blur-2xl"></div>
        </div>

        <div className="relative z-10 text-center">
          {/* Logo */}
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-blue-500/30" style={{ boxShadow: '0 0 40px rgba(59,130,246,0.3), 0 0 80px rgba(59,130,246,0.1)' }}>
                <img src="https://i.imgur.com/1bmshnE.png" alt="Kimichi ERP" className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-400 rounded-full flex items-center justify-center">
                <Zap size={16} className="text-gray-900" />
              </div>
            </div>
          </div>

          <h1 className="text-5xl font-bold mb-3" style={{ background: 'linear-gradient(135deg, #60a5fa, #34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Kimichi ERP
          </h1>
          <p className="text-xl text-blue-300 mb-2">منصة إدارة الأعمال المتكاملة</p>
          <p className="text-slate-500 text-sm mb-12">نظام SaaS متعدد الشركات - ليبيا وما بعدها</p>

          {/* Feature cards */}
          <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
            {[
              { icon: '🏢', title: 'متعدد الشركات', desc: 'إدارة مئات الشركات' },
              { icon: '📊', title: 'تقارير ذكية', desc: 'تحليل بيانات متكامل' },
              { icon: '🔒', title: 'أمان متقدم', desc: 'عزل كامل للبيانات' },
              { icon: '📄', title: 'PDF تلقائي', desc: 'فواتير احترافية' },
            ].map((f, i) => (
              <div key={i} className="kimichi-card p-4 text-right">
                <div className="text-2xl mb-2">{f.icon}</div>
                <div className="text-sm font-semibold text-blue-300">{f.title}</div>
                <div className="text-xs text-slate-500">{f.desc}</div>
              </div>
            ))}
          </div>

          <div className="mt-10 flex items-center justify-center gap-4 text-xs text-slate-600">
            <span>📧 kimichierp@gmail.com</span>
            <span>•</span>
            <span>📱 +49 177 7952971</span>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-[480px] flex flex-col justify-center p-8 relative" style={{ background: 'rgba(13,20,38,0.98)', borderRight: '1px solid rgba(59,130,246,0.1)' }}>
        {/* Mobile logo */}
        <div className="lg:hidden flex justify-center mb-8">
          <img src="https://i.imgur.com/1bmshnE.png" alt="Kimichi ERP" className="w-20 h-20 rounded-full" />
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-1">مرحباً بك</h2>
          <p className="text-slate-400 text-sm">سجّل الدخول إلى حساب Kimichi ERP</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="form-label">اسم المستخدم</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="أدخل اسم المستخدم"
              className="kimichi-input"
              required
              autoComplete="username"
            />
          </div>

          <div>
            <label className="form-label">كلمة المرور</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="أدخل كلمة المرور"
                className="kimichi-input pl-10"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="alert-danger fade-in flex items-start gap-2">
              <Shield size={16} className="mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full justify-center py-3 text-base font-semibold"
            style={{ background: 'linear-gradient(135deg, #2563eb 0%, #0ea5e9 100%)' }}
          >
            {loading ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> جارٍ تسجيل الدخول...</>
            ) : (
              <><Shield size={16} /> تسجيل الدخول</>
            )}
          </button>
        </form>

        {/* Quick Fill Accounts */}
        <div className="mt-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-slate-800"></div>
            <span className="text-xs text-slate-500 px-2">حسابات تجريبية</span>
            <div className="flex-1 h-px bg-slate-800"></div>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {quickAccounts.map((acc, i) => (
              <button
                key={i}
                type="button"
                onClick={() => quickFill(acc.username, acc.password)}
                className={`flex items-center gap-3 p-3 rounded-lg border bg-transparent text-right transition-all cursor-pointer ${acc.color}`}
                style={{ borderWidth: '1px' }}
              >
                <span className="text-lg">{acc.icon}</span>
                <div className="flex-1">
                  <div className="text-xs font-medium text-slate-300">{acc.label}</div>
                  <div className="text-xs text-slate-600">{acc.username} / {acc.password}</div>
                </div>
                <span className="text-xs text-slate-600">اضغط للملء</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 text-center text-xs text-slate-600">
          <p>Kimichi ERP © {new Date().getFullYear()} - جميع الحقوق محفوظة</p>
          <p className="mt-1">
            <a href="mailto:kimichierp@gmail.com" className="hover:text-blue-400 transition-colors">kimichierp@gmail.com</a>
            {' • '}
            <a href="https://wa.me/4917779529271" target="_blank" rel="noopener noreferrer" className="hover:text-green-400 transition-colors">WhatsApp</a>
          </p>
        </div>
      </div>
    </div>
  );
}
