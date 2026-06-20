'use client';
import { useState } from 'react';
import { useStore } from '@/store';
import type { Company, BusinessType, SubscriptionPlan, BillingCycle, CompanyStatus, PaymentStatus } from '@/types';
import {
  formatCurrency, formatDate, getSubscriptionStatus, BUSINESS_TYPE_LABELS,
  PLAN_LABELS, PLAN_PRICES, BILLING_CYCLE_LABELS, PAYMENT_STATUS_LABELS,
  COMPANY_STATUS_LABELS, COMPANY_STATUS_COLORS, BUSINESS_TYPES
} from '@/lib/utils';
import { generateCompaniesReportPDF } from '@/lib/pdfService';
import {
  Plus, Search, Edit2, Trash2, Eye, Ban, CheckCircle, Archive,
  Download, X, Building2, Filter
} from 'lucide-react';

type ModalMode = 'create' | 'edit' | 'view' | null;

export default function CompaniesPage() {
  const { companies, addCompany, updateCompany, deleteCompany, hardDeleteCompany, suspendCompany, activateCompany, archiveCompany } = useStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Company | null>(null);
  const [confirmHardDelete, setConfirmHardDelete] = useState<Company | null>(null);
  const [toast, setToast] = useState('');

  const emptyForm = {
    name: '', businessType: 'general' as BusinessType, ownerName: '', ownerUsername: '',
    ownerPassword: '123456', ownerPhone: '', ownerEmail: '', city: '', address: '',
    subscriptionPlan: 'trial' as SubscriptionPlan, subscriptionPrice: 0, billingCycle: 'trial' as BillingCycle,
    subscriptionStartDate: new Date().toISOString().slice(0, 10),
    subscriptionEndDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    paymentStatus: 'paid' as PaymentStatus, status: 'trial' as CompanyStatus, notes: '',
  };
  const [form, setForm] = useState(emptyForm);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const filtered = companies.filter(c => {
    const matchSearch = c.name.includes(search) || c.ownerName.includes(search) || c.serialNumber.includes(search) || c.city.includes(search);
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const openCreate = () => {
    setForm(emptyForm);
    setModalMode('create');
  };

  const openEdit = (c: Company) => {
    setSelectedCompany(c);
    setForm({
      name: c.name, businessType: c.businessType, ownerName: c.ownerName, ownerUsername: c.ownerUsername,
      ownerPassword: c.ownerPassword, ownerPhone: c.ownerPhone, ownerEmail: c.ownerEmail, city: c.city, address: c.address,
      subscriptionPlan: c.subscriptionPlan, subscriptionPrice: c.subscriptionPrice, billingCycle: c.billingCycle,
      subscriptionStartDate: c.subscriptionStartDate, subscriptionEndDate: c.subscriptionEndDate,
      paymentStatus: c.paymentStatus, status: c.status, notes: c.notes,
    });
    setModalMode('edit');
  };

  const openView = (c: Company) => {
    setSelectedCompany(c);
    setModalMode('view');
  };

  const handlePlanChange = (plan: SubscriptionPlan) => {
    setForm(f => ({ ...f, subscriptionPlan: plan, subscriptionPrice: PLAN_PRICES[plan] }));
  };

  const handleSubmit = () => {
    if (!form.name || !form.ownerName || !form.ownerUsername) {
      showToast('يرجى تعبئة جميع الحقول المطلوبة');
      return;
    }
    if (modalMode === 'create') {
      addCompany(form);
      showToast('تم إنشاء الشركة بنجاح ✅');
    } else if (modalMode === 'edit' && selectedCompany) {
      updateCompany(selectedCompany.id, form);
      showToast('تم تحديث بيانات الشركة ✅');
    }
    setModalMode(null);
  };

  const handleDelete = () => {
    if (confirmDelete) {
      // Soft delete: archives the company and disables all login accounts.
      // Historical data (invoices, customers, etc.) is preserved for audit.
      // Use "Hard Delete" for permanent, irreversible removal.
      deleteCompany(confirmDelete.id);
      showToast('تم أرشفة الشركة وتعطيل جميع حساباتها ✅');
      setConfirmDelete(null);
    }
  };

  const handleHardDelete = () => {
    if (confirmHardDelete) {
      hardDeleteCompany(confirmHardDelete.id);
      showToast('تم الحذف النهائي لجميع بيانات الشركة — لا يمكن التراجع ⚠️');
      setConfirmHardDelete(null);
    }
  };

  const statusCounts = {
    all: companies.length,
    active: companies.filter(c => c.status === 'active').length,
    trial: companies.filter(c => c.status === 'trial').length,
    suspended: companies.filter(c => c.status === 'suspended').length,
    expired: companies.filter(c => c.status === 'expired').length,
    archived: companies.filter(c => c.status === 'archived').length,
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">إدارة الشركات</h1>
          <p className="text-slate-400 text-sm">{companies.length} شركة مسجلة على المنصة</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => generateCompaniesReportPDF(companies)} className="btn-ghost">
            <Download size={14} /> تصدير PDF
          </button>
          <button onClick={openCreate} className="btn-primary">
            <Plus size={16} /> إنشاء شركة جديدة
          </button>
        </div>
      </div>

      {/* Status filter pills */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'all', label: 'الكل' },
          { key: 'active', label: 'نشط' },
          { key: 'trial', label: 'تجريبي' },
          { key: 'suspended', label: 'موقوف' },
          { key: 'expired', label: 'منتهي' },
          { key: 'archived', label: 'مؤرشف' },
        ].map(s => (
          <button
            key={s.key}
            onClick={() => setStatusFilter(s.key)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{
              background: statusFilter === s.key ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.04)',
              color: statusFilter === s.key ? '#60a5fa' : '#94a3b8',
              border: statusFilter === s.key ? '1px solid rgba(59,130,246,0.4)' : '1px solid rgba(255,255,255,0.08)',
            }}
          >
            {s.label} ({statusCounts[s.key as keyof typeof statusCounts]})
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          className="kimichi-input pr-10"
          placeholder="بحث بالاسم، المالك، المدينة، الرقم التسلسلي..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Companies Table */}
      <div className="kimichi-card overflow-x-auto">
        <table className="kimichi-table">
          <thead>
            <tr>
              <th>الرقم التسلسلي</th>
              <th>اسم الشركة</th>
              <th>نوع النشاط</th>
              <th>المالك</th>
              <th>المدينة</th>
              <th>الباقة</th>
              <th>الحالة</th>
              <th>الاشتراك</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={9} className="text-center text-slate-500 py-8">لا توجد نتائج</td></tr>
            )}
            {filtered.map(c => {
              const sub = getSubscriptionStatus(c);
              return (
                <tr key={c.id}>
                  <td className="text-xs text-blue-400 font-mono">{c.serialNumber}</td>
                  <td className="font-medium text-white">{c.name}</td>
                  <td className="text-xs">{BUSINESS_TYPE_LABELS[c.businessType]}</td>
                  <td>{c.ownerName}</td>
                  <td>{c.city}</td>
                  <td><span className="badge badge-info">{PLAN_LABELS[c.subscriptionPlan]}</span></td>
                  <td><span className={`badge ${COMPANY_STATUS_COLORS[c.status]}`}>{COMPANY_STATUS_LABELS[c.status]}</span></td>
                  <td><span className={`badge ${sub.color}`}>{sub.label}</span></td>
                  <td>
                    <div className="flex gap-1">
                      <button onClick={() => openView(c)} className="p-1.5 rounded hover:bg-blue-500/10 text-blue-400" title="عرض"><Eye size={14} /></button>
                      <button onClick={() => openEdit(c)} className="p-1.5 rounded hover:bg-yellow-500/10 text-yellow-400" title="تعديل"><Edit2 size={14} /></button>
                      {c.status === 'suspended' ? (
                        <button onClick={() => { activateCompany(c.id); showToast('تم تفعيل الشركة'); }} className="p-1.5 rounded hover:bg-green-500/10 text-green-400" title="تفعيل"><CheckCircle size={14} /></button>
                      ) : (
                        <button onClick={() => { suspendCompany(c.id); showToast('تم إيقاف الشركة'); }} className="p-1.5 rounded hover:bg-red-500/10 text-red-400" title="إيقاف"><Ban size={14} /></button>
                      )}
                      <button onClick={() => { archiveCompany(c.id); showToast('تم أرشفة الشركة'); }} className="p-1.5 rounded hover:bg-slate-500/10 text-slate-400" title="أرشفة"><Archive size={14} /></button>
                      <button onClick={() => setConfirmDelete(c)} className="p-1.5 rounded hover:bg-red-500/10 text-red-400" title="أرشفة الشركة (حذف ناعم)"><Archive size={14} /></button>
                      <button onClick={() => setConfirmHardDelete(c)} className="p-1.5 rounded hover:bg-red-700/20 text-red-600" title="حذف نهائي — لا رجعة"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      {(modalMode === 'create' || modalMode === 'edit') && (
        <div className="modal-overlay" onClick={() => setModalMode(null)}>
          <div className="modal-content w-full max-w-3xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Building2 size={18} className="text-blue-400" />
                {modalMode === 'create' ? 'إنشاء شركة جديدة' : 'تعديل بيانات الشركة'}
              </h2>
              <button onClick={() => setModalMode(null)} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="form-label">اسم الشركة *</label>
                <input className="kimichi-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="مثال: شركة النور للتجارة" />
              </div>

              <div>
                <label className="form-label">نوع النشاط</label>
                <select className="kimichi-select" value={form.businessType} onChange={e => setForm({ ...form, businessType: e.target.value as BusinessType })}>
                  {BUSINESS_TYPES.map(bt => <option key={bt} value={bt}>{BUSINESS_TYPE_LABELS[bt]}</option>)}
                </select>
              </div>

              <div>
                <label className="form-label">المدينة</label>
                <input className="kimichi-input" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="طرابلس" />
              </div>

              <div className="col-span-2">
                <label className="form-label">العنوان</label>
                <input className="kimichi-input" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="العنوان التفصيلي" />
              </div>

              <div className="col-span-2 border-t pt-4 mt-2" style={{ borderColor: 'rgba(59,130,246,0.1)' }}>
                <h3 className="text-sm font-semibold text-blue-400 mb-3">بيانات المالك</h3>
              </div>

              <div>
                <label className="form-label">اسم المالك *</label>
                <input className="kimichi-input" value={form.ownerName} onChange={e => setForm({ ...form, ownerName: e.target.value })} placeholder="الاسم الكامل" />
              </div>

              <div>
                <label className="form-label">اسم المستخدم *</label>
                <input className="kimichi-input" value={form.ownerUsername} onChange={e => setForm({ ...form, ownerUsername: e.target.value })} placeholder="username" disabled={modalMode === 'edit'} />
              </div>

              <div>
                <label className="form-label">كلمة المرور المؤقتة</label>
                <input className="kimichi-input" value={form.ownerPassword} onChange={e => setForm({ ...form, ownerPassword: e.target.value })} />
              </div>

              <div>
                <label className="form-label">رقم الهاتف</label>
                <input className="kimichi-input" value={form.ownerPhone} onChange={e => setForm({ ...form, ownerPhone: e.target.value })} placeholder="+218..." />
              </div>

              <div className="col-span-2">
                <label className="form-label">البريد الإلكتروني</label>
                <input className="kimichi-input" type="email" value={form.ownerEmail} onChange={e => setForm({ ...form, ownerEmail: e.target.value })} placeholder="owner@company.ly" />
              </div>

              <div className="col-span-2 border-t pt-4 mt-2" style={{ borderColor: 'rgba(59,130,246,0.1)' }}>
                <h3 className="text-sm font-semibold text-blue-400 mb-3">الاشتراك</h3>
              </div>

              <div>
                <label className="form-label">الباقة</label>
                <select className="kimichi-select" value={form.subscriptionPlan} onChange={e => handlePlanChange(e.target.value as SubscriptionPlan)}>
                  {Object.entries(PLAN_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>

              <div>
                <label className="form-label">السعر (د.ل)</label>
                <input className="kimichi-input" type="number" value={form.subscriptionPrice} onChange={e => setForm({ ...form, subscriptionPrice: Number(e.target.value) })} />
              </div>

              <div>
                <label className="form-label">دورة الفوترة</label>
                <select className="kimichi-select" value={form.billingCycle} onChange={e => setForm({ ...form, billingCycle: e.target.value as BillingCycle })}>
                  {Object.entries(BILLING_CYCLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>

              <div>
                <label className="form-label">حالة الدفع</label>
                <select className="kimichi-select" value={form.paymentStatus} onChange={e => setForm({ ...form, paymentStatus: e.target.value as PaymentStatus })}>
                  {Object.entries(PAYMENT_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>

              <div>
                <label className="form-label">تاريخ البدء</label>
                <input className="kimichi-input" type="date" value={form.subscriptionStartDate} onChange={e => setForm({ ...form, subscriptionStartDate: e.target.value })} />
              </div>

              <div>
                <label className="form-label">تاريخ الانتهاء</label>
                <input className="kimichi-input" type="date" value={form.subscriptionEndDate} onChange={e => setForm({ ...form, subscriptionEndDate: e.target.value })} />
              </div>

              <div>
                <label className="form-label">حالة الشركة</label>
                <select className="kimichi-select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value as CompanyStatus })}>
                  {Object.entries(COMPANY_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>

              <div className="col-span-2">
                <label className="form-label">ملاحظات</label>
                <textarea className="kimichi-input" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={handleSubmit} className="btn-primary flex-1 justify-center py-2.5">
                {modalMode === 'create' ? 'إنشاء الشركة' : 'حفظ التعديلات'}
              </button>
              <button onClick={() => setModalMode(null)} className="btn-ghost px-6">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {modalMode === 'view' && selectedCompany && (
        <div className="modal-overlay" onClick={() => setModalMode(null)}>
          <div className="modal-content w-full max-w-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">{selectedCompany.name}</h2>
              <button onClick={() => setModalMode(null)} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                ['الرقم التسلسلي', selectedCompany.serialNumber],
                ['نوع النشاط', BUSINESS_TYPE_LABELS[selectedCompany.businessType]],
                ['المالك', selectedCompany.ownerName],
                ['اسم المستخدم', selectedCompany.ownerUsername],
                ['الهاتف', selectedCompany.ownerPhone],
                ['البريد', selectedCompany.ownerEmail],
                ['المدينة', selectedCompany.city],
                ['العنوان', selectedCompany.address],
                ['الباقة', PLAN_LABELS[selectedCompany.subscriptionPlan]],
                ['السعر', formatCurrency(selectedCompany.subscriptionPrice)],
                ['دورة الفوترة', BILLING_CYCLE_LABELS[selectedCompany.billingCycle]],
                ['تاريخ البدء', formatDate(selectedCompany.subscriptionStartDate)],
                ['تاريخ الانتهاء', formatDate(selectedCompany.subscriptionEndDate)],
                ['حالة الدفع', PAYMENT_STATUS_LABELS[selectedCompany.paymentStatus]],
                ['تاريخ التسجيل', formatDate(selectedCompany.createdAt)],
              ].map(([label, value]) => (
                <div key={label}>
                  <div className="text-xs text-slate-500 mb-1">{label}</div>
                  <div className="text-slate-200">{value}</div>
                </div>
              ))}
              {selectedCompany.notes && (
                <div className="col-span-2">
                  <div className="text-xs text-slate-500 mb-1">ملاحظات</div>
                  <div className="text-slate-200">{selectedCompany.notes}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}


      {/* Soft Delete (Archive) Confirmation */}
      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal-content w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white mb-2">أرشفة الشركة</h3>
            <p className="text-slate-400 text-sm mb-2">
              سيتم أرشفة شركة <span className="text-white font-medium">{confirmDelete.name}</span> وتعطيل جميع حسابات الدخول (المالك + الموظفون).
            </p>
            <p className="text-xs text-slate-500 mb-6">البيانات التاريخية (فواتير، عملاء، منتجات) تُحفظ للمراجعة. يمكن استعادة الشركة لاحقًا بتغيير حالتها إلى "نشطة".</p>
            <div className="flex gap-3">
              <button onClick={handleDelete} className="btn-danger flex-1 justify-center py-2">أرشفة وتعطيل</button>
              <button onClick={() => setConfirmDelete(null)} className="btn-ghost px-6">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* Hard Delete Confirmation */}
      {confirmHardDelete && (
        <div className="modal-overlay" onClick={() => setConfirmHardDelete(null)}>
          <div className="modal-content w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-red-400 mb-2">⚠️ حذف نهائي لا رجعة فيه</h3>
            <p className="text-slate-400 text-sm mb-2">
              سيتم حذف شركة <span className="text-white font-medium">{confirmHardDelete.name}</span> وكل بياناتها بشكل دائم:
            </p>
            <p className="text-xs text-red-400 mb-6">العملاء — المنتجات — الفواتير — المشتريات — الموردين — الموظفون — المصروفات — حسابات الدخول. هذا الإجراء لا يمكن التراجع عنه نهائيًا.</p>
            <div className="flex gap-3">
              <button onClick={handleHardDelete} className="btn-danger flex-1 justify-center py-2">حذف نهائي — لا رجعة</button>
              <button onClick={() => setConfirmHardDelete(null)} className="btn-ghost px-6">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 fade-in">
          <div className="alert-success shadow-lg">{toast}</div>
        </div>
      )}
    </div>
  );
}
