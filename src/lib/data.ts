import "server-only";

import { connection } from "next/server";
import { cache } from "react";

import { areasOf, freshSince, inArea, isStale } from "./listing";
import { rank } from "./search";
import { readStore } from "./store";
import { GOVERNORATES, type GovernorateSlug } from "./taxonomy";
import type { Family, Listing, Opportunity, Talent } from "./types";

const newestFirst = (a: Listing, b: Listing) => b.createdAt.localeCompare(a.createdAt);
const visible = <T extends Listing>(l: T) => !l.hidden && !l.moderated && !l.pending;

/** كل البيانات مرة واحدة لكل طلب */
const loadAll = cache(async () => {
  await connection();
  const store = await readStore();
  return {
    talents: store.talents.filter(visible).sort(newestFirst) as Talent[],
    families: store.families.filter(visible).sort(newestFirst) as Family[],
    opportunities: store.opportunities.filter(visible).sort(newestFirst) as Opportunity[],
  };
});

export type TalentFilters = { q?: string; area?: string; category?: string; seeking?: string };
export type FamilyFilters = { q?: string; area?: string; category?: string; events?: boolean };
export type OpportunityFilters = { q?: string; area?: string; category?: string; type?: string };

export async function listTalents(f: TalentFilters = {}) {
  const { talents } = await loadAll();
  const filtered = talents.filter(
    (t) =>
      (!f.area || t.governorate === f.area) &&
      (!f.category || t.category === f.category) &&
      (!f.seeking || t.seeking.includes(f.seeking as Talent["seeking"][number])),
  );
  return rank(filtered, f.q);
}

export async function listFamilies(f: FamilyFilters = {}) {
  const { families } = await loadAll();
  const filtered = families.filter(
    (fam) =>
      (!f.area || fam.governorate === f.area) &&
      (!f.category || fam.categories.includes(f.category as Family["categories"][number])) &&
      (!f.events || Boolean(fam.events)),
  );
  return rank(filtered, f.q);
}

export async function listOpportunities(f: OpportunityFilters = {}) {
  const { opportunities } = await loadAll();
  const filtered = opportunities.filter(
    (o) =>
      (!f.area || inArea(o, f.area)) &&
      (!f.category || o.category === f.category) &&
      (!f.type || o.type === f.type),
  );
  // الفرص الحديثة أولاً، ثم التي قد تكون انتهت، ثم المكتملة
  const now = Date.now();
  const group = (o: Opportunity) => (o.closed ? 2 : isStale(o, now) ? 1 : 0);
  const ranked = rank(filtered, f.q);
  const byQuery = new Map(ranked.map((o, i) => [o, i]));
  return ranked.sort(
    (a, b) =>
      group(a) - group(b) ||
      (f.q ? byQuery.get(a)! - byQuery.get(b)! : freshSince(b).localeCompare(freshSince(a))),
  );
}

/**
 * البحث الموحّد يرتّب الأنواع الثلاثة معاً: إن وُجدت نتائج تطابق كل الكلمات في أي قسم،
 * لا نعرض نتائج تقريبية في الأقسام الأخرى.
 */
export async function searchEverything(q: string | undefined, area?: string) {
  const [talents, families, opportunities] = await Promise.all([
    listTalents({ area }),
    listFamilies({ area }),
    listOpportunities({ area }),
  ]);
  const ranked = rank<Listing>([...opportunities, ...talents, ...families], q);
  const now = Date.now();
  const group = (o: Opportunity) => (o.closed ? 2 : isStale(o, now) ? 1 : 0);
  return {
    talents: ranked.filter((l): l is Talent => l.kind === "talent"),
    families: ranked.filter((l): l is Family => l.kind === "family"),
    opportunities: ranked
      .filter((l): l is Opportunity => l.kind === "opportunity")
      .sort((a, b) => group(a) - group(b)),
  };
}

export async function getTalent(id: string) {
  const { talents } = await loadAll();
  return talents.find((t) => t.id === id) ?? null;
}

export async function getFamily(id: string) {
  const { families } = await loadAll();
  return families.find((f) => f.id === id) ?? null;
}

export async function getOpportunity(id: string) {
  const { opportunities } = await loadAll();
  return opportunities.find((o) => o.id === id) ?? null;
}

export async function getStats() {
  const { talents, families, opportunities } = await loadAll();
  const open = opportunities.filter((o) => !o.closed);
  const byArea = Object.fromEntries(GOVERNORATES.map((g) => [g.slug, 0])) as Record<GovernorateSlug, number>;
  for (const l of [...talents, ...families, ...open]) for (const a of areasOf(l)) byArea[a] += 1;
  return {
    talents: talents.length,
    families: families.length,
    products: families.reduce((n, f) => n + f.products.length, 0),
    opportunities: open.length,
    byArea,
  };
}

/** مقترحات مشابهة: نفس التصنيف أولاً ثم نفس المحافظة */
export function similarTo<T extends Listing>(
  item: T,
  pool: T[],
  sameCategory: (a: T, b: T) => boolean,
  limit = 3,
) {
  return pool
    .filter((p) => p.id !== item.id && !(p.kind === "opportunity" && p.closed))
    .map((p) => ({
      p,
      s: (sameCategory(item, p) ? 2 : 0) + (areasOf(p).some((a) => inArea(item, a)) ? 1 : 0),
    }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map((x) => x.p);
}
