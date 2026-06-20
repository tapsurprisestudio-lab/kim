'use client';
import { useState } from 'react';
import { useStore } from '@/store';
import type { NotificationType } from '@/types';
import { formatDateTime, NOTIFICATION_TYPE_LABELS } from '@/lib/utils';
import { Bell, Send, Users, Building2, CheckCircle2, X, AlertTriangle, Info, Wrench } from 'lucide-react';

export default function NotificationCenterPage() {
  const { session, companies, notifications, addNotification } = useStore();
  const [composeOpen, setComposeOpen] = useState(false);
  const [toast, setToast] = useState('');

  const [form, setForm] = useState({
    target: 'all' as 'all' | 'selected',
    selectedCompanies: [] as string[],
    title: '',
    message: '',
    type: 'general' as NotificationType,
  });

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const toggleCompany = (id: string) => {
    setForm(f => ({
      ...f,
      selectedCompanies: f.selectedCompanies.includes(id) ? f.selectedCompanies.filter(c => c !== id) : [...f.selectedCompanies, id],
    }));
  };

  const handleSend = () => {
    if (!form.title || !form.message) {
      showToast('يرجى تعبئة العنوان والرسالة');
      return;
    }
    addNotification({
      targetCompanyIds: form.target === 'all' ? [] : form.selectedCompanies,
      title: form.title,
      message: form.message,
      type: form.type,
      isRead: false,
      readByCompanyIds: [],
      createdBy: session!.user.id,
    });
    showToast('تم إرسال الإشعار بنجاح ✅');
    setComposeOpen(false);
    setForm({ target: 'all', selectedCompanies: [], title: '', message: '', type: 'general' });
  };

  const typeIcons: Record<NotificationType, any> = {
    subscription_warning: AlertTriangle,
    payment_reminder: Bell,
    system_update: Info,
    maintenance: Wrench,
    general: Info,
    urgent: AlertTriangle,
  };

  const typeColors: Record<NotificationType, string> = {
    subscription_warning: '#fbbf24',
    payment_reminder: '#f59e0b',
    system_update: '#60a5fa',
    maintenance: '#a78bfa',
    general: '#94a3b8',
    urgent: '#ef4444',
  };

  const getTargetLabel = (ids: string[]) => {
    if (ids.length === 0) return 'جميع الشركات';
    if (ids.length === 1) return companies.find(c => c.id === ids[0])?.name || 'شركة واحدة';
    return `${ids.length} شركات`;
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">مركز الإشعارات</h1>
          <p className="text-slate-400 text-sm">إرسال إشعارات إلى الشركات المسجلة</p>
        </div>
        <button onClick={() => setComposeOpen(true)} className="btn-primary">
          <Send size={16} /> إرسال إشعار جديد
        </button>
      </div>

      {/* Notification history */}
      <div className="space-y-3">
        {notifications.length === 0 && (
          <div className="kimichi-card p-8 text-center text-slate-500">لا توجد إشعارات مرسلة</div>
        )}
        {notifications.slice().reverse().map(n => {
          const Icon = typeIcons[n.type];
          const color = typeColors[n.type];
          return (
            <div key={n.id} className="kimichi-card p-4 flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${color}1a` }}>
                <Icon size={18} style={{ color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-semibold text-white">{n.title}</h4>
                  <span className="badge badge-gray" style={{ color, background: `${color}1a` }}>{NOTIFICATION_TYPE_LABELS[n.type]}</span>
                </div>
                <p className="text-sm text-slate-400 mb-2">{n.message}</p>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><Building2 size={12} /> {getTargetLabel(n.targetCompanyIds)}</span>
                  <span>•</span>
                  <span>{formatDateTime(n.createdAt)}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1"><CheckCircle2 size={12} /> قرأها {n.readByCompanyIds.length}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Compose Modal */}
      {composeOpen && (
        <div className="modal-overlay" onClick={() => setComposeOpen(false)}>
          <div className="modal-content w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Bell size={18} className="text-blue-400" /> إرسال إشعار جديد
              </h2>
              <button onClick={() => setComposeOpen(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="form-label">الجهة المستهدفة</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setForm({ ...form, target: 'all' })}
                    className={`flex-1 p-3 rounded-lg border text-sm flex items-center justify-center gap-2 ${form.target === 'all' ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-slate-700 text-slate-400'}`}
                  >
                    <Users size={14} /> جميع الشركات
                  </button>
                  <button
                    onClick={() => setForm({ ...form, target: 'selected' })}
                    className={`flex-1 p-3 rounded-lg border text-sm flex items-center justify-center gap-2 ${form.target === 'selected' ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-slate-700 text-slate-400'}`}
                  >
                    <Building2 size={14} /> شركات محددة
                  </button>
                </div>
              </div>

              {form.target === 'selected' && (
                <div className="max-h-40 overflow-y-auto space-y-1 p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  {companies.map(c => (
                    <label key={c.id} className="flex items-center gap-2 p-2 rounded hover:bg-white/5 cursor-pointer text-sm">
                      <input type="checkbox" checked={form.selectedCompanies.includes(c.id)} onChange={() => toggleCompany(c.id)} className="accent-blue-500" />
                      <span className="text-slate-300">{c.name}</span>
                    </label>
                  ))}
                </div>
              )}

              <div>
                <label className="form-label">نوع الإشعار</label>
                <select className="kimichi-select" value={form.type} onChange={e => setForm({ ...form, type: e.target.value as NotificationType })}>
                  {Object.entries(NOTIFICATION_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>

              <div>
                <label className="form-label">العنوان</label>
                <input className="kimichi-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="عنوان الإشعار" />
              </div>

              <div>
                <label className="form-label">الرسالة</label>
                <textarea className="kimichi-input" rows={4} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="مثال: محمد، اشتراكك متأخر 3 أيام. يرجى التواصل مع الدعم." />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={handleSend} className="btn-primary flex-1 justify-center py-2.5">
                <Send size={14} /> إرسال الإشعار
              </button>
              <button onClick={() => setComposeOpen(false)} className="btn-ghost px-6">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 fade-in">
          <div className="alert-success shadow-lg">{toast}</div>
        </div>
      )}
    </div>
  );
}
