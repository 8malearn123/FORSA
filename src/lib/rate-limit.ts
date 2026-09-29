import "server-only";

import { createHash } from "node:crypto";

import { headers } from "next/headers";

export const MINUTE = 60_000;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;

/**
 * حدود بسيطة في الذاكرة لحماية الإجراءات العامة (كشف التواصل، البلاغات، النشر).
 * تكفي لخادم واحد؛ عند التوسع تُنقل إلى مخزن مشترك.
 */
const shared = globalThis as typeof globalThis & { __forsaLimits?: Map<string, number[]> };
const buckets = (shared.__forsaLimits ??= new Map<string, number[]>());

/**
 * معرّف الزائر من آخر عنوان أضافه الوكيل العكسي الموثوق (X-Real-IP أو آخر قيمة
 * في X-Forwarded-For)، لا من أول قيمة التي يستطيع الزائر تزويرها.
 * لا نخزن العنوان نفسه، بل بصمة مختصرة منه.
 */
export async function visitorKey() {
  const h = await headers();
  const forwarded = h
    .get("x-forwarded-for")
    ?.split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  const ip = h.get("x-real-ip")?.trim() || forwarded?.at(-1) || "local";
  return createHash("sha256").update(`forsa:${ip}`).digest("hex").slice(0, 20);
}

let lastSweep = 0;

function sweep(now: number) {
  if (now - lastSweep < MINUTE && buckets.size < 5_000) return;
  lastSweep = now;
  for (const [key, hits] of buckets) {
    const recent = hits.filter((t) => now - t < DAY);
    if (recent.length) buckets.set(key, recent);
    else buckets.delete(key);
  }
}

/**
 * يحجز «محاولة» ضمن الحد، ويرجع false إن تجاوزه.
 * التحقق والحجز يتمان معاً دون انتظار، فلا تتسابق الطلبات المتزامنة على نفس الحد.
 */
export function take(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  sweep(now);
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    buckets.set(key, hits);
    return false;
  }
  hits.push(now);
  buckets.set(key, hits);
  return true;
}

/** يعيد محاولة محجوزة (مثلاً إن فشل النشر لسبب لا علاقة له بالزائر) */
export function release(key: string) {
  const hits = buckets.get(key);
  if (hits?.length) hits.pop();
}
