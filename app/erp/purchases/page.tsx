'use client';
import { useState } from 'react';
import { useStore } from '@/store';
import type { Purchase, PurchaseItem } from '@/types';
import { formatCurrency, formatDate, PAYMENT_STATUS_LABELS, PAYMENT_STATUS_COLORS } from '@/lib/utils';
import { roundMoney, addMoney, subMoney, clampNonNegative, isZeroMoney } from '@/lib/money';
import { Plus, Search, Eye, X, ShoppingCart, Trash2, CreditCard } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export default function PurchasesPage() {
  const { session, purchases, suppliers, products, addPurchase, registerSupplierPayment, peekNextPurchaseSerial } = useStore();
  const companyId = session!.company!.id;
  const companyPurchases = purchases.filter(p => p.companyId === companyId).slice().reverse();
  const companySuppliers = suppliers.filter(s => s.companyId === companyId);
  const companyProducts = products.filter(p => p.companyId === companyId);

  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [viewPurchase, setViewPurchase] = useState<Purchase | null>(null);
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState('cash');
  const [toast, setToast] = useState('');
  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 3000); };

  const [form, setForm] = useState({ supplierId: '', receivedDate: new Date().toISOString().slice(0, 10), paid: 0, notes: '' });
  const [items, setItems] = useState<PurchaseItem[]>([]);

  const filtered = companyPurchases.filter(p => p.serialNumber.includes(search) || p.supplierName.includes(search));

  const addItemRow = () => {
    if (companyProducts.length === 0) { showToast('لا توجد منتجات'); return; }
    const product = companyProducts[0];
    setItems([...items, { id: uuidv4(), productId: product.id, productName: product.name, quantity: 1, unitPrice: product.buyPrice, total: roundMoney(product.buyPrice) }]);
  };

  const updateItem = (id: string, patch: Partial<PurchaseItem>) => {
    setItems(items.map(it => {
      if (it.id !== id) return it;
      const updated = { ...it, ...patch };
      if (patch.productId) {
        const p = companyProducts.find(pp => pp.id === patch.productId);
        if (p) { updated.productName = p.name; updated.unitPrice = p.buyPrice; }
      }
      updated.total = roundMoney(updated.quantity * updated.unitPrice);
      return updated;
    }));
  };

  const removeItem = (id: string) => setItems(items.filter(it => it.id !== id));
  const total = roundMoney(items.reduce((s, it) => addMoney(s, it.total), 0));
  const remaining = clampNonNegative(subMoney(total, form.paid));

  const resetForm = () => { setForm({ supplierId: '', receivedDate: new Date().toISOString().slice(0, 10), paid: 0, notes: '' }); setItems([]); };

  const handleCreate = () => {
    if (!form.supplierId || items.length === 0) { showToast('يرجى اختيار مورد وإضافة منتجات'); return; }
    const supplier = companySuppliers.find(s => s.id === form.supplierId);
    // addPurchase already updates supplier.amountDue and product stock
    // internally — no separate updateSupplier call needed here (the old
    // code called updateSupplier AND relied on addPurchase, which would
    // double count the debt once addPurchase was fixed to do this itself).
    addPurchase({
      companyId, supplierId: form.supplierId, supplierName: supplier?.name || '', items, total,
      paid: form.paid, remaining, paymentStatus: isZeroMoney(remaining) ? 'paid' : 'pending',
      receivedDate: form.receivedDate, notes: form.notes,
    });
    showToast('تم تسجيل أمر الشراء ✅');
    setCreateOpen(false);
    resetForm();
  };

  const handlePay = () => {
    if (!viewPurchase || payAmount <= 0) { showToast('يرجى تحديد مبلغ صحيح'); return; }
    const { applied, excess } = registerSupplierPayment(viewPurchase.id, payAmount, payMethod, '');
    if (excess > 0) showToast(`تم تسجيل ${formatCurrency(applied)} فقط (المتبقي على أمر الشراء).`);
    else showToast('تم تسجيل الدفعة ✅');
    setPayAmount(0);
    // Refresh the viewed purchase from the store so the modal reflects
    // the new paid/remaining values immediately.
    const updated = useStore.getState().purchases.find(p => p.id === viewPurchase.id);
    setViewPurchase(updated || null);
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="page-header">
        <div><h1 className="text-2xl font-bold text-white mb-1">المشتريات</h1><p className="text-slate-400 text-sm">{companyPurchases.length} أمر شراء</p></div>
        <button onClick={() => setCreateOpen(true)} className="btn-primary"><Plus size={16} /> أمر شراء جديد</button>
      </div>

      <div className="relative max-w-md">
        <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input className="kimichi-input pr-10" placeholder="بحث برقم الأمر أو المورد..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="kimichi-card overflow-x-auto">
        <table className="kimichi-table">
          <thead><tr><th>رقم الأمر</th><th>المورد</th><th>الإجمالي</th><th>المدفوع</th><th>المتبقي</th><th>الحالة</th><th>تاريخ الاستلام</th><th>إجراءات</th></tr></thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={8} className="text-center text-slate-500 py-8">لا توجد مشتريات</td></tr>}
            {filtered.map(p => (
              <tr key={p.id}>
                <td className="text-xs text-blue-400 font-mono">{p.serialNumber}</td>
                <td className="text-white">{p.supplierName}</td>
                <td>{formatCurrency(p.total)}</td>
                <td className="text-green-400">{formatCurrency(p.paid)}</td>
                <td className={p.remaining > 0 ? 'text-yellow-400' : 'text-slate-500'}>{formatCurrency(p.remaining)}</td>
                <td><span className={`badge ${PAYMENT_STATUS_COLORS[p.paymentStatus]}`}>{PAYMENT_STATUS_LABELS[p.paymentStatus]}</span></td>
                <td className="text-xs text-slate-500">{formatDate(p.receivedDate)}</td>
                <td><button onClick={() => setViewPurchase(p)} className="p-1.5 rounded hover:bg-blue-500/10 text-blue-400"><Eye size={14} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {createOpen && (
        <div className="modal-overlay" onClick={() => setCreateOpen(false)}>
          <div className="modal-content w-full max-w-3xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2"><ShoppingCart size={18} className="text-blue-400" /> أمر شراء جديد <span className="text-xs text-slate-500 font-mono">({peekNextPurchaseSerial(companyId)})</span></h2>
              <button onClick={() => setCreateOpen(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div><label className="form-label">المورد *</label><select className="kimichi-select" value={form.supplierId} onChange={e => setForm({ ...form, supplierId: e.target.value })}><option value="">اختر مورد</option>{companySuppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
              <div><label className="form-label">تاريخ الاستلام</label><input type="date" className="kimichi-input" value={form.receivedDate} onChange={e => setForm({ ...form, receivedDate: e.target.value })} /></div>
            </div>

            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-blue-400">المنتجات المستلمة</h3>
              <button onClick={addItemRow} className="btn-ghost text-xs py-1"><Plus size={12} /> إضافة منتج</button>
            </div>
            <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
              {items.length === 0 && <p className="text-slate-500 text-sm text-center py-4">لا توجد منتجات</p>}
              {items.map(item => (
                <div key={item.id} className="grid grid-cols-12 gap-2 items-center p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <select className="kimichi-select col-span-5 text-xs" value={item.productId} onChange={e => updateItem(item.id, { productId: e.target.value })}>{companyProducts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
                  <input type="number" className="kimichi-input col-span-2 text-xs" placeholder="الكمية" value={item.quantity} onChange={e => updateItem(item.id, { quantity: Number(e.target.value) })} />
                  <input type="number" className="kimichi-input col-span-2 text-xs" placeholder="سعر الشراء" value={item.unitPrice} onChange={e => updateItem(item.id, { unitPrice: Number(e.target.value) })} />
                  <div className="col-span-2 text-xs text-green-400">{formatCurrency(item.total)}</div>
                  <button onClick={() => removeItem(item.id)} className="col-span-1 text-red-400"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-start gap-6 border-t pt-4" style={{ borderColor: 'rgba(59,130,246,0.1)' }}>
              <div className="flex-1"><label className="form-label">ملاحظات</label><textarea className="kimichi-input" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
              <div className="w-64 space-y-1 text-sm">
                <div className="flex justify-between font-bold text-white"><span>الإجمالي</span><span>{formatCurrency(total)}</span></div>
                <div className="flex justify-between items-center"><span className="text-slate-400">المدفوع الآن</span><input type="number" className="kimichi-input w-24 text-xs" value={form.paid} onChange={e => setForm({ ...form, paid: Number(e.target.value) })} /></div>
                <div className="flex justify-between text-yellow-400"><span>المتبقي</span><span>{formatCurrency(remaining)}</span></div>
              </div>
            </div>

            <div className="flex gap-3 mt-6"><button onClick={handleCreate} className="btn-primary flex-1 justify-center py-2.5">تسجيل أمر الشراء</button><button onClick={() => setCreateOpen(false)} className="btn-ghost px-6">إلغاء</button></div>
          </div>
        </div>
      )}

      {viewPurchase && (
        <div className="modal-overlay" onClick={() => setViewPurchase(null)}>
          <div className="modal-content w-full max-w-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6"><h2 className="text-lg font-bold text-white">أمر شراء {viewPurchase.serialNumber}</h2><button onClick={() => setViewPurchase(null)} className="text-slate-400 hover:text-white"><X size={20} /></button></div>
            <table className="kimichi-table mb-4"><thead><tr><th>المنتج</th><th>الكمية</th><th>السعر</th><th>الإجمالي</th></tr></thead>
              <tbody>{viewPurchase.items.map(it => <tr key={it.id}><td>{it.productName}</td><td>{it.quantity}</td><td>{formatCurrency(it.unitPrice)}</td><td>{formatCurrency(it.total)}</td></tr>)}</tbody>
            </table>
            <div className="flex justify-between items-end gap-6 border-t pt-4" style={{ borderColor: 'rgba(59,130,246,0.1)' }}>
              <div className="text-sm space-y-1">
                <div className="flex gap-2"><span className="text-slate-400">الإجمالي:</span><span className="text-white">{formatCurrency(viewPurchase.total)}</span></div>
                <div className="flex gap-2"><span className="text-slate-400">المدفوع:</span><span className="text-green-400">{formatCurrency(viewPurchase.paid)}</span></div>
                <div className="flex gap-2"><span className="text-slate-400">المتبقي:</span><span className="text-yellow-400">{formatCurrency(viewPurchase.remaining)}</span></div>
              </div>
              {viewPurchase.remaining > 0 && (
                <div className="w-64 space-y-2">
                  <label className="form-label">تسجيل دفعة للمورد</label>
                  <input type="number" max={viewPurchase.remaining} className="kimichi-input" placeholder="المبلغ" value={payAmount || ''} onChange={e => setPayAmount(Number(e.target.value))} />
                  <select className="kimichi-select" value={payMethod} onChange={e => setPayMethod(e.target.value)}>
                    <option value="cash">نقدي</option><option value="bank">تحويل بنكي</option><option value="check">شيك</option><option value="other">أخرى</option>
                  </select>
                  <button onClick={handlePay} className="btn-success w-full justify-center py-2"><CreditCard size={14} /> تأكيد الدفع</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 fade-in"><div className="alert-success shadow-lg">{toast}</div></div>}
    </div>
  );
}
