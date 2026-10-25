import "server-only";

import { formatNumber as n } from "./format";
import { monthOf, readStore } from "./store";

type Store = Awaited<ReturnType<typeof readStore>>;

export type ReportTile = {
  label: string;
  value: number;
  /** الزيادة في الشهر الحالي */
  month?: number;
  note?: string;
};

/** أرقام لوحة الإشراف كلها، من المخزن مباشرة */
export function reportsOf(store: Store) {
  const month = monthOf();
  const thisMonth = (items: { createdAt: string }[]) =>
    items.filter((i) => monthOf(i.createdAt) === month).length;
  const counter = (name: string) => store.counters?.[name] ?? 0;

  // الشركات والجهات: كل حساب نشر باسم شركة أو جهة يُحسب مرة واحدة
  const businesses = new Map<string, "company" | "organization">();
  for (const o of store.opportunities) {
    if (o.poster.type === "individual") continue;
    businesses.set(o.ownerId ?? `name:${o.poster.name}`, o.poster.type);
  }
  const companies = [...businesses.values()].filter((t) => t === "company").length;

  const jobs = store.opportunities.filter((o) => o.type === "job");
  const jobIds = new Set(jobs.map((o) => o.id));
  const jobApplications = store.applications.filter((a) => jobIds.has(a.opportunityId));

  // طلبات إظهار وسائل التواصل قبل تتبّع الواتساب، لكل نوع
  const reveals = (kind: string) =>
    Object.entries(store.reveals)
      .filter(([key]) => key.startsWith(`${kind}:`))
      .reduce((sum, [, v]) => sum + v, 0);

  return {
    people: [
      {
        label: "المستخدمون",
        value: store.accounts.length,
        month: thisMonth(store.accounts),
        note: "حسابات سجّلت برقم واتساب",
      },
      { label: "الأسر المنتجة", value: store.families.length, month: thisMonth(store.families) },
      { label: "الموهوبون", value: store.talents.length, month: thisMonth(store.talents) },
      {
        label: "الشركات والجهات",
        value: businesses.size,
        note: `شركات: ${n(companies)} · جهات وجمعيات: ${n(businesses.size - companies)}`,
      },
    ],
    activity: [
      {
        label: "الإعلانات الوظيفية",
        value: jobs.length,
        month: thisMonth(jobs),
        note: `المفتوحة: ${n(jobs.filter((o) => !o.closed).length)} · كل الفرص: ${n(store.opportunities.length)}`,
      },
      {
        label: "تواصل واتساب مع الأسر",
        value: counter("whatsapp:family"),
        month: counter(`whatsapp:family@${month}`),
        note: `طلبات إظهار التواصل: ${n(reveals("family"))}`,
      },
      {
        label: "تواصل واتساب مع الموهوبين",
        value: counter("whatsapp:talent"),
        month: counter(`whatsapp:talent@${month}`),
        note: `طلبات إظهار التواصل: ${n(reveals("talent"))}`,
      },
      {
        label: "التقديم على الوظائف",
        value: jobApplications.length,
        month: thisMonth(jobApplications),
        note: `متقدمون مختلفون: ${n(new Set(jobApplications.map((a) => a.accountId)).size)} · كل التقديمات: ${n(store.applications.length)}`,
      },
    ],
  } satisfies Record<string, ReportTile[]>;
}
