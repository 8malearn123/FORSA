"use server";

import { cookies } from "next/headers";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";

import { ADMIN_COOKIE, adminSession, checkAdminKey, isAdmin } from "@/lib/admin";
import { imagesOf, isKind } from "@/lib/listing";
import { DEFAULT_PARTNERS } from "@/lib/partners";
import { collectionOf, mutateStore, newId, removeListing } from "@/lib/store";
import { discardImages, saveImage, UploadError } from "@/lib/uploads";

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

/** إجراءات الإشراف: إخفاء، إظهار، موافقة على فرصة معلّقة أو رفضها، حذف إعلان، أو إغلاق بلاغ */
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
    // فرصة علّقتها المراجعة الآلية: الموافقة تنشرها، والرفض يخفيها كأي إعلان أخفاه الإشراف
    if (listing && op === "approve") delete listing.pending;
    if (listing && op === "reject") {
      delete listing.pending;
      listing.moderated = true;
    }
    return null;
  });
  if (removed) await discardImages(imagesOf(removed));
  refresh();
}

/* ─────────────── شركاء النجاح ─────────────── */

export type PartnerState = { error?: string; ok?: boolean };

const field = (fd: FormData, name: string) => String(fd.get(name) ?? "").trim();

/** رابط موقع الجهة: http أو https فقط، ونضيف https إن كُتب بدونها */
function cleanUrl(value: string) {
  if (!value) return undefined;
  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}

/** يضيف جهة جديدة، أو يعدّل جهة موجودة إن أُرسل معرّفها */
export async function savePartner(_prev: PartnerState, fd: FormData): Promise<PartnerState> {
  if (!(await isAdmin())) return { error: "انتهت جلسة الإشراف، ادخل من جديد." };
  const id = field(fd, "id");
  const name = field(fd, "name");
  const role = field(fd, "role");
  const url = cleanUrl(field(fd, "url"));
  if (name.length < 2 || name.length > 60) return { error: "الاسم من ٢ إلى ٦٠ حرفاً." };
  if (role.length > 40) return { error: "الصفة حتى ٤٠ حرفاً." };
  if (url === null) return { error: "الرابط غير صحيح." };

  let logo: string | undefined;
  try {
    logo = await saveImage(fd.get("logo"), { side: 800 });
  } catch (error) {
    return { error: error instanceof UploadError ? error.message : "تعذّر رفع الشعار." };
  }
  const removeLogo = fd.get("removeLogo") === "on";

  let previous: string | null | undefined;
  try {
    previous = await mutateStore((store) => {
      const partners = (store.partners ??= structuredClone(DEFAULT_PARTNERS));
      const existing = id ? partners.find((p) => p.id === id) : undefined;
      // حذفها مشرف آخر قبل الحفظ
      if (id && !existing) return null;
      const partner = existing ?? { id: newId(), name };
      const old = partner.logo;
      partner.name = name;
      partner.role = role || undefined;
      partner.url = url;
      if (logo || removeLogo) partner.logo = logo;
      if (!existing) partners.push(partner);
      return logo || removeLogo ? old : undefined;
    });
  } catch (error) {
    console.error("[forsa] save partner failed", error);
    if (logo) await discardImages([logo]);
    return { error: "تعذّر الحفظ، حاول مرة أخرى." };
  }
  if (previous === null) {
    if (logo) await discardImages([logo]);
    refresh();
    return { error: "هذه الجهة حُذفت." };
  }
  if (previous) await discardImages([previous]);
  refresh();
  return { ok: true };
}

/** ترتيب الجهات أو حذف إحداها */
export async function partnerOp(fd: FormData) {
  if (!(await isAdmin())) return;
  const op = field(fd, "op");
  const id = field(fd, "id");
  const removed = await mutateStore((store) => {
    const partners = (store.partners ??= structuredClone(DEFAULT_PARTNERS));
    const index = partners.findIndex((p) => p.id === id);
    if (index < 0) return undefined;
    if (op === "delete") return partners.splice(index, 1)[0];
    const to = op === "up" ? index - 1 : op === "down" ? index + 1 : index;
    if (to >= 0 && to < partners.length) [partners[index], partners[to]] = [partners[to], partners[index]];
    return undefined;
  });
  if (removed?.logo) await discardImages([removed.logo]);
  refresh();
}
