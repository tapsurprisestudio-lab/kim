-- ========================================
-- KIMICHI ERP - ROW LEVEL SECURITY POLICIES
-- Multi-Tenant Isolation: Super Admin sees all, companies see only their own data
-- ========================================

-- ========================================
-- HELPER FUNCTIONS
-- ========================================

-- Returns true if the current authenticated user is super_admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE auth_id = auth.uid() AND role = 'super_admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Returns the company_id of the current authenticated user
CREATE OR REPLACE FUNCTION current_company_id()
RETURNS UUID AS $$
  SELECT company_id FROM profiles WHERE auth_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ========================================
-- ENABLE RLS ON ALL TENANT TABLES
-- ========================================
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

-- ========================================
-- COMPANIES POLICIES
-- ========================================
CREATE POLICY companies_super_admin_all ON companies
  FOR ALL USING (is_super_admin());

CREATE POLICY companies_own_select ON companies
  FOR SELECT USING (id = current_company_id());

-- ========================================
-- PROFILES POLICIES
-- ========================================
CREATE POLICY profiles_super_admin_all ON profiles
  FOR ALL USING (is_super_admin());

CREATE POLICY profiles_own_company ON profiles
  FOR SELECT USING (company_id = current_company_id());

CREATE POLICY profiles_self_update ON profiles
  FOR UPDATE USING (auth_id = auth.uid());

-- ========================================
-- PLANS POLICIES (public read, super admin write)
-- ========================================
CREATE POLICY plans_read_all ON plans
  FOR SELECT USING (true);

CREATE POLICY plans_super_admin_write ON plans
  FOR INSERT WITH CHECK (is_super_admin());

CREATE POLICY plans_super_admin_update ON plans
  FOR UPDATE USING (is_super_admin());

-- ========================================
-- SUBSCRIPTIONS / SUBSCRIPTION_INVOICES
-- ========================================
CREATE POLICY subscriptions_super_admin_all ON subscriptions
  FOR ALL USING (is_super_admin());

CREATE POLICY subscriptions_own_select ON subscriptions
  FOR SELECT USING (company_id = current_company_id());

CREATE POLICY sub_invoices_super_admin_all ON subscription_invoices
  FOR ALL USING (is_super_admin());

CREATE POLICY sub_invoices_own_select ON subscription_invoices
  FOR SELECT USING (company_id = current_company_id());

-- ========================================
-- TENANT-SCOPED TABLES (generic pattern)
-- Super Admin: full access. Company users: only their own company_id.
-- ========================================

-- CUSTOMERS
CREATE POLICY customers_super_admin_all ON customers FOR ALL USING (is_super_admin());
CREATE POLICY customers_tenant_isolation ON customers FOR ALL
  USING (company_id = current_company_id())
  WITH CHECK (company_id = current_company_id());

-- PRODUCTS
CREATE POLICY products_super_admin_all ON products FOR ALL USING (is_super_admin());
CREATE POLICY products_tenant_isolation ON products FOR ALL
  USING (company_id = current_company_id())
  WITH CHECK (company_id = current_company_id());

-- INVENTORY MOVEMENTS
CREATE POLICY inventory_super_admin_all ON inventory_movements FOR ALL USING (is_super_admin());
CREATE POLICY inventory_tenant_isolation ON inventory_movements FOR ALL
  USING (company_id = current_company_id())
  WITH CHECK (company_id = current_company_id());

-- INVOICES
CREATE POLICY invoices_super_admin_all ON invoices FOR ALL USING (is_super_admin());
CREATE POLICY invoices_tenant_isolation ON invoices FOR ALL
  USING (company_id = current_company_id())
  WITH CHECK (company_id = current_company_id());

-- INVOICE ITEMS (scoped via parent invoice)
CREATE POLICY invoice_items_super_admin_all ON invoice_items FOR ALL USING (is_super_admin());
CREATE POLICY invoice_items_tenant_isolation ON invoice_items FOR ALL
  USING (EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.company_id = current_company_id()))
  WITH CHECK (EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.company_id = current_company_id()));

-- PAYMENTS
CREATE POLICY payments_super_admin_all ON payments FOR ALL USING (is_super_admin());
CREATE POLICY payments_tenant_isolation ON payments FOR ALL
  USING (company_id = current_company_id())
  WITH CHECK (company_id = current_company_id());

