'use client';
import { useState } from 'react';
import { useStore } from '@/store';
import type { Customer } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { generateCustomerStatementPDF } from '@/lib/pdfService';
import { Plus, Search, Edit2, Trash2, Eye, X, Users, FileText, Phone } from 'lucide-react';

export default function CustomersPage() {
  const { session, customers, addCustomer, updateCustomer, deleteCustomer, invoices, employees, payments } = useStore();
  const companyId = session!.company!.id;
  const companyCustomers = customers.filter(c => c.companyId === companyId);
  const salesmen = employees.filter(e => e.companyId === companyId && e.role === 'salesman');

  const [search, setSearch] = useState('');
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view' | null>(null);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Customer | null>(null);
  const [toast, setToast] = useState('');

  const emptyForm = { name: '', phone: '', address: '', city: '', creditLimit: 1000, currentDebt: 0, salesmanId: '', status: 'active' as 'active' | 'inactive' | 'blocked', notes: '' };
  const [form, setForm] = useState(emptyForm);

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 3000); };

  const filtered = companyCustomers.filter(c => c.name.includes(search) || c.phone.includes(search) || c.city.includes(search));

  const openCreate = () => { setForm(emptyForm); setModalMode('create'); };
  const openEdit = (c: Customer) => {
    setSelected(c);
    setForm({ name: c.name, phone: c.phone, address: c.address, city: c.city, creditLimit: c.creditLimit, currentDebt: c.currentDebt, salesmanId: c.salesmanId || '', status: c.status, notes: c.notes });
    setModalMode('edit');
  };
  const openView = (c: Customer) => { setSelected(c); setModalMode('view'); };

  const handleSubmit = () => {
    if (!form.name || !form.phone) { showToast('يرجى تعبئة الاسم والهاتف'); return; }
    if (modalMode === 'create') {
      addCustomer({ ...form, companyId });
      showToast('تم إضافة العميل ✅');
    } else if (modalMode === 'edit' && selected) {
      updateCustomer(selected.id, form);
      showToast('تم تحديث بيانات العميل ✅');
    }
    setModalMode(null);
  };

  const handleDelete = () => { if (confirmDelete) { deleteCustomer(confirmDelete.id); showToast('تم حذف العميل'); setConfirmDelete(null); } };

  const handlePrintStatement = (c: Customer) => {
    const custInvoices = invoices.filter(i => i.customerId === c.id);
    const custPayments = payments.filter(p => p.customerId === c.id);
    generateCustomerStatementPDF(c, custInvoices, custPayments);
  };

  const getCustomerInvoices = (id: string) => invoices.filter(i => i.customerId === id);
  const getHealthScore = (c: Customer) => {
    if (c.creditLimit === 0) return 100;
    const ratio = c.currentDebt / c.creditLimit;
    if (ratio <= 0) return 100;
    if (ratio < 0.5) return 80;
    if (ratio < 0.8) return 50;
    if (ratio < 1) return 25;
    return 0;
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">العملاء</h1>
          <p className="text-slate-400 text-sm">{companyCustomers.length} عميل مسجل</p>
        </div>
        <button onClick={openCreate} className="btn-primary"><Plus size={16} /> إضافة عميل</button>
      </div>

      <div className="relative max-w-md">
        <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input className="kimichi-input pr-10" placeholder="بحث بالاسم، الهاتف، المدينة..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="kimichi-card overflow-x-auto">
        <table className="kimichi-table">
          <thead>
            <tr>
              <th>الاسم</th><th>الهاتف</th><th>المدينة</th><th>حد الائتمان</th><th>الدين الحالي</th><th>المؤشر الصحي</th><th>الحالة</th><th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={8} className="text-center text-slate-500 py-8">لا يوجد عملاء</td></tr>}
            {filtered.map(c => {
              const health = getHealthScore(c);
              return (
                <tr key={c.id}>
                  <td className="font-medium text-white">{c.name}</td>
                  <td className="text-xs flex items-center gap-1"><Phone size={12} className="text-slate-500" />{c.phone}</td>
                  <td>{c.city}</td>
                  <td>{formatCurrency(c.creditLimit)}</td>
                  <td className={c.currentDebt > 0 ? 'text-yellow-400' : 'text-slate-400'}>{formatCurrency(c.currentDebt)}</td>
                  <td>
                    <div className="w-20 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div className="h-full" style={{ width: `${health}%`, background: health >= 80 ? '#22c55e' : health >= 40 ? '#f59e0b' : '#ef4444' }}></div>
                    </div>
                  </td>
                  <td><span className={`badge ${c.status === 'active' ? 'badge-success' : c.status === 'blocked' ? 'badge-danger' : 'badge-gray'}`}>{c.status === 'active' ? 'نشط' : c.status === 'blocked' ? 'محظور' : 'غير نشط'}</span></td>
                  <td>
                    <div className="flex gap-1">
                      <button onClick={() => openView(c)} className="p-1.5 rounded hover:bg-blue-500/10 text-blue-400" title="عرض"><Eye size={14} /></button>
                      <button onClick={() => openEdit(c)} className="p-1.5 rounded hover:bg-yellow-500/10 text-yellow-400" title="تعديل"><Edit2 size={14} /></button>
                      <button onClick={() => handlePrintStatement(c)} className="p-1.5 rounded hover:bg-green-500/10 text-green-400" title="كشف حساب PDF"><FileText size={14} /></button>
                      <button onClick={() => setConfirmDelete(c)} className="p-1.5 rounded hover:bg-red-500/10 text-red-500" title="حذف"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {(modalMode === 'create' || modalMode === 'edit') && (
        <div className="modal-overlay" onClick={() => setModalMode(null)}>
          <div className="modal-content w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2"><Users size={18} className="text-blue-400" /> {modalMode === 'create' ? 'إضافة عميل جديد' : 'تعديل العميل'}</h2>
              <button onClick={() => setModalMode(null)} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2"><label className="form-label">الاسم *</label><input className="kimichi-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div><label className="form-label">الهاتف *</label><input className="kimichi-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
              <div><label className="form-label">المدينة</label><input className="kimichi-input" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} /></div>
              <div className="col-span-2"><label className="form-label">العنوان</label><input className="kimichi-input" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
              <div><label className="form-label">حد الائتمان</label><input type="number" className="kimichi-input" value={form.creditLimit} onChange={e => setForm({ ...form, creditLimit: Number(e.target.value) })} /></div>
              <div><label className="form-label">الدين الحالي</label><input type="number" className="kimichi-input" value={form.currentDebt} onChange={e => setForm({ ...form, currentDebt: Number(e.target.value) })} /><p className="text-xs text-slate-500 mt-1">⚠️ تعديل هذا الحقل يدويًا قد يجعله غير متطابق مع إجمالي الفواتير المستحقة. يُفضّل استخدامه فقط لإدخال الأرصدة الافتتاحية.</p></div>
              <div>
                <label className="form-label">المندوب</label>
                <select className="kimichi-select" value={form.salesmanId} onChange={e => setForm({ ...form, salesmanId: e.target.value })}>
                  <option value="">بدون</option>
                  {salesmen.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">الحالة</label>
                <select className="kimichi-select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value as any })}>
                  <option value="active">نشط</option><option value="inactive">غير نشط</option><option value="blocked">محظور</option>
                </select>
              </div>
              <div className="col-span-2"><label className="form-label">ملاحظات</label><textarea className="kimichi-input" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleSubmit} className="btn-primary flex-1 justify-center py-2.5">{modalMode === 'create' ? 'إضافة' : 'حفظ'}</button>
              <button onClick={() => setModalMode(null)} className="btn-ghost px-6">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {modalMode === 'view' && selected && (
        <div className="modal-overlay" onClick={() => setModalMode(null)}>
          <div className="modal-content w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">{selected.name}</h2>
              <button onClick={() => setModalMode(null)} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <div><div className="text-xs text-slate-500 mb-1">الهاتف</div><div className="text-slate-200">{selected.phone}</div></div>
              <div><div className="text-xs text-slate-500 mb-1">المدينة</div><div className="text-slate-200">{selected.city}</div></div>
              <div><div className="text-xs text-slate-500 mb-1">حد الائتمان</div><div className="text-slate-200">{formatCurrency(selected.creditLimit)}</div></div>
              <div><div className="text-xs text-slate-500 mb-1">الدين الحالي</div><div className="text-yellow-400">{formatCurrency(selected.currentDebt)}</div></div>
            </div>
            <h3 className="text-sm font-semibold text-blue-400 mb-2">سجل الفواتير</h3>
            <table className="kimichi-table">
              <thead><tr><th>رقم</th><th>التاريخ</th><th>الإجمالي</th><th>الحالة</th></tr></thead>
              <tbody>
                {getCustomerInvoices(selected.id).map(inv => (
                  <tr key={inv.id}><td className="text-xs">{inv.serialNumber}</td><td className="text-xs">{formatDate(inv.createdAt)}</td><td className="text-xs">{formatCurrency(inv.total)}</td><td><span className="badge badge-info">{inv.status}</span></td></tr>
                ))}
                {getCustomerInvoices(selected.id).length === 0 && <tr><td colSpan={4} className="text-center text-slate-500 py-4">لا توجد فواتير</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal-content w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white mb-2">تأكيد الحذف</h3>
            <p className="text-slate-400 text-sm mb-6">هل تريد حذف العميل <span className="text-white">{confirmDelete.name}</span>؟</p>
            <div className="flex gap-3"><button onClick={handleDelete} className="btn-danger flex-1 justify-center py-2">حذف</button><button onClick={() => setConfirmDelete(null)} className="btn-ghost px-6">إلغاء</button></div>
          </div>
        </div>
      )}

      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 fade-in"><div className="alert-success shadow-lg">{toast}</div></div>}
    </div>
  );
}
