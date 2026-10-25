"use server";

import { getFamily, getOpportunity, getTalent } from "@/lib/data";
import { contactChannels, type ContactChannel } from "@/lib/contact";
import { after } from "next/server";

import { isKind, KIND_NAME, pathOf, REASON_NAME, titleOf } from "@/lib/listing";
import { notifyAdmins, siteLink } from "@/lib/notifications";
import { DAY, HOUR, release, take, visitorKey } from "@/lib/rate-limit";
import { addReport, countReveal, listingKey } from "@/lib/store";
import type { Listing, ListingKind } from "@/lib/types";

async function findListing(kind: unknown, id: unknown): Promise<Listing | null> {
  if (!isKind(kind) || typeof id !== "string" || id.length > 80) return null;
  if (kind === "talent") return getTalent(id);
  if (kind === "family") return getFamily(id);
  return getOpportunity(id);
}

export type RevealResult =
  | { status: "ok"; channels: ContactChannel[] }
  | { status: "closed" }
  | { status: "limited" }
  | { status: "missing" };

/**
 * بيانات التواصل لا تُرسل مع الصفحة، بل عند طلب الزائر فقط، وبحد أقصى لكل زائر،
 * حتى لا تجمعها برامج الزحف بسهولة. ويُحسب الزائر مرة واحدة يومياً لكل إعلان.
 */
export async function revealContact(kind: ListingKind, id: string): Promise<RevealResult> {
  const listing = await findListing(kind, id);
  if (!listing) return { status: "missing" };
  if (listing.kind === "opportunity" && listing.closed) return { status: "closed" };
  const visitor = await visitorKey();
  const key = listingKey(listing.kind, listing.id);
  const onceKey = `reveal-once:${visitor}:${key}`;
  const firstToday = await take(onceKey, 1, DAY);
  if (firstToday && !(await take(`reveal:${visitor}`, 30, HOUR))) {
    await release(onceKey);
    return { status: "limited" };
  }
  if (firstToday) await countReveal(listing.kind, listing.id);
  return { status: "ok", channels: contactChannels(listing.contact, titleOf(listing)) };
}

const REASONS = ["wrong-info", "inappropriate", "scam", "expired", "other"] as const;

export type ReportState = { status: "idle" | "done" | "error"; message?: string };

export async function reportListing(_prev: ReportState, formData: FormData): Promise<ReportState> {
  const reason = formData.get("reason");
  if (!REASONS.includes(reason as (typeof REASONS)[number])) {
    return { status: "error", message: "اختر سبب البلاغ من فضلك." };
  }
  const listing = await findListing(formData.get("kind"), formData.get("id"));
  if (!listing) return { status: "error", message: "هذا الإعلان لم يعد متاحاً، شكراً لاهتمامك." };

  const visitor = await visitorKey();
  const key = listingKey(listing.kind, listing.id);
  // بلاغ واحد يومياً من كل زائر على الإعلان نفسه يكفي، والتكرار يُقبل بصمت
  if (!(await take(`report-once:${visitor}:${key}`, 1, DAY))) return { status: "done" };
  if (!(await take(`report:${visitor}`, 10, HOUR))) {
    return { status: "error", message: "أرسلت بلاغات كثيرة خلال وقت قصير. حاول مرة أخرى لاحقاً." };
  }
  const note = String(formData.get("note") ?? "")
    .replace(/\r\n/g, "\n")
    .trim()
    .slice(0, 500);
  await addReport({
    kind: listing.kind,
    listingId: listing.id,
    reason: String(reason),
    note: note || undefined,
  });
  after(() =>
    notifyAdmins(
      [
        "🚩 بلاغ جديد في فرصة",
        `${KIND_NAME[listing.kind]}: ${titleOf(listing)}`,
        `السبب: ${REASON_NAME[String(reason)] ?? reason}`,
        ...(note ? [`ملاحظة: ${note}`] : []),
        `الإعلان: ${siteLink(pathOf(listing))}`,
        `الإشراف: ${siteLink("/admin")}`,
      ].join("\n"),
    ),
  );
  return { status: "done" };
}
