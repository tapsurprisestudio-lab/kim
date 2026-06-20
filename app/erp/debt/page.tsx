'use client';
import { useState } from 'react';
import { useStore } from '@/store';
import { formatCurrency, formatDate } from '@/lib/utils';
import { generateDebtReportPDF } from '@/lib/pdfService';
import { Wallet, AlertTriangle, Phone, FileText, X, CreditCard, TrendingUp } from 'lucide-react';

export default function DebtCollectionPage() {
  const { session, customers, invoices, registerCustomerPayment } = useStore();
  const companyId = session!.company!.id;
  const companyCustomers = customers.filter(c => c.companyId === companyId && c.currentDebt > 0);
  const companyInvoices = invoices.filter(i => i.companyId === companyId);

  const [payModal, setPayModal] = useState<{ customerId: string; customerName: string; debt: number } | null>(null);
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState('cash');
  const [notes, setNotes] = useState('');
  const [toast, setToast] = useState('');
  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 3000); };

  const getOldestUnpaidInvoice = (customerId: string) => {
    return companyInvoices.filter(i => i.customerId === customerId && i.remaining > 0).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0];
  };

  const getDebtAge = (customerId: string) => {
    const inv = getOldestUnpaidInvoice(customerId);
    if (!inv) return 0;
    return Math.floor((Date.now() - new Date(inv.createdAt).getTime()) / 86400000);
  };

  const getRiskScore = (debt: number, creditLimit: number, age: number) => {
    let score = 0;
    if (creditLimit > 0 && debt / creditLimit > 0.9) score += 40;
    else if (creditLimit > 0 && debt / creditLimit > 0.6) score += 20;
    if (age > 90) score += 40;
    else if (age > 30) score += 20;
    else if (age > 7) score += 10;
    return Math.min(100, score);
  };

  const debtList = companyCustomers.map(c => {
    const age = getDebtAge(c.id);
    const risk = getRiskScore(c.currentDebt, c.creditLimit, age);
    return { ...c, age, risk };
  }).sort((a, b) => b.risk - a.risk);

  const totalDebt = companyCustomers.reduce((s, c) => s + c.currentDebt, 0);
  const highRisk = debtList.filter(c => c.risk >= 60).length;
  const overdueCount = debtList.filter(c => c.age > 30).length;

  const handlePay = () => {
    if (!payModal) return;
    if (payAmount <= 0) { showToast('يرجى تحديد مبلغ صحيح'); return; }
    // Allocates the payment across ALL of the customer's open invoices
    // (oldest due date first) instead of always dumping it onto a single
    // invoice, which previously let currentDebt drift from the real sum
    // of invoice balances whenever a customer had more than one open
    // invoice.
    const { allocated, unallocated } = registerCustomerPayment(payModal.customerId, payAmount, payMethod, notes);
    if (allocated.length === 0 && unallocated <= 0) {
      showToast('لا توجد فواتير مفتوحة لهذا العميل');
    } else if (unallocated > 0) {
      showToast(`تم توزيع الدفعة على ${allocated.length} فاتورة. تبقى ${formatCurrency(unallocated)} كرصيد دائن للعميل (سيُخصم من فاتورته القادمة).`);
    } else {
      showToast(`تم تحصيل الدفعة وتوزيعها على ${allocated.length} فاتورة ✅`);
    }
    setPayModal(null);
    setPayAmount(0);
    setNotes('');
  };

  const riskColor = (risk: number) => risk >= 60 ? 'badge-danger' : risk >= 30 ? 'badge-warning' : 'badge-success';
  const riskLabel = (risk: number) => risk >= 60 ? 'مرتفع' : risk >= 30 ? 'متوسط' : 'منخفض';

  return (
    <div className="space-y-6 fade-in">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">تحصيل الديون</h1>
          <p className="text-slate-400 text-sm">إدارة وتتبع ديون العملاء</p>
        </div>
        <button onClick={() => generateDebtReportPDF(customers.filter(c => c.companyId === companyId), session!.company!.name)} className="btn-ghost"><FileText size={14} /> تصدير تقرير PDF</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="stat-card"><div className="flex items-center gap-2 mb-2"><Wallet size={16} className="text-yellow-400" /><span className="text-xs text-slate-400">إجمالي الديون</span></div><div className="text-2xl font-bold text-white">{formatCurrency(totalDebt)}</div></div>
        <div className="stat-card"><div className="flex items-center gap-2 mb-2"><AlertTriangle size={16} className="text-red-400" /><span className="text-xs text-slate-400">مخاطر مرتفعة</span></div><div className="text-2xl font-bold text-white">{highRisk}</div></div>
        <div className="stat-card"><div className="flex items-center gap-2 mb-2"><TrendingUp size={16} className="text-orange-400" /><span className="text-xs text-slate-400">متأخر +30 يوم</span></div><div className="text-2xl font-bold text-white">{overdueCount}</div></div>
      </div>

      <div className="kimichi-card overflow-x-auto">
        <table className="kimichi-table">
          <thead><tr><th>الأولوية</th><th>العميل</th><th>الهاتف</th><th>الدين الحالي</th><th>عمر الدين (يوم)</th><th>درجة الخطر</th><th>إجراءات</th></tr></thead>
          <tbody>
            {debtList.length === 0 && <tr><td colSpan={7} className="text-center text-slate-500 py-8">لا توجد ديون مستحقة 🎉</td></tr>}
            {debtList.map((c, i) => (
              <tr key={c.id}>
                <td><span className="badge badge-info">#{i + 1}</span></td>
                <td className="font-medium text-white">{c.name}</td>
                <td className="text-xs flex items-center gap-1"><Phone size={12} className="text-slate-500" />{c.phone}</td>
                <td className="text-yellow-400">{formatCurrency(c.currentDebt)}</td>
                <td>{c.age} يوم</td>
                <td><span className={`badge ${riskColor(c.risk)}`}>{riskLabel(c.risk)} ({c.risk})</span></td>
                <td>
                  <button onClick={() => { setPayModal({ customerId: c.id, customerName: c.name, debt: c.currentDebt }); setPayAmount(c.currentDebt); }} className="btn-success text-xs py-1"><CreditCard size={12} /> تسجيل تحصيل</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {payModal && (
        <div className="modal-overlay" onClick={() => setPayModal(null)}>
          <div className="modal-content w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white mb-4">تحصيل من {payModal.customerName}</h3>
            <p className="text-xs text-slate-500 mb-4">سيتم توزيع المبلغ تلقائيًا على فواتير العميل المفتوحة، الأقدم تاريخ استحقاق أولًا.</p>
            <label className="form-label">المبلغ المحصل</label>
            <input type="number" className="kimichi-input mb-4" value={payAmount} onChange={e => setPayAmount(Number(e.target.value))} />
            <label className="form-label">طريقة الدفع</label>
            <select className="kimichi-select mb-4" value={payMethod} onChange={e => setPayMethod(e.target.value)}>
              <option value="cash">نقدي</option><option value="bank">تحويل بنكي</option><option value="check">شيك</option><option value="other">أخرى</option>
            </select>
            <label className="form-label">ملاحظات التحصيل</label>
            <textarea className="kimichi-input mb-4" rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="مثال: تم الاتصال، وعد بالدفع الأسبوع القادم" />
            <div className="flex gap-3"><button onClick={handlePay} className="btn-success flex-1 justify-center py-2">تأكيد التحصيل</button><button onClick={() => setPayModal(null)} className="btn-ghost px-6">إلغاء</button></div>
          </div>
        </div>
      )}

      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 fade-in"><div className="alert-success shadow-lg">{toast}</div></div>}
    </div>
  );
}
