'use client';
import { useState, useMemo } from 'react';
import { useStore } from '@/store';
import type { Product } from '@/types';
import { formatCurrency, getDeadStockProductIds } from '@/lib/utils';
import { Plus, Search, Edit2, Trash2, X, Package, AlertTriangle } from 'lucide-react';

export default function ProductsPage() {
  const { session, products, invoices, addProduct, updateProduct, deleteProduct, addInventoryMovement } = useStore();
  const companyId = session!.company!.id;
  const businessType = session!.company!.businessType;
  const companyProducts = products.filter(p => p.companyId === companyId);
  const companyInvoices = invoices.filter(i => i.companyId === companyId);

  // Real dead-stock detection: products with stock on hand that have not
  // appeared in any sales invoice within the last 90 days. Previously this
  // filter just checked `stock > 0`, which flagged almost every product.
  const deadStockIds = useMemo(
    () => getDeadStockProductIds(companyProducts, companyInvoices, 90),
    [companyProducts, companyInvoices]
  );

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'low_stock' | 'dead_stock'>('all');
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [selected, setSelected] = useState<Product | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Product | null>(null);
  const [toast, setToast] = useState('');

  const emptyForm = {
    name: '', sku: '', barcode: '', category: '', buyPrice: 0, sellPrice: 0, stock: 0, minStock: 10, unit: 'قطعة',
    serialNumber: '', warrantyMonths: 0, expiryDate: '', batchNumber: '', partNumber: '', carModel: '', supplierLicense: '',
    status: 'active' as 'active' | 'inactive', notes: '',
  };
  const [form, setForm] = useState(emptyForm);

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 3000); };

  const filtered = companyProducts.filter(p => {
    const matchSearch = p.name.includes(search) || p.sku.includes(search) || p.category.includes(search);
    if (filter === 'low_stock') return matchSearch && p.stock <= p.minStock;
    if (filter === 'dead_stock') return matchSearch && deadStockIds.has(p.id);
    return matchSearch;
  });

  const openCreate = () => { setForm(emptyForm); setModalMode('create'); };
  const openEdit = (p: Product) => {
    setSelected(p);
    setForm({
      name: p.name, sku: p.sku, barcode: p.barcode || '', category: p.category, buyPrice: p.buyPrice, sellPrice: p.sellPrice,
      stock: p.stock, minStock: p.minStock, unit: p.unit, serialNumber: p.serialNumber || '', warrantyMonths: p.warrantyMonths || 0,
      expiryDate: p.expiryDate || '', batchNumber: p.batchNumber || '', partNumber: p.partNumber || '', carModel: p.carModel || '',
      supplierLicense: p.supplierLicense || '', status: p.status, notes: p.notes,
    });
    setModalMode('edit');
  };

  const handleSubmit = () => {
    if (!form.name || !form.sku) { showToast('يرجى تعبئة الاسم والرمز SKU'); return; }
    if (modalMode === 'create') {
      addProduct({ ...form, companyId });
      showToast('تم إضافة المنتج ✅');
    } else if (modalMode === 'edit' && selected) {
      // If stock was changed directly on this form, log it as an
      // inventory movement so it shows up in the audit trail on the
      // Inventory page instead of silently desyncing from the ledger.
      if (form.stock !== selected.stock) {
        addInventoryMovement({
          companyId,
          productId: selected.id,
          productName: form.name,
          type: form.stock > selected.stock ? 'in' : 'out',
          quantity: Math.abs(form.stock - selected.stock),
          previousStock: selected.stock,
          newStock: form.stock,
          reason: 'تعديل يدوي من صفحة المنتجات',
          reference: '',
          userId: session!.user.id,
          userName: session!.user.name,
        });
      }
      updateProduct(selected.id, form);
      showToast('تم تحديث المنتج ✅');
    }
    setModalMode(null);
  };

  const handleDelete = () => { if (confirmDelete) { deleteProduct(confirmDelete.id); showToast('تم حذف المنتج'); setConfirmDelete(null); } };

  const showExpiry = ['food_wholesale', 'supermarket', 'pharmacy', 'restaurant', 'cafe'].includes(businessType);
  const showWarranty = businessType === 'electronics';
  const showCarParts = businessType === 'car_parts';
  const showPharmacyLicense = businessType === 'pharmacy';

  return (
    <div className="space-y-6 fade-in">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">المنتجات</h1>
          <p className="text-slate-400 text-sm">{companyProducts.length} منتج في النظام</p>
        </div>
        <button onClick={openCreate} className="btn-primary"><Plus size={16} /> إضافة منتج</button>
      </div>

      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative max-w-md flex-1">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input className="kimichi-input pr-10" placeholder="بحث بالاسم، الرمز، الفئة..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2">
          {[{ k: 'all', l: 'الكل' }, { k: 'low_stock', l: 'مخزون منخفض' }, { k: 'dead_stock', l: `مخزون راكد (${deadStockIds.size})` }].map(f => (
            <button key={f.k} onClick={() => setFilter(f.k as any)} title={f.k === 'dead_stock' ? 'منتجات لها مخزون لكن لم تُباع خلال آخر 90 يومًا' : undefined} className="px-3 py-1.5 rounded-lg text-xs" style={{ background: filter === f.k ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.04)', color: filter === f.k ? '#60a5fa' : '#94a3b8', border: filter === f.k ? '1px solid rgba(59,130,246,0.4)' : '1px solid rgba(255,255,255,0.08)' }}>{f.l}</button>
          ))}
        </div>
      </div>

      <div className="kimichi-card overflow-x-auto">
        <table className="kimichi-table">
          <thead>
            <tr><th>المنتج</th><th>SKU</th><th>الفئة</th><th>سعر الشراء</th><th>سعر البيع</th><th>الربح</th><th>المخزون</th><th>إجراءات</th></tr>
          </thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={8} className="text-center text-slate-500 py-8">لا توجد منتجات</td></tr>}
            {filtered.map(p => {
              const margin = p.sellPrice - p.buyPrice;
              const marginPct = p.buyPrice > 0 ? ((margin / p.buyPrice) * 100).toFixed(0) : '0';
              const isLow = p.stock <= p.minStock;
              return (
                <tr key={p.id}>
                  <td className="font-medium text-white">{p.name}</td>
                  <td className="text-xs font-mono text-blue-400">{p.sku}</td>
                  <td className="text-xs">{p.category}</td>
                  <td>{formatCurrency(p.buyPrice)}</td>
                  <td>{formatCurrency(p.sellPrice)}</td>
                  <td className="text-green-400 text-xs">{formatCurrency(margin)} ({marginPct}%)</td>
                  <td>
                    <div className="flex flex-col gap-1">
                      <span className={`badge ${isLow ? 'badge-danger' : 'badge-success'}`}>
                        {isLow && <AlertTriangle size={10} className="ml-1" />}
                        {p.stock} {p.unit}
                      </span>
                      {deadStockIds.has(p.id) && <span className="badge badge-warning text-[10px]">راكد 90+ يوم</span>}
                    </div>
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded hover:bg-yellow-500/10 text-yellow-400" title="تعديل"><Edit2 size={14} /></button>
                      <button onClick={() => setConfirmDelete(p)} className="p-1.5 rounded hover:bg-red-500/10 text-red-500" title="حذف"><Trash2 size={14} /></button>
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
          <div className="modal-content w-full max-w-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2"><Package size={18} className="text-blue-400" /> {modalMode === 'create' ? 'إضافة منتج جديد' : 'تعديل المنتج'}</h2>
              <button onClick={() => setModalMode(null)} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2"><label className="form-label">اسم المنتج *</label><input className="kimichi-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div><label className="form-label">رمز SKU *</label><input className="kimichi-input" value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} /></div>
              <div><label className="form-label">الباركود</label><input className="kimichi-input" value={form.barcode} onChange={e => setForm({ ...form, barcode: e.target.value })} /></div>
              <div><label className="form-label">الفئة</label><input className="kimichi-input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} /></div>
              <div><label className="form-label">الوحدة</label><input className="kimichi-input" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} /></div>
              <div><label className="form-label">سعر الشراء</label><input type="number" className="kimichi-input" value={form.buyPrice} onChange={e => setForm({ ...form, buyPrice: Number(e.target.value) })} /></div>
              <div><label className="form-label">سعر البيع</label><input type="number" className="kimichi-input" value={form.sellPrice} onChange={e => setForm({ ...form, sellPrice: Number(e.target.value) })} /></div>
              <div><label className="form-label">الكمية الحالية</label><input type="number" className="kimichi-input" value={form.stock} onChange={e => setForm({ ...form, stock: Number(e.target.value) })} /></div>
              <div><label className="form-label">حد إعادة الطلب</label><input type="number" className="kimichi-input" value={form.minStock} onChange={e => setForm({ ...form, minStock: Number(e.target.value) })} /></div>

              {showExpiry && (
                <>
                  <div><label className="form-label">تاريخ الانتهاء</label><input type="date" className="kimichi-input" value={form.expiryDate} onChange={e => setForm({ ...form, expiryDate: e.target.value })} /></div>
                  <div><label className="form-label">رقم التشغيلة (Batch)</label><input className="kimichi-input" value={form.batchNumber} onChange={e => setForm({ ...form, batchNumber: e.target.value })} /></div>
                </>
              )}
              {showWarranty && (
                <>
                  <div><label className="form-label">الرقم التسلسلي</label><input className="kimichi-input" value={form.serialNumber} onChange={e => setForm({ ...form, serialNumber: e.target.value })} /></div>
                  <div><label className="form-label">الضمان (أشهر)</label><input type="number" className="kimichi-input" value={form.warrantyMonths} onChange={e => setForm({ ...form, warrantyMonths: Number(e.target.value) })} /></div>
                </>
              )}
              {showCarParts && (
                <>
                  <div><label className="form-label">رقم القطعة</label><input className="kimichi-input" value={form.partNumber} onChange={e => setForm({ ...form, partNumber: e.target.value })} /></div>
                  <div><label className="form-label">موديل السيارة</label><input className="kimichi-input" value={form.carModel} onChange={e => setForm({ ...form, carModel: e.target.value })} /></div>
                </>
              )}
              {showPharmacyLicense && (
                <div className="col-span-2"><label className="form-label">رخصة المورد</label><input className="kimichi-input" value={form.supplierLicense} onChange={e => setForm({ ...form, supplierLicense: e.target.value })} /></div>
              )}

              <div className="col-span-2"><label className="form-label">ملاحظات</label><textarea className="kimichi-input" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleSubmit} className="btn-primary flex-1 justify-center py-2.5">{modalMode === 'create' ? 'إضافة' : 'حفظ'}</button>
              <button onClick={() => setModalMode(null)} className="btn-ghost px-6">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal-content w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white mb-2">تأكيد الحذف</h3>
            <p className="text-slate-400 text-sm mb-6">هل تريد حذف المنتج <span className="text-white">{confirmDelete.name}</span>؟</p>
            <div className="flex gap-3"><button onClick={handleDelete} className="btn-danger flex-1 justify-center py-2">حذف</button><button onClick={() => setConfirmDelete(null)} className="btn-ghost px-6">إلغاء</button></div>
          </div>
        </div>
      )}

      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 fade-in"><div className="alert-success shadow-lg">{toast}</div></div>}
    </div>
  );
}
