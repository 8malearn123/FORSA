import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { hashToken, mutateStore, newId, newToken, readStore, type Account } from "./store";

/**
 * الحسابات: الدخول برقم واتساب ورمز يصل إليه (otp.ts)، بلا كلمات مرور.
 * الجلسة مفتاح عشوائي في كوكي httpOnly، ونخزن بصمته فقط.
 */
const COOKIE = "forsa_session";
const HOUR_MS = 3_600_000;
/** «تذكّرني» شهران. وبدونه تنتهي الجلسة بعد ١٢ ساعة، لأن الجوال قد يكون مشتركاً في العائلة */
export const SESSION_HOURS = { remember: 60 * 24, short: 12 };
/** أقصى عدد للأجهزة المفتوحة على الحساب الواحد؛ الأقدم يُغلق أولاً */
const MAX_SESSIONS = 10;

/** الحساب الذي دخل من هذا المتصفح، أو null. تُقرأ مرة واحدة لكل طلب */
export const currentAccount = cache(async (): Promise<Account | null> => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const store = await readStore();
  const session = store.sessions[hashToken(token)];
  if (!session || Date.parse(session.expiresAt) <= Date.now()) return null;
  return store.accounts.find((a) => a.id === session.accountId) ?? null;
});

/** للصفحات التي تحتاج حساباً: من لم يدخل يذهب لصفحة الدخول ثم يعود إليها */
export async function requireAccount(returnTo: string) {
  const account = await currentAccount();
  if (!account) redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  return account;
}

/** نرجع بعد الدخول لمسار داخل الموقع فقط، حتى لا يُستغل رابط الدخول للتحويل إلى موقع آخر */
export function safeNext(value: unknown, fallback = "/account") {
  const next = typeof value === "string" ? value : "";
  return next.length <= 300 && /^\/(?![/\\])[^\s\\]*$/.test(next) && !next.startsWith("/login")
    ? next
    : fallback;
}

/** ينشئ الحساب عند أول دخول، ثم يفتح جلسة على هذا الجهاز */
export async function startSession(phone: string, remember: boolean) {
  const token = newToken();
  const now = Date.now();
  const hours = remember ? SESSION_HOURS.remember : SESSION_HOURS.short;
  await mutateStore((store) => {
    let account = store.accounts.find((a) => a.phone === phone);
    if (!account) {
      account = { id: newId(), phone, createdAt: new Date(now).toISOString() };
      store.accounts.push(account);
    }
    account.lastLoginAt = new Date(now).toISOString();
    const accountId = account.id;

    for (const [key, s] of Object.entries(store.sessions)) {
      if (Date.parse(s.expiresAt) <= now) delete store.sessions[key];
    }
    store.sessions[hashToken(token)] = {
      accountId,
      createdAt: new Date(now).toISOString(),
      expiresAt: new Date(now + hours * HOUR_MS).toISOString(),
    };
    const open = Object.entries(store.sessions)
      .filter(([, s]) => s.accountId === accountId)
      .sort(([, a], [, b]) => b.createdAt.localeCompare(a.createdAt));
    for (const [key] of open.slice(MAX_SESSIONS)) delete store.sessions[key];
  });
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    // بدون «تذكّرني» تُحذف الكوكي بإغلاق المتصفح، والخادم يرفضها بعد ١٢ ساعة على أي حال
    maxAge: remember ? hours * 3600 : undefined,
  });
}

/** الخروج من هذا الجهاز، أو من كل الأجهزة المفتوحة على الحساب */
export async function endSession({ everywhere = false } = {}) {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) {
    const key = hashToken(token);
    await mutateStore((store) => {
      const accountId = store.sessions[key]?.accountId;
      for (const [k, s] of Object.entries(store.sessions)) {
        if (k === key || (everywhere && s.accountId === accountId)) delete store.sessions[k];
      }
    });
  }
  jar.delete(COOKIE);
}
