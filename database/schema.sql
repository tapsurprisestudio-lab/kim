-- ========================================
-- KIMICHI ERP - DATABASE SCHEMA
-- PostgreSQL / Supabase Ready
-- ========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- COMPANIES (Tenants)
-- ========================================
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  serial_number TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  business_type TEXT NOT NULL DEFAULT 'general',
  owner_name TEXT NOT NULL,
  owner_username TEXT UNIQUE NOT NULL,
  owner_password TEXT NOT NULL,
  owner_phone TEXT,
  owner_email TEXT,
  city TEXT,
  address TEXT,
  subscription_plan TEXT NOT NULL DEFAULT 'trial',
  subscription_price NUMERIC(12,2) DEFAULT 0,
  billing_cycle TEXT NOT NULL DEFAULT 'trial',
  subscription_start_date DATE,
  subscription_end_date DATE,
  payment_status TEXT NOT NULL DEFAULT 'paid',
  status TEXT NOT NULL DEFAULT 'trial', -- active, suspended, trial, expired, archived
  notes TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ========================================
-- PROFILES / USERS
-- ========================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  password TEXT, -- only for non-Supabase-auth demo fallback
  role TEXT NOT NULL CHECK (role IN ('super_admin','owner','admin','accountant','salesman','warehouse')),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_profiles_company ON profiles(company_id);

-- ========================================
-- PLANS
-- ========================================
CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL, -- trial, basic, pro, enterprise, lifetime
  price NUMERIC(12,2) NOT NULL,
  features JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ========================================
-- SUBSCRIPTIONS
-- ========================================
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES plans(id),
  billing_cycle TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_subscriptions_company ON subscriptions(company_id);

-- ========================================
-- SUBSCRIPTION INVOICES
-- ========================================
CREATE TABLE subscription_invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  company_name TEXT,
  plan TEXT NOT NULL,
  billing_cycle TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_sub_invoices_company ON subscription_invoices(company_id);

-- ========================================
-- CUSTOMERS
-- ========================================
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  city TEXT,
  credit_limit NUMERIC(12,2) DEFAULT 0,
  current_debt NUMERIC(12,2) DEFAULT 0,
  salesman_id UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_customers_company ON customers(company_id);

-- ========================================
-- PRODUCTS
-- ========================================
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  sku TEXT NOT NULL,
  barcode TEXT,
  category TEXT,
  buy_price NUMERIC(12,2) DEFAULT 0,
  sell_price NUMERIC(12,2) DEFAULT 0,
  stock NUMERIC(12,2) DEFAULT 0,
  min_stock NUMERIC(12,2) DEFAULT 0,
  unit TEXT DEFAULT 'piece',
  serial_number TEXT,
  warranty_months INT,
  expiry_date DATE,
  batch_number TEXT,
  part_number TEXT,
  car_model TEXT,
  supplier_license TEXT,
  status TEXT DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_products_company ON products(company_id);
CREATE UNIQUE INDEX idx_products_company_sku ON products(company_id, sku);

-- ========================================
-- INVENTORY MOVEMENTS
-- ========================================
CREATE TABLE inventory_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  product_name TEXT,
  type TEXT NOT NULL CHECK (type IN ('in','out','adjustment')),
  quantity NUMERIC(12,2) NOT NULL,
  previous_stock NUMERIC(12,2),
  new_stock NUMERIC(12,2),
  reason TEXT,
  reference TEXT,
  user_id UUID REFERENCES profiles(id),
  user_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_inventory_company ON inventory_movements(company_id);

-- ========================================
-- INVOICES
-- ========================================
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  serial_number TEXT NOT NULL,
  customer_id UUID REFERENCES customers(id),
  customer_name TEXT,
  salesman_id UUID REFERENCES profiles(id),
  salesman_name TEXT,
  subtotal NUMERIC(12,2) DEFAULT 0,
  discount NUMERIC(12,2) DEFAULT 0,
  tax NUMERIC(12,2) DEFAULT 0,
  total NUMERIC(12,2) DEFAULT 0,
  paid NUMERIC(12,2) DEFAULT 0,
  remaining NUMERIC(12,2) DEFAULT 0,
  status TEXT DEFAULT 'unpaid', -- paid, partial, unpaid, overdue
  due_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_invoices_company ON invoices(company_id);
