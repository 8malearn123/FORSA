import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";

import { adminPhones } from "./admin";
import { db, must } from "./supabase";

/**
 * إشعارات فريق المبادرة على واتساب عبر «رزان» (مساعدة الواتساب في منصة قمة).
 * المنصة تضيف الإشعار لجدول forsa_notifications، ورزان تسحبه كل دقيقة من /api/v1/notifications
 * بمفتاح FORSA_RAZAN_KEY وترسله لأرقام FORSA_ADMIN_PHONES، ثم تؤكد الإرسال أو الفشل.
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
  } catch (error) {
    console.error("[forsa] admin notification failed", error);
  }
}

export type PendingNotification = {
  id: number;
  phone: string;
  name: string | null;
  text: string;
  created_at: string;
};

/** الإشعارات المعلّقة من الأقدم للأحدث */
export async function pendingNotifications(limit: number): Promise<PendingNotification[]> {
  const rows = must(
    await db()
      .from("forsa_notifications")
      .select("id, phone, name, text, created_at")
      .eq("status", "pending")
      .order("id", { ascending: true })
      .limit(limit),
  );
  return rows ?? [];
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
