import "server-only";

import { createHash, randomBytes } from "node:crypto";

import { db, must } from "./supabase";
import type { Application, Family, Listing, ListingKind, Opportunity, Talent } from "./types";

/**
 * المخزن مستند JSON واحد في جدول forsa_store على Supabase، يكفي للنسخة الأولى.
 * عند التوسع يُستبدل بجداول منفصلة دون تغيير بقية التطبيق،
 * لأن الوصول للبيانات كله يمر عبر هذا الملف وملف data.ts.
 */

export type Report = {
  id: string;
  kind: ListingKind;
  listingId: string;
  reason: string;
  note?: string;
  createdAt: string;
  resolved?: boolean;
};

/** حساب صاحب الإعلانات: رقم واتساب سعودي (بصيغة 966501234567) أثبت ملكيته برمز دخول */
export type Account = {
  id: string;
  phone: string;
  createdAt: string;
  lastLoginAt?: string;
};

/** جهة تظهر في «شركاء النجاح» بصفحة «عن فرصة»، ويديرها فريق الإشراف */
export type Partner = {
  id: string;
  name: string;
  /** صفة قصيرة تحت الاسم: «الراعي الرسمي»، «التصميم» */
  role?: string;
  logo?: string;
  url?: string;
};

type Session = { accountId: string; createdAt: string; expiresAt: string };

type StoreShape = {
  talents: Talent[];
  families: Family[];
  opportunities: Opportunity[];
  accounts: Account[];
  /** مفتاح الجلسة (مُجزّأ) ← الحساب */
  sessions: Record<string, Session>;
  /**
   * روابط الإدارة من قبل الحسابات (مُجزّأة) ← الإعلان. لم نعد نُصدر روابط جديدة،
   * وكل رابط يُحذف حين يربط صاحبه الإعلان بحسابه.
   */
  owners: Record<string, { kind: ListingKind; id: string }>;
  reports: Report[];
  /** كم زائراً طلب وسائل التواصل لكل إعلان — يظهر لصاحبه فقط */
  reveals: Record<string, number>;
  applications: Application[];
  /** بدونها تظهر القائمة الافتراضية، والقائمة الفارغة تُخفي القسم */
  partners?: Partner[];
};

/** حد أعلى للبلاغات المفتوحة على الإعلان الواحد، حتى لا يكبر المستند بلا حدود */
const MAX_OPEN_REPORTS_PER_LISTING = 20;
/** عدد المحاولات إن كتب طلب آخر في المخزن بين قراءتنا وكتابتنا */
const MAX_WRITE_ATTEMPTS = 8;

const empty = (): StoreShape => ({
  talents: [],
  families: [],
  opportunities: [],
  accounts: [],
  sessions: {},
  owners: {},
  reports: [],
  reveals: {},
  applications: [],
});

async function load() {
  const row = must(await db().from("forsa_store").select("data, version").eq("id", 1).single());
  if (!row) throw new Error("[forsa] forsa_store row is missing; run supabase/migrations");
  return { store: { ...empty(), ...(row.data as Partial<StoreShape>) }, version: row.version as number };
}

export async function readStore(): Promise<StoreShape> {
  return (await load()).store;
}

/**
 * يقرأ المخزن ويعدّله ويكتبه بشرط ألا يكون تغيّر منذ قراءته (تحكم تفاؤلي بالتزامن).
 * إن سبقنا طلب آخر نعيد القراءة والتعديل من جديد، لذا يجب ألا يكون لـ fn أثر خارج المخزن.
 */
export async function mutateStore<T>(fn: (store: StoreShape) => T | Promise<T>): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    const { store, version } = await load();
    const result = await fn(store);
    const saved = must(await db().rpc("forsa_save", { p_data: store, p_version: version }));
    if (saved !== null) return result;
    if (attempt >= MAX_WRITE_ATTEMPTS) throw new Error("[forsa] store is busy, write abandoned");
    await new Promise((r) => setTimeout(r, 20 * attempt + Math.random() * 50));
  }
}

