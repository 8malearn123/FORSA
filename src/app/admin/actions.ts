"use server";

import { cookies } from "next/headers";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";

import { ADMIN_COOKIE, adminSession, checkAdminKey, isAdmin } from "@/lib/admin";
import { collectionOf, mutateStore, removeListing } from "@/lib/store";
import { imagesOf, isKind } from "@/lib/listing";
import { discardImages } from "@/lib/uploads";

export type LoginState = { error?: string };

export async function adminLogin(_prev: LoginState, formData: FormData): Promise<LoginState> {
  if (!checkAdminKey(String(formData.get("key") ?? ""))) return { error: "المفتاح غير صحيح." };
  (await cookies()).set(ADMIN_COOKIE, adminSession(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  redirect("/admin");
}

export async function adminLogout() {
  (await cookies()).delete(ADMIN_COOKIE);
  redirect("/");
}

/** إجراءات الإشراف: إخفاء، إظهار، حذف إعلان، أو إغلاق بلاغ */
export async function moderate(formData: FormData) {
  if (!(await isAdmin())) return;
  const op = String(formData.get("op") ?? "");
  const kind = formData.get("kind");
  const id = String(formData.get("id") ?? "");
  const reportId = String(formData.get("report") ?? "");

  const removed = await mutateStore((store) => {
    if (reportId) {
      const report = store.reports.find((r) => r.id === reportId);
      if (report) report.resolved = true;
    }
    if (!isKind(kind) || !id) return null;
    if (op === "delete") return removeListing(store, kind, id);
    const listing = collectionOf(store, kind).find((l) => l.id === id);
    // إخفاء الإشراف علامة مستقلة عن إخفاء صاحب الإعلان، ولا يستطيع صاحبه إلغاءها
    if (listing && op === "hide") listing.moderated = true;
    if (listing && op === "show") listing.moderated = false;
    return null;
  });
  if (removed) await discardImages(imagesOf(removed));
  refresh();
}
