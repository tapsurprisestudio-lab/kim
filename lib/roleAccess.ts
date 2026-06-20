// ========================================
// KIMICHI ERP - ROLE-BASED ROUTE ACCESS
// ========================================
// Single source of truth for which roles can access which /erp/* routes.
// This is consumed by:
//   1. app/erp/layout.tsx (to filter sidebar links AND block direct access)
//   2. useRequireRole() hook (called by each page as a defense-in-depth check)
//
// IMPORTANT: This is client-side authorization only (no server to enforce
// it). It stops accidental/curious URL navigation within the demo app, but
// it is NOT a substitute for real server-side authorization (e.g. Supabase
// RLS policies scoped by role) once a real backend is wired up. See
// lib/supabaseClient.ts and database/rls-policies.sql for the server-side
// story.

import type { UserRole } from '@/types';

export type ErpRouteKey =
  | '/erp/dashboard'
  | '/erp/customers'
  | '/erp/products'
  | '/erp/inventory'
  | '/erp/invoices'
  | '/erp/debt'
  | '/erp/suppliers'
  | '/erp/purchases'
  | '/erp/expenses'
  | '/erp/salesmen'
  | '/erp/reports'
  | '/erp/assistant'
  | '/erp/employees'
  | '/erp/settings'
  | '/erp/support';

/** Roles allowed to access each /erp/* route. Company-scoped roles only —
 * super_admin never reaches /erp/* (it has its own /admin/* area). */
export const ERP_ROUTE_ROLES: Record<ErpRouteKey, UserRole[]> = {
  '/erp/dashboard': ['owner', 'admin', 'accountant', 'salesman', 'warehouse'],
  '/erp/customers': ['owner', 'admin', 'accountant', 'salesman'],
  '/erp/products': ['owner', 'admin', 'accountant', 'salesman', 'warehouse'],
  '/erp/inventory': ['owner', 'admin', 'warehouse'],
  '/erp/invoices': ['owner', 'admin', 'accountant', 'salesman'],
  '/erp/debt': ['owner', 'admin', 'accountant'],
  '/erp/suppliers': ['owner', 'admin', 'accountant'],
  '/erp/purchases': ['owner', 'admin', 'warehouse'],
  '/erp/expenses': ['owner', 'admin', 'accountant'],
  '/erp/salesmen': ['owner', 'admin'],
  '/erp/reports': ['owner', 'admin', 'accountant'],
  '/erp/assistant': ['owner', 'admin'],
  '/erp/employees': ['owner', 'admin'],
  '/erp/settings': ['owner', 'admin'],
  '/erp/support': ['owner', 'admin', 'accountant', 'salesman', 'warehouse'],
};

/** Returns true if the given role may access the given /erp path.
 * Unknown paths default to "allowed" (so new pages aren't accidentally
 * locked out before being registered here) — add new routes to the map
 * above to scope them. */
export function isRoleAllowedForPath(role: UserRole, pathname: string): boolean {
  const entry = (Object.keys(ERP_ROUTE_ROLES) as ErpRouteKey[]).find(
    key => pathname === key || pathname.startsWith(key + '/')
  );
  if (!entry) return true;
  return ERP_ROUTE_ROLES[entry].includes(role);
}

/** The first route in the nav that a given role IS allowed to see — used
 * to redirect a blocked user somewhere useful instead of just bouncing
 * them to an empty page. */
export function getFallbackRouteForRole(role: UserRole): ErpRouteKey {
  if (ERP_ROUTE_ROLES['/erp/dashboard'].includes(role)) return '/erp/dashboard';
  const fallback = (Object.keys(ERP_ROUTE_ROLES) as ErpRouteKey[]).find(key =>
    ERP_ROUTE_ROLES[key].includes(role)
  );
  return fallback || '/erp/dashboard';
}
