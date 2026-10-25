"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";

import { isApplicationStatus } from "@/lib/applications";
import { currentAccount, endSession, safeNext } from "@/lib/auth";
import { canRenew, imagesOf, isKind } from "@/lib/listing";
import { DAY, release, take } from "@/lib/rate-limit";
import {
  collectionOf,
  hashToken,
  listingsOf,
  mutateStore,
  newId,
  ownedListing,
  removeListing,
} from "@/lib/store";
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

function targetOf(formData: FormData) {
  const kind = formData.get("kind");
  const id = String(formData.get("id") ?? "");
  return isKind(kind) && id ? { kind, id } : null;
}

/** كل عمليات الإدارة تتحقق من الحساب ومن ملكيته للإعلان قبل أي تعديل */
export async function updateListing(formData: FormData) {
  const op = String(formData.get("op") ?? "") as Op;
  const target = targetOf(formData);
  const account = await currentAccount();
  if (!OPS.includes(op) || !target || !account) return;
  await mutateStore((store) => {
    const listing = ownedListing(store, account.id, target.kind, target.id);
    if (listing) apply(listing, op);
  });
  refresh();
}

export async function deleteListing(formData: FormData) {
  const target = targetOf(formData);
  const account = await currentAccount();
  if (formData.get("confirm") !== "yes" || !target || !account) return;
  const removed = await mutateStore((store) =>
    ownedListing(store, account.id, target.kind, target.id)
      ? removeListing(store, target.kind, target.id)
      : null,
  );
  // حذف الصور المرفوعة مع الإعلان
  if (removed) await discardImages(imagesOf(removed));
  redirect("/account?deleted=1");
}

export async function logout() {
  await endSession();
  redirect("/");
}

/** لمن دخل من جوال غيره ونسي الخروج */
export async function logoutEverywhere() {
  await endSession({ everywhere: true });
  redirect("/login?next=/account");
}

/** يحذف الحساب وكل إعلاناته وصورها، ويغلق كل أجهزته */
export async function deleteAccount(formData: FormData) {
  if (formData.get("confirm") !== "yes") return;
  const account = await currentAccount();
  if (!account) redirect("/login?next=/account");
  const removed = await mutateStore((store) => {
    const listings = listingsOf(store, account.id)
      .map((l) => removeListing(store, l.kind, l.id))
      .filter((l): l is Listing => l !== null);
    for (const [key, s] of Object.entries(store.sessions)) {
      if (s.accountId === account.id) delete store.sessions[key];
    }
    store.applications = store.applications.filter((a) => a.accountId !== account.id);
    store.accounts = store.accounts.filter((a) => a.id !== account.id);
    return listings;
  });
  await discardImages(removed.flatMap(imagesOf));
  await endSession();
  redirect("/join?deleted=account");
}

/**
 * يربط إعلاناً نُشر قبل الحسابات (برابط إدارة) بحساب من فتح الرابط،
 * ثم يتوقف الرابط عن العمل، فلا يبقى طريق لإدارة الإعلان إلا من الحساب.
 */
export async function claimListing(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const account = await currentAccount();
  if (!account) redirect(`/login?next=${encodeURIComponent(`/manage/${token}`)}`);
  const claimed = await mutateStore((store) => {
    const key = hashToken(token);
    const link = store.owners[key];
    const listing = link ? collectionOf(store, link.kind).find((l) => l.id === link.id) : undefined;
    if (!listing || (listing.ownerId && listing.ownerId !== account.id)) return null;
    listing.ownerId = account.id;
    delete store.owners[key];
    return listing;
  });
  redirect(claimed ? `/account/${claimed.kind}/${claimed.id}?claimed=1` : "/account");
}

/* ─────────────── التقديم على الفرص ─────────────── */

export type ApplyState = { error?: string };

/** حد التقديم لكل حساب في اليوم، حتى لا تُغرق الفرص برسائل عشوائية */
const APPLIES_PER_DAY = process.env.NODE_ENV === "production" ? 30 : 300;

const APPLY_ERRORS = {
  missing: "هذه الفرصة لم تعد تستقبل التقديم.",
  closed: "اكتملت هذه الفرصة وأغلقها صاحبها.",
  own: "هذه فرصتك، ولا يمكنك التقديم عليها.",
  profile: "اختر أحد ملفاتك لتقدّم به.",
} as const;

/**
 * التقديم بأحد ملفات الحساب (ملف موهبة أو صفحة أسرة)، مع رسالة قصيرة اختيارية.
 * تقديم واحد لكل حساب على الفرصة، ولا يُقبل على فرصة مغلقة أو على فرصة صاحبها نفسه.
 */
export async function applyToOpportunity(_prev: ApplyState, formData: FormData): Promise<ApplyState> {
  const opportunityId = String(formData.get("opportunity") ?? "").slice(0, 80);
  const account = await currentAccount();
  if (!account) redirect(`/login?next=${encodeURIComponent(`/opportunities/${opportunityId}`)}`);
  const [kind, id = ""] = String(formData.get("profile") ?? "").split(":");
  if (kind !== "talent" && kind !== "family") return { error: APPLY_ERRORS.profile };
  const message =
    String(formData.get("message") ?? "")
      .replace(/\r\n?/g, "\n")
      .trim()
      .slice(0, 500) || undefined;

  const key = `apply:${account.id}`;
  if (!(await take(key, APPLIES_PER_DAY, DAY)))
    return { error: "قدّمت على فرص كثيرة اليوم. حاول مرة أخرى غداً." };
  const result = await mutateStore((store) => {
    const opportunity = store.opportunities.find((o) => o.id === opportunityId);
    if (!opportunity?.apply || opportunity.hidden || opportunity.moderated || opportunity.pending)
      return "missing";
    if (opportunity.closed) return "closed";
    if (opportunity.ownerId === account.id) return "own";
    // من قدّم من قبل لا يُكرر تقديمه
    if (store.applications.some((a) => a.opportunityId === opportunityId && a.accountId === account.id)) {
      return "done";
    }
    const profile = ownedListing(store, account.id, kind, id);
    if (!profile || profile.moderated) return "profile";
    store.applications.push({
      id: newId(),
      opportunityId,
      accountId: account.id,
      profile: { kind, id },
      message,
      status: "new",
      createdAt: new Date().toISOString(),
    });
    return "done";
  });
  if (result !== "done") {
    await release(key);
    return { error: APPLY_ERRORS[result] };
  }
  redirect(`/opportunities/${opportunityId}?applied=1#apply`);
}

/** يسحب المتقدم تقديمه، فيختفي من قائمة صاحب الفرصة */
export async function withdrawApplication(formData: FormData) {
  const id = String(formData.get("application") ?? "");
  const account = await currentAccount();
  if (!account) return;
  await mutateStore((store) => {
    store.applications = store.applications.filter((a) => !(a.id === id && a.accountId === account.id));
  });
  redirect(safeNext(formData.get("back")));
}

/** فرز المتقدم: ترشيح، أو استبعاد، أو إعادة للفرز. لصاحب الفرصة فقط */
export async function setApplicationStatus(formData: FormData) {
  const id = String(formData.get("application") ?? "");
  const status = formData.get("status");
  const account = await currentAccount();
  if (!account || !isApplicationStatus(status)) return;
  await mutateStore((store) => {
    const application = store.applications.find((a) => a.id === id);
    if (application && ownedListing(store, account.id, "opportunity", application.opportunityId)) {
      application.status = status;
    }
  });
  refresh();
}
