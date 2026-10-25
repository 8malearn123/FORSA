import { COUNT, countLabel } from "./format";
import { GOVERNORATES, governorateName, type GovernorateSlug } from "./taxonomy";
import type { Family, Listing, ListingKind, Opportunity } from "./types";

export const KINDS: ListingKind[] = ["talent", "family", "opportunity"];

export const isKind = (value: unknown): value is ListingKind => KINDS.includes(value as ListingKind);

/** معرّف إعلان صالح للروابط: حروف لاتينية صغيرة وأرقام وشرطات */
export const isListingId = (value: unknown): value is string =>
  typeof value === "string" && /^[a-z0-9-]{1,60}$/.test(value);

export const KIND_NAME: Record<ListingKind, string> = {
  talent: "ملف موهبة",
  family: "صفحة أسرة منتجة",
  opportunity: "فرصة",
};

/** أسباب البلاغ كما تظهر للفريق */
export const REASON_NAME: Record<string, string> = {
  "wrong-info": "معلومات غير صحيحة",
  inappropriate: "محتوى غير لائق",
  scam: "احتيال أو طلب مبالغ",
  expired: "منتهٍ أو مكرر",
  other: "سبب آخر",
};

/** بعد هذه المدة دون تجديد تُعلَّم الفرصة بأنها «قد تكون انتهت» */
export const STALE_DAYS = 30;
/** لا يظهر زر التجديد إلا بعد هذه المدة، حتى لا تُستغل لإبقاء الفرصة في الأعلى */
export const RENEW_AFTER_DAYS = 7;

const DAY = 86_400_000;

/** تاريخ حداثة الفرصة: آخر تجديد أو تاريخ النشر */
export const freshSince = (o: Opportunity) => o.renewedAt ?? o.createdAt;

export const ageInDays = (o: Opportunity, now = Date.now()) => (now - Date.parse(freshSince(o))) / DAY;

export const isStale = (o: Opportunity, now = Date.now()) => !o.closed && ageInDays(o, now) > STALE_DAYS;

export const canRenew = (o: Opportunity, now = Date.now()) => ageInDays(o, now) >= RENEW_AFTER_DAYS;

/** المحافظات التي يشملها الإعلان: الفرصة قد تشمل أكثر من محافظة، وبقية الإعلانات في محافظة واحدة */
export const areasOf = (listing: Listing): GovernorateSlug[] =>
  listing.kind === "opportunity" && listing.areas?.length ? listing.areas : [listing.governorate];

export const inArea = (listing: Listing, area: string) => areasOf(listing).some((a) => a === area);

/**
 * اسم مكان الإعلان: «صبيا»، «صبيا، جازان»، أو مختصراً «صبيا و٣ محافظات أخرى».
 * full يذكر كل المحافظات، لصفحة الفرصة.
 */
export function areasName(listing: Listing, { full = false } = {}) {
  const areas = areasOf(listing);
  if (areas.length >= GOVERNORATES.length) return "كل محافظات منطقة جازان";
  if (full || areas.length <= 2) return areas.map(governorateName).join("، ");
  return `${governorateName(areas[0])} و${countLabel(areas.length - 1, COUNT.otherArea)}`;
}

/** صورة الأسرة: الغلاف إن وُجد، وإلا أول صورة منتج */
export const coverOf = (family: Family) => family.cover ?? family.products.find((p) => p.image)?.image;

/** كل الصور المرفوعة المرتبطة بإعلان (لحذفها معه) */
export const imagesOf = (listing: Listing) =>
  listing.kind === "talent"
    ? listing.work.map((w) => w.image)
    : listing.kind === "family"
      ? [listing.cover, ...listing.products.map((p) => p.image)]
      : [];

export const titleOf = (listing: Listing) => (listing.kind === "opportunity" ? listing.title : listing.name);

export const pathOf = (listing: Listing) =>
  listing.kind === "talent"
    ? `/talents/${listing.id}`
    : listing.kind === "family"
      ? `/families/${listing.id}`
      : `/opportunities/${listing.id}`;
