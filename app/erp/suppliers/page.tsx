'use client';
import { useState } from 'react';
import { useStore } from '@/store';
import type { Supplier } from '@/types';
import { formatCurrency, formatDate, getSupplierPerformanceScore } from '@/lib/utils';
import { Plus, Search, Edit2, Trash2, Eye, X, Truck, Phone, CreditCard } from 'lucide-react';

export default function SuppliersPage() {
  const { session, suppliers, addSupplier, updateSupplier, deleteSupplier, purchases, registerSupplierPayment } = useStore();
  const companyId = session!.company!.id;
  const companySuppliers = suppliers.filter(s => s.companyId === companyId);
  const companyPurchases = purchases.filter(p => p.companyId === companyId);

  const [search, setSearch] = useState('');
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view' | null>(null);
  const [selected, setSelected] = useState<Supplier | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Supplier | null>(null);
  const [payTarget, setPayTarget] = useState<{ purchaseId: string; remaining: number; serialNumber: string } | null>(null);
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState('cash');
  const [toast, setToast] = useState('');
  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 3000); };

  const emptyForm = { name: '', phone: '', email: '', address: '', city: '', amountDue: 0, status: 'active' as 'active' | 'inactive', notes: '' };
  const [form, setForm] = useState(emptyForm);

  const filtered = companySuppliers.filter(s => s.name.includes(search) || s.phone.includes(search) || s.city.includes(search));

  const openCreate = () => { setForm(emptyForm); setModalMode('create'); };
  const openEdit = (s: Supplier) => {
    setSelected(s);
    setForm({ name: s.name, phone: s.phone, email: s.email, address: s.address, city: s.city, amountDue: s.amountDue, status: s.status, notes: s.notes });
    setModalMode('edit');
  };
  const openView = (s: Supplier) => { setSelected(s); setModalMode('view'); };

  const handleSubmit = () => {
    if (!form.name || !form.phone) { showToast('يرجى تعبئة الاسم والهاتف'); return; }
    if (modalMode === 'create') { addSupplier({ ...form, companyId }); showToast('تم إضافة المورد ✅'); }
    else if (modalMode === 'edit' && selected) { updateSupplier(selected.id, form); showToast('تم تحديث المورد ✅'); }
    setModalMode(null);
  };

  const handleDelete = () => { if (confirmDelete) { deleteSupplier(confirmDelete.id); showToast('تم حذف المورد'); setConfirmDelete(null); } };

  const handleSupplierPay = () => {
    if (!payTarget || payAmount <= 0) { showToast('يرجى تحديد مبلغ صحيح'); return; }
    const { applied, excess } = registerSupplierPayment(payTarget.purchaseId, payAmount, payMethod, '');
    if (excess > 0) showToast(`تم تسجيل ${formatCurrency(applied)} فقط (المتبقي على أمر الشراء). الزيادة ${formatCurrency(excess)} لم تُطبّق.`);
    else showToast('تم تسجيل دفعة المورد ✅');
    setPayTarget(null);
    setPayAmount(0);
  };

  const getSupplierPurchases = (id: string) => companyPurchases.filter(p => p.supplierId === id);
  // Real performance score based on actual purchase-payment history
  // (settled in full, or still within a 30-day grace period from receipt)
  // instead of a stored paymentStatus field that nothing ever transitions
  // to 'overdue' automatically. Returns null ("no data") when a supplier
  // has no purchase history yet, instead of a misleading 100%.
  const getPerformanceScore = (id: string) => getSupplierPerformanceScore(getSupplierPurchases(id));

  return (
    <div className="space-y-6 fade-in">
      <div className="page-header">
        <div><h1 className="text-2xl font-bold text-white mb-1">الموردين</h1><p className="text-slate-400 text-sm">{companySuppliers.length} مورد مسجل</p></div>
        <button onClick={openCreate} className="btn-primary"><Plus size={16} /> إضافة مورد</button>
      </div>

      <div className="relative max-w-md">
        <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input className="kimichi-input pr-10" placeholder="بحث بالاسم، الهاتف، المدينة..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="kimichi-card overflow-x-auto">
        <table className="kimichi-table">
          <thead><tr><th>الاسم</th><th>الهاتف</th><th>المدينة</th><th>المبلغ المستحق</th><th>الأداء</th><th>الحالة</th><th>إجراءات</th></tr></thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={7} className="text-center text-slate-500 py-8">لا يوجد موردين</td></tr>}
            {filtered.map(s => {
              const score = getPerformanceScore(s.id);
              return (
                <tr key={s.id}>
                  <td className="font-medium text-white">{s.name}</td>
                  <td className="text-xs flex items-center gap-1"><Phone size={12} className="text-slate-500" />{s.phone}</td>
                  <td>{s.city}</td>
                  <td className={s.amountDue > 0 ? 'text-yellow-400' : 'text-slate-400'}>{formatCurrency(s.amountDue)}</td>
                  <td>{score === null ? <span className="badge badge-gray">لا توجد بيانات</span> : <span className={`badge ${score >= 80 ? 'badge-success' : score >= 50 ? 'badge-warning' : 'badge-danger'}`}>{score}%</span>}</td>
                  <td><span className={`badge ${s.status === 'active' ? 'badge-success' : 'badge-gray'}`}>{s.status === 'active' ? 'نشط' : 'غير نشط'}</span></td>
                  <td>
                    <div className="flex gap-1">
                      <button onClick={() => openView(s)} className="p-1.5 rounded hover:bg-blue-500/10 text-blue-400"><Eye size={14} /></button>
                      <button onClick={() => openEdit(s)} className="p-1.5 rounded hover:bg-yellow-500/10 text-yellow-400"><Edit2 size={14} /></button>
                      <button onClick={() => setConfirmDelete(s)} className="p-1.5 rounded hover:bg-red-500/10 text-red-500"><Trash2 size={14} /></button>
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
              <h2 className="text-lg font-bold text-white flex items-center gap-2"><Truck size={18} className="text-blue-400" /> {modalMode === 'create' ? 'إضافة مورد' : 'تعديل المورد'}</h2>
              <button onClick={() => setModalMode(null)} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2"><label className="form-label">الاسم *</label><input className="kimichi-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div><label className="form-label">الهاتف *</label><input className="kimichi-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
              <div><label className="form-label">البريد الإلكتروني</label><input className="kimichi-input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
              <div><label className="form-label">المدينة</label><input className="kimichi-input" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} /></div>
              <div><label className="form-label">المبلغ المستحق</label><input type="number" className="kimichi-input" value={form.amountDue} onChange={e => setForm({ ...form, amountDue: Number(e.target.value) })} /><p className="text-xs text-slate-500 mt-1">⚠️ يُفضّل استخدامه فقط للأرصدة الافتتاحية — يتحدث تلقائيًا مع كل أمر شراء أو دفعة مسجلة.</p></div>
              <div className="col-span-2"><label className="form-label">العنوان</label><input className="kimichi-input" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
              <div><label className="form-label">الحالة</label><select className="kimichi-select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value as any })}><option value="active">نشط</option><option value="inactive">غير نشط</option></select></div>
              <div className="col-span-2"><label className="form-label">ملاحظات</label><textarea className="kimichi-input" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
            </div>
            <div className="flex gap-3 mt-6"><button onClick={handleSubmit} className="btn-primary flex-1 justify-center py-2.5">{modalMode === 'create' ? 'إضافة' : 'حفظ'}</button><button onClick={() => setModalMode(null)} className="btn-ghost px-6">إلغاء</button></div>
          </div>
        </div>
      )}

      {modalMode === 'view' && selected && (
        <div className="modal-overlay" onClick={() => setModalMode(null)}>
          <div className="modal-content w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6"><h2 className="text-lg font-bold text-white">{selected.name}</h2><button onClick={() => setModalMode(null)} className="text-slate-400 hover:text-white"><X size={20} /></button></div>
            <h3 className="text-sm font-semibold text-blue-400 mb-2">سجل المشتريات</h3>
            <table className="kimichi-table">
              <thead><tr><th>رقم</th><th>التاريخ</th><th>الإجمالي</th><th>المتبقي</th><th>الحالة</th><th></th></tr></thead>
              <tbody>
                {getSupplierPurchases(selected.id).map(p => (
                  <tr key={p.id}>
                    <td className="text-xs">{p.serialNumber}</td>
                    <td className="text-xs">{formatDate(p.createdAt)}</td>
                    <td className="text-xs">{formatCurrency(p.total)}</td>
                    <td className="text-xs text-yellow-400">{formatCurrency(p.remaining)}</td>
                    <td><span className="badge badge-info">{p.paymentStatus === 'paid' ? 'مدفوع' : 'معلق'}</span></td>
                    <td>
                      {p.remaining > 0 && (
                        <button onClick={() => { setPayTarget({ purchaseId: p.id, remaining: p.remaining, serialNumber: p.serialNumber }); setPayAmount(p.remaining); }} className="p-1 rounded hover:bg-green-500/10 text-green-400" title="تسجيل دفعة"><CreditCard size={13} /></button>
                      )}
                    </td>
                  </tr>
                ))}
                {getSupplierPurchases(selected.id).length === 0 && <tr><td colSpan={6} className="text-center text-slate-500 py-4">لا توجد مشتريات</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Supplier Payment Modal */}
      {payTarget && (
        <div className="modal-overlay" onClick={() => setPayTarget(null)}>
          <div className="modal-content w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white mb-4">تسجيل دفعة - {payTarget.serialNumber}</h3>
            <p className="text-sm text-slate-400 mb-4">المتبقي: <span className="text-yellow-400">{formatCurrency(payTarget.remaining)}</span></p>
            <label className="form-label">المبلغ</label>
            <input type="number" max={payTarget.remaining} className="kimichi-input mb-4" value={payAmount} onChange={e => setPayAmount(Number(e.target.value))} />
            <label className="form-label">طريقة الدفع</label>
            <select className="kimichi-select mb-4" value={payMethod} onChange={e => setPayMethod(e.target.value)}>
              <option value="cash">نقدي</option><option value="bank">تحويل بنكي</option><option value="check">شيك</option><option value="other">أخرى</option>
            </select>
            <div className="flex gap-3"><button onClick={handleSupplierPay} className="btn-success flex-1 justify-center py-2">تأكيد الدفع</button><button onClick={() => setPayTarget(null)} className="btn-ghost px-6">إلغاء</button></div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal-content w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white mb-2">تأكيد الحذف</h3>
            <p className="text-slate-400 text-sm mb-6">هل تريد حذف المورد <span className="text-white">{confirmDelete.name}</span>؟</p>
            <div className="flex gap-3"><button onClick={handleDelete} className="btn-danger flex-1 justify-center py-2">حذف</button><button onClick={() => setConfirmDelete(null)} className="btn-ghost px-6">إلغاء</button></div>
          </div>
        </div>
      )}

      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 fade-in"><div className="alert-success shadow-lg">{toast}</div></div>}
    </div>
  );
}
