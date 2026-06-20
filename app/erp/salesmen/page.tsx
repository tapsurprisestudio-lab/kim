'use client';
import { useStore } from '@/store';
import { formatCurrency } from '@/lib/utils';
import { UserCheck, TrendingUp, Wallet, Users, Award } from 'lucide-react';

export default function SalesmenPage() {
  const { session, employees, invoices, customers } = useStore();
  const companyId = session!.company!.id;
  const salesmen = employees.filter(e => e.companyId === companyId && e.role === 'salesman');
  const companyInvoices = invoices.filter(i => i.companyId === companyId);
  const companyCustomers = customers.filter(c => c.companyId === companyId);

  const thisMonth = new Date().getMonth(), thisYear = new Date().getFullYear();

  const getSalesmanStats = (salesmanId: string) => {
    const sInvoices = companyInvoices.filter(i => i.salesmanId === salesmanId);
    const monthlyInvoices = sInvoices.filter(i => { const d = new Date(i.createdAt); return d.getMonth() === thisMonth && d.getFullYear() === thisYear; });
    const totalSales = sInvoices.reduce((s, i) => s + i.total, 0);
    const monthlySales = monthlyInvoices.reduce((s, i) => s + i.total, 0);
    const collected = sInvoices.reduce((s, i) => s + i.paid, 0);
    const collectionRate = totalSales > 0 ? Math.round((collected / totalSales) * 100) : 0;
    const assignedCustomers = companyCustomers.filter(c => c.salesmanId === salesmanId).length;
    return { totalSales, monthlySales, collectionRate, assignedCustomers, invoiceCount: sInvoices.length };
  };

  const target = 5000; // Default monthly sales target (LYD). A per-salesman configurable target
  // would require adding a `monthlyTarget` field to Employee — noted as a future improvement.

  return (
    <div className="space-y-6 fade-in">
      <div className="page-header">
        <div><h1 className="text-2xl font-bold text-white mb-1">المندوبين</h1><p className="text-slate-400 text-sm">{salesmen.length} مندوب مبيعات</p></div>
      </div>

      {salesmen.length === 0 ? (
        <div className="kimichi-card p-8 text-center text-slate-500">
          لا يوجد مندوبين مسجلين. يمكنك إضافتهم من صفحة <span className="text-blue-400">الموظفين</span>.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {salesmen.map(s => {
            const stats = getSalesmanStats(s.id);
            const achievement = Math.min(100, Math.round((stats.monthlySales / target) * 100));
            return (
              <div key={s.id} className="kimichi-card p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#22c55e,#0ea5e9)' }}>
                    <span className="text-lg font-bold text-white">{s.name.charAt(0)}</span>
                  </div>
                  <div>
                    <div className="font-semibold text-white">{s.name}</div>
                    <div className="text-xs text-slate-500">{s.phone}</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-1"><span>تحقيق الهدف الشهري</span><span>{achievement}%</span></div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div className="h-full" style={{ width: `${achievement}%`, background: achievement >= 80 ? '#22c55e' : achievement >= 40 ? '#f59e0b' : '#ef4444' }}></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="p-2 rounded-lg" style={{ background: 'rgba(34,197,94,0.06)' }}>
                      <div className="text-xs text-slate-500">مبيعات الشهر</div>
                      <div className="text-sm font-bold text-green-400">{formatCurrency(stats.monthlySales)}</div>
                    </div>
                    <div className="p-2 rounded-lg" style={{ background: 'rgba(59,130,246,0.06)' }}>
                      <div className="text-xs text-slate-500">معدل التحصيل</div>
                      <div className="text-sm font-bold text-blue-400">{stats.collectionRate}%</div>
                    </div>
                    <div className="p-2 rounded-lg" style={{ background: 'rgba(139,92,246,0.06)' }}>
                      <div className="text-xs text-slate-500">العملاء</div>
                      <div className="text-sm font-bold text-purple-400">{stats.assignedCustomers}</div>
                    </div>
                    <div className="p-2 rounded-lg" style={{ background: 'rgba(245,158,11,0.06)' }}>
                      <div className="text-xs text-slate-500">عمولة (تقديري)</div>
                      {/* Use nullish coalescing (??) not logical OR (||) so a real
                          0% commission rate shows 0 instead of falling back to an
                          estimated 2%-of-sales figure that was never stored. */}
                      <div className="text-sm font-bold text-yellow-400">{formatCurrency(s.commission ?? stats.monthlySales * 0.02)}</div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
