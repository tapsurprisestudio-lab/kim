import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ================================================================
// KIMICHI ERP — SUPABASE CLIENT (OPTIONAL SCAFFOLD — NOT LIVE)
// ================================================================
//
// CURRENT STATUS: This client is scaffolded and exported but is NOT
// called by any part of the application. The entire app runs on a
// Zustand store persisted to localStorage (see store/index.ts).
// There are no API routes, no server actions, and no Supabase queries
// anywhere in this codebase as of this version.
//
// Do NOT describe this app as "Supabase-powered" or "production
// multi-tenant SaaS" until the migration checklist below is complete.
//
// ── MIGRATION CHECKLIST (all items incomplete) ────────────────────
//
// 1. SCHEMA MISMATCH (non-trivial):
//    database/schema.sql normalises invoice/purchase items into child
//    tables (invoice_items, purchase_items). The live store embeds them
//    as JSON arrays. Migration requires splitting every addInvoice/
//    addPurchase into 2-table Supabase transactions and updating every
//    read to JOIN/select('*, items(*)').
//
// 2. RLS PRIVILEGE ESCALATION (security gap):
//    profiles_self_update in rls-policies.sql lets any user update
//    their own `role` column. Fix with SECURITY DEFINER or column-level
//    grants before going live.
//
// 3. AUTHENTICATION:
//    Replace store/index.ts login() with supabase.auth.signInWithPassword()
//    and map auth.users → profiles.
//
// 4. SERVICE ROLE KEY:
//    SUPABASE_SERVICE_ROLE_KEY in .env.example is for future server-side
//    use only (API routes / edge functions). Never expose it client-side.
//    This app currently has NO server-side code.
//
// ── STEPS WHEN READY ──────────────────────────────────────────────
//    1. Create Supabase project.
//    2. Run database/schema.sql then database/rls-policies.sql.
//    3. Fix RLS role-escalation gap.
//    4. Copy .env.example → .env.local and fill values.
//    5. Migrate store actions to Supabase calls one by one.
//    6. Switch auth to supabase.auth.signInWithPassword().
// ─────────────────────────────────────────────────────────────────

const supabaseUrl      = process.env.NEXT_PUBLIC_SUPABASE_URL      || '';
const supabaseAnonKey  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let supabase: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseAnonKey) return null;
  if (!supabase) {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
  }
  return supabase;
}

export const isSupabaseConfigured = () => Boolean(supabaseUrl && supabaseAnonKey);

export default getSupabaseClient;