CREATE INDEX idx_invoices_customer ON invoices(customer_id);

-- ========================================
-- INVOICE ITEMS
-- ========================================
CREATE TABLE invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id),
  product_name TEXT,
  quantity NUMERIC(12,2) NOT NULL,
  unit_price NUMERIC(12,2) NOT NULL,
  discount NUMERIC(12,2) DEFAULT 0,
  total NUMERIC(12,2) NOT NULL
);

CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id);

-- ========================================
-- PAYMENTS
-- ========================================
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id),
  customer_name TEXT,
  amount NUMERIC(12,2) NOT NULL,
  method TEXT DEFAULT 'cash',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_payments_company ON payments(company_id);

-- ========================================
-- SUPPLIERS
-- ========================================
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  amount_due NUMERIC(12,2) DEFAULT 0,
  status TEXT DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_suppliers_company ON suppliers(company_id);

-- ========================================
-- PURCHASES
-- ========================================
CREATE TABLE purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  serial_number TEXT NOT NULL,
  supplier_id UUID REFERENCES suppliers(id),
  supplier_name TEXT,
  total NUMERIC(12,2) DEFAULT 0,
  paid NUMERIC(12,2) DEFAULT 0,
  remaining NUMERIC(12,2) DEFAULT 0,
  payment_status TEXT DEFAULT 'pending',
  received_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_purchases_company ON purchases(company_id);

-- ========================================
-- PURCHASE ITEMS
-- ========================================
CREATE TABLE purchase_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_id UUID REFERENCES purchases(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id),
  product_name TEXT,
  quantity NUMERIC(12,2) NOT NULL,
  unit_price NUMERIC(12,2) NOT NULL,
  total NUMERIC(12,2) NOT NULL
);

CREATE INDEX idx_purchase_items_purchase ON purchase_items(purchase_id);

-- ========================================
-- EXPENSES
-- ========================================
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  amount NUMERIC(12,2) NOT NULL,
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_expenses_company ON expenses(company_id);

-- ========================================
-- EMPLOYEES (extends profiles with HR data)
-- ========================================
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  username TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin','accountant','salesman','warehouse')),
  phone TEXT,
  email TEXT,
  salary NUMERIC(12,2) DEFAULT 0,
  commission NUMERIC(5,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_employees_company ON employees(company_id);

-- ========================================
-- NOTIFICATIONS
-- ========================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  target_company_ids UUID[] DEFAULT '{}', -- empty = all companies
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'general',
  read_by_company_ids UUID[] DEFAULT '{}',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ========================================
-- SUPPORT MESSAGES
-- ========================================
CREATE TABLE support_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  company_name TEXT,
  sender_id UUID REFERENCES profiles(id),
  sender_name TEXT,
  sender_role TEXT,
  message TEXT NOT NULL,
  is_from_admin BOOLEAN DEFAULT false,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_support_company ON support_messages(company_id);

-- ========================================
-- SECURITY LOGS
-- ========================================
CREATE TABLE security_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  user_name TEXT,
  action TEXT NOT NULL,
  description TEXT,
  severity TEXT DEFAULT 'info' CHECK (severity IN ('info','warning','error','critical')),
  ip_address TEXT,
  device TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_security_logs_company ON security_logs(company_id);
CREATE INDEX idx_security_logs_created ON security_logs(created_at DESC);

-- ========================================
-- COMPANY SETTINGS
-- ========================================
CREATE TABLE company_settings (
  company_id UUID PRIMARY KEY REFERENCES companies(id) ON DELETE CASCADE,
  company_display_name TEXT,
  currency TEXT DEFAULT 'LYD',
  currency_symbol TEXT DEFAULT 'د.ل',
  tax_rate NUMERIC(5,2) DEFAULT 0,
  invoice_prefix TEXT DEFAULT 'INV',
  purchase_prefix TEXT DEFAULT 'PUR',
  low_stock_threshold NUMERIC(12,2) DEFAULT 10,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ========================================
-- UPDATED_AT TRIGGER FUNCTION
-- ========================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION set_updated_at();
