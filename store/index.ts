import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type {
  User, Company, AuthSession, SubscriptionInvoice,
  Customer, Product, InventoryMovement, Invoice, InvoiceItem,
  Payment, SupplierPayment, Supplier, Purchase, Expense, Employee,
  Notification, SupportMessage, SecurityLog, CompanySettings,
  UserRole, BusinessType, SubscriptionPlan, BillingCycle,
  PaymentStatus, InvoiceStatus, NotificationType, MovementType
} from '@/types';
import { addMoney, subMoney, clampNonNegative, isZeroMoney, roundMoney } from '@/lib/money';

// ========================================
// DEMO DATA
// ========================================

const demoCompanies: Company[] = [
  {
    id: 'comp-001',
    serialNumber: 'KIM-0001',
    name: 'شركة النور للمواد الغذائية',
    businessType: 'food_wholesale',
    ownerName: 'محمد أبوبكر النور',
    ownerUsername: 'owner',
    ownerPassword: '123456',
    ownerPhone: '+218911234567',
    ownerEmail: 'owner@alnour.ly',
    city: 'طرابلس',
    address: 'شارع المية، طرابلس',
    subscriptionPlan: 'pro',
    subscriptionPrice: 150,
    billingCycle: 'monthly',
    subscriptionStartDate: '2026-01-01',
    subscriptionEndDate: '2026-12-31',
    paymentStatus: 'paid',
    status: 'active',
    notes: 'شركة مواد غذائية بالجملة',
    createdAt: '2026-01-01T10:00:00Z',
    updatedAt: '2026-01-01T10:00:00Z',
    nextInvoiceSeq: 4,
    nextPurchaseSeq: 1,
  },
  {
    id: 'comp-002',
    serialNumber: 'KIM-0002',
    name: 'متجر التقنية للإلكترونيات',
    businessType: 'electronics',
    ownerName: 'أحمد سالم التقني',
    ownerUsername: 'owner2',
    ownerPassword: '123456',
    ownerPhone: '+218927654321',
    ownerEmail: 'owner@techstore.ly',
    city: 'بنغازي',
    address: 'شارع التكنولوجيا، بنغازي',
    subscriptionPlan: 'basic',
    subscriptionPrice: 80,
    billingCycle: 'monthly',
    subscriptionStartDate: '2026-02-01',
    subscriptionEndDate: '2026-08-01',
    paymentStatus: 'paid',
    status: 'active',
    notes: 'متجر إلكترونيات وأجهزة',
    createdAt: '2026-02-01T10:00:00Z',
    updatedAt: '2026-02-01T10:00:00Z',
  },
  {
    id: 'comp-003',
    serialNumber: 'KIM-0003',
    name: 'الأندلس لمواد البناء',
    businessType: 'building_materials',
    ownerName: 'خالد يوسف الأندلسي',
    ownerUsername: 'owner3',
    ownerPassword: '123456',
    ownerPhone: '+218916543210',
    ownerEmail: 'owner@andalus.ly',
    city: 'مصراتة',
    address: 'منطقة القرضابية، مصراتة',
    subscriptionPlan: 'enterprise',
    subscriptionPrice: 300,
    billingCycle: 'yearly',
    subscriptionStartDate: '2026-01-15',
    subscriptionEndDate: '2026-07-10',
    paymentStatus: 'overdue',
    status: 'suspended',
    notes: 'مواد بناء بالجملة والتجزئة',
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-01-15T10:00:00Z',
  },
  {
    id: 'comp-004',
    serialNumber: 'KIM-0004',
    name: 'صيدلية الشفاء',
    businessType: 'pharmacy',
    ownerName: 'فاطمة علي الشفاء',
    ownerUsername: 'owner4',
    ownerPassword: '123456',
    ownerPhone: '+218929876543',
    ownerEmail: 'owner@shifa.ly',
    city: 'طرابلس',
    address: 'شارع عمر المختار، طرابلس',
    subscriptionPlan: 'pro',
    subscriptionPrice: 150,
    billingCycle: 'quarterly',
    subscriptionStartDate: '2026-03-01',
    subscriptionEndDate: '2026-12-01',
    paymentStatus: 'paid',
    status: 'active',
    notes: 'صيدلية كاملة الخدمات',
    createdAt: '2026-03-01T10:00:00Z',
    updatedAt: '2026-03-01T10:00:00Z',
  },
  {
    id: 'comp-005',
    serialNumber: 'KIM-0005',
    name: 'متجر الأناقة للملابس',
    businessType: 'clothing',
    ownerName: 'سارة محمود الأناقة',
    ownerUsername: 'owner5',
    ownerPassword: '123456',
    ownerPhone: '+218913210987',
    ownerEmail: 'owner@anaka.ly',
    city: 'الزاوية',
    address: 'السوق المركزي، الزاوية',
    subscriptionPlan: 'trial',
    subscriptionPrice: 0,
    billingCycle: 'trial',
    subscriptionStartDate: '2026-06-01',
    subscriptionEndDate: '2026-06-30',
    paymentStatus: 'paid',
    status: 'trial',
    notes: 'ملابس نسائية وأزياء',
    createdAt: '2026-06-01T10:00:00Z',
    updatedAt: '2026-06-01T10:00:00Z',
  },
];

