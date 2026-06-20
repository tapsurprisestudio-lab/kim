'use client';
import { useState } from 'react';
import { useStore } from '@/store';
import type { Company, SubscriptionPlan, BillingCycle, PaymentStatus } from '@/types';
import {
  formatCurrency, formatDate, getDaysRemaining, getSubscriptionStatus,
  PLAN_LABELS, PLAN_PRICES, BILLING_CYCLE_LABELS, PAYMENT_STATUS_LABELS, PAYMENT_STATUS_COLORS
} from '@/lib/utils';
import { generateSubscriptionInvoicePDF } from '@/lib/pdfService';
import {
  CreditCard, RefreshCw, X, Download, AlertTriangle, Calendar,
  TrendingUp, Ban, CheckCircle, Clock, FileText
} from 'lucide-react';

export default function SubscriptionsPage() {
  const { companies, subscriptionInvoices, updateCompany, addSubscriptionInvoice, suspendCompany, activateCompany } = useStore();
  const [tab, setTab] = useState<'overview' | 'invoices'>('overview');
  const [renewModal, setRenewModal] = useState<Company | null>(null);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const [renewForm, setRenewForm] = useState({
    plan: 'pro' as SubscriptionPlan,
    billingCycle: 'monthly' as BillingCycle,
    amount: 150,
    months: 1,
  });

  const openRenew = (c: Company) => {
    setRenewModal(c);
    setRenewForm({ plan: c.subscriptionPlan, billingCycle: c.billingCycle, amount: c.subscriptionPrice, months: 1 });
  };

  const handleRenew = () => {
    if (!renewModal) return;
    const currentEnd = new Date(renewModal.subscriptionEndDate);
    const baseDate = currentEnd > new Date() ? currentEnd : new Date();
    const newEnd = new Date(baseDate);
    newEnd.setMonth(newEnd.getMonth() + renewForm.months);

    updateCompany(renewModal.id, {
      subscriptionPlan: renewForm.plan,
      billingCycle: renewForm.billingCycle,
      subscriptionPrice: renewForm.amount,
      subscriptionEndDate: newEnd.toISOString().slice(0, 10),
      paymentStatus: 'paid',
      status: renewModal.status === 'expired' || renewModal.status === 'suspended' ? 'active' : renewModal.status,
    });

    addSubscriptionInvoice({
      companyId: renewModal.id,
      companyName: renewModal.name,
      plan: renewForm.plan,
      billingCycle: renewForm.billingCycle,
      amount: renewForm.amount,
      startDate: new Date().toISOString().slice(0, 10),
      endDate: newEnd.toISOString().slice(0, 10),
      paymentStatus: 'paid',
      paidAt: new Date().toISOString(),
      notes: 'تجديد اشتراك',
    });

    showToast('تم تجديد الاشتراك بنجاح ✅');
    setRenewModal(null);
  };

  const handleCancel = (c: Company) => {
    updateCompany(c.id, { status: 'expired', paymentStatus: 'cancelled' });
    showToast('تم إلغاء الاشتراك');
  };

  // Stats
  const expiringSoon = companies.filter(c => { const d = getDaysRemaining(c.subscriptionEndDate); return d >= 0 && d <= 30; });
  const expired = companies.filter(c => getDaysRemaining(c.subscriptionEndDate) < 0);
  const overdue = companies.filter(c => c.paymentStatus === 'overdue');
  const totalActive = companies.filter(c => c.status === 'active').length;

  const planDistribution = Object.entries(PLAN_LABELS).map(([key, label]) => ({
    key, label, count: companies.filter(c => c.subscriptionPlan === key).length,
    revenue: companies.filter(c => c.subscriptionPlan === key).reduce((s, c) => s + c.subscriptionPrice, 0),
  }));

  return (
    <div className="space-y-6 fade-in">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">إدارة الاشتراكات</h1>
          <p className="text-slate-400 text-sm">تتبع وتجديد اشتراكات الشركات</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2"><CheckCircle size={16} className="text-green-400" /><span className="text-xs text-slate-400">نشطة</span></div>
          <div className="text-2xl font-bold text-white">{totalActive}</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2"><Clock size={16} className="text-yellow-400" /><span className="text-xs text-slate-400">تنتهي قريباً</span></div>
          <div className="text-2xl font-bold text-white">{expiringSoon.length}</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2"><AlertTriangle size={16} className="text-red-400" /><span className="text-xs text-slate-400">منتهية</span></div>
          <div className="text-2xl font-bold text-white">{expired.length}</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2"><CreditCard size={16} className="text-orange-400" /><span className="text-xs text-slate-400">دفعات متأخرة</span></div>
          <div className="text-2xl font-bold text-white">{overdue.length}</div>
        </div>
      </div>

      {/* Plan distribution */}
      <div className="kimichi-card p-5">
        <h3 className="text-sm font-semibold text-slate-300 mb-4">توزيع الباقات</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {planDistribution.map(p => (
            <div key={p.key} className="p-3 rounded-lg text-center" style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.1)' }}>
              <div className="text-xs text-slate-400 mb-1">{p.label}</div>
              <div className="text-xl font-bold text-blue-400">{p.count}</div>
              <div className="text-xs text-slate-500">{formatCurrency(p.revenue)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b" style={{ borderColor: 'rgba(59,130,246,0.1)' }}>
        <button onClick={() => setTab('overview')} className={`px-4 py-2 text-sm ${tab === 'overview' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-500'}`}>نظرة عامة</button>
        <button onClick={() => setTab('invoices')} className={`px-4 py-2 text-sm ${tab === 'invoices' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-500'}`}>فواتير الاشتراكات</button>
      </div>

      {tab === 'overview' && (
        <div className="kimichi-card overflow-x-auto">
          <table className="kimichi-table">
            <thead>
              <tr>
                <th>الشركة</th>
                <th>الباقة</th>
                <th>السعر</th>
                <th>دورة الفوترة</th>
                <th>تاريخ الانتهاء</th>
                <th>الحالة</th>
                <th>حالة الدفع</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {companies.map(c => {
                const sub = getSubscriptionStatus(c);
                return (
                  <tr key={c.id}>
                    <td className="font-medium text-white">{c.name}</td>
                    <td><span className="badge badge-info">{PLAN_LABELS[c.subscriptionPlan]}</span></td>
                    <td>{formatCurrency(c.subscriptionPrice)}</td>
                    <td className="text-xs">{BILLING_CYCLE_LABELS[c.billingCycle]}</td>
                    <td className="text-xs text-slate-400">{formatDate(c.subscriptionEndDate)}</td>
                    <td><span className={`badge ${sub.color}`}>{sub.label}</span></td>
                    <td><span className={`badge ${PAYMENT_STATUS_COLORS[c.paymentStatus]}`}>{PAYMENT_STATUS_LABELS[c.paymentStatus]}</span></td>
                    <td>
                      <div className="flex gap-1">
                        <button onClick={() => openRenew(c)} className="p-1.5 rounded hover:bg-green-500/10 text-green-400" title="تجديد/تمديد"><RefreshCw size={14} /></button>
                        {c.status === 'suspended' ? (
                          <button onClick={() => { activateCompany(c.id); showToast('تم التفعيل'); }} className="p-1.5 rounded hover:bg-green-500/10 text-green-400" title="تفعيل"><CheckCircle size={14} /></button>
                        ) : (
                          <button onClick={() => { suspendCompany(c.id); showToast('تم الإيقاف'); }} className="p-1.5 rounded hover:bg-red-500/10 text-red-400" title="إيقاف"><Ban size={14} /></button>
                        )}
                        <button onClick={() => handleCancel(c)} className="p-1.5 rounded hover:bg-slate-500/10 text-slate-400" title="إلغاء الاشتراك"><X size={14} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'invoices' && (
        <div className="kimichi-card overflow-x-auto">
          <table className="kimichi-table">
            <thead>
              <tr>
                <th>رقم الفاتورة</th>
                <th>الشركة</th>
                <th>الباقة</th>
                <th>المبلغ</th>
                <th>الفترة</th>
                <th>حالة الدفع</th>
                <th>تاريخ الإصدار</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {subscriptionInvoices.length === 0 && (
                <tr><td colSpan={8} className="text-center text-slate-500 py-8">لا توجد فواتير</td></tr>
              )}
              {subscriptionInvoices.slice().reverse().map(inv => (
                <tr key={inv.id}>
                  <td className="text-xs text-blue-400 font-mono">#{inv.id.slice(0, 8).toUpperCase()}</td>
                  <td>{inv.companyName}</td>
                  <td><span className="badge badge-info">{PLAN_LABELS[inv.plan]}</span></td>
                  <td className="font-medium text-white">{formatCurrency(inv.amount)}</td>
                  <td className="text-xs text-slate-400">{inv.startDate} → {inv.endDate}</td>
                  <td><span className={`badge ${PAYMENT_STATUS_COLORS[inv.paymentStatus]}`}>{PAYMENT_STATUS_LABELS[inv.paymentStatus]}</span></td>
                  <td className="text-xs text-slate-400">{formatDate(inv.createdAt)}</td>
                  <td>
                    <button onClick={() => generateSubscriptionInvoicePDF(inv)} className="p-1.5 rounded hover:bg-blue-500/10 text-blue-400" title="تحميل PDF"><FileText size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Renew Modal */}
      {renewModal && (
        <div className="modal-overlay" onClick={() => setRenewModal(null)}>
          <div className="modal-content w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <RefreshCw size={18} className="text-green-400" />
                تجديد اشتراك {renewModal.name}
              </h2>
              <button onClick={() => setRenewModal(null)} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="form-label">الباقة</label>
                <select className="kimichi-select" value={renewForm.plan} onChange={e => setRenewForm({ ...renewForm, plan: e.target.value as SubscriptionPlan, amount: PLAN_PRICES[e.target.value as SubscriptionPlan] })}>
                  {Object.entries(PLAN_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">دورة الفوترة</label>
                <select className="kimichi-select" value={renewForm.billingCycle} onChange={e => setRenewForm({ ...renewForm, billingCycle: e.target.value as BillingCycle })}>
                  {Object.entries(BILLING_CYCLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">عدد الأشهر للتمديد</label>
                <input type="number" min={1} className="kimichi-input" value={renewForm.months} onChange={e => setRenewForm({ ...renewForm, months: Number(e.target.value) })} />
              </div>
              <div>
                <label className="form-label">المبلغ (د.ل)</label>
                <input type="number" className="kimichi-input" value={renewForm.amount} onChange={e => setRenewForm({ ...renewForm, amount: Number(e.target.value) })} />
              </div>

              <div className="alert-info flex items-center gap-2">
                <Calendar size={14} />
                تاريخ الانتهاء الحالي: {formatDate(renewModal.subscriptionEndDate)}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={handleRenew} className="btn-success flex-1 justify-center py-2.5">تأكيد التجديد</button>
              <button onClick={() => setRenewModal(null)} className="btn-ghost px-6">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 fade-in">
          <div className="alert-success shadow-lg">{toast}</div>
        </div>
      )}
    </div>
  );
}
