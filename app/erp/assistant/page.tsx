'use client';
import { useStore } from '@/store';
import { formatCurrency } from '@/lib/utils';
import { Bot, AlertTriangle, TrendingDown, Wallet, Package, UserCheck, Sparkles } from 'lucide-react';

interface Insight {
  type: 'danger' | 'warning' | 'info' | 'success';
  icon: any;
  title: string;
  description: string;
}

export default function BusinessAssistantPage() {
  const { session, products, customers, invoices, expenses, employees } = useStore();
  const companyId = session!.company!.id;
  const companyProducts = products.filter(p => p.companyId === companyId);
  const companyCustomers = customers.filter(c => c.companyId === companyId);
  const companyInvoices = invoices.filter(i => i.companyId === companyId);
  const companyExpenses = expenses.filter(e => e.companyId === companyId);
  const salesmen = employees.filter(e => e.companyId === companyId && e.role === 'salesman');

  const insights: Insight[] = [];

  // 1. Products to reorder
  const lowStock = companyProducts.filter(p => p.stock <= p.minStock);
  if (lowStock.length > 0) {
    insights.push({
      type: 'warning', icon: Package,
      title: `${lowStock.length} منتج يحتاج إعادة طلب`,
      description: `المنتجات: ${lowStock.slice(0, 3).map(p => p.name).join('، ')}${lowStock.length > 3 ? ' وأخرى' : ''}. يُنصح بإعادة الطلب الآن لتجنب نفاد المخزون.`,
    });
  }

  // 2. Customers to collect from (high risk)
  const highDebtCustomers = companyCustomers.filter(c => c.creditLimit > 0 && c.currentDebt / c.creditLimit > 0.8);
  if (highDebtCustomers.length > 0) {
    insights.push({
      type: 'danger', icon: Wallet,
      title: `${highDebtCustomers.length} عميل بحاجة لتحصيل عاجل`,
      description: `العملاء: ${highDebtCustomers.slice(0, 3).map(c => c.name).join('، ')} تجاوزوا 80% من حد الائتمان. يُنصح بالتواصل فوراً.`,
    });
  }

  // 3. Products not selling (dead stock candidates - products with stock but no invoice items)
  const soldProductIds = new Set(companyInvoices.flatMap(i => i.items.map(it => it.productId)));
  const notSelling = companyProducts.filter(p => !soldProductIds.has(p.id) && p.stock > 0);
  if (notSelling.length > 0) {
    insights.push({
      type: 'info', icon: TrendingDown,
      title: `${notSelling.length} منتج راكد لم يُباع`,
      description: `المنتجات: ${notSelling.slice(0, 3).map(p => p.name).join('، ')} لم تحقق أي مبيعات. فكر في تخفيض السعر أو حملة تسويقية.`,
    });
  }

  // 4. Expenses too high
  const thisMonth = new Date().getMonth(), thisYear = new Date().getFullYear();
  const monthlyExpenses = companyExpenses.filter(e => { const d = new Date(e.date); return d.getMonth() === thisMonth && d.getFullYear() === thisYear; }).reduce((s, e) => s + e.amount, 0);
  const monthlySales = companyInvoices.filter(i => { const d = new Date(i.createdAt); return d.getMonth() === thisMonth && d.getFullYear() === thisYear; }).reduce((s, i) => s + i.total, 0);
  if (monthlySales > 0 && monthlyExpenses / monthlySales > 0.4) {
    insights.push({
      type: 'warning', icon: AlertTriangle,
      title: 'نسبة المصروفات مرتفعة',
      description: `المصروفات تمثل ${Math.round((monthlyExpenses / monthlySales) * 100)}% من المبيعات هذا الشهر. يُنصح بمراجعة بنود المصروفات لتحسين الربحية.`,
    });
  }

  // 5. Salesman performance alerts
  salesmen.forEach(s => {
    const sInvoices = companyInvoices.filter(i => i.salesmanId === s.id);
    const monthlyS = sInvoices.filter(i => { const d = new Date(i.createdAt); return d.getMonth() === thisMonth && d.getFullYear() === thisYear; }).reduce((sum, i) => sum + i.total, 0);
    if (monthlyS < 1000 && sInvoices.length > 0) {
      insights.push({
        type: 'info', icon: UserCheck,
        title: `أداء منخفض للمندوب ${s.name}`,
        description: `مبيعات هذا الشهر ${formatCurrency(monthlyS)} وهي أقل من المتوقع. يُنصح بمراجعة أدائه أو تقديم دعم إضافي.`,
      });
    }
  });

  // 6. Debt risk overall
  const totalDebt = companyCustomers.reduce((s, c) => s + c.currentDebt, 0);
  if (totalDebt > monthlySales * 0.5 && monthlySales > 0) {
    insights.push({
      type: 'danger', icon: AlertTriangle,
      title: 'مخاطر ديون مرتفعة على مستوى الشركة',
      description: `إجمالي الديون المستحقة (${formatCurrency(totalDebt)}) يتجاوز نصف مبيعات الشهر. يُنصح بتكثيف جهود التحصيل.`,
    });
  }

  if (insights.length === 0) {
    insights.push({ type: 'success', icon: Sparkles, title: 'كل شيء على ما يرام!', description: 'لا توجد تنبيهات حالياً. استمر في العمل الجيد 👏' });
  }

  const typeStyles: Record<string, { bg: string; text: string; border: string }> = {
    danger: { bg: 'rgba(239,68,68,0.08)', text: '#f87171', border: 'rgba(239,68,68,0.2)' },
    warning: { bg: 'rgba(245,158,11,0.08)', text: '#fbbf24', border: 'rgba(245,158,11,0.2)' },
    info: { bg: 'rgba(59,130,246,0.08)', text: '#60a5fa', border: 'rgba(59,130,246,0.2)' },
    success: { bg: 'rgba(34,197,94,0.08)', text: '#4ade80', border: 'rgba(34,197,94,0.2)' },
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2"><Bot size={24} className="text-blue-400" /> المساعد الذكي</h1>
          <p className="text-slate-400 text-sm">تحليل تلقائي لبيانات شركتك وتوصيات ذكية</p>
        </div>
      </div>

      <div className="alert-info">
        المساعد الذكي يعمل بنظام قواعد محلي (Rule-Based) يحلل بياناتك الحالية دون الحاجة لاتصال خارجي بأي API.
      </div>

      <div className="space-y-3">
        {insights.map((insight, i) => {
          const Icon = insight.icon;
          const style = typeStyles[insight.type];
          return (
            <div key={i} className="kimichi-card p-4 flex items-start gap-4" style={{ borderColor: style.border }}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: style.bg }}>
                <Icon size={18} style={{ color: style.text }} />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white mb-1">{insight.title}</h4>
                <p className="text-sm text-slate-400">{insight.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