-- SUPPLIERS
CREATE POLICY suppliers_super_admin_all ON suppliers FOR ALL USING (is_super_admin());
CREATE POLICY suppliers_tenant_isolation ON suppliers FOR ALL
  USING (company_id = current_company_id())
  WITH CHECK (company_id = current_company_id());

-- PURCHASES
CREATE POLICY purchases_super_admin_all ON purchases FOR ALL USING (is_super_admin());
CREATE POLICY purchases_tenant_isolation ON purchases FOR ALL
  USING (company_id = current_company_id())
  WITH CHECK (company_id = current_company_id());

-- PURCHASE ITEMS (scoped via parent purchase)
CREATE POLICY purchase_items_super_admin_all ON purchase_items FOR ALL USING (is_super_admin());
CREATE POLICY purchase_items_tenant_isolation ON purchase_items FOR ALL
  USING (EXISTS (SELECT 1 FROM purchases WHERE purchases.id = purchase_items.purchase_id AND purchases.company_id = current_company_id()))
  WITH CHECK (EXISTS (SELECT 1 FROM purchases WHERE purchases.id = purchase_items.purchase_id AND purchases.company_id = current_company_id()));

-- EXPENSES
CREATE POLICY expenses_super_admin_all ON expenses FOR ALL USING (is_super_admin());
CREATE POLICY expenses_tenant_isolation ON expenses FOR ALL
  USING (company_id = current_company_id())
  WITH CHECK (company_id = current_company_id());

-- EMPLOYEES
CREATE POLICY employees_super_admin_all ON employees FOR ALL USING (is_super_admin());
CREATE POLICY employees_tenant_isolation ON employees FOR ALL
  USING (company_id = current_company_id())
  WITH CHECK (company_id = current_company_id());

-- COMPANY SETTINGS
CREATE POLICY company_settings_super_admin_all ON company_settings FOR ALL USING (is_super_admin());
CREATE POLICY company_settings_tenant_isolation ON company_settings FOR ALL
  USING (company_id = current_company_id())
  WITH CHECK (company_id = current_company_id());

-- ========================================
-- NOTIFICATIONS
-- Super admin: full access (sender).
-- Companies: can read notifications targeted at them or broadcast (empty array).
-- ========================================
CREATE POLICY notifications_super_admin_all ON notifications FOR ALL USING (is_super_admin());

CREATE POLICY notifications_company_read ON notifications
  FOR SELECT USING (
    target_company_ids = '{}' OR current_company_id() = ANY(target_company_ids)
  );

-- ========================================
-- SUPPORT MESSAGES
-- Super admin: full access.
-- Companies: only their own thread, can insert messages for their own company.
-- ========================================
CREATE POLICY support_super_admin_all ON support_messages FOR ALL USING (is_super_admin());

CREATE POLICY support_tenant_select ON support_messages
  FOR SELECT USING (company_id = current_company_id());

CREATE POLICY support_tenant_insert ON support_messages
  FOR INSERT WITH CHECK (company_id = current_company_id());

-- ========================================
-- SECURITY LOGS
-- Super admin: full access (read all platform logs).
-- Companies: can only read logs scoped to their own company_id.
-- No company-side writes (logs are written via service role / server functions).
-- ========================================
CREATE POLICY security_logs_super_admin_all ON security_logs FOR ALL USING (is_super_admin());

CREATE POLICY security_logs_company_read ON security_logs
  FOR SELECT USING (company_id = current_company_id());

-- ========================================
-- NOTES
-- ========================================
-- 1. All policies assume `profiles.auth_id` is linked 1:1 with Supabase `auth.users.id`.
-- 2. INSERT/UPDATE/DELETE on companies, profiles (other than self), plans, and subscriptions
--    is restricted to super_admin by design — company owners must request changes through
--    the Kimichi Support Center, not directly mutate billing/tenant records.
-- 3. Service-role (server-side) functions bypass RLS entirely and should be used for:
--    - Creating new companies + owner profile in one atomic transaction
--    - Writing security_logs entries triggered by company-side actions
--    - Cross-tenant aggregate reporting for the Super Admin dashboard
