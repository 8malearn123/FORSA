import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * عميل Supabase للخادم فقط، بمفتاح service_role. الجداول مقفلة بـ RLS دون سياسات،
 * فلا يصل إليها أحد إلا من هنا. المتصفح لا يتصل بـ Supabase أبداً.
 */
const shared = globalThis as typeof globalThis & { __forsaSupabase?: SupabaseClient };

export function db() {
  if (shared.__forsaSupabase) return shared.__forsaSupabase;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("[forsa] SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
  shared.__forsaSupabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    // البيانات تتغير مع كل طلب، فلا نسمح لـ Next بتخزين الردود
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
  });
  return shared.__forsaSupabase;
}

/** يرمي الخطأ إن فشل الطلب، ويرجع البيانات */
export function must<T>({ data, error }: { data: T; error: { message: string } | null }): T {
  if (error) throw new Error(`[forsa] supabase: ${error.message}`);
  return data;
}
