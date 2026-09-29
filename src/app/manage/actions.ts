"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";

import { collectionOf, hashToken, mutateStore } from "@/lib/store";
import { canRenew, imagesOf } from "@/lib/listing";
import type { Listing } from "@/lib/types";
import { discardImages } from "@/lib/uploads";

const OPS = ["hide", "show", "close", "reopen", "renew", "available", "busy"] as const;
type Op = (typeof OPS)[number];

function apply(listing: Listing, op: Op) {
  if (op === "hide") listing.hidden = true;
  if (op === "show") listing.hidden = false;
  if (listing.kind === "opportunity" && op === "close") listing.closed = true;
  if (listing.kind === "opportunity" && op === "reopen") listing.closed = false;
  // التجديد يعيد الفرصة لأعلى القائمة، ومسموح بعد مدة من آخر تجديد فقط
  if (listing.kind === "opportunity" && op === "renew" && !listing.closed && canRenew(listing)) {
    listing.renewedAt = new Date().toISOString();
  }
  if (listing.kind === "talent" && op === "available") listing.available = true;
  if (listing.kind === "talent" && op === "busy") listing.available = false;
}

/** كل عمليات الإدارة تتحقق من الرابط السري (مفتاح الإدارة) قبل أي تعديل */
export async function updateListing(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const op = String(formData.get("op") ?? "") as Op;
  if (!OPS.includes(op)) return;
  await mutateStore((store) => {
    const owner = store.owners[hashToken(token)];
    if (!owner) return;
    const listing = collectionOf(store, owner.kind).find((l) => l.id === owner.id);
    if (listing) apply(listing, op);
  });
  refresh();
}

export async function deleteListing(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  if (formData.get("confirm") !== "yes") return;
  const removed = await mutateStore((store) => {
    const key = hashToken(token);
    const owner = store.owners[key];
    if (!owner) return null;
    const list = collectionOf(store, owner.kind);
    const index = list.findIndex((l) => l.id === owner.id);
    const [listing] = index >= 0 ? list.splice(index, 1) : [];
    delete store.owners[key];
    return listing ?? null;
  });
  // حذف الصور المرفوعة مع الإعلان
  if (removed) await discardImages(imagesOf(removed));
  redirect("/join?deleted=1");
}
