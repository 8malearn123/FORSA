import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";

import { currentAccount } from "./auth";
import { normalizeSaudiMobile } from "./text";

/**
 * إشراف بسيط للمبادرة بطريقتين: أرقام فريق «فرصة» في FORSA_ADMIN_PHONES (تدخل بتسجيل الدخول العادي)،
 * أو مفتاح واحد في FORSA_ADMIN_KEY. إن لم يُضبط أي منهما تبقى صفحة الإشراف معطّلة تماماً.
 */
export const ADMIN_COOKIE = "forsa_admin";

const secret = () => process.env.FORSA_ADMIN_KEY ?? "";

export const adminKeyEnabled = () => secret().length >= 12;

/** أرقام المشرفين بصيغة 966501234567، مفصولة بفواصل في متغير البيئة */
export const adminPhones = () =>
  (process.env.FORSA_ADMIN_PHONES ?? "")
    .split(",")
    .map((p) => normalizeSaudiMobile(p))
    .filter((p): p is string => p !== null);

export const adminEnabled = () => adminKeyEnabled() || adminPhones().length > 0;

/** قيمة الكوكي مشتقة من المفتاح، فلا نخزن المفتاح نفسه في المتصفح */
export const adminSession = () => createHmac("sha256", secret()).update("forsa-admin-session").digest("hex");

const same = (a: string, b: string) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

export const checkAdminKey = (key: string) => adminKeyEnabled() && same(key, secret());

/** كيف دخل المشرف: برقم من أرقام الفريق، أو بالمفتاح، أو null إن لم يكن مشرفاً */
export async function adminVia(): Promise<"phone" | "key" | null> {
  const account = await currentAccount();
  if (account && adminPhones().includes(account.phone)) return "phone";
  if (!adminKeyEnabled()) return null;
  const value = (await cookies()).get(ADMIN_COOKIE)?.value ?? "";
  return same(value, adminSession()) ? "key" : null;
}

export const isAdmin = async () => (await adminVia()) !== null;
