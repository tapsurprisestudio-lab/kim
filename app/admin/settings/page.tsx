'use client';
import { useState, useEffect } from 'react';
import { Settings, Mail, Phone, Globe, Shield, Save } from 'lucide-react';

const STORAGE_KEY = 'kimichi-admin-platform-settings';

const defaultSettings = {
  platformName: 'Kimichi ERP',
  email: 'kimichierp@gmail.com',
  phone: '+49 177 7952971',
  currency: 'د.ل',
  defaultTrialDays: 30,
  logoUrl: 'https://i.imgur.com/1bmshnE.png',
};

export default function AdminSettingsPage() {
  const [toast, setToast] = useState('');
  const [settings, setSettings] = useState(defaultSettings);

  // Load from localStorage on mount so settings survive a page refresh.
  // These are UI/branding preferences for this browser session only —
  // they are NOT synced to any server or shared between admin users.
  // A real multi-admin deployment would need a server-side config table.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setSettings({ ...defaultSettings, ...JSON.parse(saved) });
    } catch { /* ignore parse errors */ }
  }, []);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const handleSave = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      showToast('تم حفظ الإعدادات محلياً ✅');
    } catch {
      showToast('فشل الحفظ — تحقق من مساحة المتصفح');
    }
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">إعدادات Kimichi</h1>
          <p className="text-slate-400 text-sm">إعدادات عامة لمنصة Kimichi ERP</p>
        </div>
      </div>

      <div className="kimichi-card p-6 max-w-2xl">
        <h3 className="text-sm font-semibold text-blue-400 mb-4 flex items-center gap-2"><Settings size={16} /> الإعدادات العامة</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <img src={settings.logoUrl} alt="logo" className="w-16 h-16 rounded-full border border-blue-500/30" />
            <div className="flex-1">
              <label className="form-label">رابط الشعار</label>
              <input className="kimichi-input" value={settings.logoUrl} onChange={e => setSettings({ ...settings, logoUrl: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="form-label">اسم المنصة</label>
            <input className="kimichi-input" value={settings.platformName} onChange={e => setSettings({ ...settings, platformName: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label flex items-center gap-1"><Mail size={12} /> البريد الإلكتروني الرسمي</label>
              <input className="kimichi-input" value={settings.email} onChange={e => setSettings({ ...settings, email: e.target.value })} />
            </div>
            <div>
              <label className="form-label flex items-center gap-1"><Phone size={12} /> رقم الواتساب</label>
              <input className="kimichi-input" value={settings.phone} onChange={e => setSettings({ ...settings, phone: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label flex items-center gap-1"><Globe size={12} /> العملة الافتراضية</label>
              <input className="kimichi-input" value={settings.currency} onChange={e => setSettings({ ...settings, currency: e.target.value })} />
            </div>
            <div>
              <label className="form-label">عدد أيام الفترة التجريبية</label>
              <input type="number" className="kimichi-input" value={settings.defaultTrialDays} onChange={e => setSettings({ ...settings, defaultTrialDays: Number(e.target.value) })} />
            </div>
          </div>
        </div>

        <button onClick={handleSave} className="btn-primary mt-6">
          <Save size={14} /> حفظ الإعدادات
        </button>
        <p className="text-xs text-slate-500 mt-3">⚠️ هذه الإعدادات تُحفظ في المتصفح المحلي فقط (localStorage). لن تنتقل إلى متصفح آخر أو مستخدم آخر حتى يتوفر خادم خلفي حقيقي.</p>
      </div>

      <div className="kimichi-card p-6 max-w-2xl">
        <h3 className="text-sm font-semibold text-blue-400 mb-4 flex items-center gap-2"><Shield size={16} /> الأمان</h3>
        <p className="text-sm text-slate-400">سياسات الأمان والصلاحيات تُدار حالياً من خلال الأدوار الثابتة في النظام (super_admin, owner, admin, accountant, salesman, warehouse). فقط مشرف Kimichi يملك صلاحية الوصول الكامل لجميع الشركات.</p>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 fade-in">
          <div className="alert-success shadow-lg">{toast}</div>
        </div>
      )}
    </div>
  );
}