const demoUsers: User[] = [
  {
    id: 'user-super-001',
    username: 'admin',
    password: '123456',
    role: 'super_admin',
    name: 'Kimichi Admin',
    email: 'kimichierp@gmail.com',
    phone: '+49 177 7952971',
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  // comp-001 users
  {
    id: 'user-001-owner',
    username: 'owner',
    password: '123456',
    role: 'owner',
    companyId: 'comp-001',
    name: 'محمد أبوبكر النور',
    email: 'owner@alnour.ly',
    phone: '+218911234567',
    isActive: true,
    createdAt: '2026-01-01T10:00:00Z',
    updatedAt: '2026-01-01T10:00:00Z',
  },
  {
    id: 'user-001-accountant',
    username: 'accountant',
    password: '123456',
    role: 'accountant',
    companyId: 'comp-001',
    name: 'عمر خالد المحاسب',
    email: 'accountant@alnour.ly',
    phone: '+218921234567',
    isActive: true,
    createdAt: '2026-01-01T10:00:00Z',
    updatedAt: '2026-01-01T10:00:00Z',
  },
  {
    id: 'user-001-salesman',
    username: 'salesman',
    password: '123456',
    role: 'salesman',
    companyId: 'comp-001',
    name: 'يوسف أحمد البائع',
    email: 'salesman@alnour.ly',
    phone: '+218931234567',
    isActive: true,
    createdAt: '2026-01-01T10:00:00Z',
    updatedAt: '2026-01-01T10:00:00Z',
  },
  {
    id: 'user-001-warehouse',
    username: 'warehouse',
    password: '123456',
    role: 'warehouse',
    companyId: 'comp-001',
    name: 'علي حسن المخزن',
    email: 'warehouse@alnour.ly',
    phone: '+218941234567',
    isActive: true,
    createdAt: '2026-01-01T10:00:00Z',
    updatedAt: '2026-01-01T10:00:00Z',
  },
];

const demoEmployees: Employee[] = [
  {
    id: 'user-001-accountant', companyId: 'comp-001', userId: 'user-001-accountant', name: 'عمر خالد المحاسب', username: 'accountant', password: '123456', role: 'accountant', phone: '+218921234567', email: 'accountant@alnour.ly', salary: 1200, commission: 0, isActive: true, createdAt: '2026-01-01T10:00:00Z', updatedAt: '2026-01-01T10:00:00Z',
  },
  {
    id: 'user-001-salesman', companyId: 'comp-001', userId: 'user-001-salesman', name: 'يوسف أحمد البائع', username: 'salesman', password: '123456', role: 'salesman', phone: '+218931234567', email: 'salesman@alnour.ly', salary: 900, commission: 2, isActive: true, createdAt: '2026-01-01T10:00:00Z', updatedAt: '2026-01-01T10:00:00Z',
  },
  {
    id: 'user-001-warehouse', companyId: 'comp-001', userId: 'user-001-warehouse', name: 'علي حسن المخزن', username: 'warehouse', password: '123456', role: 'warehouse', phone: '+218941234567', email: 'warehouse@alnour.ly', salary: 850, commission: 0, isActive: true, createdAt: '2026-01-01T10:00:00Z', updatedAt: '2026-01-01T10:00:00Z',
  },
];

const demoCustomers: Customer[] = [
  { id: 'cust-001', companyId: 'comp-001', name: 'محمد الزروق', phone: '+218911111111', address: 'شارع الرشيد', city: 'طرابلس', creditLimit: 5000, currentDebt: 1200, salesmanId: 'user-001-salesman', status: 'active', notes: '', createdAt: '2026-01-10T10:00:00Z', updatedAt: '2026-01-10T10:00:00Z' },
  { id: 'cust-002', companyId: 'comp-001', name: 'أحمد الفرجاني', phone: '+218922222222', address: 'طريق المطار', city: 'طرابلس', creditLimit: 8000, currentDebt: 3400, salesmanId: 'user-001-salesman', status: 'active', notes: '', createdAt: '2026-01-12T10:00:00Z', updatedAt: '2026-01-12T10:00:00Z' },
  { id: 'cust-003', companyId: 'comp-001', name: 'فاطمة بن علي', phone: '+218933333333', address: 'شارع النصر', city: 'طرابلس', creditLimit: 3000, currentDebt: 0, salesmanId: 'user-001-salesman', status: 'active', notes: '', createdAt: '2026-01-15T10:00:00Z', updatedAt: '2026-01-15T10:00:00Z' },
  { id: 'cust-004', companyId: 'comp-001', name: 'عمر الصويعي', phone: '+218944444444', address: 'سوق الجمعة', city: 'طرابلس', creditLimit: 10000, currentDebt: 6700, salesmanId: 'user-001-salesman', status: 'active', notes: 'عميل مميز', createdAt: '2026-01-20T10:00:00Z', updatedAt: '2026-01-20T10:00:00Z' },
  { id: 'cust-005', companyId: 'comp-001', name: 'خالد التواتي', phone: '+218955555555', address: 'أبو سليم', city: 'طرابلس', creditLimit: 2000, currentDebt: 2000, salesmanId: 'user-001-salesman', status: 'blocked', notes: 'تجاوز حد الائتمان', createdAt: '2026-02-01T10:00:00Z', updatedAt: '2026-02-01T10:00:00Z' },
];

const demoProducts: Product[] = [
  { id: 'prod-001', companyId: 'comp-001', name: 'زيت زيتون بكر', sku: 'OIL-001', barcode: '621234567001', category: 'زيوت', buyPrice: 12, sellPrice: 18, stock: 150, minStock: 20, unit: 'لتر', status: 'active', notes: '', createdAt: '2026-01-05T10:00:00Z', updatedAt: '2026-01-05T10:00:00Z' },
  { id: 'prod-002', companyId: 'comp-001', name: 'سكر أبيض', sku: 'SUG-001', barcode: '621234567002', category: 'بقالة', buyPrice: 3.5, sellPrice: 5, stock: 8, minStock: 50, unit: 'كيلو', status: 'active', notes: '', createdAt: '2026-01-05T10:00:00Z', updatedAt: '2026-01-05T10:00:00Z' },
  { id: 'prod-003', companyId: 'comp-001', name: 'أرز مصري', sku: 'RIC-001', barcode: '621234567003', category: 'حبوب', buyPrice: 4, sellPrice: 6.5, stock: 200, minStock: 30, unit: 'كيلو', status: 'active', notes: '', createdAt: '2026-01-05T10:00:00Z', updatedAt: '2026-01-05T10:00:00Z' },
  { id: 'prod-004', companyId: 'comp-001', name: 'معلبات طماطم', sku: 'TOM-001', barcode: '621234567004', category: 'معلبات', buyPrice: 2, sellPrice: 3.5, stock: 5, minStock: 40, unit: 'علبة', status: 'active', notes: '', createdAt: '2026-01-05T10:00:00Z', updatedAt: '2026-01-05T10:00:00Z' },
  { id: 'prod-005', companyId: 'comp-001', name: 'شاي أسود', sku: 'TEA-001', barcode: '621234567005', category: 'مشروبات', buyPrice: 8, sellPrice: 12, stock: 80, minStock: 15, unit: 'علبة', status: 'active', notes: '', createdAt: '2026-01-05T10:00:00Z', updatedAt: '2026-01-05T10:00:00Z' },
];

const demoInvoices: Invoice[] = [
  {
    id: 'inv-001', companyId: 'comp-001', serialNumber: 'INV-0001', customerId: 'cust-001', customerName: 'محمد الزروق',
    salesmanId: 'user-001-salesman', salesmanName: 'يوسف أحمد البائع',
    items: [
      { id: 'item-001', productId: 'prod-001', productName: 'زيت زيتون بكر', quantity: 10, unitPrice: 18, discount: 0, total: 180 },
      { id: 'item-002', productId: 'prod-003', productName: 'أرز مصري', quantity: 20, unitPrice: 6.5, discount: 0, total: 130 },
    ],
    subtotal: 310, discount: 10, tax: 0, total: 300, paid: 200, remaining: 100,
    status: 'partial', dueDate: '2026-07-01', notes: '',
    createdAt: '2026-06-01T10:00:00Z', updatedAt: '2026-06-01T10:00:00Z',
  },
  {
    id: 'inv-002', companyId: 'comp-001', serialNumber: 'INV-0002', customerId: 'cust-002', customerName: 'أحمد الفرجاني',
    items: [
      { id: 'item-003', productId: 'prod-002', productName: 'سكر أبيض', quantity: 50, unitPrice: 5, discount: 0, total: 250 },
      { id: 'item-004', productId: 'prod-005', productName: 'شاي أسود', quantity: 30, unitPrice: 12, discount: 0, total: 360 },
    ],
    subtotal: 610, discount: 0, tax: 0, total: 610, paid: 0, remaining: 610,
    status: 'unpaid', dueDate: '2026-06-15', notes: '',
    createdAt: '2026-06-05T10:00:00Z', updatedAt: '2026-06-05T10:00:00Z',
  },
  {
    id: 'inv-003', companyId: 'comp-001', serialNumber: 'INV-0003', customerId: 'cust-003', customerName: 'فاطمة بن علي',
    items: [
      { id: 'item-005', productId: 'prod-001', productName: 'زيت زيتون بكر', quantity: 5, unitPrice: 18, discount: 0, total: 90 },
    ],
    subtotal: 90, discount: 0, tax: 0, total: 90, paid: 90, remaining: 0,
    status: 'paid', dueDate: '2026-06-30', notes: '',
    createdAt: '2026-06-10T10:00:00Z', updatedAt: '2026-06-10T10:00:00Z',
  },
];

const demoExpenses: Expense[] = [
  { id: 'exp-001', companyId: 'comp-001', category: 'إيجار', description: 'إيجار المستودع الشهري', amount: 800, date: '2026-06-01', notes: '', createdAt: '2026-06-01T10:00:00Z' },
  { id: 'exp-002', companyId: 'comp-001', category: 'رواتب', description: 'رواتب الموظفين', amount: 3500, date: '2026-06-01', notes: '', createdAt: '2026-06-01T10:00:00Z' },
  { id: 'exp-003', companyId: 'comp-001', category: 'مرافق', description: 'فاتورة الكهرباء', amount: 250, date: '2026-06-05', notes: '', createdAt: '2026-06-05T10:00:00Z' },
  { id: 'exp-004', companyId: 'comp-001', category: 'نقل', description: 'تكاليف التوصيل والنقل', amount: 400, date: '2026-06-10', notes: '', createdAt: '2026-06-10T10:00:00Z' },
];

const demoSuppliers: Supplier[] = [
  { id: 'sup-001', companyId: 'comp-001', name: 'شركة الزيوت الليبية', phone: '+218911000001', email: 'info@libyaoil.ly', address: 'منطقة جانزور', city: 'طرابلس', amountDue: 2000, status: 'active', notes: '', createdAt: '2026-01-01T10:00:00Z', updatedAt: '2026-01-01T10:00:00Z' },
  { id: 'sup-002', companyId: 'comp-001', name: 'مطاحن الحبوب الوطنية', phone: '+218911000002', email: 'info@grains.ly', address: 'طريق المطار', city: 'طرابلس', amountDue: 500, status: 'active', notes: '', createdAt: '2026-01-01T10:00:00Z', updatedAt: '2026-01-01T10:00:00Z' },
];

const demoNotifications: Notification[] = [
  {
    id: 'notif-001', targetCompanyIds: [], title: 'تحديث النظام', message: 'سيتم إجراء صيانة للنظام يوم الجمعة من الساعة 2 إلى 4 صباحاً. قد يتأثر الوصول مؤقتاً.', type: 'maintenance', isRead: false, readByCompanyIds: [], createdAt: '2026-06-14T10:00:00Z', createdBy: 'user-super-001',
  },
  {
    id: 'notif-002', targetCompanyIds: ['comp-001'], title: 'تذكير بالاشتراك', message: 'محمد، اشتراكك ينتهي خلال 15 يوماً. يرجى التواصل مع الدعم للتجديد.', type: 'subscription_warning', isRead: false, readByCompanyIds: [], createdAt: '2026-06-15T10:00:00Z', createdBy: 'user-super-001',
  },
];

const demoSecurityLogs: SecurityLog[] = [
  { id: 'log-001', userId: 'user-super-001', userName: 'Kimichi Admin', action: 'login', description: 'تسجيل دخول ناجح للمشرف العام', severity: 'info', ipAddress: '192.168.1.1', device: 'Chrome / Windows', createdAt: '2026-06-16T08:00:00Z' },
  { id: 'log-002', companyId: 'comp-001', userId: 'user-001-owner', userName: 'محمد أبوبكر النور', action: 'login', description: 'تسجيل دخول ناجح', severity: 'info', ipAddress: '192.168.1.5', device: 'Firefox / MacOS', createdAt: '2026-06-16T09:00:00Z' },
  { id: 'log-003', companyId: 'comp-003', userId: 'unknown', userName: 'unknown', action: 'failed_login', description: 'محاولة تسجيل دخول فاشلة - كلمة مرور خاطئة', severity: 'warning', ipAddress: '10.0.0.15', device: 'Mobile / iOS', createdAt: '2026-06-16T10:00:00Z' },
  { id: 'log-004', userId: 'user-super-001', userName: 'Kimichi Admin', action: 'company_suspended', description: 'إيقاف شركة الأندلس لمواد البناء', severity: 'warning', ipAddress: '192.168.1.1', device: 'Chrome / Windows', createdAt: '2026-06-15T11:00:00Z' },
];

const demoSubscriptionInvoices: SubscriptionInvoice[] = [
  { id: 'sinv-001', companyId: 'comp-001', companyName: 'شركة النور للمواد الغذائية', plan: 'pro', billingCycle: 'monthly', amount: 150, startDate: '2026-01-01', endDate: '2026-12-31', paymentStatus: 'paid', paidAt: '2026-01-01', notes: '', createdAt: '2026-01-01T10:00:00Z' },
  { id: 'sinv-002', companyId: 'comp-002', companyName: 'متجر التقنية للإلكترونيات', plan: 'basic', billingCycle: 'monthly', amount: 80, startDate: '2026-02-01', endDate: '2026-08-01', paymentStatus: 'paid', paidAt: '2026-02-01', notes: '', createdAt: '2026-02-01T10:00:00Z' },
  { id: 'sinv-003', companyId: 'comp-003', companyName: 'الأندلس لمواد البناء', plan: 'enterprise', billingCycle: 'yearly', amount: 300, startDate: '2026-01-15', endDate: '2026-07-10', paymentStatus: 'overdue', notes: '', createdAt: '2026-01-15T10:00:00Z' },
  { id: 'sinv-004', companyId: 'comp-004', companyName: 'صيدلية الشفاء', plan: 'pro', billingCycle: 'quarterly', amount: 150, startDate: '2026-03-01', endDate: '2026-12-01', paymentStatus: 'paid', paidAt: '2026-03-01', notes: '', createdAt: '2026-03-01T10:00:00Z' },
];

const demoSupplierPayments: SupplierPayment[] = [];

const defaultCompanySettings = (companyId: string): CompanySettings => ({
  companyId,
  companyDisplayName: '',
  currency: 'LYD',
  currencySymbol: 'د.ل',
  taxRate: 0,
  invoicePrefix: 'INV',
  purchasePrefix: 'PUR',
  lowStockThreshold: 10,
  notifyLowStock: true,
  notifyOverdueInvoices: true,
  updatedAt: new Date().toISOString(),
});

const demoCompanySettings: CompanySettings[] = [
  defaultCompanySettings('comp-001'),
];

// ========================================
// STORE INTERFACE
// ========================================

interface KimichiStore {
  // Hydration (fixes Zustand persist hydration race — see app/erp/layout.tsx
  // and app/admin/layout.tsx, which must not trust `session` until this is true)
  hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;

  // Auth
  session: AuthSession | null;
  login: (username: string, password: string) => { success: boolean; error?: string };
  logout: () => void;

  // Companies
  companies: Company[];
  addCompany: (data: Omit<Company, 'id' | 'serialNumber' | 'createdAt' | 'updatedAt' | 'nextInvoiceSeq' | 'nextPurchaseSeq'>) => Company;
  updateCompany: (id: string, data: Partial<Company>) => void;
  /** Soft-deletes a company: archives it, disables its owner + all employee
   * logins, and keeps historical data intact for audit purposes. Use this
   * instead of hardDeleteCompany in normal operation. */
  deleteCompany: (id: string) => void;
  /** Permanently removes a company AND all of its child records (customers,
   * products, invoices, purchases, suppliers, expenses, employees, users,
   * inventory movements, payments, notifications-read-state). Irreversible. */
  hardDeleteCompany: (id: string) => void;
  suspendCompany: (id: string) => void;
  activateCompany: (id: string) => void;
  archiveCompany: (id: string) => void;

  // Users
  users: User[];
  addUser: (data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => User;
  updateUser: (id: string, data: Partial<User>) => void;
  deleteUser: (id: string) => void;

  // Subscription Invoices
  subscriptionInvoices: SubscriptionInvoice[];
  addSubscriptionInvoice: (data: Omit<SubscriptionInvoice, 'id' | 'createdAt'>) => SubscriptionInvoice;
  updateSubscriptionInvoice: (id: string, data: Partial<SubscriptionInvoice>) => void;

  // Customers
  customers: Customer[];
  addCustomer: (data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => Customer;
  updateCustomer: (id: string, data: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;

  // Products
  products: Product[];
  addProduct: (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Product;
  updateProduct: (id: string, data: Partial<Product>) => void;
  deleteProduct: (id: string) => void;

  // Inventory
  inventoryMovements: InventoryMovement[];
  addInventoryMovement: (data: Omit<InventoryMovement, 'id' | 'createdAt'>) => void;

  // Invoices
  invoices: Invoice[];
  addInvoice: (data: Omit<Invoice, 'id' | 'serialNumber' | 'createdAt' | 'updatedAt'>) => Invoice;
  /** Edits an invoice's items/discount/etc. Recomputes stock movements and
   * customer debt deltas so they stay correct (reverses old item stock
   * impact, applies new item stock impact). */
  updateInvoiceDetails: (id: string, data: { customerId: string; salesmanId?: string; salesmanName?: string; items: InvoiceItem[]; discount: number; dueDate: string; notes: string }) => { success: boolean; error?: string };
  /** Generic field patch (status flags etc.) — does NOT recompute stock/debt.
   * Prefer updateInvoiceDetails for content edits and registerPayment for
   * payments. Kept for narrow internal use. */
  updateInvoice: (id: string, data: Partial<Invoice>) => void;
  /** Deletes an invoice and reverses its effects: restores product stock
   * for each line item and reduces the customer's currentDebt by the
   * invoice's outstanding remaining balance. */
  deleteInvoice: (id: string) => { success: boolean; error?: string };
  /** Registers a payment against a specific invoice. Amount is clamped to
   * the invoice's remaining balance — any excess is returned so the caller
   * can offer to apply it to the customer's other open invoices or record
   * it as store credit. */
  registerPayment: (invoiceId: string, amount: number, method: string, notes: string) => { applied: number; excess: number };
  /** Registers a payment from a customer and automatically allocates it
   * across that customer's open invoices, oldest due-date first. Any
   * amount left over after all open invoices are fully paid is returned
   * as `unallocated` (e.g. to record as customer credit) instead of being
   * silently dropped. */
  registerCustomerPayment: (customerId: string, amount: number, method: string, notes: string) => { allocated: { invoiceId: string; amount: number }[]; unallocated: number };

  // Payments
  payments: Payment[];

  // Suppliers
  suppliers: Supplier[];
  addSupplier: (data: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>) => Supplier;
  updateSupplier: (id: string, data: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;

  // Supplier Payments
  supplierPayments: SupplierPayment[];
  /** Registers a payment to a supplier against a specific purchase order,
   * clamped to that purchase's remaining balance. Updates supplier.amountDue
   * accordingly so it never drifts from real purchase totals. */
  registerSupplierPayment: (purchaseId: string, amount: number, method: string, notes: string) => { applied: number; excess: number };

  // Purchases
  purchases: Purchase[];
  addPurchase: (data: Omit<Purchase, 'id' | 'serialNumber' | 'createdAt'>) => Purchase;
  updatePurchase: (id: string, data: Partial<Purchase>) => void;

  // Expenses
  expenses: Expense[];
  addExpense: (data: Omit<Expense, 'id' | 'createdAt'>) => Expense;
  updateExpense: (id: string, data: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;

  // Employees (kept in sync with `users` — see addEmployee/updateEmployee/deleteEmployee)
  employees: Employee[];
  addEmployee: (data: Omit<Employee, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => Employee;
  updateEmployee: (id: string, data: Partial<Omit<Employee, 'id' | 'companyId' | 'userId'>>) => void;
  /** Removes the employee record AND disables (does not orphan) their login
   * user, so a deleted employee can no longer sign in. */
  deleteEmployee: (id: string) => void;

  // Company Settings
  companySettings: CompanySettings[];
  getCompanySettings: (companyId: string) => CompanySettings;
  updateCompanySettings: (companyId: string, data: Partial<Omit<CompanySettings, 'companyId' | 'updatedAt'>>) => void;

  // Notifications
  notifications: Notification[];
  addNotification: (data: Omit<Notification, 'id' | 'createdAt'>) => void;
  markNotificationRead: (id: string, companyId: string) => void;

  // Support
  supportMessages: SupportMessage[];
  addSupportMessage: (data: Omit<SupportMessage, 'id' | 'createdAt'>) => void;
  markSupportRead: (id: string) => void;

  // Security Logs
  securityLogs: SecurityLog[];
  addSecurityLog: (data: Omit<SecurityLog, 'id' | 'createdAt'>) => void;

  // Helpers
  getCompanyCustomers: (companyId: string) => Customer[];
  getCompanyProducts: (companyId: string) => Product[];
  getCompanyInvoices: (companyId: string) => Invoice[];
  getCompanyExpenses: (companyId: string) => Expense[];
  getCompanySuppliers: (companyId: string) => Supplier[];
  getCompanyEmployees: (companyId: string) => Employee[];
  getCompanyNotifications: (companyId: string) => Notification[];
  getCompanyUnreadNotifications: (companyId: string) => number;
  getUnreadSupportCount: () => number;
  /** Next invoice serial number for a company WITHOUT consuming the counter
   * (preview only — addInvoice consumes it for real). */
  peekNextInvoiceSerial: (companyId: string) => string;
  peekNextPurchaseSerial: (companyId: string) => string;
}

// ========================================
// STORE IMPLEMENTATION

// ========================================

export const useStore = create<KimichiStore>()(
  persist(
    (set, get) => ({
      // ---- STATE ----
      hasHydrated: false,
      setHasHydrated: (v) => set({ hasHydrated: v }),
      session: null,
      companies: demoCompanies,
      users: demoUsers,
      subscriptionInvoices: demoSubscriptionInvoices,
      customers: demoCustomers,
      products: demoProducts,
      inventoryMovements: [],
      invoices: demoInvoices,
      payments: [],
      suppliers: demoSuppliers,
      supplierPayments: demoSupplierPayments,
      purchases: [],
      expenses: demoExpenses,
      employees: demoEmployees,
      companySettings: demoCompanySettings,
      notifications: demoNotifications,
      supportMessages: [],
      securityLogs: demoSecurityLogs,

      // ---- AUTH ----
      login: (username, password) => {
        const { users, companies } = get();
        const user = users.find(u => u.username === username && u.password === password && u.isActive);
        if (!user) {
          get().addSecurityLog({ userId: undefined, userName: username, action: 'failed_login', description: `محاولة دخول فاشلة للمستخدم: ${username}`, severity: 'warning', ipAddress: '0.0.0.0', device: 'Browser' });
          return { success: false, error: 'اسم المستخدم أو كلمة المرور غير صحيحة' };
        }
        if (user.role !== 'super_admin' && user.companyId) {
          const company = companies.find(c => c.id === user.companyId);
          if (!company) return { success: false, error: 'الشركة غير موجودة' };
          if (company.status === 'suspended') return { success: false, error: 'تم إيقاف حساب شركتك مؤقتًا. يرجى التواصل مع إدارة Kimichi.' };
          if (company.status === 'expired') return { success: false, error: 'انتهى اشتراك شركتك. يرجى التواصل مع إدارة Kimichi للتجديد.' };
          const endDate = new Date(company.subscriptionEndDate);
          const now = new Date();
          if (now > endDate && company.status !== 'trial') {
            set(state => ({ companies: state.companies.map(c => c.id === company.id ? { ...c, status: 'expired' } : c) }));
            return { success: false, error: 'انتهى اشتراك شركتك. يرجى التواصل مع إدارة Kimichi للتجديد.' };
          }
          const session: AuthSession = { user, company, loginAt: new Date().toISOString() };
          set({ session });
          get().addSecurityLog({ companyId: company.id, userId: user.id, userName: user.name, action: 'login', description: `تسجيل دخول ناجح لـ ${user.name}`, severity: 'info', ipAddress: '0.0.0.0', device: 'Browser' });
          return { success: true };
        }
        const session: AuthSession = { user, loginAt: new Date().toISOString() };
        set({ session });
        get().addSecurityLog({ userId: user.id, userName: user.name, action: 'login', description: `تسجيل دخول ناجح للمشرف: ${user.name}`, severity: 'info', ipAddress: '0.0.0.0', device: 'Browser' });
        return { success: true };
      },

      logout: () => {
        const { session } = get();
        if (session) {
          get().addSecurityLog({ companyId: session.company?.id, userId: session.user.id, userName: session.user.name, action: 'logout', description: `تسجيل خروج: ${session.user.name}`, severity: 'info', ipAddress: '0.0.0.0', device: 'Browser' });
        }
        set({ session: null });
      },

      // ---- COMPANIES ----
      addCompany: (data) => {
        const id = `comp-${uuidv4().slice(0, 8)}`;
        // Serial numbers are derived from a max-seen scan rather than
        // array length, so a previously deleted company can never cause
        // a collision with a still-existing serial number.
        const maxSeen = get().companies.reduce((max, c) => {
          const n = parseInt(c.serialNumber.replace(/\D/g, ''), 10);
          return Number.isFinite(n) ? Math.max(max, n) : max;
        }, 0);
        const serialNumber = `KIM-${String(maxSeen + 1).padStart(4, '0')}`;
        const company: Company = { ...data, id, serialNumber, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), nextInvoiceSeq: 1, nextPurchaseSeq: 1 };
        // Create owner user
        const ownerUser: User = {
          id: `user-${id}-owner`,
          username: data.ownerUsername,
          password: data.ownerPassword,
          role: 'owner',
          companyId: id,
          name: data.ownerName,
          email: data.ownerEmail,
          phone: data.ownerPhone,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set(state => ({
          companies: [...state.companies, company],
          users: [...state.users, ownerUser],
          companySettings: [...state.companySettings, defaultCompanySettings(id)],
        }));
        get().addSecurityLog({ userId: get().session?.user.id, userName: get().session?.user.name || 'System', action: 'company_created', description: `إنشاء شركة جديدة: ${data.name}`, severity: 'info', ipAddress: '0.0.0.0', device: 'Browser' });
        return company;
      },
      updateCompany: (id, data) => {
        const company = get().companies.find(c => c.id === id);
        set(state => ({ companies: state.companies.map(c => c.id === id ? { ...c, ...data, updatedAt: new Date().toISOString() } : c) }));
        // Keep the owner's login User record in sync if owner credentials
        // are edited from the admin panel — previously this silently did
        // nothing for actual login.
        if (company) {
          const ownerUser = get().users.find(u => u.companyId === id && u.role === 'owner');
          if (ownerUser) {
            const userPatch: Partial<User> = {};
            if (data.ownerUsername !== undefined) userPatch.username = data.ownerUsername;
            if (data.ownerPassword !== undefined) userPatch.password = data.ownerPassword;
            if (data.ownerName !== undefined) userPatch.name = data.ownerName;
            if (data.ownerEmail !== undefined) userPatch.email = data.ownerEmail;
            if (data.ownerPhone !== undefined) userPatch.phone = data.ownerPhone;
            if (Object.keys(userPatch).length > 0) get().updateUser(ownerUser.id, userPatch);
          }
        }
      },
      deleteCompany: (id) => {
        // Soft delete: archive the company and disable every login tied
        // to it (owner + all employees), but KEEP all historical data
        // (customers, invoices, products, etc.) intact for audit/recovery
        // purposes. This replaces the old behavior which removed the
        // company row only and left everything else as orphaned, still-
        // usable data with no way to find it again.
        set(state => ({
          companies: state.companies.map(c => c.id === id ? { ...c, status: 'archived', updatedAt: new Date().toISOString() } : c),
          users: state.users.map(u => u.companyId === id ? { ...u, isActive: false, updatedAt: new Date().toISOString() } : u),
          employees: state.employees.map(e => e.companyId === id ? { ...e, isActive: false, updatedAt: new Date().toISOString() } : e),
        }));
        get().addSecurityLog({ userId: get().session?.user.id, userName: get().session?.user.name || 'System', action: 'company_deleted', description: `أرشفة شركة وتعطيل جميع حساباتها ID: ${id}`, severity: 'critical', ipAddress: '0.0.0.0', device: 'Browser' });
      },
      hardDeleteCompany: (id) => {
        // Irreversible: removes the company AND every child record across
        // every slice in the store. Use only when the previous soft-delete
        // (archiving + disabling logins) is not sufficient, e.g. GDPR-style
        // erasure requests.
        set(state => ({
          companies: state.companies.filter(c => c.id !== id),
          users: state.users.filter(u => u.companyId !== id),
          customers: state.customers.filter(c => c.companyId !== id),
          products: state.products.filter(p => p.companyId !== id),
          inventoryMovements: state.inventoryMovements.filter(m => m.companyId !== id),
          invoices: state.invoices.filter(i => i.companyId !== id),
          payments: state.payments.filter(p => p.companyId !== id),
          suppliers: state.suppliers.filter(s => s.companyId !== id),
          supplierPayments: state.supplierPayments.filter(sp => sp.companyId !== id),
          purchases: state.purchases.filter(p => p.companyId !== id),
          expenses: state.expenses.filter(e => e.companyId !== id),
          employees: state.employees.filter(e => e.companyId !== id),
          companySettings: state.companySettings.filter(s => s.companyId !== id),
          subscriptionInvoices: state.subscriptionInvoices.filter(s => s.companyId !== id),
          notifications: state.notifications.map(n => ({ ...n, targetCompanyIds: n.targetCompanyIds.filter(cid => cid !== id), readByCompanyIds: n.readByCompanyIds.filter(cid => cid !== id) })),
          supportMessages: state.supportMessages.filter(m => m.companyId !== id),
          securityLogs: state.securityLogs.filter(l => l.companyId !== id),
        }));
        get().addSecurityLog({ userId: get().session?.user.id, userName: get().session?.user.name || 'System', action: 'company_hard_deleted', description: `حذف نهائي وكامل لشركة ID: ${id} وكل بياناتها`, severity: 'critical', ipAddress: '0.0.0.0', device: 'Browser' });
      },
      suspendCompany: (id) => {
        set(state => ({ companies: state.companies.map(c => c.id === id ? { ...c, status: 'suspended', updatedAt: new Date().toISOString() } : c) }));
        get().addSecurityLog({ companyId: id, userId: get().session?.user.id, userName: get().session?.user.name || 'System', action: 'company_suspended', description: `إيقاف شركة ID: ${id}`, severity: 'warning', ipAddress: '0.0.0.0', device: 'Browser' });
      },
      activateCompany: (id) => {
        set(state => ({ companies: state.companies.map(c => c.id === id ? { ...c, status: 'active', updatedAt: new Date().toISOString() } : c) }));
        get().addSecurityLog({ companyId: id, userId: get().session?.user.id, userName: get().session?.user.name || 'System', action: 'company_activated', description: `تفعيل شركة ID: ${id}`, severity: 'info', ipAddress: '0.0.0.0', device: 'Browser' });
      },
      archiveCompany: (id) => set(state => ({ companies: state.companies.map(c => c.id === id ? { ...c, status: 'archived', updatedAt: new Date().toISOString() } : c) })),

      // ---- USERS ----
      addUser: (data) => {
        const user: User = { ...data, id: uuidv4(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        set(state => ({ users: [...state.users, user] }));
        return user;
      },
      updateUser: (id, data) => set(state => ({ users: state.users.map(u => u.id === id ? { ...u, ...data, updatedAt: new Date().toISOString() } : u) })),
      deleteUser: (id) => set(state => ({ users: state.users.filter(u => u.id !== id) })),

      // ---- SUBSCRIPTION INVOICES ----
      addSubscriptionInvoice: (data) => {
        const inv: SubscriptionInvoice = { ...data, id: uuidv4(), createdAt: new Date().toISOString() };
        set(state => ({ subscriptionInvoices: [...state.subscriptionInvoices, inv] }));
        return inv;
      },
      updateSubscriptionInvoice: (id, data) => set(state => ({ subscriptionInvoices: state.subscriptionInvoices.map(i => i.id === id ? { ...i, ...data } : i) })),

      // ---- CUSTOMERS ----
      addCustomer: (data) => {
        const customer: Customer = { ...data, id: uuidv4(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        set(state => ({ customers: [...state.customers, customer] }));
        return customer;
      },
      updateCustomer: (id, data) => set(state => ({ customers: state.customers.map(c => c.id === id ? { ...c, ...data, updatedAt: new Date().toISOString() } : c) })),
      deleteCustomer: (id) => set(state => ({ customers: state.customers.filter(c => c.id !== id) })),

      // ---- PRODUCTS ----
      addProduct: (data) => {
        const product: Product = { ...data, id: uuidv4(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        set(state => ({ products: [...state.products, product] }));
        return product;
      },
      updateProduct: (id, data) => set(state => ({ products: state.products.map(p => p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p) })),
      deleteProduct: (id) => set(state => ({ products: state.products.filter(p => p.id !== id) })),

      // ---- INVENTORY ----
      addInventoryMovement: (data) => {
        const movement: InventoryMovement = { ...data, id: uuidv4(), createdAt: new Date().toISOString() };
        set(state => ({ inventoryMovements: [...state.inventoryMovements, movement] }));
        // Update product stock
        set(state => ({ products: state.products.map(p => p.id === data.productId ? { ...p, stock: data.newStock } : p) }));
      },

      // ---- INVOICES ----
      peekNextInvoiceSerial: (companyId) => {
        const company = get().companies.find(c => c.id === companyId);
        const settings = get().getCompanySettings(companyId);
        const seq = company?.nextInvoiceSeq ?? 1;
        return `${settings.invoicePrefix}-${String(seq).padStart(4, '0')}`;
      },
      peekNextPurchaseSerial: (companyId) => {
        const company = get().companies.find(c => c.id === companyId);
        const settings = get().getCompanySettings(companyId);
        const seq = company?.nextPurchaseSeq ?? 1;
        return `${settings.purchasePrefix}-${String(seq).padStart(4, '0')}`;
      },
      addInvoice: (data) => {
        const company = get().companies.find(c => c.id === data.companyId);
        const settings = get().getCompanySettings(data.companyId);
        // Serial numbers come from a per-company monotonically increasing
        // counter (Company.nextInvoiceSeq) rather than `array.length + 1`.
        // The counter is incremented immediately and NEVER decremented
        // (even if the invoice is later deleted), so a serial number can
        // never be issued twice for the same company.
        const seq = company?.nextInvoiceSeq ?? 1;
        const serialNumber = `${settings.invoicePrefix}-${String(seq).padStart(4, '0')}`;
        const invoice: Invoice = { ...data, id: uuidv4(), serialNumber, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        set(state => ({
          invoices: [...state.invoices, invoice],
          companies: state.companies.map(c => c.id === data.companyId ? { ...c, nextInvoiceSeq: seq + 1 } : c),
        }));
        // Update stock for each item
        data.items.forEach(item => {
          const product = get().products.find(p => p.id === item.productId);
          if (product) {
            const newStock = product.stock - item.quantity;
            get().addInventoryMovement({ companyId: data.companyId, productId: item.productId, productName: item.productName, type: 'out', quantity: item.quantity, previousStock: product.stock, newStock: Math.max(0, newStock), reason: `فاتورة مبيعات ${serialNumber}`, reference: invoice.id, userId: get().session?.user.id || '', userName: get().session?.user.name || '' });
          }
        });
        // Update customer debt
        if (data.remaining > 0) {
          const customer = get().customers.find(c => c.id === data.customerId);
          get().updateCustomer(data.customerId, { currentDebt: addMoney(customer?.currentDebt || 0, data.remaining) });
        }
        return invoice;
      },
      updateInvoice: (id, data) => set(state => ({ invoices: state.invoices.map(i => i.id === id ? { ...i, ...data, updatedAt: new Date().toISOString() } : i) })),
      updateInvoiceDetails: (id, data) => {
        const invoice = get().invoices.find(i => i.id === id);
        if (!invoice) return { success: false, error: 'الفاتورة غير موجودة' };
        if (invoice.paid > 0) {
          // Editing line items after a payment has been registered against
          // this invoice would desync paid/remaining math in non-obvious
          // ways (e.g. shrinking the total below what's already been paid).
          // Block it and ask the user to use a credit note / new invoice
          // instead, rather than silently producing an inconsistent state.
          return { success: false, error: 'لا يمكن تعديل بنود فاتورة تم تسجيل دفعات عليها. يرجى إلغاء الدفعات أولاً أو إصدار إشعار دائن.' };
        }

        // 1. Reverse the OLD items' stock impact (restore stock as if the
        //    original invoice never happened).
        invoice.items.forEach(oldItem => {
          const product = get().products.find(p => p.id === oldItem.productId);
          if (product) {
            const restoredStock = product.stock + oldItem.quantity;
            get().addInventoryMovement({ companyId: invoice.companyId, productId: oldItem.productId, productName: oldItem.productName, type: 'in', quantity: oldItem.quantity, previousStock: product.stock, newStock: restoredStock, reason: `تعديل فاتورة ${invoice.serialNumber} - إلغاء البند القديم`, reference: invoice.id, userId: get().session?.user.id || '', userName: get().session?.user.name || '' });
          }
        });

        // 2. Validate stock is sufficient for the NEW items (post-reversal).
        for (const newItem of data.items) {
          const product = get().products.find(p => p.id === newItem.productId);
          if (product && product.stock < newItem.quantity) {
            // Roll back the reversal we just did so we don't leave stock
            // in a half-applied state if validation fails.
            invoice.items.forEach(oldItem => {
              const p = get().products.find(pp => pp.id === oldItem.productId);
              if (p) get().addInventoryMovement({ companyId: invoice.companyId, productId: oldItem.productId, productName: oldItem.productName, type: 'out', quantity: oldItem.quantity, previousStock: p.stock, newStock: Math.max(0, p.stock - oldItem.quantity), reason: `تراجع عن تعديل فاتورة ${invoice.serialNumber} (فشل التحقق من المخزون)`, reference: invoice.id, userId: get().session?.user.id || '', userName: get().session?.user.name || '' });
            });
            return { success: false, error: `الكمية المطلوبة من "${newItem.productName}" غير متوفرة في المخزون` };
          }
        }

        // 3. Apply the NEW items' stock impact.
        data.items.forEach(newItem => {
          const product = get().products.find(p => p.id === newItem.productId);
          if (product) {
            const newStock = product.stock - newItem.quantity;
            get().addInventoryMovement({ companyId: invoice.companyId, productId: newItem.productId, productName: newItem.productName, type: 'out', quantity: newItem.quantity, previousStock: product.stock, newStock: Math.max(0, newStock), reason: `تعديل فاتورة ${invoice.serialNumber} - بند جديد`, reference: invoice.id, userId: get().session?.user.id || '', userName: get().session?.user.name || '' });
          }
        });

        // 4. Recompute totals with cents-safe rounding.
        const subtotal = roundMoney(data.items.reduce((sum, it) => addMoney(sum, it.total), 0));
        const total = clampNonNegative(subMoney(subtotal, data.discount || 0));
        const remaining = clampNonNegative(subMoney(total, invoice.paid));
        const status: InvoiceStatus = isZeroMoney(remaining) ? 'paid' : invoice.paid > 0 ? 'partial' : 'unpaid';

        // 5. Adjust customer debt by the delta between old and new remaining,
        //    and re-point the invoice at a new customer if changed.
        const oldRemaining = invoice.remaining;
        if (data.customerId === invoice.customerId) {
          const customer = get().customers.find(c => c.id === invoice.customerId);
          get().updateCustomer(invoice.customerId, { currentDebt: clampNonNegative(addMoney(customer?.currentDebt || 0, subMoney(remaining, oldRemaining))) });
        } else {
          const oldCustomer = get().customers.find(c => c.id === invoice.customerId);
          if (oldCustomer) get().updateCustomer(invoice.customerId, { currentDebt: clampNonNegative(subMoney(oldCustomer.currentDebt, oldRemaining)) });
          const newCustomer = get().customers.find(c => c.id === data.customerId);
          const newCustomerName = newCustomer?.name || invoice.customerName;
          if (newCustomer) get().updateCustomer(data.customerId, { currentDebt: addMoney(newCustomer.currentDebt, remaining) });
          get().updateInvoice(id, { customerName: newCustomerName });
        }

        get().updateInvoice(id, {
          customerId: data.customerId,
          salesmanId: data.salesmanId,
          salesmanName: data.salesmanName,
          items: data.items,
          subtotal,
          discount: data.discount || 0,
          total,
          remaining,
          status,
          dueDate: data.dueDate,
          notes: data.notes,
        });
        get().addSecurityLog({ companyId: invoice.companyId, userId: get().session?.user.id, userName: get().session?.user.name || 'System', action: 'invoice_updated', description: `تعديل الفاتورة ${invoice.serialNumber}`, severity: 'info', ipAddress: '0.0.0.0', device: 'Browser' });
        return { success: true };
      },
      deleteInvoice: (id) => {
        const invoice = get().invoices.find(i => i.id === id);
        if (!invoice) return { success: false, error: 'الفاتورة غير موجودة' };
        if (invoice.paid > 0) {
          // Deleting an invoice that already has payments registered
          // against it would silently destroy that payment history and
          // leave the customer's debt/credit picture wrong. Refuse and
          // point the user at the safer path.
          return { success: false, error: 'لا يمكن حذف فاتورة تم تسجيل دفعات عليها. يرجى التواصل مع المحاسب لإصدار إشعار دائن.' };
        }
        // Restore stock for every line item.
        invoice.items.forEach(item => {
          const product = get().products.find(p => p.id === item.productId);
          if (product) {
            const restoredStock = product.stock + item.quantity;
            get().addInventoryMovement({ companyId: invoice.companyId, productId: item.productId, productName: item.productName, type: 'in', quantity: item.quantity, previousStock: product.stock, newStock: restoredStock, reason: `حذف فاتورة مبيعات ${invoice.serialNumber}`, reference: invoice.id, userId: get().session?.user.id || '', userName: get().session?.user.name || '' });
          }
        });
        // Reverse the customer's outstanding debt from this invoice.
        if (invoice.remaining > 0) {
          const customer = get().customers.find(c => c.id === invoice.customerId);
          if (customer) get().updateCustomer(invoice.customerId, { currentDebt: clampNonNegative(subMoney(customer.currentDebt, invoice.remaining)) });
        }
        set(state => ({ invoices: state.invoices.filter(i => i.id !== id) }));
        get().addSecurityLog({ companyId: invoice.companyId, userId: get().session?.user.id, userName: get().session?.user.name || 'System', action: 'invoice_deleted', description: `حذف الفاتورة ${invoice.serialNumber} مع عكس المخزون والمديونية`, severity: 'warning', ipAddress: '0.0.0.0', device: 'Browser' });
        return { success: true };
      },
      registerPayment: (invoiceId, amount, method, notes) => {
        const invoice = get().invoices.find(i => i.id === invoiceId);
        if (!invoice) return { applied: 0, excess: amount };
        // Clamp the applied amount to what's actually owed on this invoice;
        // anything beyond that is returned as `excess` instead of being
        // silently absorbed (previously could overpay and the extra money
        // just vanished from the books).
        const applied = Math.min(roundMoney(amount), invoice.remaining);
        const excess = clampNonNegative(subMoney(amount, applied));
        if (applied <= 0) return { applied: 0, excess: clampNonNegative(amount) };

        const newPaid = addMoney(invoice.paid, applied);
        const newRemaining = clampNonNegative(subMoney(invoice.total, newPaid));
        // Cents-safe zero check instead of `newRemaining === 0`, which is
        // unreliable after chained float arithmetic.
        const newStatus: InvoiceStatus = isZeroMoney(newRemaining) ? 'paid' : 'partial';
        get().updateInvoice(invoiceId, { paid: newPaid, remaining: newRemaining, status: newStatus });

        const customer = get().customers.find(c => c.id === invoice.customerId);
        get().updateCustomer(invoice.customerId, { currentDebt: clampNonNegative(subMoney(customer?.currentDebt || 0, applied)) });

        const payment: Payment = { id: uuidv4(), companyId: invoice.companyId, invoiceId, customerId: invoice.customerId, customerName: invoice.customerName, amount: applied, method: method as any, notes, createdAt: new Date().toISOString() };
        set(state => ({ payments: [...state.payments, payment] }));
        return { applied, excess };
      },
      registerCustomerPayment: (customerId, amount, method, notes) => {
        // Allocates a single payment across ALL of a customer's open
        // invoices, oldest due date first, instead of always dumping the
        // whole amount onto a single invoice (which previously caused
        // currentDebt to desync from the real sum of invoice.remaining
        // whenever a customer had more than one open invoice).
        const openInvoices = get().invoices
          .filter(i => i.customerId === customerId && i.remaining > 0)
          .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

        let remainingToAllocate = roundMoney(amount);
        const allocated: { invoiceId: string; amount: number }[] = [];

        for (const inv of openInvoices) {
          if (remainingToAllocate <= 0) break;
          const portion = Math.min(remainingToAllocate, inv.remaining);
          if (portion <= 0) continue;
          const result = get().registerPayment(inv.id, portion, method, notes);
          if (result.applied > 0) {
            allocated.push({ invoiceId: inv.id, amount: result.applied });
            remainingToAllocate = clampNonNegative(subMoney(remainingToAllocate, result.applied));
          }
        }

        // Anything left after every open invoice is fully paid is real
        // overpayment / store credit — it is returned to the caller
        // instead of being dropped, so the UI can record it explicitly
        // (e.g. as a negative debt / credit balance) rather than losing it.
        if (remainingToAllocate > 0) {
          const customer = get().customers.find(c => c.id === customerId);
          if (customer) {
            // Represent credit as negative debt rather than clamping to 0,
            // so the next invoice for this customer can draw it down.
            get().updateCustomer(customerId, { currentDebt: subMoney(customer.currentDebt, remainingToAllocate) });
          }
        }

        return { allocated, unallocated: remainingToAllocate };
      },

      // ---- SUPPLIERS ----
      addSupplier: (data) => {
        const supplier: Supplier = { ...data, id: uuidv4(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        set(state => ({ suppliers: [...state.suppliers, supplier] }));
        return supplier;
      },
      updateSupplier: (id, data) => set(state => ({ suppliers: state.suppliers.map(s => s.id === id ? { ...s, ...data, updatedAt: new Date().toISOString() } : s) })),
      deleteSupplier: (id) => set(state => ({ suppliers: state.suppliers.filter(s => s.id !== id) })),

      // ---- SUPPLIER PAYMENTS ----
      registerSupplierPayment: (purchaseId, amount, method, notes) => {
        const purchase = get().purchases.find(p => p.id === purchaseId);
        if (!purchase) return { applied: 0, excess: amount };
        const applied = Math.min(roundMoney(amount), purchase.remaining);
        const excess = clampNonNegative(subMoney(amount, applied));
        if (applied <= 0) return { applied: 0, excess: clampNonNegative(amount) };

        const newPaid = addMoney(purchase.paid, applied);
        const newRemaining = clampNonNegative(subMoney(purchase.total, newPaid));
        const newStatus: PaymentStatus = isZeroMoney(newRemaining) ? 'paid' : 'pending';
        get().updatePurchase(purchaseId, { paid: newPaid, remaining: newRemaining, paymentStatus: newStatus });

        const supplier = get().suppliers.find(s => s.id === purchase.supplierId);
        if (supplier) get().updateSupplier(purchase.supplierId, { amountDue: clampNonNegative(subMoney(supplier.amountDue, applied)) });

        const payment: SupplierPayment = { id: uuidv4(), companyId: purchase.companyId, purchaseId, supplierId: purchase.supplierId, supplierName: purchase.supplierName, amount: applied, method: method as any, notes, createdAt: new Date().toISOString() };
        set(state => ({ supplierPayments: [...state.supplierPayments, payment] }));
        return { applied, excess };
      },

      // ---- PURCHASES ----
      addPurchase: (data) => {
        const company = get().companies.find(c => c.id === data.companyId);
        const settings = get().getCompanySettings(data.companyId);
        const seq = company?.nextPurchaseSeq ?? 1;
        const serialNumber = `${settings.purchasePrefix}-${String(seq).padStart(4, '0')}`;
        const purchase: Purchase = { ...data, id: uuidv4(), serialNumber, createdAt: new Date().toISOString() };
        set(state => ({
          purchases: [...state.purchases, purchase],
          companies: state.companies.map(c => c.id === data.companyId ? { ...c, nextPurchaseSeq: seq + 1 } : c),
        }));
        // Update product stock
        data.items.forEach(item => {
          const product = get().products.find(p => p.id === item.productId);
          if (product) {
            const newStock = product.stock + item.quantity;
            get().addInventoryMovement({ companyId: data.companyId, productId: item.productId, productName: item.productName, type: 'in', quantity: item.quantity, previousStock: product.stock, newStock, reason: `أمر شراء ${serialNumber}`, reference: purchase.id, userId: get().session?.user.id || '', userName: get().session?.user.name || '' });
          }
        });
        // Keep supplier.amountDue in sync with real outstanding purchase
        // balances instead of letting it be a disconnected manual field.
        if (data.remaining > 0) {
          const supplier = get().suppliers.find(s => s.id === data.supplierId);
          if (supplier) get().updateSupplier(data.supplierId, { amountDue: addMoney(supplier.amountDue, data.remaining) });
        }
        return purchase;
      },
      updatePurchase: (id, data) => set(state => ({ purchases: state.purchases.map(p => p.id === id ? { ...p, ...data } : p) })),

      // ---- EXPENSES ----
      addExpense: (data) => {
        const expense: Expense = { ...data, id: uuidv4(), createdAt: new Date().toISOString() };
        set(state => ({ expenses: [...state.expenses, expense] }));
        return expense;
      },
      updateExpense: (id, data) => set(state => ({ expenses: state.expenses.map(e => e.id === id ? { ...e, ...data } : e) })),
      deleteExpense: (id) => set(state => ({ expenses: state.expenses.filter(e => e.id !== id) })),

      // ---- EMPLOYEES (kept in sync with users) ----
      addEmployee: (data) => {
        // Creating an employee now ALSO creates their login User record,
        // linked by employee.userId. Previously these were entirely
        // separate, so a new "employee" had no way to actually log in
        // unless someone separately created a matching User by hand.
        const userId = uuidv4();
        const employee: Employee = { ...data, id: uuidv4(), userId, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        const loginUser: User = {
          id: userId,
          username: data.username,
          password: data.password,
          role: data.role,
          companyId: data.companyId,
          name: data.name,
          email: data.email,
          phone: data.phone,
          isActive: data.isActive,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set(state => ({ employees: [...state.employees, employee], users: [...state.users, loginUser] }));
        return employee;
      },
      updateEmployee: (id, data) => {
        const employee = get().employees.find(e => e.id === id);
        set(state => ({ employees: state.employees.map(e => e.id === id ? { ...e, ...data, updatedAt: new Date().toISOString() } : e) }));
        // Mirror every field that affects login/authorization onto the
        // linked User record. Previously resetPassword/toggleActive/role
        // edits here silently did nothing to the real login credentials.
        if (employee?.userId) {
          const userPatch: Partial<User> = {};
          if (data.password !== undefined) userPatch.password = data.password;
          if (data.role !== undefined) userPatch.role = data.role;
          if (data.isActive !== undefined) userPatch.isActive = data.isActive;
          if (data.name !== undefined) userPatch.name = data.name;
          if (data.email !== undefined) userPatch.email = data.email;
          if (data.phone !== undefined) userPatch.phone = data.phone;
          if (Object.keys(userPatch).length > 0) get().updateUser(employee.userId, userPatch);
        }
      },
      deleteEmployee: (id) => {
        const employee = get().employees.find(e => e.id === id);
        set(state => ({ employees: state.employees.filter(e => e.id !== id) }));
        // Disable rather than delete the linked User so security logs /
        // historical references (invoices, inventory movements recorded
        // under this user) keep a valid userId, but the account can never
        // log in again. Previously the User record was left untouched and
        // fully able to log in even after the employee was "deleted".
        if (employee?.userId) get().updateUser(employee.userId, { isActive: false });
      },

      // ---- COMPANY SETTINGS ----
      getCompanySettings: (companyId) => {
        const existing = get().companySettings.find(s => s.companyId === companyId);
        return existing || defaultCompanySettings(companyId);
      },
      updateCompanySettings: (companyId, data) => set(state => {
        const exists = state.companySettings.some(s => s.companyId === companyId);
        if (exists) {
          return { companySettings: state.companySettings.map(s => s.companyId === companyId ? { ...s, ...data, updatedAt: new Date().toISOString() } : s) };
        }
        return { companySettings: [...state.companySettings, { ...defaultCompanySettings(companyId), ...data, updatedAt: new Date().toISOString() }] };
      }),

      // ---- NOTIFICATIONS ----
      addNotification: (data) => {
        const notif: Notification = { ...data, id: uuidv4(), createdAt: new Date().toISOString() };
        set(state => ({ notifications: [...state.notifications, notif] }));
      },
      markNotificationRead: (id, companyId) => set(state => ({
        notifications: state.notifications.map(n => n.id === id ? { ...n, readByCompanyIds: [...new Set([...n.readByCompanyIds, companyId])] } : n)
      })),

      // ---- SUPPORT ----
      addSupportMessage: (data) => {
        const msg: SupportMessage = { ...data, id: uuidv4(), createdAt: new Date().toISOString() };
        set(state => ({ supportMessages: [...state.supportMessages, msg] }));
      },
      markSupportRead: (id) => set(state => ({ supportMessages: state.supportMessages.map(m => m.id === id ? { ...m, isRead: true } : m) })),

      // ---- SECURITY LOGS ----
      addSecurityLog: (data) => {
        const log: SecurityLog = { ...data, id: uuidv4(), createdAt: new Date().toISOString() };
        set(state => ({ securityLogs: [log, ...state.securityLogs].slice(0, 500) }));
      },

      // ---- HELPERS ----
      getCompanyCustomers: (cid) => get().customers.filter(c => c.companyId === cid),
      getCompanyProducts: (cid) => get().products.filter(p => p.companyId === cid),
      getCompanyInvoices: (cid) => get().invoices.filter(i => i.companyId === cid),
      getCompanyExpenses: (cid) => get().expenses.filter(e => e.companyId === cid),
      getCompanySuppliers: (cid) => get().suppliers.filter(s => s.companyId === cid),
      getCompanyEmployees: (cid) => get().employees.filter(e => e.companyId === cid),
      getCompanyNotifications: (cid) => get().notifications.filter(n => n.targetCompanyIds.length === 0 || n.targetCompanyIds.includes(cid)),
      getCompanyUnreadNotifications: (cid) => get().notifications.filter(n => (n.targetCompanyIds.length === 0 || n.targetCompanyIds.includes(cid)) && !n.readByCompanyIds.includes(cid)).length,
      getUnreadSupportCount: () => get().supportMessages.filter(m => !m.isFromAdmin && !m.isRead).length,
    }),
    {
      name: 'kimichi-erp-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        companies: state.companies,
        users: state.users,
        subscriptionInvoices: state.subscriptionInvoices,
        customers: state.customers,
        products: state.products,
        inventoryMovements: state.inventoryMovements,
        invoices: state.invoices,
        payments: state.payments,
        suppliers: state.suppliers,
        supplierPayments: state.supplierPayments,
        purchases: state.purchases,
        expenses: state.expenses,
        employees: state.employees,
        companySettings: state.companySettings,
        notifications: state.notifications,
        supportMessages: state.supportMessages,
        securityLogs: state.securityLogs,
        // NOTE: `session` is deliberately included so a refresh doesn't log
        // the user out, but it means hasHydrated MUST be checked before any
        // page trusts `session` — see app/erp/layout.tsx / app/admin/layout.tsx.
        session: state.session,
      }),
      // This callback fires once the persisted state has actually been
      // read back from localStorage and merged into the store. Until it
      // fires, `session` may still be at its initial `null` value even
      // though the user IS logged in (their session is sitting in
      // localStorage, just not loaded yet). Layouts use `hasHydrated` to
      // avoid redirecting to /login or crashing on `session!.x` during
      // that brief window — this directly fixes the hydration race bug
      // from the audit.
      onRehydrateStorage: () => (state, error) => {
        if (state) state.setHasHydrated(true);
        else if (error) {
          // If rehydration fails entirely (corrupted localStorage, etc.),
          // still flip the flag so the app doesn't hang on a loading
          // screen forever — it will just behave as a fresh, logged-out
          // session.
          useStore.getState().setHasHydrated(true);
        }
      },
    }
  )
);
