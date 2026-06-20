'use client';
import { useState } from 'react';
import { useStore } from '@/store';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { Warehouse, ArrowDownCircle, ArrowUpCircle, Settings2, AlertTriangle, TrendingDown, X, Plus } from 'lucide-react';

export default function InventoryPage() {
  const { session, products, inventoryMovements, addInventoryMovement } = useStore();
  const companyId = session!.company!.id;
  const companyProducts = products.filter(p => p.companyId === companyId);
  const companyMovements = inventoryMovements.filter(m => m.companyId === companyId).slice().reverse();

  const [tab, setTab] = useState<'movements' | 'low_stock' | 'valuation'>('movements');
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [form, setForm] = useState({ productId: '', type: 'in' as 'in' | 'out' | 'adjustment', quantity: 0, reason: '' });

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 3000); };

  const lowStock = companyProducts.filter(p => p.stock <= p.minStock);
  const totalValuation = companyProducts.reduce((s, p) => s + p.stock * p.buyPrice, 0);
  const totalRetailValue = companyProducts.reduce((s, p) => s + p.stock * p.sellPrice, 0);

  const handleAdjust = () => {
    const product = companyProducts.find(p => p.id === form.productId);
    if (!product) { showToast('يرجى اختيار منتج'); return; }
    // For 'adjustment' (set absolute new stock), 0 is a valid target
    // (e.g. recording that a product is fully out of stock). Only 'in'/
    // 'out' require a positive quantity, since "move 0 units" is
    // meaningless for those.
    if (form.type !== 'adjustment' && form.quantity <= 0) { showToast('يرجى تحديد كمية أكبر من صفر'); return; }
    if (form.type === 'adjustment' && form.quantity < 0) { showToast('لا يمكن أن يكون المخزون بقيمة سالبة'); return; }
    let newStock = product.stock;
    if (form.type === 'in') newStock += form.quantity;
    else if (form.type === 'out') newStock = Math.max(0, newStock - form.quantity);
    else newStock = form.quantity;

    addInventoryMovement({
      companyId, productId: product.id, productName: product.name, type: form.type,
      quantity: form.quantity, previousStock: product.stock, newStock,
      reason: form.reason || 'تعديل يدوي', userId: session!.user.id, userName: session!.user.name,
    });
    showToast('تم تسجيل حركة المخزون ✅');
    setAdjustModalOpen(false);
    setForm({ productId: '', type: 'in', quantity: 0, reason: '' });
  };

  const movementColors: Record<string, { bg: string; text: string; icon: any }> = {
    in: { bg: 'rgba(34,197,94,0.1)', text: '#4ade80', icon: ArrowDownCircle },
    out: { bg: 'rgba(239,68,68,0.1)', text: '#f87171', icon: ArrowUpCircle },
    adjustment: { bg: 'rgba(59,130,246,0.1)', text: '#60a5fa', icon: Settings2 },
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">المخزون</h1>
          <p className="text-slate-400 text-sm">إدارة حركات المخزون والمستويات</p>
        </div>
        <button onClick={() => setAdjustModalOpen(true)} className="btn-primary"><Plus size={16} /> حركة مخزون جديدة</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-card"><div className="flex items-center gap-2 mb-2"><Warehouse size={16} className="text-blue-400" /><span className="text-xs text-slate-400">إجمالي المنتجات</span></div><div className="text-2xl font-bold text-white">{companyProducts.length}</div></div>
        <div className="stat-card"><div className="flex items-center gap-2 mb-2"><AlertTriangle size={16} className="text-red-400" /><span className="text-xs text-slate-400">مخزون منخفض</span></div><div className="text-2xl font-bold text-white">{lowStock.length}</div></div>
        <div className="stat-card"><div className="flex items-center gap-2 mb-2"><TrendingDown size={16} className="text-green-400" /><span className="text-xs text-slate-400">قيمة المخزون (تكلفة)</span></div><div className="text-xl font-bold text-white">{formatCurrency(totalValuation)}</div></div>
        <div className="stat-card"><div className="flex items-center gap-2 mb-2"><TrendingDown size={16} className="text-purple-400" /><span className="text-xs text-slate-400">القيمة السوقية</span></div><div className="text-xl font-bold text-white">{formatCurrency(totalRetailValue)}</div></div>
      </div>

      <div className="flex gap-2 border-b" style={{ borderColor: 'rgba(59,130,246,0.1)' }}>
        <button onClick={() => setTab('movements')} className={`px-4 py-2 text-sm ${tab === 'movements' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-500'}`}>حركات المخزون</button>
        <button onClick={() => setTab('low_stock')} className={`px-4 py-2 text-sm ${tab === 'low_stock' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-500'}`}>مخزون منخفض</button>
        <button onClick={() => setTab('valuation')} className={`px-4 py-2 text-sm ${tab === 'valuation' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-500'}`}>تقييم المخزون</button>
      </div>

      {tab === 'movements' && (
        <div className="kimichi-card overflow-x-auto">
          <table className="kimichi-table">
            <thead><tr><th>النوع</th><th>المنتج</th><th>الكمية</th><th>المخزون قبل</th><th>المخزون بعد</th><th>السبب</th><th>المستخدم</th><th>التاريخ</th></tr></thead>
            <tbody>
              {companyMovements.length === 0 && <tr><td colSpan={8} className="text-center text-slate-500 py-8">لا توجد حركات مسجلة</td></tr>}
              {companyMovements.map(m => {
                const c = movementColors[m.type];
                const Icon = c.icon;
                return (
                  <tr key={m.id}>
                    <td><span className="badge" style={{ background: c.bg, color: c.text }}><Icon size={10} className="ml-1" />{m.type === 'in' ? 'إدخال' : m.type === 'out' ? 'إخراج' : 'تعديل'}</span></td>
                    <td className="text-white">{m.productName}</td>
                    <td>{m.quantity}</td>
                    <td className="text-slate-500">{m.previousStock}</td>
                    <td className="text-slate-300">{m.newStock}</td>
                    <td className="text-xs">{m.reason}</td>
                    <td className="text-xs text-slate-500">{m.userName}</td>
                    <td className="text-xs text-slate-500">{formatDateTime(m.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'low_stock' && (
        <div className="kimichi-card overflow-x-auto">
          <table className="kimichi-table">
            <thead><tr><th>المنتج</th><th>المخزون الحالي</th><th>حد إعادة الطلب</th><th>الكمية المقترحة</th></tr></thead>
            <tbody>
              {lowStock.length === 0 && <tr><td colSpan={4} className="text-center text-slate-500 py-8">لا توجد منتجات منخفضة المخزون</td></tr>}
              {lowStock.map(p => (
                <tr key={p.id}>
                  <td className="text-white">{p.name}</td>
                  <td><span className="badge badge-danger">{p.stock} {p.unit}</span></td>
                  <td>{p.minStock} {p.unit}</td>
                  <td className="text-green-400">{Math.max(p.minStock * 2 - p.stock, p.minStock)} {p.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'valuation' && (
        <div className="kimichi-card overflow-x-auto">
          <table className="kimichi-table">
            <thead><tr><th>المنتج</th><th>الكمية</th><th>سعر التكلفة</th><th>قيمة التكلفة</th><th>سعر البيع</th><th>القيمة السوقية</th></tr></thead>
            <tbody>
              {companyProducts.map(p => (
                <tr key={p.id}>
                  <td className="text-white">{p.name}</td>
                  <td>{p.stock} {p.unit}</td>
                  <td>{formatCurrency(p.buyPrice)}</td>
                  <td>{formatCurrency(p.stock * p.buyPrice)}</td>
                  <td>{formatCurrency(p.sellPrice)}</td>
                  <td className="text-green-400">{formatCurrency(p.stock * p.sellPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {adjustModalOpen && (
        <div className="modal-overlay" onClick={() => setAdjustModalOpen(false)}>
          <div className="modal-content w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2"><Warehouse size={18} className="text-blue-400" /> حركة مخزون جديدة</h2>
              <button onClick={() => setAdjustModalOpen(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="form-label">المنتج</label>
                <select className="kimichi-select" value={form.productId} onChange={e => setForm({ ...form, productId: e.target.value })}>
                  <option value="">اختر منتج</option>
                  {companyProducts.map(p => <option key={p.id} value={p.id}>{p.name} (متوفر: {p.stock})</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">نوع الحركة</label>
                <div className="flex gap-2">
                  {[{ k: 'in', l: 'إدخال' }, { k: 'out', l: 'إخراج' }, { k: 'adjustment', l: 'تعديل مباشر' }].map(t => (
                    <button key={t.k} onClick={() => setForm({ ...form, type: t.k as any })} className={`flex-1 py-2 rounded-lg text-sm border ${form.type === t.k ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-slate-700 text-slate-400'}`}>{t.l}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="form-label">{form.type === 'adjustment' ? 'الكمية الجديدة' : 'الكمية'}</label>
                <input type="number" className="kimichi-input" value={form.quantity} onChange={e => setForm({ ...form, quantity: Number(e.target.value) })} />
              </div>
              <div>
                <label className="form-label">السبب</label>
                <input className="kimichi-input" value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} placeholder="مثال: جرد، تلف، تصحيح" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleAdjust} className="btn-primary flex-1 justify-center py-2.5">تسجيل الحركة</button>
              <button onClick={() => setAdjustModalOpen(false)} className="btn-ghost px-6">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 fade-in"><div className="alert-success shadow-lg">{toast}</div></div>}
    </div>
  );
}
