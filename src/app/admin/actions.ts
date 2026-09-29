"use server";

import { cookies } from "next/headers";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";

import { ADMIN_COOKIE, adminSession, checkAdminKey, isAdmin } from "@/lib/admin";
import { collectionOf, listingKey, mutateStore } from "@/lib/store";
import { imagesOf } from "@/lib/listing";
import type { ListingKind } from "@/lib/types";
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

const KINDS: ListingKind[] = ["talent", "family", "opportunity"];

/** إجراءات الإشراف: إخفاء، إظهار، حذف إعلان، أو إغلاق بلاغ */
export async function moderate(formData: FormData) {
  if (!(await isAdmin())) return;
  const op = String(formData.get("op") ?? "");
  const kind = String(formData.get("kind") ?? "") as ListingKind;
  const id = String(formData.get("id") ?? "");
  const reportId = String(formData.get("report") ?? "");

  const removed = await mutateStore((store) => {
    if (reportId) {
      const report = store.reports.find((r) => r.id === reportId);
      if (report) report.resolved = true;
    }
    if (!KINDS.includes(kind) || !id) return null;
    const list = collectionOf(store, kind);
    const index = list.findIndex((l) => l.id === id);
    if (index < 0) return null;
    // إخفاء الإشراف علامة مستقلة عن إخفاء صاحب الإعلان، ولا يستطيع صاحبه إلغاءها
    if (op === "hide") list[index].moderated = true;
    if (op === "show") list[index].moderated = false;
    if (op === "delete") {
      const [listing] = list.splice(index, 1);
      for (const [token, owner] of Object.entries(store.owners)) {
        if (owner.kind === kind && owner.id === id) delete store.owners[token];
      }
      delete store.reveals[listingKey(kind, id)];
      for (const r of store.reports) if (r.kind === kind && r.listingId === id) r.resolved = true;
      return listing;
    }
    return null;
  });
  if (removed) await discardImages(imagesOf(removed));
  refresh();
}
