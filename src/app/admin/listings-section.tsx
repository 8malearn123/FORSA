import Link from "next/link";
import { Eye, EyeOff, Search, Trash2 } from "lucide-react";

import { FilterChip, FilterPanel, FilterRow, hrefWith, one, ResultsBar, tally } from "@/components/browse";
import { inputClass } from "@/components/form";
import { Badge, buttonClass } from "@/components/ui";
import { COUNT, countLabel, formatNumber, timeAgo } from "@/lib/format";
import { areasName, inArea, isKind, isStale, KINDS, pathOf, titleOf } from "@/lib/listing";
import { listingKey, type readStore } from "@/lib/store";
import { GOVERNORATES, governorateName, isGovernorate } from "@/lib/taxonomy";
import { normalizeArabic } from "@/lib/text";
import type { Listing } from "@/lib/types";

import { KIND_NAME, ModerateButton } from "./moderate-button";

type Store = Awaited<ReturnType<typeof readStore>>;

const STATUSES = {
  visible: "ظاهر",
  reported: "عليه بلاغات",
  moderated: "أخفاه الإشراف",
  hidden: "أخفاه صاحبه",
  closed: "فرصة مكتملة",
  stale: "قد تكون انتهت",
} as const;
type Status = keyof typeof STATUSES;

const SORTS = {
  new: "الأحدث",
  old: "الأقدم",
  contacts: "الأكثر طلباً للتواصل",
} as const;
type Sort = keyof typeof SORTS;

const PAGE = 40;
const BASE = "/admin";

type Params = { q?: string; kind?: string; status?: string; area?: string; sort?: string; limit?: string };

