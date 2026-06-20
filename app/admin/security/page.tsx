'use client';
import { useState } from 'react';
import { useStore } from '@/store';
import { formatDateTime, SEVERITY_LABELS, SEVERITY_COLORS } from '@/lib/utils';
import { Shield, Search, Filter, AlertTriangle, Info, AlertCircle, XCircle } from 'lucide-react';

export default function SecurityLogsPage() {
  const { securityLogs, companies } = useStore();
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');

  const uniqueActions = Array.from(new Set(securityLogs.map(l => l.action)));

  const filtered = securityLogs.filter(l => {
    const matchSearch = l.description.includes(search) || l.userName.includes(search);
    const matchSeverity = severityFilter === 'all' || l.severity === severityFilter;
    const matchCompany = companyFilter === 'all' || l.companyId === companyFilter;
    const matchAction = actionFilter === 'all' || l.action === actionFilter;
    return matchSearch && matchSeverity && matchCompany && matchAction;
  });

  const severityIcons: Record<string, any> = { info: Info, warning: AlertTriangle, error: AlertCircle, critical: XCircle };
  const severityCounts = {
    info: securityLogs.filter(l => l.severity === 'info').length,
    warning: securityLogs.filter(l => l.severity === 'warning').length,
    error: securityLogs.filter(l => l.severity === 'error').length,
    critical: securityLogs.filter(l => l.severity === 'critical').length,
  };

  const getCompanyName = (id?: string) => companies.find(c => c.id === id)?.name || '—';

  return (
    <div className="space-y-6 fade-in">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">الأمان وسجلات التدقيق</h1>
          <p className="text-slate-400 text-sm">{securityLogs.length} سجل نشاط مسجل</p>
        </div>
      </div>

      {/* Severity stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(['info', 'warning', 'error', 'critical'] as const).map(sev => {
          const Icon = severityIcons[sev];
          const colors: Record<string, string> = { info: '#60a5fa', warning: '#fbbf24', error: '#f87171', critical: '#dc2626' };
          return (
            <div key={sev} className="stat-card">
              <div className="flex items-center gap-2 mb-2">
                <Icon size={16} style={{ color: colors[sev] }} />
                <span className="text-xs text-slate-400">{SEVERITY_LABELS[sev]}</span>
              </div>
              <div className="text-2xl font-bold text-white">{severityCounts[sev]}</div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="kimichi-card p-4 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="form-label">بحث</label>
          <div className="relative">
            <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input className="kimichi-input pr-9" placeholder="بحث في السجلات..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="min-w-[150px]">
          <label className="form-label">الخطورة</label>
          <select className="kimichi-select" value={severityFilter} onChange={e => setSeverityFilter(e.target.value)}>
            <option value="all">الكل</option>
            {Object.entries(SEVERITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div className="min-w-[180px]">
          <label className="form-label">الشركة</label>
          <select className="kimichi-select" value={companyFilter} onChange={e => setCompanyFilter(e.target.value)}>
            <option value="all">جميع الشركات</option>
            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="min-w-[150px]">
          <label className="form-label">الإجراء</label>
          <select className="kimichi-select" value={actionFilter} onChange={e => setActionFilter(e.target.value)}>
            <option value="all">جميع الإجراءات</option>
            {uniqueActions.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </div>

      {/* Logs table */}
      <div className="kimichi-card overflow-x-auto">
        <table className="kimichi-table">
          <thead>
            <tr>
              <th>الخطورة</th>
              <th>المستخدم</th>
              <th>الشركة</th>
              <th>الإجراء</th>
              <th>الوصف</th>
              <th>IP</th>
              <th>الجهاز</th>
              <th>التاريخ</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="text-center text-slate-500 py-8">لا توجد سجلات مطابقة</td></tr>
            )}
            {filtered.map(log => (
              <tr key={log.id}>
                <td><span className={`badge ${SEVERITY_COLORS[log.severity]}`}>{SEVERITY_LABELS[log.severity]}</span></td>
                <td className="text-white">{log.userName}</td>
                <td className="text-xs">{getCompanyName(log.companyId)}</td>
                <td className="text-xs font-mono text-blue-400">{log.action}</td>
                <td className="text-xs max-w-xs truncate">{log.description}</td>
                <td className="text-xs text-slate-500 font-mono">{log.ipAddress}</td>
                <td className="text-xs text-slate-500">{log.device}</td>
                <td className="text-xs text-slate-500">{formatDateTime(log.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
