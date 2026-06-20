'use client';
import { useState } from 'react';
import { useStore } from '@/store';
import type { Employee } from '@/types';
import { formatCurrency, formatDate, ROLE_LABELS } from '@/lib/utils';
import { Plus, Edit2, Trash2, X, UserCog, Ban, CheckCircle, Key } from 'lucide-react';

type AllowedRole = 'admin' | 'accountant' | 'salesman' | 'warehouse';

export default function EmployeesPage() {
  const { session, employees, addEmployee, updateEmployee, deleteEmployee } = useStore();
  const companyId = session!.company!.id;
  const companyEmployees = employees.filter(e => e.companyId === companyId);

  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [selected, setSelected] = useState<Employee | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Employee | null>(null);
  const [resetPwModal, setResetPwModal] = useState<Employee | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [toast, setToast] = useState('');
  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 3000); };

  const emptyForm = { name: '', username: '', password: '123456', role: 'salesman' as AllowedRole, phone: '', email: '', salary: 0, commission: 0, isActive: true };
  const [form, setForm] = useState(emptyForm);

  const openCreate = () => { setForm(emptyForm); setModalMode('create'); };
  const openEdit = (e: Employee) => {
    setSelected(e);
    setForm({ name: e.name, username: e.username, password: e.password, role: e.role as AllowedRole, phone: e.phone, email: e.email, salary: e.salary, commission: e.commission, isActive: e.isActive });
    setModalMode('edit');
  };

  const handleSubmit = () => {
    if (!form.name || !form.username) { showToast('يرجى تعبئة الاسم واسم المستخدم'); return; }
    if (modalMode === 'create') {
      // addEmployee now creates the matching login User internally and
      // keeps it linked via employee.userId — no separate addUser call,
      // which previously created a second, disconnected user record.
      const usernameTaken = useStore.getState().users.some(u => u.username === form.username);
      if (usernameTaken) { showToast('اسم المستخدم هذا مستخدم بالفعل'); return; }
      addEmployee({ ...form, companyId });
      showToast('تم إضافة الموظف ✅');
    } else if (modalMode === 'edit' && selected) {
      // updateEmployee mirrors role/password/active/name/email/phone onto
      // the linked login user automatically.
      const { username, ...editable } = form;
      updateEmployee(selected.id, editable);
      showToast('تم تحديث بيانات الموظف ✅');
    }
    setModalMode(null);
  };

  const handleDelete = () => { if (confirmDelete) { deleteEmployee(confirmDelete.id); showToast('تم حذف الموظف'); setConfirmDelete(null); } };
  const handleToggleActive = (e: Employee) => { updateEmployee(e.id, { isActive: !e.isActive }); showToast(e.isActive ? 'تم تعطيل الموظف' : 'تم تفعيل الموظف'); };
  const handleResetPassword = () => {
    if (!resetPwModal || !newPassword) { showToast('يرجى إدخال كلمة مرور جديدة'); return; }
    updateEmployee(resetPwModal.id, { password: newPassword });
    showToast('تم إعادة تعيين كلمة المرور ✅');
    setResetPwModal(null);
    setNewPassword('');
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="page-header">
        <div><h1 className="text-2xl font-bold text-white mb-1">الموظفين</h1><p className="text-slate-400 text-sm">{companyEmployees.length} موظف مسجل</p></div>
        <button onClick={openCreate} className="btn-primary"><Plus size={16} /> إضافة موظف</button>
      </div>

      <div className="kimichi-card overflow-x-auto">
        <table className="kimichi-table">
          <thead><tr><th>الاسم</th><th>اسم المستخدم</th><th>الدور</th><th>الهاتف</th><th>الراتب</th><th>الحالة</th><th>إجراءات</th></tr></thead>
          <tbody>
            {companyEmployees.length === 0 && <tr><td colSpan={7} className="text-center text-slate-500 py-8">لا يوجد موظفين مسجلين</td></tr>}
            {companyEmployees.map(e => (
              <tr key={e.id}>
                <td className="font-medium text-white">{e.name}</td>
                <td className="text-xs font-mono text-blue-400">{e.username}</td>
                <td><span className="badge badge-info">{ROLE_LABELS[e.role]}</span></td>
                <td className="text-xs">{e.phone}</td>
                <td>{formatCurrency(e.salary)}</td>
                <td><span className={`badge ${e.isActive ? 'badge-success' : 'badge-danger'}`}>{e.isActive ? 'نشط' : 'معطل'}</span></td>
                <td>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(e)} className="p-1.5 rounded hover:bg-yellow-500/10 text-yellow-400" title="تعديل"><Edit2 size={14} /></button>
                    <button onClick={() => setResetPwModal(e)} className="p-1.5 rounded hover:bg-purple-500/10 text-purple-400" title="إعادة تعيين كلمة المرور"><Key size={14} /></button>
                    {e.isActive ? <button onClick={() => handleToggleActive(e)} className="p-1.5 rounded hover:bg-red-500/10 text-red-400" title="تعطيل"><Ban size={14} /></button> : <button onClick={() => handleToggleActive(e)} className="p-1.5 rounded hover:bg-green-500/10 text-green-400" title="تفعيل"><CheckCircle size={14} /></button>}
                    <button onClick={() => setConfirmDelete(e)} className="p-1.5 rounded hover:bg-red-500/10 text-red-500" title="حذف"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(modalMode === 'create' || modalMode === 'edit') && (
        <div className="modal-overlay" onClick={() => setModalMode(null)}>
          <div className="modal-content w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6"><h2 className="text-lg font-bold text-white flex items-center gap-2"><UserCog size={18} className="text-blue-400" /> {modalMode === 'create' ? 'إضافة موظف' : 'تعديل الموظف'}</h2><button onClick={() => setModalMode(null)} className="text-slate-400 hover:text-white"><X size={20} /></button></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2"><label className="form-label">الاسم *</label><input className="kimichi-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div><label className="form-label">اسم المستخدم *</label><input className="kimichi-input" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} disabled={modalMode === 'edit'} /></div>
              <div><label className="form-label">كلمة المرور</label><input className="kimichi-input" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} disabled={modalMode === 'edit'} /></div>
              <div>
                <label className="form-label">الدور</label>
                <select className="kimichi-select" value={form.role} onChange={e => setForm({ ...form, role: e.target.value as AllowedRole })}>
                  <option value="admin">مدير</option><option value="accountant">محاسب</option><option value="salesman">مندوب مبيعات</option><option value="warehouse">أمين مستودع</option>
                </select>
              </div>
              <div><label className="form-label">الهاتف</label><input className="kimichi-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
              <div className="col-span-2"><label className="form-label">البريد الإلكتروني</label><input className="kimichi-input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
              <div><label className="form-label">الراتب (د.ل)</label><input type="number" className="kimichi-input" value={form.salary} onChange={e => setForm({ ...form, salary: Number(e.target.value) })} /></div>
              <div><label className="form-label">العمولة %</label><input type="number" className="kimichi-input" value={form.commission} onChange={e => setForm({ ...form, commission: Number(e.target.value) })} /></div>
            </div>
            <div className="alert-info mt-4 text-xs">ملاحظة: لا يمكن إنشاء حساب مشرف Kimichi (super_admin) من هنا. هذا الدور مخصص فقط لإدارة المنصة.</div>
            <div className="flex gap-3 mt-4"><button onClick={handleSubmit} className="btn-primary flex-1 justify-center py-2.5">{modalMode === 'create' ? 'إضافة' : 'حفظ'}</button><button onClick={() => setModalMode(null)} className="btn-ghost px-6">إلغاء</button></div>
          </div>
        </div>
      )}

      {resetPwModal && (
        <div className="modal-overlay" onClick={() => setResetPwModal(null)}>
          <div className="modal-content w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white mb-4">إعادة تعيين كلمة مرور {resetPwModal.name}</h3>
            <label className="form-label">كلمة المرور الجديدة</label>
            <input className="kimichi-input mb-4" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="كلمة مرور جديدة" />
            <div className="flex gap-3"><button onClick={handleResetPassword} className="btn-primary flex-1 justify-center py-2">تأكيد</button><button onClick={() => setResetPwModal(null)} className="btn-ghost px-6">إلغاء</button></div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal-content w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white mb-2">تأكيد الحذف</h3>
            <p className="text-slate-400 text-sm mb-2">هل تريد حذف الموظف <span className="text-white">{confirmDelete.name}</span>؟</p>
            <p className="text-xs text-slate-500 mb-6">سيتم تعطيل حساب تسجيل الدخول الخاص به فورًا ولن يستطيع الدخول إلى النظام مرة أخرى.</p>
            <div className="flex gap-3"><button onClick={handleDelete} className="btn-danger flex-1 justify-center py-2">حذف</button><button onClick={() => setConfirmDelete(null)} className="btn-ghost px-6">إلغاء</button></div>
          </div>
        </div>
      )}

      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 fade-in"><div className="alert-success shadow-lg">{toast}</div></div>}
    </div>
  );
}
