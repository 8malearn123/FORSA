import type { Family, Listing, ListingKind, Opportunity } from "./types";

export const KINDS: ListingKind[] = ["talent", "family", "opportunity"];

export const isKind = (value: unknown): value is ListingKind => KINDS.includes(value as ListingKind);

/** معرّف إعلان صالح للروابط: حروف لاتينية صغيرة وأرقام (وشرطات في الأمثلة التجريبية) */
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
