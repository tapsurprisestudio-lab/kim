'use client';
import { useStore } from '@/store';
import { formatCurrency } from '@/lib/utils';
import { generateCompaniesReportPDF } from '@/lib/pdfService';
import { Download, FileText, Building2, DollarSign, Users, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminReportsPage() {
  const { companies, subscriptionInvoices, customers, invoices } = useStore();

  const revenueByPlan = Object.entries(
    companies.reduce((acc, c) => {
      acc[c.subscriptionPlan] = (acc[c.subscriptionPlan] || 0) + c.subscriptionPrice;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  const totalRevenue = subscriptionInvoices.filter(i => i.paymentStatus === 'paid').reduce((s, i) => s + i.amount, 0);
  const totalCompanies = companies.length;
  const totalCustomersAcrossPlatform = customers.length;
  const totalInvoicesAcrossPlatform = invoices.length;

  const reports = [
    { title: 'تقرير الشركات الشامل', desc: 'قائمة كاملة بجميع الشركات وحالاتها', action: () => generateCompaniesReportPDF(companies), icon: Building2 },
  ];

  return (
    <div className="space-y-6 fade-in">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">التقارير</h1>
          <p className="text-slate-400 text-sm">تقارير شاملة عن أداء المنصة</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2"><DollarSign size={16} className="text-green-400" /><span className="text-xs text-slate-400">إجمالي الإيرادات</span></div>
          <div className="text-xl font-bold text-white">{formatCurrency(totalRevenue)}</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2"><Building2 size={16} className="text-blue-400" /><span className="text-xs text-slate-400">الشركات</span></div>
          <div className="text-xl font-bold text-white">{totalCompanies}</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2"><Users size={16} className="text-purple-400" /><span className="text-xs text-slate-400">عملاء المنصة</span></div>
          <div className="text-xl font-bold text-white">{totalCustomersAcrossPlatform}</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2"><TrendingUp size={16} className="text-yellow-400" /><span className="text-xs text-slate-400">إجمالي الفواتير</span></div>
          <div className="text-xl font-bold text-white">{totalInvoicesAcrossPlatform}</div>
        </div>
      </div>

      <div className="kimichi-card p-5">
        <h3 className="text-sm font-semibold text-slate-300 mb-4">الإيرادات حسب الباقة</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={revenueByPlan}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.08)" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
            <Tooltip contentStyle={{ background: '#0d1426', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 8, fontSize: 12 }} formatter={(v: any) => formatCurrency(Number(v))} />
            <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="kimichi-card p-5">
        <h3 className="text-sm font-semibold text-slate-300 mb-4">تصدير التقارير</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {reports.map((r, i) => {
            const Icon = r.icon;
            return (
              <button key={i} onClick={r.action} className="flex items-center gap-3 p-4 rounded-lg text-right transition-colors hover:bg-blue-500/5" style={{ border: '1px solid rgba(59,130,246,0.15)' }}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.1)' }}>
                  <Icon size={18} className="text-blue-400" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">{r.title}</div>
                  <div className="text-xs text-slate-500">{r.desc}</div>
                </div>
                <Download size={16} className="text-slate-500" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
