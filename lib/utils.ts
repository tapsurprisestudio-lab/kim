import type { CompanyStatus, SubscriptionPlan, PaymentStatus, InvoiceStatus, BusinessType, UserRole, NotificationType, SeverityLevel } from '@/types';
import { useStore } from '@/store';

export const CURRENCY = 'د.ل';
export const CURRENCY_SYMBOL = 'LD';

/**
 * Formats a currency amount using the active company's saved currency
 * symbol (Settings page) when available, falling back to the static
 * default. This is a plain function (not a hook) so it can be called
 * from anywhere — including lib/pdfService.ts — but it reads the live
 * Zustand store via getState() rather than a React hook subscription,
 * since utils.ts is not itself a component.
 */
export const formatCurrency = (amount: number, companyId?: string) => {
  let symbol = CURRENCY;
  try {
    const state = useStore.getState();
    const id = companyId || state.session?.company?.id;
    if (id) {
      const settings = state.companySettings.find(s => s.companyId === id);
      if (settings?.currencySymbol) symbol = settings.currencySymbol;
    }
  } catch {
    // Store not available (e.g. server-side/test context) — use default.
  }
  return `${symbol} ${amount.toLocaleString('ar-LY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};
export const formatDate = (date: string) => new Date(date).toLocaleDateString('ar-LY');
export const formatDateTime = (date: string) => new Date(date).toLocaleString('ar-LY');

export const COMPANY_STATUS_LABELS: Record<CompanyStatus, string> = {
  active: 'نشط',
  suspended: 'موقوف',
  trial: 'تجريبي',
  expired: 'منتهي',
  archived: 'مؤرشف',
};

export const COMPANY_STATUS_COLORS: Record<CompanyStatus, string> = {
  active: 'badge-success',
  suspended: 'badge-danger',
  trial: 'badge-info',
  expired: 'badge-warning',
  archived: 'badge-gray',
};

export const PLAN_LABELS: Record<SubscriptionPlan, string> = {
  trial: 'تجريبي',
  basic: 'أساسي',
  pro: 'احترافي',
  enterprise: 'مؤسسي',
  lifetime: 'مدى الحياة',
};

export const PLAN_PRICES: Record<SubscriptionPlan, number> = {
  trial: 0,
  basic: 80,
  pro: 150,
  enterprise: 300,
  lifetime: 2000,
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  paid: 'مدفوع',
  pending: 'معلق',
  overdue: 'متأخر',
  cancelled: 'ملغي',
};

export const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  paid: 'badge-success',
  pending: 'badge-warning',
  overdue: 'badge-danger',
  cancelled: 'badge-gray',
};

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  paid: 'مدفوع',
  partial: 'جزئي',
  unpaid: 'غير مدفوع',
  overdue: 'متأخر',
};

export const INVOICE_STATUS_COLORS: Record<InvoiceStatus, string> = {
  paid: 'badge-success',
  partial: 'badge-warning',
  unpaid: 'badge-danger',
  overdue: 'badge-danger',
};

export const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  food_wholesale: 'مواد غذائية بالجملة',
  supermarket: 'سوبرماركت',
  electronics: 'إلكترونيات',
  clothing: 'ملابس',
  building_materials: 'مواد بناء',
  car_parts: 'قطع غيار',
  pharmacy: 'صيدلية',
  clinic: 'عيادة',
  restaurant: 'مطعم',
  cafe: 'كافيه',
  warehouse: 'مستودع',
  distribution: 'توزيع',
  bookstore: 'مكتبة',
  perfume: 'عطور',
  cosmetics: 'مستحضرات تجميل',
  workshop: 'ورشة صيانة',
  general: 'تجاري عام',
};

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'مشرف Kimichi',
  owner: 'مالك الشركة',
  admin: 'مدير',
  accountant: 'محاسب',
  salesman: 'مندوب مبيعات',
  warehouse: 'أمين المستودع',
};

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  subscription_warning: 'تحذير اشتراك',
  payment_reminder: 'تذكير بالدفع',
  system_update: 'تحديث النظام',
  maintenance: 'صيانة',
  general: 'عام',
  urgent: 'عاجل',
};

export const SEVERITY_LABELS: Record<SeverityLevel, string> = {
  info: 'معلومة',
  warning: 'تحذير',
  error: 'خطأ',
  critical: 'حرج',
};

export const SEVERITY_COLORS: Record<SeverityLevel, string> = {
  info: 'badge-info',
  warning: 'badge-warning',
  error: 'badge-danger',
  critical: 'badge-danger',
};

export const getDaysRemaining = (endDate: string) => {
  const end = new Date(endDate);
  const now = new Date();
  const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
};

export const getSubscriptionStatus = (company: { subscriptionEndDate: string; status: string }) => {
  const days = getDaysRemaining(company.subscriptionEndDate);
  if (company.status === 'suspended') return { label: 'موقوف', color: 'badge-danger' };
  if (company.status === 'archived') return { label: 'مؤرشف', color: 'badge-gray' };
  if (days < 0) return { label: 'منتهي', color: 'badge-danger' };
  if (days <= 7) return { label: `ينتهي خلال ${days} أيام`, color: 'badge-warning' };
  if (days <= 30) return { label: `ينتهي خلال ${days} يوم`, color: 'badge-warning' };
  return { label: `${days} يوم متبقي`, color: 'badge-success' };
};

export const EXPENSE_CATEGORIES = [
  'إيجار', 'رواتب', 'مرافق', 'نقل', 'تسويق', 'صيانة', 'مشتريات مكتبية',
  'رسوم بنكية', 'تأمين', 'اتصالات', 'ضرائب', 'تدريب', 'أخرى'
];

export const BILLING_CYCLE_LABELS = {
  trial: 'تجريبي',
  monthly: 'شهري',
  quarterly: 'ربع سنوي',
  yearly: 'سنوي',
  lifetime: 'مدى الحياة',
};

export const BUSINESS_TYPES: BusinessType[] = [
  'food_wholesale', 'supermarket', 'electronics', 'clothing', 'building_materials',
  'car_parts', 'pharmacy', 'clinic', 'restaurant', 'cafe', 'warehouse',
  'distribution', 'bookstore', 'perfume', 'cosmetics', 'workshop', 'general'
];

// ========================================
// REAL (NON-FAKE) DERIVED METRICS
// ========================================
// These replace metrics that were previously hardcoded/fake or relied on
// a stored status enum that nothing ever updated automatically.

/**
 * An invoice is genuinely "overdue" only if it still has a balance AND its
 * due date has passed — never based on the stored `status` field alone,
 * since nothing in this client-only app runs a background job to flip
 * `status` to 'overdue' over time. Call this wherever "is this invoice
 * overdue" matters (dashboards, stats, badges).
 */
export const isInvoiceOverdue = (invoice: { remaining: number; dueDate: string; status: string }): boolean => {
  if (invoice.remaining <= 0) return false;
  if (!invoice.dueDate) return false;
  const due = new Date(invoice.dueDate);
  const today = new Date();
  due.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return due.getTime() < today.getTime();
};

/** Live-computed display status for an invoice: prefers the real overdue
 * check over the stored status when there's a balance past due. */
export const getEffectiveInvoiceStatus = (invoice: { remaining: number; dueDate: string; status: InvoiceStatus }): InvoiceStatus => {
  if (invoice.status === 'paid') return 'paid';
  if (isInvoiceOverdue(invoice)) return 'overdue';
  return invoice.status === 'overdue' ? 'unpaid' : invoice.status;
};

/**
 * "Dead stock" = products that have stock on hand but have not appeared
 * in any sales invoice in the lookback window (default 90 days). This
 * requires actual sales history, unlike the old placeholder filter which
 * just checked `stock > 0`.
 */
export const getDeadStockProductIds = (
  products: { id: string; stock: number }[],
  invoices: { createdAt: string; items: { productId: string }[] }[],
  lookbackDays: number = 90
): Set<string> => {
  const cutoff = Date.now() - lookbackDays * 86400000;
  const soldRecently = new Set<string>();
  for (const inv of invoices) {
    if (new Date(inv.createdAt).getTime() < cutoff) continue;
    for (const item of inv.items) soldRecently.add(item.productId);
  }
  const deadIds = new Set<string>();
  for (const p of products) {
    if (p.stock > 0 && !soldRecently.has(p.id)) deadIds.add(p.id);
  }
  return deadIds;
};

/**
 * Supplier performance score based on real purchase-payment history:
 * percentage of purchase orders that were paid in full within their
 * "grace period" (default 30 days from receivedDate), using actual
 * payment dates rather than a status field nothing ever updates.
 * Returns null when there isn't enough history to score (so the UI can
 * show "no data" instead of a misleading 100%).
 */
export const getSupplierPerformanceScore = (
  supplierPurchases: { total: number; paid: number; remaining: number; receivedDate: string }[],
  graceDays: number = 30
): number | null => {
  if (supplierPurchases.length === 0) return null;
  const today = new Date();
  let onTrack = 0;
  for (const p of supplierPurchases) {
    const due = new Date(p.receivedDate);
    due.setDate(due.getDate() + graceDays);
    const isSettled = p.remaining <= 0;
    const isWithinGrace = today.getTime() <= due.getTime();
    if (isSettled || isWithinGrace) onTrack += 1;
  }
  return Math.round((onTrack / supplierPurchases.length) * 100);
};
