'use client';
import { useStore } from '@/store';
import { formatCurrency, getDaysRemaining, BUSINESS_TYPE_LABELS } from '@/lib/utils';
import {
  Building2, TrendingUp, AlertTriangle, Clock, CheckCircle,
  XCircle, DollarSign, Users, Activity, Shield, Zap, ArrowUpRight
} from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const CHART_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function AdminDashboard() {
  const { companies, subscriptionInvoices, securityLogs, supportMessages } = useStore();

  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  // Stats
  const totalCompanies = companies.length;
  const activeCompanies = companies.filter(c => c.status === 'active').length;
  const suspendedCompanies = companies.filter(c => c.status === 'suspended').length;
  const expiredCompanies = companies.filter(c => c.status === 'expired').length;
  const trialCompanies = companies.filter(c => c.status === 'trial').length;

  const monthlyRevenue = subscriptionInvoices
    .filter(i => {
      const d = new Date(i.createdAt);
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear && i.paymentStatus === 'paid';
    })
    .reduce((s, i) => s + i.amount, 0);

  const yearlyRevenue = subscriptionInvoices
    .filter(i => new Date(i.createdAt).getFullYear() === thisYear && i.paymentStatus === 'paid')
    .reduce((s, i) => s + i.amount, 0);

  const newCompaniesThisMonth = companies.filter(c => {
    const d = new Date(c.createdAt);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  }).length;

  const expiringSoon = companies.filter(c => {
    const days = getDaysRemaining(c.subscriptionEndDate);
    return days >= 0 && days <= 30 && c.status === 'active';
  }).length;

  const recentAlerts = securityLogs.filter(l => l.severity === 'warning' || l.severity === 'critical').slice(0, 5);
  const recentLogins = securityLogs.filter(l => l.action === 'login').slice(0, 5);

  // Chart data
  const statusData = [
    { name: 'نشط', value: activeCompanies },
    { name: 'تجريبي', value: trialCompanies },
    { name: 'موقوف', value: suspendedCompanies },
    { name: 'منتهي', value: expiredCompanies },
  ];

  const businessTypeData = Object.entries(
    companies.reduce((acc, c) => {
      const type = BUSINESS_TYPE_LABELS[c.businessType] || c.businessType;
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value })).slice(0, 6);

  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now);
    d.setMonth(d.getMonth() - (5 - i));
    const m = d.getMonth();
    const y = d.getFullYear();
    const rev = subscriptionInvoices
      .filter(inv => {
        const id = new Date(inv.createdAt);
        return id.getMonth() === m && id.getFullYear() === y && inv.paymentStatus === 'paid';
      })
      .reduce((s, inv) => s + inv.amount, 0);
    return { month: d.toLocaleString('ar-LY', { month: 'short' }), revenue: rev };
  });

  const stats = [
    { label: 'إجمالي الشركات', value: totalCompanies, icon: Building2, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
    { label: 'شركات نشطة', value: activeCompanies, icon: CheckCircle, color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
    { label: 'موقوفة', value: suspendedCompanies, icon: XCircle, color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
    { label: 'تجريبية', value: trialCompanies, icon: Clock, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    { label: 'إيرادات الشهر', value: formatCurrency(monthlyRevenue), icon: DollarSign, color: '#22c55e', bg: 'rgba(34,197,94,0.1)', isText: true },
    { label: 'إيرادات السنة', value: formatCurrency(yearlyRevenue), icon: TrendingUp, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', isText: true },
    { label: 'شركات جديدة هذا الشهر', value: newCompaniesThisMonth, icon: Zap, color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
    { label: 'اشتراكات تنتهي قريباً', value: expiringSoon, icon: AlertTriangle, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  ];

  const severityStyles: Record<string, { bg: string; text: string }> = {
    info: { bg: 'rgba(59,130,246,0.1)', text: '#60a5fa' },
    warning: { bg: 'rgba(245,158,11,0.1)', text: '#fbbf24' },
    error: { bg: 'rgba(239,68,68,0.1)', text: '#f87171' },
    critical: { bg: 'rgba(220,38,38,0.15)', text: '#f87171' },
  };

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">مركز القيادة</h1>
          <p className="text-slate-400 text-sm">نظرة عامة على منصة Kimichi ERP</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', color: '#4ade80' }}>
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
          جميع الأنظمة تعمل
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="stat-card">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: stat.bg }}>
                  <Icon size={20} style={{ color: stat.color }} />
                </div>
                <ArrowUpRight size={14} className="text-slate-600 mt-1" />
              </div>
              <div className="font-bold text-2xl text-white mb-1">
                {stat.value}
              </div>
              <div className="text-xs text-slate-400">{stat.label}</div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Monthly Revenue Chart */}
        <div className="kimichi-card p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">الإيرادات الشهرية (6 أشهر)</h3>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.08)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip
                contentStyle={{ background: '#0d1426', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: '#94a3b8' }}
                itemStyle={{ color: '#60a5fa' }}
                formatter={(v: any) => [formatCurrency(Number(v)), 'الإيراد']}
              />
              <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Company Status Pie */}
        <div className="kimichi-card p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">حالة الشركات</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                {statusData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#0d1426', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 8, fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Business Types + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Business types */}
        <div className="kimichi-card p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">أنواع الأعمال</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={businessTypeData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.08)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} width={100} />
              <Tooltip contentStyle={{ background: '#0d1426', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 8, fontSize: 11 }} />
              <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Security Alerts */}
        <div className="kimichi-card p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <Shield size={16} className="text-yellow-400" />
            أحدث التنبيهات الأمنية
          </h3>
          <div className="space-y-2">
            {recentAlerts.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-4">لا توجد تنبيهات</p>
            ) : recentAlerts.map((log) => {
              const s = severityStyles[log.severity];
              return (
                <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: s.text }}></div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-slate-300 truncate">{log.description}</div>
                    <div className="text-xs text-slate-600">{log.userName} • {new Date(log.createdAt).toLocaleString('ar-LY')}</div>
                  </div>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: s.bg, color: s.text }}>{log.severity}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Logins + Expiring Soon */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="kimichi-card p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <Activity size={16} className="text-blue-400" />
            أحدث تسجيلات الدخول
          </h3>
          <table className="kimichi-table">
            <thead>
              <tr>
                <th>المستخدم</th>
                <th>الإجراء</th>
                <th>الوقت</th>
              </tr>
            </thead>
            <tbody>
              {recentLogins.map((log) => (
                <tr key={log.id}>
                  <td>{log.userName}</td>
                  <td><span className="badge badge-success">دخول</span></td>
                  <td className="text-xs text-slate-500">{new Date(log.createdAt).toLocaleString('ar-LY')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="kimichi-card p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <Clock size={16} className="text-yellow-400" />
            اشتراكات تنتهي قريباً
          </h3>
          <table className="kimichi-table">
            <thead>
              <tr>
                <th>الشركة</th>
                <th>تنتهي في</th>
                <th>الأيام المتبقية</th>
              </tr>
            </thead>
            <tbody>
              {companies
                .filter(c => { const d = getDaysRemaining(c.subscriptionEndDate); return d >= 0 && d <= 60; })
                .sort((a, b) => getDaysRemaining(a.subscriptionEndDate) - getDaysRemaining(b.subscriptionEndDate))
                .slice(0, 5)
                .map(c => {
                  const days = getDaysRemaining(c.subscriptionEndDate);
                  return (
                    <tr key={c.id}>
                      <td className="text-xs">{c.name}</td>
                      <td className="text-xs text-slate-400">{c.subscriptionEndDate}</td>
                      <td>
                        <span className={`badge ${days <= 7 ? 'badge-danger' : days <= 30 ? 'badge-warning' : 'badge-info'}`}>
                          {days} يوم
                        </span>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
