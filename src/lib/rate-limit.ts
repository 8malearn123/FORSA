import "server-only";

import { createHash } from "node:crypto";

import { headers } from "next/headers";

import { db, must } from "./supabase";

export const MINUTE = 60_000;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;

/**
 * حدود بسيطة لحماية الإجراءات العامة (كشف التواصل، البلاغات، النشر).
 * تُحفظ في جدول forsa_hits على Supabase، فتشترك فيها كل نسخ الخادم.
 */

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

/**
 * يحجز «محاولة» ضمن الحد، ويرجع false إن تجاوزه.
 * التحقق والحجز يتمان معاً في قاعدة البيانات بقفل على المفتاح، فلا تتسابق الطلبات المتزامنة على نفس الحد.
 */
export async function take(key: string, limit: number, windowMs: number): Promise<boolean> {
  return must(await db().rpc("forsa_take", { p_key: key, p_limit: limit, p_window_ms: windowMs }));
}

/** يعيد محاولة محجوزة (مثلاً إن فشل النشر لسبب لا علاقة له بالزائر) */
export async function release(key: string) {
  must(await db().rpc("forsa_release", { p_key: key }));
}
