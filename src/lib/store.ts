import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

import type { Family, Listing, ListingKind, Opportunity, Talent } from "./types";

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

type StoreShape = {
  talents: Talent[];
  families: Family[];
  opportunities: Opportunity[];
  /** مفتاح الإدارة (مُجزّأ) ← الإعلان الذي يملكه */
  owners: Record<string, { kind: ListingKind; id: string }>;
  reports: Report[];
  /** كم زائراً طلب وسائل التواصل لكل إعلان — يظهر لصاحبه فقط */
  reveals: Record<string, number>;
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
  owners: {},
  reports: [],
  reveals: {},
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

export async function insertListing(listing: Listing) {
  const token = newToken();
  await mutateStore((store) => {
    const list = collectionOf(store, listing.kind);
    // احتياط نادر جداً: لو تكرر المعرّف نولّد غيره قبل الحفظ
    while (list.some((l) => l.id === listing.id)) listing.id = newId();
    list.unshift(listing);
    store.owners[hashToken(token)] = { kind: listing.kind, id: listing.id };
  });
  return token;
}

export async function findOwned(token: string) {
  const [listing] = await findOwnedMany([token]);
  return listing?.listing ?? null;
}

/** يبحث عن عدة روابط إدارة بقراءة واحدة للمخزن */
export async function findOwnedMany(tokens: string[]) {
  const store = await readStore();
  return tokens.flatMap((token) => {
    const owner = store.owners[hashToken(token)];
    const listing = owner ? collectionOf(store, owner.kind).find((l) => l.id === owner.id) : undefined;
    return listing ? [{ token, listing }] : [];
  });
}

export function collectionOf(store: StoreShape, kind: ListingKind): Listing[] {
  if (kind === "talent") return store.talents;
  if (kind === "family") return store.families;
  return store.opportunities;
}

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
