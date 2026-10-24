import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";

import { adminPhones } from "./admin";
import { db, must } from "./supabase";

/**
 * إشعارات فريق المبادرة ورموز الدخول على واتساب عبر «رزان» (مساعدة الواتساب في منصة قمة).
 * المنصة تضيف الإشعار لجدول forsa_notifications وتنبّه رزان لحظياً، ورزان تسحبه من /api/v1/notifications
 * بمفتاح FORSA_RAZAN_KEY وترسله، ثم تؤكد الإرسال أو الفشل. وبدون التنبيه تسحبه رزان كل دقيقة.
 * بدون المفتاح لا يُضاف شيء للطابور.
 */
const razanKey = () => process.env.FORSA_RAZAN_KEY ?? "";

export const razanEnabled = () => razanKey().length >= 24;

const digest = (value: string) => createHash("sha256").update(value).digest();

/** يتحقق من مفتاح رزان في ترويسة Authorization بزمن ثابت */
export function isRazan(request: Request) {
  if (!razanEnabled()) return false;
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  return timingSafeEqual(digest(token), digest(razanKey()));
}

/** بعد ثلاث محاولات فاشلة يُغلق الإشعار ولا يُعاد */
export const MAX_ATTEMPTS = 3;

/**
 * تنبيه رزان لحظياً لتسحب الطابور الآن بدل انتظار الفحص الدوري. التنبيه فارغ بلا بيانات،
 * يُرسل لقناة Realtime في Supabase حق مكتب رزان (FORSA_RAZAN_PING_URL ومفتاحه العام FORSA_RAZAN_PING_KEY).
 * لا يرمي: إن فشل تصل الإشعارات مع الفحص الدوري.
 */
async function pingRazan() {
  const url = process.env.FORSA_RAZAN_PING_URL;
  const key = process.env.FORSA_RAZAN_PING_KEY;
  if (!url || !key) return;
  try {
    const response = await fetch(`${url.replace(/\/$/, "")}/realtime/v1/api/broadcast`, {
      method: "POST",
      headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [{ topic: "razan-notify", event: "ping", payload: {} }] }),
      cache: "no-store",
      signal: AbortSignal.timeout(3_000),
    });
    if (!response.ok) console.error("[forsa] razan ping failed", response.status);
  } catch (error) {
    console.error("[forsa] razan ping failed", error);
  }
}

/** يضيف إشعاراً لكل رقم من أرقام الفريق. لا يرمي أبداً: تعطل الإشعار لا يوقف ما فعله الزائر */
export async function notifyAdmins(text: string) {
  const phones = adminPhones();
  if (!razanEnabled() || phones.length === 0) return;
  try {
    must(
      await db()
        .from("forsa_notifications")
        .insert(phones.map((phone) => ({ phone, text: text.slice(0, 2000) }))),
    );
    await pingRazan();
  } catch (error) {
    console.error("[forsa] admin notification failed", error);
  }
}

/** يضيف رمز الدخول للطابور وينبّه رزان. يرجع false إن لم تُربط رزان أو فشلت الإضافة */
export async function queueLoginCode(phone: string, code: string, expiresAt: string) {
  if (!razanEnabled()) return false;
  const text = `رمز دخولك إلى «فرصة»: ${code}\nصالح ١٠ دقائق. لا تعطه لأحد، فريق «فرصة» ما يطلبه منك أبداً.`;
  const { error } = await db()
    .from("forsa_notifications")
    .insert({ phone, text, kind: "otp", expires_at: expiresAt });
  if (error) {
    console.error("[forsa] login code queue failed", error.message);
    return false;
  }
  await pingRazan();
  return true;
}

export type PendingNotification = {
  id: number;
  phone: string;
  name: string | null;
  text: string;
  kind: "admin" | "otp";
  created_at: string;
};

/** الإشعارات المعلّقة: رموز الدخول أولاً، ثم من الأقدم للأحدث، بدون ما انتهت صلاحيته */
export async function pendingNotifications(limit: number): Promise<PendingNotification[]> {
  const rows = must(
    await db()
      .from("forsa_notifications")
      .select("id, phone, name, text, kind, created_at")
      .eq("status", "pending")
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .order("kind", { ascending: false })
      .order("id", { ascending: true })
      .limit(limit),
  );
  return (rows ?? []) as PendingNotification[];
}

/** يرجع false إن لم يوجد الإشعار */
export async function ackNotification(
  id: number,
  result: { status: "sent" } | { status: "failed"; error: string },
) {
  return must(
    await db().rpc("forsa_ack_notification", {
      p_id: id,
      p_status: result.status,
      p_error: result.status === "failed" ? result.error : null,
      p_max_attempts: MAX_ATTEMPTS,
    }),
  ) as boolean;
}

/** رابط كامل في المنصة لنص الإشعار */
export const siteLink = (path: string) =>
  `${(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "")}${path}`;