/** قائمة الإعلانات في لوحة الإشراف مع البحث والفلترة، وكلها في الرابط فتبقى عند التحديث والمشاركة */
export function ListingsSection({
  store,
  params: raw,
}: {
  store: Store;
  params: Record<string, string | string[] | undefined>;
}) {
  const kind = one(raw.kind);
  const status = one(raw.status);
  const area = one(raw.area);
  const sort = one(raw.sort);
  const params: Params = {
    q: one(raw.q),
    kind: isKind(kind) ? kind : undefined,
    status: status && status in STATUSES ? status : undefined,
    area: isGovernorate(area) ? area : undefined,
    sort: sort && sort in SORTS && sort !== "new" ? sort : undefined,
  };
  const limit = Math.max(PAGE, Math.min(Number(one(raw.limit)) || PAGE, 2000));

  const reported = new Set(
    store.reports.filter((r) => !r.resolved).map((r) => listingKey(r.kind, r.listingId)),
  );
  const reveals = (l: Listing) => store.reveals[listingKey(l.kind, l.id)] ?? 0;
  const statusOf = (l: Listing): Status[] => {
    const s: Status[] = [];
    if (!l.moderated && !l.hidden) s.push("visible");
    if (reported.has(listingKey(l.kind, l.id))) s.push("reported");
    if (l.moderated) s.push("moderated");
    if (l.hidden) s.push("hidden");
    if (l.kind === "opportunity" && l.closed) s.push("closed");
    if (l.kind === "opportunity" && isStale(l)) s.push("stale");
    return s;
  };

  const words = params.q ? normalizeArabic(params.q).split(" ").filter(Boolean) : [];
  const textOf = (l: Listing) =>
    normalizeArabic([titleOf(l), l.kind === "opportunity" ? l.poster.name : "", l.id].join(" "));

  const all: Listing[] = [...store.talents, ...store.families, ...store.opportunities];
  /** يطبّق كل الفلاتر عدا المستثنى، لحساب أعداد خياراته */
  const filtered = (skip?: keyof Params) =>
    all.filter(
      (l) =>
        (skip === "kind" || !params.kind || l.kind === params.kind) &&
        (skip === "status" || !params.status || statusOf(l).includes(params.status as Status)) &&
        (!params.area || inArea(l, params.area)) &&
        (words.length === 0 || words.every((w) => textOf(l).includes(w))),
    );

  const results = filtered().sort((a, b) =>
    params.sort === "old"
      ? a.createdAt.localeCompare(b.createdAt)
      : params.sort === "contacts"
        ? reveals(b) - reveals(a) || b.createdAt.localeCompare(a.createdAt)
        : b.createdAt.localeCompare(a.createdAt),
  );
  const byKind = tally(filtered("kind"), (l) => l.kind);
  const byStatus = tally(filtered("status"), statusOf);
  const href = (changes: Params) => hrefWith(BASE, params, changes);

  const active = [
    params.q && { label: `«${params.q}»`, clearHref: href({ q: undefined }) },
    params.area && { label: governorateName(params.area), clearHref: href({ area: undefined }) },
    params.sort && { label: SORTS[params.sort as Sort], clearHref: href({ sort: undefined }) },
  ].filter(Boolean) as { label: string; clearHref: string }[];

  return (
    <section id="listings" className="mt-12 scroll-mt-24">
      <h2 className="text-2xl font-extrabold text-ink-900">الإعلانات</h2>

      <form action={`${BASE}#listings`} className="mt-5 flex flex-col gap-3 sm:flex-row">
        {params.kind ? <input type="hidden" name="kind" value={params.kind} /> : null}
        {params.status ? <input type="hidden" name="status" value={params.status} /> : null}
        <label className="relative flex-1">
          <span className="sr-only">بحث</span>
          <Search className="pointer-events-none absolute start-4 top-1/2 size-4 -translate-y-1/2 text-ink-400" />
          <input
            type="search"
            name="q"
            defaultValue={params.q}
            placeholder="ابحث بالعنوان أو الاسم أو اسم الناشر"
            className={`${inputClass} h-11 ps-10`}
          />
        </label>
        <select
          name="area"
          defaultValue={params.area ?? ""}
          aria-label="المحافظة"
          className={`${inputClass} h-11 cursor-pointer sm:w-40`}
        >
          <option value="">كل المحافظات</option>
          {GOVERNORATES.map((g) => (
            <option key={g.slug} value={g.slug}>
              {g.name}
            </option>
          ))}
        </select>
        <select
          name="sort"
          defaultValue={params.sort ?? "new"}
          aria-label="الترتيب"
          className={`${inputClass} h-11 cursor-pointer sm:w-48`}
        >
          {Object.entries(SORTS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button type="submit" className={buttonClass({ variant: "dark", size: "md" })}>
          تطبيق
        </button>
      </form>

      <div className="mt-3">
        <FilterPanel>
          <FilterRow label="النوع">
            <FilterChip href={href({ kind: undefined })} active={!params.kind}>
              الكل
            </FilterChip>
            {KINDS.map((k) => (
              <FilterChip
                key={k}
                href={href({ kind: k })}
                active={params.kind === k}
                count={byKind.get(k) ?? 0}
              >
                {KIND_NAME[k]}
              </FilterChip>
            ))}
          </FilterRow>
          <FilterRow label="الحالة">
            <FilterChip href={href({ status: undefined })} active={!params.status}>
              الكل
            </FilterChip>
            {(Object.keys(STATUSES) as Status[])
              .filter((s) => byStatus.has(s) || params.status === s)
              .map((s) => (
                <FilterChip
                  key={s}
                  href={href({ status: s })}
                  active={params.status === s}
                  count={byStatus.get(s) ?? 0}
                >
                  {STATUSES[s]}
                </FilterChip>
              ))}
          </FilterRow>
        </FilterPanel>
      </div>

      <div className="mt-5">
        <ResultsBar count={countLabel(results.length, COUNT.listing)} filters={active} />
      </div>

      {results.length === 0 ? (
        <p className="mt-4 text-ink-600">
          {all.length === 0 ? "لم يُنشر أي إعلان بعد." : "لا توجد إعلانات تطابق هذه الفلاتر."}
        </p>
      ) : (
        <ul className="mt-4 flex flex-col gap-2">
          {results.slice(0, limit).map((l) => {
            const s = statusOf(l);
            return (
              <li
                key={listingKey(l.kind, l.id)}
                className="flex flex-col gap-3 rounded-2xl rounded-ee-[6px] bg-white p-4 ring-1 ring-ink-100 md:flex-row md:items-center"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-ink-500">
                    <Badge tone={l.kind === "family" ? "clay" : l.kind === "talent" ? "sage" : "ink"}>
                      {KIND_NAME[l.kind]}
                    </Badge>
                    {areasName(l)} · {timeAgo(l.createdAt)} · طلبات تواصل: {formatNumber(reveals(l))}
                    {s.includes("reported") ? <Badge tone="clay">عليه بلاغات</Badge> : null}
                    {l.moderated ? <Badge tone="clay">أخفاه الإشراف</Badge> : null}
                    {l.hidden ? <Badge tone="sand">أخفاه صاحبه</Badge> : null}
                    {s.includes("closed") ? <Badge tone="sand">مكتملة</Badge> : null}
                    {s.includes("stale") ? <Badge tone="sand">قد تكون انتهت</Badge> : null}
                  </div>
                  <Link
                    href={pathOf(l)}
                    className="mt-1.5 block truncate font-semibold text-ink-900 hover:text-clay-700"
                  >
                    {titleOf(l)}
                  </Link>
                  {l.kind === "opportunity" ? (
                    <p className="mt-0.5 truncate text-sm text-ink-500">{l.poster.name}</p>
                  ) : null}
                </div>
                <div className="flex gap-2">
                  {l.moderated ? (
                    <ModerateButton op="show" kind={l.kind} id={l.id}>
                      <Eye className="size-4" />
                      إظهار
                    </ModerateButton>
                  ) : (
                    <ModerateButton op="hide" kind={l.kind} id={l.id}>
                      <EyeOff className="size-4" />
                      إخفاء
                    </ModerateButton>
                  )}
                  <ModerateButton op="delete" kind={l.kind} id={l.id} danger>
                    <Trash2 className="size-4" />
                    حذف
                  </ModerateButton>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {results.length > limit ? (
        <div className="mt-4 flex justify-center">
          <Link
            href={hrefWith(BASE, { ...params, limit: String(limit + PAGE) }, {})}
            scroll={false}
            className={buttonClass({ variant: "secondary", size: "md" })}
          >
            عرض المزيد ({formatNumber(results.length - limit)} متبقية)
          </Link>
        </div>
      ) : null}
    </section>
  );
}
