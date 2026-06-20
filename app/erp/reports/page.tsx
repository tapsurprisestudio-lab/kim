'use client';
import { useState } from 'react';
import { useStore } from '@/store';
import { formatCurrency } from '@/lib/utils';
import { generateSalesReportPDF, generateDebtReportPDF } from '@/lib/pdfService';
import { BarChart3, Download, TrendingUp, Package, Users, Wallet, UserCheck, Receipt } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#0ea5e9'];

export default function CompanyReportsPage() {
  const { session, invoices, products, customers, expenses, employees } = useStore();
  const companyId = session!.company!.id;
  const companyInvoices = invoices.filter(i => i.companyId === companyId);
  const companyProducts = products.filter(p => p.companyId === companyId);
  const companyCustomers = customers.filter(c => c.companyId === companyId);
  const companyExpenses = expenses.filter(e => e.companyId === companyId);
  const companySalesmen = employees.filter(e => e.companyId === companyId && e.role === 'salesman');

  const [dateFrom, setDateFrom] = useState(new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10));
  const [dateTo, setDateTo] = useState(new Date().toISOString().slice(0, 10));

  const filteredInvoices = companyInvoices.filter(i => i.createdAt.slice(0, 10) >= dateFrom && i.createdAt.slice(0, 10) <= dateTo);

  const totalSales = filteredInvoices.reduce((s, i) => s + i.total, 0);
  const totalCollected = filteredInvoices.reduce((s, i) => s + i.paid, 0);
  const totalCost = filteredInvoices.reduce((s, inv) => s + inv.items.reduce((is, item) => {
    const product = companyProducts.find(p => p.id === item.productId);
    return is + (product ? product.buyPrice * item.quantity : 0);
  }, 0), 0);
  const grossProfit = totalSales - totalCost;
  const filteredExpenses = companyExpenses.filter(e => e.date >= dateFrom && e.date <= dateTo);
  const totalExpenseAmt = filteredExpenses.reduce((s, e) => s + e.amount, 0);
  const netProfit = grossProfit - totalExpenseAmt;

  const salesByProduct: Record<string, number> = {};
  filteredInvoices.forEach(inv => inv.items.forEach(it => { salesByProduct[it.productName] = (salesByProduct[it.productName] || 0) + it.total; }));
  const topProductsData = Object.entries(salesByProduct).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, value]) => ({ name, value }));

  const salesBySalesman: Record<string, number> = {};
  filteredInvoices.forEach(inv => { if (inv.salesmanName) salesBySalesman[inv.salesmanName] = (salesBySalesman[inv.salesmanName] || 0) + inv.total; });
  const salesmanData = Object.entries(salesBySalesman).map(([name, value]) => ({ name, value }));

  const reportCards = [
    { title: 'تقرير المبيعات', desc: 'تفاصيل جميع فواتير المبيعات', icon: TrendingUp, action: () => generateSalesReportPDF(filteredInvoices, session!.company!.name, dateFrom, dateTo) },
    { title: 'تقرير الديون', desc: 'العملاء المدينون وحالة التحصيل', icon: Wallet, action: () => generateDebtReportPDF(companyCustomers, session!.company!.name) },
  ];

  return (
    <div className="space-y-6 fade-in">
      <div className="page-header">
        <div><h1 className="text-2xl font-bold text-white mb-1">التقارير</h1><p className="text-slate-400 text-sm">تقارير شاملة لأداء الشركة</p></div>
      </div>

      <div className="kimichi-card p-4 flex flex-wrap gap-3 items-end">
        <div><label className="form-label">من تاريخ</label><input type="date" className="kimichi-input" value={dateFrom} onChange={e => setDateFrom(e.target.value)} /></div>
        <div><label className="form-label">إلى تاريخ</label><input type="date" className="kimichi-input" value={dateTo} onChange={e => setDateTo(e.target.value)} /></div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-card"><div className="flex items-center gap-2 mb-2"><TrendingUp size={16} className="text-blue-400" /><span className="text-xs text-slate-400">إجمالي المبيعات</span></div><div className="text-xl font-bold text-white">{formatCurrency(totalSales)}</div></div>
        <div className="stat-card"><div className="flex items-center gap-2 mb-2"><Wallet size={16} className="text-green-400" /><span className="text-xs text-slate-400">المحصّل</span></div><div className="text-xl font-bold text-white">{formatCurrency(totalCollected)}</div></div>
        <div className="stat-card"><div className="flex items-center gap-2 mb-2"><Receipt size={16} className="text-red-400" /><span className="text-xs text-slate-400">المصروفات</span></div><div className="text-xl font-bold text-white">{formatCurrency(totalExpenseAmt)}</div></div>
        <div className="stat-card"><div className="flex items-center gap-2 mb-2"><BarChart3 size={16} className={netProfit >= 0 ? 'text-green-400' : 'text-red-400'} /><span className="text-xs text-slate-400">صافي الربح</span></div><div className="text-xl font-bold text-white">{formatCurrency(netProfit)}</div></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="kimichi-card p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2"><Package size={16} className="text-blue-400" /> أفضل المنتجات مبيعاً (بالقيمة)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={topProductsData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.08)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} width={100} />
              <Tooltip contentStyle={{ background: '#0d1426', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 8, fontSize: 11 }} formatter={(v: any) => formatCurrency(Number(v))} />
              <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="kimichi-card p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2"><UserCheck size={16} className="text-green-400" /> المبيعات حسب المندوب</h3>
          {salesmanData.length === 0 ? <p className="text-slate-500 text-sm text-center py-12">لا توجد بيانات مندوبين</p> : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={salesmanData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value" label={({ name, value }) => name}>
                  {salesmanData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#0d1426', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 8, fontSize: 11 }} formatter={(v: any) => formatCurrency(Number(v))} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="kimichi-card p-5">
        <h3 className="text-sm font-semibold text-slate-300 mb-4">تصدير التقارير PDF</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {reportCards.map((r, i) => {
            const Icon = r.icon;
            return (
              <button key={i} onClick={r.action} className="flex items-center gap-3 p-4 rounded-lg text-right transition-colors hover:bg-blue-500/5" style={{ border: '1px solid rgba(59,130,246,0.15)' }}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.1)' }}><Icon size={18} className="text-blue-400" /></div>
                <div className="flex-1"><div className="text-sm font-medium text-white">{r.title}</div><div className="text-xs text-slate-500">{r.desc}</div></div>
                <Download size={16} className="text-slate-500" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
