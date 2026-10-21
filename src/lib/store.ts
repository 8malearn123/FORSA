import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

import type { Application, Family, Listing, ListingKind, Opportunity, Talent } from "./types";

/**
 * مخزن بسيط بملف JSON يكفي للنسخة الأولى على خادم واحد.
 * عند التوسع يُستبدل بقاعدة بيانات دون تغيير بقية التطبيق،
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
};

export const DATA_DIR = process.env.FORSA_DATA_DIR ?? path.join(process.cwd(), ".data");
export const UPLOADS_DIR = path.join(DATA_DIR, "uploads");
const STORE_FILE = path.join(DATA_DIR, "forsa.json");

/** حد أعلى للبلاغات المفتوحة على الإعلان الواحد، حتى لا يكبر الملف بلا حدود */
const MAX_OPEN_REPORTS_PER_LISTING = 20;

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

export async function readStore(): Promise<StoreShape> {
  try {
    const raw = await fs.readFile(STORE_FILE, "utf8");
    return { ...empty(), ...(JSON.parse(raw) as Partial<StoreShape>) };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return empty();
    throw error;
  }
}

/**
 * طابور الكتابة مشترك على مستوى العملية كلها (وليس لكل نسخة من هذا الملف)،
 * وكل كتابة تستخدم ملفاً مؤقتاً باسم فريد ثم تستبدل الملف الأصلي دفعة واحدة.
 */
const shared = globalThis as typeof globalThis & { __forsaWriteQueue?: Promise<unknown> };

export function mutateStore<T>(fn: (store: StoreShape) => T | Promise<T>): Promise<T> {
  const previous = shared.__forsaWriteQueue ?? Promise.resolve();
  const run = previous.then(async () => {
    const store = await readStore();
    const result = await fn(store);
    await fs.mkdir(DATA_DIR, { recursive: true });
    const tmp = `${STORE_FILE}.${process.pid}.${randomBytes(6).toString("hex")}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(store, null, 2), "utf8");
    await fs.rename(tmp, STORE_FILE);
    return result;
  });
  shared.__forsaWriteQueue = run.catch(() => undefined);
  return run;
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
