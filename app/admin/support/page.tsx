'use client';
import { useState, useMemo } from 'react';
import { useStore } from '@/store';
import { formatDateTime } from '@/lib/utils';
import { MessageCircle, Send, Mail, Phone, Building2, CheckCheck } from 'lucide-react';

export default function SupportCenterPage() {
  const { companies, supportMessages, addSupportMessage, markSupportRead, session } = useStore();
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [reply, setReply] = useState('');

  const companiesWithMessages = useMemo(() => {
    const ids = Array.from(new Set(supportMessages.map(m => m.companyId)));
    return companies.filter(c => ids.includes(c.id));
  }, [companies, supportMessages]);

  const otherCompanies = companies.filter(c => !companiesWithMessages.find(cw => cw.id === c.id));

  const activeCompanyId = selectedCompanyId || companiesWithMessages[0]?.id || null;
  const activeCompany = companies.find(c => c.id === activeCompanyId);

  const threadMessages = supportMessages
    .filter(m => m.companyId === activeCompanyId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const getUnreadCount = (companyId: string) => supportMessages.filter(m => m.companyId === companyId && !m.isFromAdmin && !m.isRead).length;

  const handleSelectCompany = (id: string) => {
    setSelectedCompanyId(id);
    supportMessages.filter(m => m.companyId === id && !m.isFromAdmin && !m.isRead).forEach(m => markSupportRead(m.id));
  };

  const handleReply = () => {
    if (!reply.trim() || !activeCompanyId || !activeCompany) return;
    addSupportMessage({
      companyId: activeCompanyId,
      companyName: activeCompany.name,
      senderId: session?.user.id || 'admin',
      senderName: 'Kimichi Support',
      senderRole: 'super_admin',
      message: reply,
      isFromAdmin: true,
      isRead: true,
    });
    setReply('');
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">الدعم والرسائل</h1>
          <p className="text-slate-400 text-sm">مركز التواصل مع الشركات المسجلة</p>
        </div>
        <div className="flex gap-3">
          <a href="mailto:kimichierp@gmail.com" className="btn-ghost"><Mail size={14} /> kimichierp@gmail.com</a>
          <a href="https://wa.me/4917779529271" target="_blank" rel="noopener noreferrer" className="btn-success"><Phone size={14} /> WhatsApp</a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ height: 560 }}>
        {/* Company list */}
        <div className="kimichi-card overflow-y-auto p-2">
          {companiesWithMessages.length === 0 && otherCompanies.length === 0 && (
            <div className="text-center text-slate-500 py-8 text-sm">لا توجد شركات</div>
          )}
          {companiesWithMessages.map(c => {
            const unread = getUnreadCount(c.id);
            const lastMsg = supportMessages.filter(m => m.companyId === c.id).slice(-1)[0];
            return (
              <button
                key={c.id}
                onClick={() => handleSelectCompany(c.id)}
                className={`w-full text-right p-3 rounded-lg mb-1 transition-colors ${activeCompanyId === c.id ? 'bg-blue-500/10 border border-blue-500/30' : 'hover:bg-white/5'}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-white truncate">{c.name}</span>
                  {unread > 0 && <span className="text-xs px-1.5 py-0.5 rounded-full text-white font-bold" style={{ background: '#dc2626' }}>{unread}</span>}
                </div>
                {lastMsg && <p className="text-xs text-slate-500 truncate">{lastMsg.message}</p>}
              </button>
            );
          })}
          {otherCompanies.length > 0 && (
            <>
              <div className="text-xs text-slate-600 px-3 py-2 mt-2">شركات أخرى</div>
              {otherCompanies.map(c => (
                <button
                  key={c.id}
                  onClick={() => handleSelectCompany(c.id)}
                  className={`w-full text-right p-3 rounded-lg mb-1 transition-colors ${activeCompanyId === c.id ? 'bg-blue-500/10 border border-blue-500/30' : 'hover:bg-white/5'}`}
                >
                  <span className="text-sm text-slate-300 flex items-center gap-2"><Building2 size={12} /> {c.name}</span>
                </button>
              ))}
            </>
          )}
        </div>

        {/* Conversation */}
        <div className="kimichi-card lg:col-span-2 flex flex-col">
          {activeCompany ? (
            <>
              <div className="p-4 border-b flex items-center gap-3" style={{ borderColor: 'rgba(59,130,246,0.1)' }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#2563eb,#0ea5e9)' }}>
                  <Building2 size={16} className="text-white" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{activeCompany.name}</div>
                  <div className="text-xs text-slate-500">{activeCompany.ownerName} • {activeCompany.ownerPhone}</div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {threadMessages.length === 0 && (
                  <div className="text-center text-slate-500 text-sm py-8 flex flex-col items-center gap-2">
                    <MessageCircle size={32} className="text-slate-700" />
                    لا توجد رسائل بعد
                  </div>
                )}
                {threadMessages.map(m => (
                  <div key={m.id} className={`flex ${m.isFromAdmin ? 'justify-start' : 'justify-end'}`}>
                    <div
                      className="max-w-[70%] p-3 rounded-xl text-sm"
                      style={{
                        background: m.isFromAdmin ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.06)',
                        border: m.isFromAdmin ? '1px solid rgba(59,130,246,0.2)' : '1px solid rgba(255,255,255,0.08)',
                      }}
                    >
                      <div className="text-xs text-slate-500 mb-1">{m.senderName}</div>
                      <div className="text-slate-200">{m.message}</div>
                      <div className="text-xs text-slate-600 mt-1 flex items-center gap-1 justify-end">
                        {formatDateTime(m.createdAt)}
                        {m.isFromAdmin && <CheckCheck size={12} className="text-blue-400" />}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t flex gap-2" style={{ borderColor: 'rgba(59,130,246,0.1)' }}>
                <input
                  className="kimichi-input"
                  placeholder="اكتب ردك هنا..."
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleReply()}
                />
                <button onClick={handleReply} className="btn-primary px-4"><Send size={14} /></button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500">اختر شركة لعرض المحادثة</div>
          )}
        </div>
      </div>
    </div>
  );
}
