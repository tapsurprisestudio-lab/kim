'use client';
import { useState } from 'react';
import { useStore } from '@/store';
import { formatDateTime } from '@/lib/utils';
import { MessageCircle, Send, Mail, Phone, CheckCheck } from 'lucide-react';

export default function CompanySupportPage() {
  const { session, supportMessages, addSupportMessage, markSupportRead } = useStore();
  const company = session!.company!;
  const [message, setMessage] = useState('');

  const threadMessages = supportMessages.filter(m => m.companyId === company.id).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const handleSend = () => {
    if (!message.trim()) return;
    addSupportMessage({
      companyId: company.id, companyName: company.name, senderId: session!.user.id, senderName: session!.user.name,
      senderRole: session!.user.role, message, isFromAdmin: false, isRead: false,
    });
    setMessage('');
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="page-header">
        <div><h1 className="text-2xl font-bold text-white mb-1">الدعم والمساعدة</h1><p className="text-slate-400 text-sm">تواصل مع فريق دعم Kimichi ERP</p></div>
        <div className="flex gap-3">
          <a href="mailto:kimichierp@gmail.com" className="btn-ghost"><Mail size={14} /> البريد الإلكتروني</a>
          <a href="https://wa.me/4917779529271" target="_blank" rel="noopener noreferrer" className="btn-success"><Phone size={14} /> واتساب</a>
        </div>
      </div>

      <div className="kimichi-card flex flex-col" style={{ height: 500 }}>
        <div className="p-4 border-b flex items-center gap-3" style={{ borderColor: 'rgba(59,130,246,0.1)' }}>
          <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}>
            <span className="text-xs font-bold text-white">K</span>
          </div>
          <div>
            <div className="text-sm font-semibold text-white">دعم Kimichi ERP</div>
            <div className="text-xs text-slate-500">kimichierp@gmail.com • +49 177 7952971</div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {threadMessages.length === 0 && (
            <div className="text-center text-slate-500 text-sm py-12 flex flex-col items-center gap-2">
              <MessageCircle size={32} className="text-slate-700" />
              لا توجد رسائل بعد. أرسل رسالتك الأولى لفريق الدعم.
            </div>
          )}
          {threadMessages.map(m => (
            <div key={m.id} className={`flex ${m.isFromAdmin ? 'justify-start' : 'justify-end'}`}>
              <div className="max-w-[70%] p-3 rounded-xl text-sm" style={{ background: m.isFromAdmin ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.06)', border: m.isFromAdmin ? '1px solid rgba(59,130,246,0.2)' : '1px solid rgba(255,255,255,0.08)' }}>
                <div className="text-xs text-slate-500 mb-1">{m.senderName}</div>
                <div className="text-slate-200">{m.message}</div>
                <div className="text-xs text-slate-600 mt-1 flex items-center gap-1 justify-end">{formatDateTime(m.createdAt)}{!m.isFromAdmin && <CheckCheck size={12} className="text-blue-400" />}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t flex gap-2" style={{ borderColor: 'rgba(59,130,246,0.1)' }}>
          <input className="kimichi-input" placeholder="اكتب رسالتك إلى الدعم..." value={message} onChange={e => setMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} />
          <button onClick={handleSend} className="btn-primary px-4"><Send size={14} /></button>
        </div>
      </div>
    </div>
  );
}
