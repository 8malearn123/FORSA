import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";

/**
 * إشراف بسيط للمبادرة: مفتاح واحد في متغير البيئة FORSA_ADMIN_KEY.
 * إن لم يُضبط المفتاح تبقى صفحة الإشراف معطّلة تماماً.
 */
export const ADMIN_COOKIE = "forsa_admin";

const secret = () => process.env.FORSA_ADMIN_KEY ?? "";

export const adminEnabled = () => secret().length >= 12;

/** قيمة الكوكي مشتقة من المفتاح، فلا نخزن المفتاح نفسه في المتصفح */
export const adminSession = () => createHmac("sha256", secret()).update("forsa-admin-session").digest("hex");

const same = (a: string, b: string) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

export const checkAdminKey = (key: string) => adminEnabled() && same(key, secret());

export async function isAdmin() {
  if (!adminEnabled()) return false;
  const value = (await cookies()).get(ADMIN_COOKIE)?.value ?? "";
  return same(value, adminSession());
}
