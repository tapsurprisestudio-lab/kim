'use client';
import { useStore } from '@/store';
import { formatCurrency, isInvoiceOverdue } from '@/lib/utils';
import {
  TrendingUp, DollarSign, AlertTriangle, Package, Users, Award,
  Bell, ShoppingBag, ArrowUpRight, Wallet
} from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function ERPDashboard() {
  const { session, invoices, customers, products, expenses, getCompanyNotifications, markNotificationRead } = useStore();
  const companyId = session!.company!.id;

  const companyInvoices = invoices.filter(i => i.companyId === companyId);
  const companyCustomers = customers.filter(c => c.companyId === companyId);
  const companyProducts = products.filter(p => p.companyId === companyId);
  const companyExpenses = expenses.filter(e => e.companyId === companyId);
  const notifications = getCompanyNotifications(companyId);

  const today = new Date().toISOString().slice(0, 10);
  const thisMonth = new Date().getMonth();
  const thisYear = new Date().getFullYear();

  const salesToday = companyInvoices.filter(i => i.createdAt.slice(0, 10) === today).reduce((s, i) => s + i.total, 0);
  const salesThisMonth = companyInvoices.filter(i => { const d = new Date(i.createdAt); return d.getMonth() === thisMonth && d.getFullYear() === thisYear; }).reduce((s, i) => s + i.total, 0);
  const totalExpensesThisMonth = companyExpenses.filter(e => { const d = new Date(e.date); return d.getMonth() === thisMonth && d.getFullYear() === thisYear; }).reduce((s, e) => s + e.amount, 0);
  const netProfit = salesThisMonth - totalExpensesThisMonth;
  const totalDebt = companyCustomers.reduce((s, c) => s + c.currentDebt, 0);
  // Real overdue count: balance still owed AND due date has passed —
  // not the stored `status` enum, which nothing in this app ever
  // transitions to 'overdue' automatically over time.
  const overdueInvoices = companyInvoices.filter(isInvoiceOverdue).length;
  const unpaidNotYetDue = companyInvoices.filter(i => i.remaining > 0 && !isInvoiceOverdue(i)).length;
  const lowStockProducts = companyProducts.filter(p => p.stock <= p.minStock);

  const bestCustomers = [...companyCustomers].map(c => ({
    ...c,
    totalPurchases: companyInvoices.filter(i => i.customerId === c.id).reduce((s, i) => s + i.total, 0),
  })).sort((a, b) => b.totalPurchases - a.totalPurchases).slice(0, 5);

  const productSales: Record<string, number> = {};
  companyInvoices.forEach(inv => inv.items.forEach(item => { productSales[item.productName] = (productSales[item.productName] || 0) + item.quantity; }));
  const bestProducts = Object.entries(productSales).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - (5 - i));
    const m = d.getMonth(), y = d.getFullYear();
    const sales = companyInvoices.filter(inv => { const id = new Date(inv.createdAt); return id.getMonth() === m && id.getFullYear() === y; }).reduce((s, inv) => s + inv.total, 0);
    return { month: d.toLocaleString('ar-LY', { month: 'short' }), sales };
  });

  const stats = [
    { label: 'مبيعات اليوم', value: formatCurrency(salesToday), icon: DollarSign, color: '#22c55e' },
    { label: 'مبيعات الشهر', value: formatCurrency(salesThisMonth), icon: TrendingUp, color: '#3b82f6' },
    { label: 'صافي الربح', value: formatCurrency(netProfit), icon: Wallet, color: netProfit >= 0 ? '#22c55e' : '#ef4444' },
    { label: 'إجمالي الديون', value: formatCurrency(totalDebt), icon: AlertTriangle, color: '#f59e0b' },
    { label: 'فواتير متأخرة (تجاوزت الاستحقاق)', value: overdueInvoices, icon: AlertTriangle, color: '#ef4444' },
    { label: 'منتجات منخفضة المخزون', value: lowStockProducts.length, icon: Package, color: '#f59e0b' },
    { label: 'عدد العملاء', value: companyCustomers.length, icon: Users, color: '#8b5cf6' },
    { label: 'عدد المنتجات', value: companyProducts.length, icon: ShoppingBag, color: '#0ea5e9' },
  ];

  return (
    <div className="space-y-6 fade-in">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">لوحة التحكم</h1>
          <p className="text-slate-400 text-sm">{session?.company?.name}</p>
        </div>
      </div>

      {/* Notifications banner */}
      {notifications.filter(n => !n.readByCompanyIds.includes(companyId)).slice(0, 1).map(n => (
        <div key={n.id} className="alert-info flex items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            <Bell size={16} className="mt-0.5" />
            <div>
              <span className="font-medium">{n.title}: </span>
              <span>{n.message}</span>
            </div>
          </div>
          <button onClick={() => markNotificationRead(n.id, companyId)} className="text-xs underline flex-shrink-0">تعليم كمقروء</button>
        </div>
      ))}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="stat-card">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${stat.color}1a` }}>
                  <Icon size={20} style={{ color: stat.color }} />
                </div>
                <ArrowUpRight size={14} className="text-slate-600 mt-1" />
              </div>
              <div className="font-bold text-xl text-white mb-1">{stat.value}</div>
              <div className="text-xs text-slate-400">{stat.label}</div>
            </div>
          );
        })}
      </div>

      {/* Sales Chart */}
      <div className="kimichi-card p-5">
        <h3 className="text-sm font-semibold text-slate-300 mb-4">المبيعات الشهرية (6 أشهر)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.08)" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
            <Tooltip contentStyle={{ background: '#0d1426', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 8, fontSize: 12 }} formatter={(v: any) => formatCurrency(Number(v))} />
            <Line type="monotone" dataKey="sales" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e', r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Best customers */}
        <div className="kimichi-card p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2"><Award size={16} className="text-yellow-400" /> أفضل العملاء</h3>
          <div className="space-y-2">
            {bestCustomers.length === 0 && <p className="text-slate-500 text-sm text-center py-4">لا توجد بيانات</p>}
            {bestCustomers.map((c, i) => (
              <div key={c.id} className="flex items-center justify-between p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <span className="text-sm text-slate-300">{i + 1}. {c.name}</span>
                <span className="text-xs text-green-400">{formatCurrency(c.totalPurchases)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Best products */}
        <div className="kimichi-card p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2"><Package size={16} className="text-blue-400" /> أفضل المنتجات</h3>
          <div className="space-y-2">
            {bestProducts.length === 0 && <p className="text-slate-500 text-sm text-center py-4">لا توجد بيانات</p>}
            {bestProducts.map(([name, qty], i) => (
              <div key={name} className="flex items-center justify-between p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <span className="text-sm text-slate-300">{i + 1}. {name}</span>
                <span className="text-xs text-slate-500">{qty} وحدة</span>
              </div>
            ))}
          </div>
        </div>

        {/* Low stock alerts */}
        <div className="kimichi-card p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2"><AlertTriangle size={16} className="text-red-400" /> تنبيهات المخزون</h3>
          <div className="space-y-2">
            {lowStockProducts.length === 0 && <p className="text-slate-500 text-sm text-center py-4">لا توجد تنبيهات</p>}
            {lowStockProducts.slice(0, 5).map(p => (
              <div key={p.id} className="flex items-center justify-between p-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.05)' }}>
                <span className="text-sm text-slate-300">{p.name}</span>
                <span className="badge badge-danger">{p.stock} {p.unit}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
