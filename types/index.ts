// ========================================
// KIMICHI ERP - CORE TYPES
// ========================================

export type UserRole = 'super_admin' | 'owner' | 'admin' | 'accountant' | 'salesman' | 'warehouse';

export type CompanyStatus = 'active' | 'suspended' | 'trial' | 'expired' | 'archived';

export type SubscriptionPlan = 'trial' | 'basic' | 'pro' | 'enterprise' | 'lifetime';

export type BillingCycle = 'trial' | 'monthly' | 'quarterly' | 'yearly' | 'lifetime';

export type PaymentStatus = 'paid' | 'pending' | 'overdue' | 'cancelled';

export type InvoiceStatus = 'paid' | 'partial' | 'unpaid' | 'overdue';

export type BusinessType =
  | 'food_wholesale'
  | 'supermarket'
  | 'electronics'
  | 'clothing'
  | 'building_materials'
  | 'car_parts'
  | 'pharmacy'
  | 'clinic'
  | 'restaurant'
  | 'cafe'
  | 'warehouse'
  | 'distribution'
  | 'bookstore'
  | 'perfume'
  | 'cosmetics'
  | 'workshop'
  | 'general';

export type NotificationType =
  | 'subscription_warning'
  | 'payment_reminder'
  | 'system_update'
  | 'maintenance'
  | 'general'
  | 'urgent';

export type SeverityLevel = 'info' | 'warning' | 'error' | 'critical';

export type MovementType = 'in' | 'out' | 'adjustment';

// ========================================
// USER / AUTH
// ========================================

export interface User {
  id: string;
  username: string;
  password: string; // hashed in prod, plain for demo
  role: UserRole;
  companyId?: string;
  name: string;
  email?: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthSession {
  user: User;
  company?: Company;
  loginAt: string;
}

// ========================================
// COMPANY
// ========================================

export interface Company {
  id: string;
  serialNumber: string;
  name: string;
  businessType: BusinessType;
  ownerName: string;
  ownerUsername: string;
  ownerPassword: string;
  ownerPhone: string;
  ownerEmail: string;
  city: string;
  address: string;
  subscriptionPlan: SubscriptionPlan;
  subscriptionPrice: number;
  billingCycle: BillingCycle;
  subscriptionStartDate: string;
  subscriptionEndDate: string;
  paymentStatus: PaymentStatus;
  status: CompanyStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
  logoUrl?: string;
  /** Monotonically increasing counters used to generate invoice/purchase
   * serial numbers. These never decrease (even when records are deleted),
   * which guarantees serial numbers are never reused within a company. */
  nextInvoiceSeq?: number;
  nextPurchaseSeq?: number;
}

// ========================================
// SUBSCRIPTION
// ========================================

export interface SubscriptionInvoice {
  id: string;
  companyId: string;
  companyName: string;
  plan: SubscriptionPlan;
  billingCycle: BillingCycle;
  amount: number;
  startDate: string;
  endDate: string;
  paymentStatus: PaymentStatus;
  paidAt?: string;
  notes: string;
  createdAt: string;
}

// ========================================
// CUSTOMER
// ========================================

export interface Customer {
  id: string;
  companyId: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  creditLimit: number;
  currentDebt: number;
  salesmanId?: string;
  status: 'active' | 'inactive' | 'blocked';
  notes: string;
  createdAt: string;
  updatedAt: string;
}

// ========================================
// PRODUCT
// ========================================

export interface Product {
  id: string;
  companyId: string;
  name: string;
  sku: string;
  barcode?: string;
  category: string;
  buyPrice: number;
  sellPrice: number;
  stock: number;
  minStock: number;
  unit: string;
  // Business-type specific
  serialNumber?: string;
  warrantyMonths?: number;
  expiryDate?: string;
  batchNumber?: string;
  partNumber?: string;
  carModel?: string;
  supplierLicense?: string;
  status: 'active' | 'inactive';
  notes: string;
  createdAt: string;
  updatedAt: string;
}

// ========================================
// INVENTORY
// ========================================

export interface InventoryMovement {
  id: string;
  companyId: string;
  productId: string;
  productName: string;
  type: MovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  reference?: string;
  userId: string;
  userName: string;
  createdAt: string;
}

// ========================================
// INVOICE
// ========================================

export interface InvoiceItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

export interface Invoice {
  id: string;
  companyId: string;
  serialNumber: string;
  customerId: string;
  customerName: string;
  salesmanId?: string;
  salesmanName?: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paid: number;
  remaining: number;
  status: InvoiceStatus;
  dueDate: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

// ========================================
// PAYMENT
// ========================================

export interface Payment {
  id: string;
  companyId: string;
  invoiceId: string;
  customerId: string;
  customerName: string;
  amount: number;
  method: 'cash' | 'bank' | 'check' | 'other';
  notes: string;
  createdAt: string;
}

// ========================================
// SUPPLIER PAYMENT
// ========================================

export interface SupplierPayment {
  id: string;
  companyId: string;
  purchaseId: string;
  supplierId: string;
  supplierName: string;
  amount: number;
  method: 'cash' | 'bank' | 'check' | 'other';
  notes: string;
  createdAt: string;
}

// ========================================
// SUPPLIER
// ========================================

export interface Supplier {
  id: string;
  companyId: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  amountDue: number;
  status: 'active' | 'inactive';
  notes: string;
  createdAt: string;
  updatedAt: string;
}

// ========================================
// PURCHASE
// ========================================

export interface PurchaseItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Purchase {
  id: string;
  companyId: string;
  serialNumber: string;
  supplierId: string;
  supplierName: string;
  items: PurchaseItem[];
  total: number;
  paid: number;
  remaining: number;
  paymentStatus: PaymentStatus;
  receivedDate: string;
  notes: string;
  createdAt: string;
}

// ========================================
// EXPENSE
// ========================================

export interface Expense {
  id: string;
  companyId: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  notes: string;
  createdAt: string;
}

// ========================================
// EMPLOYEE / SALESMAN
// ========================================

export interface Employee {
  id: string;
  companyId: string;
  userId: string;
  name: string;
  username: string;
  password: string;
  role: Exclude<UserRole, 'super_admin' | 'owner'>;
  phone: string;
  email: string;
  salary: number;
  commission: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ========================================
// NOTIFICATION
// ========================================

export interface Notification {
  id: string;
  targetCompanyIds: string[]; // empty = all
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  readByCompanyIds: string[];
  createdAt: string;
  createdBy: string;
}

// ========================================
// SUPPORT
// ========================================

export interface SupportMessage {
  id: string;
  companyId: string;
  companyName: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  message: string;
  isFromAdmin: boolean;
  isRead: boolean;
  createdAt: string;
}

// ========================================
// SECURITY LOG
// ========================================

export interface SecurityLog {
  id: string;
  companyId?: string;
  userId?: string;
  userName: string;
  action: string;
  description: string;
  severity: SeverityLevel;
  ipAddress: string;
  device: string;
  createdAt: string;
}

// ========================================
// COMPANY SETTINGS
// ========================================

export interface CompanySettings {
  companyId: string;
  companyDisplayName: string;
  currency: string;
  currencySymbol: string;
  taxRate: number;
  invoicePrefix: string;
  purchasePrefix: string;
  lowStockThreshold: number;
  notifyLowStock: boolean;
  notifyOverdueInvoices: boolean;
  updatedAt: string;
}
