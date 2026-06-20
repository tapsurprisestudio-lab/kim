'use client';
import { useState } from 'react';
import { useStore } from '@/store';
import type { Expense } from '@/types';
import { formatCurrency, formatDate, EXPENSE_CATEGORIES } from '@/lib/utils';
import { Plus, Edit2, Trash2, X, Receipt, TrendingDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function ExpensesPage() {
  const { session, expenses, addExpense, updateExpense, deleteExpense, invoices } = useStore();
  const companyId = session!.company!.id;
  const companyExpenses = expenses.filter(e => e.companyId === companyId).slice().reverse();
  const companyInvoices = invoices.filter(i => i.companyId === companyId);

  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [selected, setSelected] = useState<Expense | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Expense | null>(null);
  const [toast, setToast] = useState('');
  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 3000); };

  const emptyForm = { category: EXPENSE_CATEGORIES[0], description: '', amount: 0, date: new Date().toISOString().slice(0, 10), notes: '' };
  const [form, setForm] = useState(emptyForm);

  const openCreate = () => { setForm(emptyForm); setModalMode('create'); };
  const openEdit = (e: Expense) => { setSelected(e); setForm({ category: e.category, description: e.description, amount: e.amount, date: e.date, notes: e.notes }); setModalMode('edit'); };

  const handleSubmit = () => {
    if (!form.description || form.amount <= 0) { showToast('يرجى تعبئة الوصف والمبلغ'); return; }
    if (modalMode === 'create') { addExpense({ ...form, companyId }); showToast('تم إضافة المصروف ✅'); }
    else if (modalMode === 'edit' && selected) { updateExpense(selected.id, form); showToast('تم تحديث المصروف ✅'); }
    setModalMode(null);
  };

  const handleDelete = () => { if (confirmDelete) { deleteExpense(confirmDelete.id); showToast('تم حذف المصروف'); setConfirmDelete(null); } };

  const thisMonth = new Date().getMonth(), thisYear = new Date().getFullYear();
  const totalThisMonth = companyExpenses.filter(e => { const d = new Date(e.date); return d.getMonth() === thisMonth && d.getFullYear() === thisYear; }).reduce((s, e) => s + e.amount, 0);
  const salesThisMonth = companyInvoices.filter(i => { const d = new Date(i.createdAt); return d.getMonth() === thisMonth && d.getFullYear() === thisYear; }).reduce((s, i) => s + i.total, 0);
  const profitAfterExpenses = salesThisMonth - totalThisMonth;

  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - (5 - i));
    const m = d.getMonth(), y = d.getFullYear();
    const total = companyExpenses.filter(e => { const ed = new Date(e.date); return ed.getMonth() === m && ed.getFullYear() === y; }).reduce((s, e) => s + e.amount, 0);
    return { month: d.toLocaleString('ar-LY', { month: 'short' }), total };
  });

  const byCategory = Object.entries(companyExpenses.reduce((acc, e) => { acc[e.category] = (acc[e.category] || 0) + e.amount; return acc; }, {} as Record<string, number>));

  return (
    <div className="space-y-6 fade-in">
      <div className="page-header">
        <div><h1 className="text-2xl font-bold text-white mb-1">المصروفات</h1><p className="text-slate-400 text-sm">{companyExpenses.length} مصروف مسجل</p></div>
        <button onClick={openCreate} className="btn-primary"><Plus size={16} /> إضافة مصروف</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="stat-card"><div className="flex items-center gap-2 mb-2"><Receipt size={16} className="text-red-400" /><span className="text-xs text-slate-400">مصروفات هذا الشهر</span></div><div className="text-2xl font-bold text-white">{formatCurrency(totalThisMonth)}</div></div>
        <div className="stat-card"><div className="flex items-center gap-2 mb-2"><TrendingDown size={16} className="text-blue-400" /><span className="text-xs text-slate-400">مبيعات الشهر</span></div><div className="text-2xl font-bold text-white">{formatCurrency(salesThisMonth)}</div></div>
        <div className="stat-card"><div className="flex items-center gap-2 mb-2"><TrendingDown size={16} className={profitAfterExpenses >= 0 ? 'text-green-400' : 'text-red-400'} /><span className="text-xs text-slate-400">الربح بعد المصروفات</span></div><div className="text-2xl font-bold text-white">{formatCurrency(profitAfterExpenses)}</div></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="kimichi-card p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">المصروفات الشهرية (6 أشهر)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.08)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip contentStyle={{ background: '#0d1426', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 8, fontSize: 12 }} formatter={(v: any) => formatCurrency(Number(v))} />
              <Bar dataKey="total" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="kimichi-card p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">حسب الفئة</h3>
          <div className="space-y-2">
            {byCategory.length === 0 && <p className="text-slate-500 text-sm text-center py-4">لا توجد بيانات</p>}
            {byCategory.sort((a, b) => b[1] - a[1]).map(([cat, amt]) => (
              <div key={cat} className="flex items-center justify-between p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <span className="text-sm text-slate-300">{cat}</span>
                <span className="text-sm text-red-400">{formatCurrency(amt)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="kimichi-card overflow-x-auto">
        <table className="kimichi-table">
          <thead><tr><th>الفئة</th><th>الوصف</th><th>المبلغ</th><th>التاريخ</th><th>إجراءات</th></tr></thead>
          <tbody>
            {companyExpenses.length === 0 && <tr><td colSpan={5} className="text-center text-slate-500 py-8">لا توجد مصروفات</td></tr>}
            {companyExpenses.map(e => (
              <tr key={e.id}>
                <td><span className="badge badge-info">{e.category}</span></td>
                <td className="text-white">{e.description}</td>
                <td className="text-red-400">{formatCurrency(e.amount)}</td>
                <td className="text-xs text-slate-500">{formatDate(e.date)}</td>
                <td><div className="flex gap-1"><button onClick={() => openEdit(e)} className="p-1.5 rounded hover:bg-yellow-500/10 text-yellow-400"><Edit2 size={14} /></button><button onClick={() => setConfirmDelete(e)} className="p-1.5 rounded hover:bg-red-500/10 text-red-500"><Trash2 size={14} /></button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(modalMode === 'create' || modalMode === 'edit') && (
        <div className="modal-overlay" onClick={() => setModalMode(null)}>
          <div className="modal-content w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6"><h2 className="text-lg font-bold text-white flex items-center gap-2"><Receipt size={18} className="text-blue-400" /> {modalMode === 'create' ? 'إضافة مصروف' : 'تعديل المصروف'}</h2><button onClick={() => setModalMode(null)} className="text-slate-400 hover:text-white"><X size={20} /></button></div>
            <div className="space-y-4">
              <div><label className="form-label">الفئة</label><select className="kimichi-select" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>{EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
              <div><label className="form-label">الوصف</label><input className="kimichi-input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
              <div><label className="form-label">المبلغ</label><input type="number" className="kimichi-input" value={form.amount} onChange={e => setForm({ ...form, amount: Number(e.target.value) })} /></div>
              <div><label className="form-label">التاريخ</label><input type="date" className="kimichi-input" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
              <div><label className="form-label">ملاحظات</label><textarea className="kimichi-input" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
            </div>
            <div className="flex gap-3 mt-6"><button onClick={handleSubmit} className="btn-primary flex-1 justify-center py-2.5">{modalMode === 'create' ? 'إضافة' : 'حفظ'}</button><button onClick={() => setModalMode(null)} className="btn-ghost px-6">إلغاء</button></div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal-content w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white mb-2">تأكيد الحذف</h3>
            <p className="text-slate-400 text-sm mb-6">هل تريد حذف هذا المصروف؟</p>
            <div className="flex gap-3"><button onClick={handleDelete} className="btn-danger flex-1 justify-center py-2">حذف</button><button onClick={() => setConfirmDelete(null)} className="btn-ghost px-6">إلغاء</button></div>
          </div>
        </div>
      )}

      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 fade-in"><div className="alert-success shadow-lg">{toast}</div></div>}
    </div>
  );
}
