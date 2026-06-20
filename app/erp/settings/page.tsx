'use client';
import { useState, useEffect } from 'react';
import { useStore } from '@/store';
import { BUSINESS_TYPE_LABELS, PLAN_LABELS, formatDate } from '@/lib/utils';
import { Settings, Building2, CreditCard, Save, Bell } from 'lucide-react';

export default function CompanySettingsPage() {
  const { session, getCompanySettings, updateCompanySettings } = useStore();
  const company = session!.company!;
  const [toast, setToast] = useState('');
  const stored = getCompanySettings(company.id);
  const [form, setForm] = useState({
    invoicePrefix: stored.invoicePrefix,
    purchasePrefix: stored.purchasePrefix,
    lowStockThreshold: stored.lowStockThreshold,
    currencySymbol: stored.currencySymbol,
    notifyLowStock: stored.notifyLowStock,
    notifyOverdueInvoices: stored.notifyOverdueInvoices,
  });

  // Keep the form synced if settings are updated elsewhere (e.g. another
  // tab) while this page is open.
  useEffect(() => {
    const s = getCompanySettings(company.id);
    setForm({
      invoicePrefix: s.invoicePrefix,
      purchasePrefix: s.purchasePrefix,
      lowStockThreshold: s.lowStockThreshold,
      currencySymbol: s.currencySymbol,
      notifyLowStock: s.notifyLowStock,
      notifyOverdueInvoices: s.notifyOverdueInvoices,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company.id]);

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 3000); };

  const handleSave = () => {
    if (!form.invoicePrefix.trim() || !form.purchasePrefix.trim()) {
      showToast('يرجى تعبئة بادئتي الفواتير والمشتريات');
      return;
    }
    // This now actually persists to the store (and therefore localStorage
    // via Zustand persist) instead of only updating local component state
    // that was discarded on refresh. addInvoice/addPurchase read these
    // prefixes directly when generating serial numbers.
    updateCompanySettings(company.id, {
      invoicePrefix: form.invoicePrefix.trim().toUpperCase(),
      purchasePrefix: form.purchasePrefix.trim().toUpperCase(),
      lowStockThreshold: form.lowStockThreshold,
      currencySymbol: form.currencySymbol,
      notifyLowStock: form.notifyLowStock,
      notifyOverdueInvoices: form.notifyOverdueInvoices,
    });
    showToast('تم حفظ الإعدادات بنجاح ✅');
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="page-header">
        <div><h1 className="text-2xl font-bold text-white mb-1">الإعدادات</h1><p className="text-slate-400 text-sm">إعدادات شركتك على منصة Kimichi ERP</p></div>
      </div>

      <div className="kimichi-card p-6">
        <h3 className="text-sm font-semibold text-blue-400 mb-4 flex items-center gap-2"><Building2 size={16} /> معلومات الشركة</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><div className="text-xs text-slate-500 mb-1">اسم الشركة</div><div className="text-white">{company.name}</div></div>
          <div><div className="text-xs text-slate-500 mb-1">نوع النشاط</div><div className="text-white">{BUSINESS_TYPE_LABELS[company.businessType]}</div></div>
          <div><div className="text-xs text-slate-500 mb-1">المدينة</div><div className="text-white">{company.city}</div></div>
          <div><div className="text-xs text-slate-500 mb-1">الرقم التسلسلي</div><div className="text-white font-mono">{company.serialNumber}</div></div>
        </div>
        <p className="text-xs text-slate-500 mt-4">لتعديل معلومات الشركة الأساسية، يرجى التواصل مع دعم Kimichi.</p>
      </div>

      <div className="kimichi-card p-6">
        <h3 className="text-sm font-semibold text-blue-400 mb-4 flex items-center gap-2"><CreditCard size={16} /> الاشتراك</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><div className="text-xs text-slate-500 mb-1">الباقة الحالية</div><span className="badge badge-info">{PLAN_LABELS[company.subscriptionPlan]}</span></div>
          <div><div className="text-xs text-slate-500 mb-1">تاريخ الانتهاء</div><div className="text-white">{formatDate(company.subscriptionEndDate)}</div></div>
        </div>
      </div>

      <div className="kimichi-card p-6 max-w-2xl">
        <h3 className="text-sm font-semibold text-blue-400 mb-4 flex items-center gap-2"><Settings size={16} /> إعدادات النظام</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="form-label">بادئة رقم الفاتورة</label><input className="kimichi-input" value={form.invoicePrefix} onChange={e => setForm({ ...form, invoicePrefix: e.target.value })} /></div>
            <div><label className="form-label">بادئة رقم أمر الشراء</label><input className="kimichi-input" value={form.purchasePrefix} onChange={e => setForm({ ...form, purchasePrefix: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="form-label">حد التنبيه لانخفاض المخزون</label><input type="number" className="kimichi-input" value={form.lowStockThreshold} onChange={e => setForm({ ...form, lowStockThreshold: Number(e.target.value) })} /></div>
            <div><label className="form-label">رمز العملة</label><input className="kimichi-input" value={form.currencySymbol} onChange={e => setForm({ ...form, currencySymbol: e.target.value })} /></div>
          </div>
          <p className="text-xs text-slate-500">يتم تطبيق البادئتين تلقائيًا على كل فاتورة أو أمر شراء جديد بعد الحفظ (الفواتير/المشتريات الحالية لا تتأثر).</p>
        </div>
        <button onClick={handleSave} className="btn-primary mt-6"><Save size={14} /> حفظ الإعدادات</button>
      </div>

      <div className="kimichi-card p-6 max-w-2xl">
        <h3 className="text-sm font-semibold text-blue-400 mb-4 flex items-center gap-2"><Bell size={16} /> تفضيلات الإشعارات</h3>
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" checked={form.notifyLowStock} onChange={e => setForm({ ...form, notifyLowStock: e.target.checked })} className="accent-blue-500" /> تنبيه عند انخفاض المخزون</label>
          <label className="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" checked={form.notifyOverdueInvoices} onChange={e => setForm({ ...form, notifyOverdueInvoices: e.target.checked })} className="accent-blue-500" /> تنبيه عند تأخر الفواتير</label>
        </div>
        <button onClick={handleSave} className="btn-primary mt-6"><Save size={14} /> حفظ تفضيلات الإشعارات</button>
        <p className="text-xs text-slate-500 mt-3">⚠️ ملاحظة: هذه التفضيلات تُحفظ بنجاح، لكن لا يوجد بعد محرك إشعارات فعلي يرسل تنبيهات تلقائية بناءً عليها — راجع قسم القيود المعروفة في ملف README.</p>
      </div>

      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 fade-in"><div className="alert-success shadow-lg">{toast}</div></div>}
    </div>
  );
}