export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

/** معرّف بـ٦٤ بت عشوائي، بحروف صغيرة وأرقام فقط (يصلح للروابط وأسماء الملفات) */
export const newId = () => BigInt(`0x${randomBytes(8).toString("hex")}`).toString(36);

export const newToken = () => randomBytes(18).toString("base64url");

/** يحفظ إعلاناً جديداً ويرجع معرّفه */
export async function insertListing(listing: Listing) {
  return mutateStore((store) => {
    const list = collectionOf(store, listing.kind);
    // احتياط نادر جداً: لو تكرر المعرّف نولّد غيره قبل الحفظ
    while (list.some((l) => l.id === listing.id)) listing.id = newId();
    list.unshift(listing);
    return listing.id;
  });
}

/** الإعلان الذي يفتحه رابط إدارة قديم */
export async function findByLegacyLink(token: string) {
  const store = await readStore();
  const owner = store.owners[hashToken(token)];
  return owner ? (collectionOf(store, owner.kind).find((l) => l.id === owner.id) ?? null) : null;
}

export function collectionOf(store: StoreShape, kind: ListingKind): Listing[] {
  if (kind === "talent") return store.talents;
  if (kind === "family") return store.families;
  return store.opportunities;
}

/** إعلانات الحساب، الأحدث أولاً */
export function listingsOf(store: StoreShape, accountId: string): Listing[] {
  return [...store.talents, ...store.families, ...store.opportunities]
    .filter((l) => l.ownerId === accountId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** الإعلان إن كان هذا الحساب صاحبه، وإلا null */
export const ownedListing = (store: StoreShape, accountId: string, kind: ListingKind, id: string) =>
  collectionOf(store, kind).find((l) => l.id === id && l.ownerId === accountId) ?? null;

/**
 * يحذف الإعلان وما يتعلق به (عدد الطلبات، بلاغاته، رابطه القديم، والتقديمات عليه أو به)،
 * ويرجعه لتُحذف صوره بعد الحفظ
 */
export function removeListing(store: StoreShape, kind: ListingKind, id: string) {
  const list = collectionOf(store, kind);
  const index = list.findIndex((l) => l.id === id);
  if (index < 0) return null;
  const [listing] = list.splice(index, 1);
  for (const [key, owner] of Object.entries(store.owners)) {
    if (owner.kind === kind && owner.id === id) delete store.owners[key];
  }
  delete store.reveals[listingKey(kind, id)];
  for (const r of store.reports) if (r.kind === kind && r.listingId === id) r.resolved = true;
  store.applications = store.applications.filter((a) =>
    kind === "opportunity" ? a.opportunityId !== id : !(a.profile.kind === kind && a.profile.id === id),
  );
  return listing;
}

/** ملف المتقدم كما هو الآن (تعديلاته تظهر لصاحب الفرصة، وحذفه يحذف التقديم) */
export const profileOf = (store: StoreShape, profile: Application["profile"]) =>
  (collectionOf(store, profile.kind).find((l) => l.id === profile.id) as Talent | Family | undefined) ?? null;

export const listingKey = (kind: ListingKind, id: string) => `${kind}:${id}`;

export async function revealsOf(kind: ListingKind, id: string) {
  return (await readStore()).reveals[listingKey(kind, id)] ?? 0;
}

export async function countReveal(kind: ListingKind, id: string) {
  await mutateStore((store) => {
    const key = listingKey(kind, id);
    store.reveals[key] = (store.reveals[key] ?? 0) + 1;
  });
}

export async function addReport(report: Omit<Report, "id" | "createdAt">) {
  await mutateStore((store) => {
    const open = store.reports.filter(
      (r) => !r.resolved && r.kind === report.kind && r.listingId === report.listingId,
    ).length;
    if (open >= MAX_OPEN_REPORTS_PER_LISTING) return;
    store.reports.push({ ...report, id: newId(), createdAt: new Date().toISOString() });
  });
}
