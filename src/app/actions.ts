"use server";

import { getFamily, getOpportunity, getTalent } from "@/lib/data";
import { contactChannels, type ContactChannel } from "@/lib/contact";
import { titleOf } from "@/lib/listing";
import { DAY, HOUR, release, take, visitorKey } from "@/lib/rate-limit";
import { addReport, countReveal, findOwnedMany, listingKey } from "@/lib/store";
import type { Listing, ListingKind } from "@/lib/types";

const KINDS: ListingKind[] = ["talent", "family", "opportunity"];

async function findListing(kind: unknown, id: unknown): Promise<Listing | null> {
  if (!KINDS.includes(kind as ListingKind) || typeof id !== "string" || id.length > 80) return null;
  if (kind === "talent") return getTalent(id);
  if (kind === "family") return getFamily(id);
  return getOpportunity(id);
}

export type RevealResult =
  | { status: "ok"; channels: ContactChannel[] }
  | { status: "demo" }
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
  if (listing.seed) return { status: "demo" };
  if (listing.kind === "opportunity" && listing.closed) return { status: "closed" };
  const visitor = await visitorKey();
  const key = listingKey(listing.kind, listing.id);
  const onceKey = `reveal-once:${visitor}:${key}`;
  const firstToday = take(onceKey, 1, DAY);
  if (firstToday && !take(`reveal:${visitor}`, 30, HOUR)) {
    release(onceKey);
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
  if (!take(`report-once:${visitor}:${key}`, 1, DAY)) return { status: "done" };
  if (!take(`report:${visitor}`, 10, HOUR)) {
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
  return { status: "done" };
}

export type MyListing = {
  token: string;
  kind: ListingKind;
  title: string;
  hidden: boolean;
  closed: boolean;
};

/**
 * «إعلاناتي على هذا الجهاز»: يتحقق من روابط الإدارة المحفوظة في المتصفح
 * ويرجع أقل قدر من المعلومات لعرضها لصاحبها فقط.
 */
export async function lookupMyListings(tokens: unknown): Promise<MyListing[]> {
  if (!Array.isArray(tokens)) return [];
  if (!take(`mine:${await visitorKey()}`, 30, HOUR)) return [];
  const valid = tokens
    .filter((t): t is string => typeof t === "string" && /^[\w-]{16,64}$/.test(t))
    .slice(0, 20);
  return (await findOwnedMany(valid)).map(({ token, listing }) => ({
    token,
    kind: listing.kind,
    title: titleOf(listing),
    hidden: Boolean(listing.hidden || listing.moderated),
    closed: listing.kind === "opportunity" && Boolean(listing.closed),
  }));
}
