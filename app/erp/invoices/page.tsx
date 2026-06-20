'use client';
import { useState } from 'react';
import { useStore } from '@/store';
import type { Invoice, InvoiceItem, InvoiceStatus } from '@/types';
import { formatCurrency, formatDate, INVOICE_STATUS_LABELS, INVOICE_STATUS_COLORS, getEffectiveInvoiceStatus } from '@/lib/utils';
import { roundMoney, addMoney, subMoney, clampNonNegative } from '@/lib/money';
import { generateInvoicePDF } from '@/lib/pdfService';
import { Plus, Search, Eye, X, FileText, Trash2, CreditCard, ShoppingCart, Edit2, AlertTriangle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export default function InvoicesPage() {
  const { session, invoices, customers, products, employees, addInvoice, registerPayment, updateInvoiceDetails, deleteInvoice, peekNextInvoiceSerial } = useStore();
  const companyId = session!.company!.id;
  const companyInvoices = invoices.filter(i => i.companyId === companyId).slice().reverse();
  const companyCustomers = customers.filter(c => c.companyId === companyId);
  const companyProducts = products.filter(p => p.companyId === companyId);
  const salesmen = employees.filter(e => e.companyId === companyId && e.role === 'salesman');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [editInvoice, setEditInvoice] = useState<Invoice | null>(null);
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);
  const [payModal, setPayModal] = useState<Invoice | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Invoice | null>(null);
  const [toast, setToast] = useState('');

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 3000); };

  const [form, setForm] = useState({ customerId: '', salesmanId: '', dueDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10), discount: 0, notes: '' });
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState('cash');

  // Status filter / badge now reflect the REAL (dueDate-based) overdue
  // status rather than the stored enum, which nothing ever auto-updates.
  const filtered = companyInvoices.filter(i => {
    const effectiveStatus = getEffectiveInvoiceStatus(i);
    const matchSearch = i.serialNumber.includes(search) || i.customerName.includes(search);
    const matchStatus = statusFilter === 'all' || effectiveStatus === statusFilter;
    return matchSearch && matchStatus;
  });

  const addItemRow = () => {
    if (companyProducts.length === 0) { showToast('لا توجد منتجات لإضافتها'); return; }
    const product = companyProducts[0];
    setItems([...items, { id: uuidv4(), productId: product.id, productName: product.name, quantity: 1, unitPrice: product.sellPrice, discount: 0, total: roundMoney(product.sellPrice) }]);
  };

  const updateItem = (id: string, patch: Partial<InvoiceItem>) => {
    setItems(items.map(it => {
      if (it.id !== id) return it;
      const updated = { ...it, ...patch };
      if (patch.productId) {
        const p = companyProducts.find(pp => pp.id === patch.productId);
        if (p) { updated.productName = p.name; updated.unitPrice = p.sellPrice; }
      }
      // Cents-safe line total instead of raw float multiply/subtract.
      updated.total = clampNonNegative(subMoney(roundMoney(updated.quantity * updated.unitPrice), updated.discount));
      return updated;
    }));
  };

  const removeItem = (id: string) => setItems(items.filter(it => it.id !== id));

  const subtotal = roundMoney(items.reduce((s, it) => addMoney(s, it.quantity * it.unitPrice), 0));
  const itemDiscounts = roundMoney(items.reduce((s, it) => addMoney(s, it.discount), 0));
  const total = clampNonNegative(subMoney(subMoney(subtotal, itemDiscounts), form.discount));

  const resetForm = () => { setForm({ customerId: '', salesmanId: '', dueDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10), discount: 0, notes: '' }); setItems([]); };

  const openEdit = (inv: Invoice) => {
    if (inv.paid > 0) { showToast('لا يمكن تعديل فاتورة تم تسجيل دفعات عليها'); return; }
    const itemDiscountSum = roundMoney(inv.items.reduce((s, it) => addMoney(s, it.discount), 0));
    setForm({ customerId: inv.customerId, salesmanId: inv.salesmanId || '', dueDate: inv.dueDate.slice(0, 10), discount: clampNonNegative(subMoney(inv.discount, itemDiscountSum)), notes: inv.notes });
    setItems(inv.items.map(it => ({ ...it })));
    setEditInvoice(inv);
  };

  const handleCreate = () => {
    if (!form.customerId || items.length === 0) { showToast('يرجى اختيار عميل وإضافة منتجات'); return; }
    const customer = companyCustomers.find(c => c.id === form.customerId);
    const salesman = salesmen.find(s => s.id === form.salesmanId);
    // Check stock availability
    for (const item of items) {
      const product = companyProducts.find(p => p.id === item.productId);
      if (product && product.stock < item.quantity) {
        showToast(`الكمية غير متوفرة لـ ${product.name} (متوفر: ${product.stock})`);
        return;
      }
    }
    addInvoice({
      companyId, customerId: form.customerId, customerName: customer?.name || '',
      salesmanId: form.salesmanId || undefined, salesmanName: salesman?.name,
      items, subtotal, discount: addMoney(itemDiscounts, form.discount), tax: 0, total,
      paid: 0, remaining: total, status: 'unpaid', dueDate: form.dueDate, notes: form.notes,
    });
    showToast('تم إنشاء الفاتورة بنجاح ✅');
    setCreateOpen(false);
    resetForm();
  };

  const handleUpdate = () => {
    if (!editInvoice) return;
    if (!form.customerId || items.length === 0) { showToast('يرجى اختيار عميل وإضافة منتجات'); return; }
    const customer = companyCustomers.find(c => c.id === form.customerId);
    const salesman = salesmen.find(s => s.id === form.salesmanId);
    const result = updateInvoiceDetails(editInvoice.id, {
      customerId: form.customerId,
      salesmanId: form.salesmanId || undefined,
      salesmanName: salesman?.name,
      items,
      discount: addMoney(itemDiscounts, form.discount),
      dueDate: form.dueDate,
      notes: form.notes,
    });
    if (!result.success) { showToast(result.error || 'حدث خطأ أثناء التعديل'); return; }
    showToast('تم تحديث الفاتورة بنجاح ✅');
    setEditInvoice(null);
    resetForm();
  };

  const handleDelete = () => {
    if (!confirmDelete) return;
    const result = deleteInvoice(confirmDelete.id);
    if (!result.success) { showToast(result.error || 'حدث خطأ أثناء الحذف'); setConfirmDelete(null); return; }
    showToast('تم حذف الفاتورة وعكس المخزون والمديونية ✅');
    setConfirmDelete(null);
  };

  const handlePay = () => {
    if (!payModal || payAmount <= 0) { showToast('يرجى تحديد مبلغ صحيح'); return; }
    const { applied, excess } = registerPayment(payModal.id, payAmount, payMethod, '');
    if (excess > 0) {
      showToast(`تم تسجيل ${formatCurrency(applied)} فقط (المتبقي على الفاتورة). الزيادة ${formatCurrency(excess)} لم تُطبّق — استخدم "تحصيل الديون" لتوزيعها على فواتير أخرى.`);
    } else {
      showToast('تم تسجيل الدفعة ✅');
    }
    setPayModal(null);
    setPayAmount(0);
  };

  const renderInvoiceFormBody = () => (
    <>
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <label className="form-label">العميل *</label>
          <select className="kimichi-select" value={form.customerId} onChange={e => setForm({ ...form, customerId: e.target.value })}>
            <option value="">اختر عميل</option>
            {companyCustomers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="form-label">المندوب</label>
          <select className="kimichi-select" value={form.salesmanId} onChange={e => setForm({ ...form, salesmanId: e.target.value })}>
            <option value="">بدون</option>
            {salesmen.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="form-label">تاريخ الاستحقاق</label>
          <input type="date" className="kimichi-input" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-blue-400">المنتجات</h3>
        <button onClick={addItemRow} className="btn-ghost text-xs py-1"><Plus size={12} /> إضافة منتج</button>
      </div>

      <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
        {items.length === 0 && <p className="text-slate-500 text-sm text-center py-4">لا توجد منتجات مضافة</p>}
        {items.map(item => (
          <div key={item.id} className="grid grid-cols-12 gap-2 items-center p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <select className="kimichi-select col-span-4 text-xs" value={item.productId} onChange={e => updateItem(item.id, { productId: e.target.value })}>
              {companyProducts.map(p => <option key={p.id} value={p.id}>{p.name} (متوفر: {p.stock})</option>)}
            </select>
            <input type="number" className="kimichi-input col-span-2 text-xs" placeholder="الكمية" value={item.quantity} onChange={e => updateItem(item.id, { quantity: Number(e.target.value) })} />
            <input type="number" className="kimichi-input col-span-2 text-xs" placeholder="السعر" value={item.unitPrice} onChange={e => updateItem(item.id, { unitPrice: Number(e.target.value) })} />
            <input type="number" className="kimichi-input col-span-2 text-xs" placeholder="خصم" value={item.discount} onChange={e => updateItem(item.id, { discount: Number(e.target.value) })} />
            <div className="col-span-1 text-xs text-green-400">{formatCurrency(item.total)}</div>
            <button onClick={() => removeItem(item.id)} className="col-span-1 text-red-400"><Trash2 size={14} /></button>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-start gap-6 border-t pt-4" style={{ borderColor: 'rgba(59,130,246,0.1)' }}>
        <div className="flex-1">
          <label className="form-label">ملاحظات</label>
          <textarea className="kimichi-input" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
        </div>
        <div className="w-64 space-y-1 text-sm">
          <div className="flex justify-between text-slate-400"><span>المجموع الفرعي</span><span>{formatCurrency(subtotal)}</span></div>
          <div className="flex justify-between text-slate-400"><span>خصم العناصر</span><span>{formatCurrency(itemDiscounts)}</span></div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">خصم إضافي</span>
            <input type="number" className="kimichi-input w-24 text-xs" value={form.discount} onChange={e => setForm({ ...form, discount: Number(e.target.value) })} />
          </div>
          <div className="flex justify-between font-bold text-white border-t pt-2" style={{ borderColor: 'rgba(59,130,246,0.1)' }}><span>الإجمالي</span><span className="text-green-400">{formatCurrency(total)}</span></div>
        </div>
      </div>
    </>
  );

  return (
    <div className="space-y-6 fade-in">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">الفواتير</h1>
          <p className="text-slate-400 text-sm">{companyInvoices.length} فاتورة</p>
        </div>
        <button onClick={() => setCreateOpen(true)} className="btn-primary"><Plus size={16} /> فاتورة جديدة</button>
      </div>

      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative max-w-md flex-1">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input className="kimichi-input pr-10" placeholder="بحث برقم الفاتورة أو العميل..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="kimichi-select max-w-[160px]" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">جميع الحالات</option>
          {Object.entries(INVOICE_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      <div className="kimichi-card overflow-x-auto">
        <table className="kimichi-table">
          <thead><tr><th>رقم الفاتورة</th><th>العميل</th><th>المندوب</th><th>الإجمالي</th><th>المدفوع</th><th>المتبقي</th><th>الحالة</th><th>التاريخ</th><th>إجراءات</th></tr></thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={9} className="text-center text-slate-500 py-8">لا توجد فواتير</td></tr>}
            {filtered.map(inv => (
              <tr key={inv.id}>
                <td className="text-xs text-blue-400 font-mono">{inv.serialNumber}</td>
                <td className="text-white">{inv.customerName}</td>
                <td className="text-xs">{inv.salesmanName || '—'}</td>
                <td>{formatCurrency(inv.total)}</td>
                <td className="text-green-400">{formatCurrency(inv.paid)}</td>
                <td className={inv.remaining > 0 ? 'text-yellow-400' : 'text-slate-500'}>{formatCurrency(inv.remaining)}</td>
                <td><span className={`badge ${INVOICE_STATUS_COLORS[getEffectiveInvoiceStatus(inv)]}`}>{INVOICE_STATUS_LABELS[getEffectiveInvoiceStatus(inv)]}</span></td>
                <td className="text-xs text-slate-500">{formatDate(inv.createdAt)}</td>
                <td>
                  <div className="flex gap-1">
                    <button onClick={() => setViewInvoice(inv)} className="p-1.5 rounded hover:bg-blue-500/10 text-blue-400" title="عرض"><Eye size={14} /></button>
                    {inv.remaining > 0 && <button onClick={() => { setPayModal(inv); setPayAmount(inv.remaining); }} className="p-1.5 rounded hover:bg-green-500/10 text-green-400" title="تسجيل دفعة"><CreditCard size={14} /></button>}
                    <button onClick={() => generateInvoicePDF(inv, session!.company!.name)} className="p-1.5 rounded hover:bg-purple-500/10 text-purple-400" title="تحميل PDF"><FileText size={14} /></button>
                    {inv.paid <= 0 && <button onClick={() => openEdit(inv)} className="p-1.5 rounded hover:bg-amber-500/10 text-amber-400" title="تعديل"><Edit2 size={14} /></button>}
                    {inv.paid <= 0 && <button onClick={() => setConfirmDelete(inv)} className="p-1.5 rounded hover:bg-red-500/10 text-red-400" title="حذف"><Trash2 size={14} /></button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Invoice Modal */}
      {createOpen && (
        <div className="modal-overlay" onClick={() => setCreateOpen(false)}>
          <div className="modal-content w-full max-w-4xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2"><ShoppingCart size={18} className="text-blue-400" /> فاتورة مبيعات جديدة <span className="text-xs text-slate-500 font-mono">({peekNextInvoiceSerial(companyId)})</span></h2>
              <button onClick={() => setCreateOpen(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <label className="form-label">العميل *</label>
                <select className="kimichi-select" value={form.customerId} onChange={e => setForm({ ...form, customerId: e.target.value })}>
                  <option value="">اختر عميل</option>
                  {companyCustomers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">المندوب</label>
                <select className="kimichi-select" value={form.salesmanId} onChange={e => setForm({ ...form, salesmanId: e.target.value })}>
                  <option value="">بدون</option>
                  {salesmen.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">تاريخ الاستحقاق</label>
                <input type="date" className="kimichi-input" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
              </div>
            </div>

            {renderInvoiceFormBody()}

            <div className="flex gap-3 mt-6">
              <button onClick={handleCreate} className="btn-primary flex-1 justify-center py-2.5">إنشاء الفاتورة</button>
              <button onClick={() => setCreateOpen(false)} className="btn-ghost px-6">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Invoice Modal */}
      {editInvoice && (
        <div className="modal-overlay" onClick={() => { setEditInvoice(null); resetForm(); }}>
          <div className="modal-content w-full max-w-4xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2"><Edit2 size={18} className="text-amber-400" /> تعديل فاتورة <span className="text-xs text-slate-500 font-mono">({editInvoice.serialNumber})</span></h2>
              <button onClick={() => { setEditInvoice(null); resetForm(); }} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>

            {renderInvoiceFormBody()}

            <div className="flex gap-3 mt-6">
              <button onClick={handleUpdate} className="btn-primary flex-1 justify-center py-2.5">حفظ التعديلات</button>
              <button onClick={() => { setEditInvoice(null); resetForm(); }} className="btn-ghost px-6">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal-content w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-2"><AlertTriangle size={18} className="text-red-400" /><h3 className="text-lg font-bold text-white">تأكيد حذف الفاتورة</h3></div>
            <p className="text-slate-400 text-sm mb-2">هل تريد حذف الفاتورة <span className="text-white font-mono">{confirmDelete.serialNumber}</span>؟</p>
            <p className="text-xs text-slate-500 mb-6">سيتم استرجاع كميات المنتجات إلى المخزون، وتعديل مديونية العميل تلقائيًا لعكس هذه الفاتورة.</p>
            <div className="flex gap-3"><button onClick={handleDelete} className="btn-danger flex-1 justify-center py-2">حذف</button><button onClick={() => setConfirmDelete(null)} className="btn-ghost px-6">إلغاء</button></div>
          </div>
        </div>
      )}

      {/* View Invoice */}
      {viewInvoice && (
        <div className="modal-overlay" onClick={() => setViewInvoice(null)}>
          <div className="modal-content w-full max-w-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">فاتورة {viewInvoice.serialNumber}</h2>
              <button onClick={() => setViewInvoice(null)} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <div><div className="text-xs text-slate-500">العميل</div><div className="text-white">{viewInvoice.customerName}</div></div>
              <div><div className="text-xs text-slate-500">الحالة</div><span className={`badge ${INVOICE_STATUS_COLORS[getEffectiveInvoiceStatus(viewInvoice)]}`}>{INVOICE_STATUS_LABELS[getEffectiveInvoiceStatus(viewInvoice)]}</span></div>
            </div>
            <table className="kimichi-table mb-4">
              <thead><tr><th>المنتج</th><th>الكمية</th><th>السعر</th><th>الإجمالي</th></tr></thead>
              <tbody>{viewInvoice.items.map(it => <tr key={it.id}><td>{it.productName}</td><td>{it.quantity}</td><td>{formatCurrency(it.unitPrice)}</td><td>{formatCurrency(it.total)}</td></tr>)}</tbody>
            </table>
            <div className="flex justify-end">
              <div className="w-56 space-y-1 text-sm">
                <div className="flex justify-between text-slate-400"><span>الإجمالي</span><span>{formatCurrency(viewInvoice.total)}</span></div>
                <div className="flex justify-between text-green-400"><span>المدفوع</span><span>{formatCurrency(viewInvoice.paid)}</span></div>
                <div className="flex justify-between text-yellow-400"><span>المتبقي</span><span>{formatCurrency(viewInvoice.remaining)}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {payModal && (
        <div className="modal-overlay" onClick={() => setPayModal(null)}>
          <div className="modal-content w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white mb-4">تسجيل دفعة - {payModal.serialNumber}</h3>
            <p className="text-sm text-slate-400 mb-4">المتبقي: <span className="text-yellow-400">{formatCurrency(payModal.remaining)}</span></p>
            <label className="form-label">المبلغ</label>
            <input type="number" max={payModal.remaining} className="kimichi-input mb-1" value={payAmount} onChange={e => setPayAmount(Number(e.target.value))} />
            <p className="text-xs text-slate-500 mb-4">المبلغ المُسجَّل على هذه الفاتورة محدود بالمتبقي ({formatCurrency(payModal.remaining)}). لتوزيع دفعة على عدة فواتير لهذا العميل، استخدم صفحة "تحصيل الديون".</p>
            <label className="form-label">طريقة الدفع</label>
            <select className="kimichi-select mb-4" value={payMethod} onChange={e => setPayMethod(e.target.value)}>
              <option value="cash">نقدي</option><option value="bank">تحويل بنكي</option><option value="check">شيك</option><option value="other">أخرى</option>
            </select>
            <div className="flex gap-3"><button onClick={handlePay} className="btn-success flex-1 justify-center py-2">تأكيد الدفع</button><button onClick={() => setPayModal(null)} className="btn-ghost px-6">إلغاء</button></div>
          </div>
        </div>
      )}

      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 fade-in"><div className="alert-success shadow-lg">{toast}</div></div>}
    </div>
  );
}
