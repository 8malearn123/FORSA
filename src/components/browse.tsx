import Link from "next/link";
import type { ReactNode } from "react";
import { X } from "lucide-react";

import { formatNumber } from "@/lib/format";
import type { CategoryIcon as CategoryIconKey } from "@/lib/taxonomy";

import { Nuqta, Sparks } from "./brand";
import { cn } from "./cn";
import { CategoryIcon } from "./icons";
import { PendingHint } from "./pending-hint";
import { Container } from "./ui";

export type Params = Record<string, string | undefined>;

/** يبني رابطاً يحافظ على الفلاتر الحالية ويعدّل ما نريد فقط */
export function hrefWith(base: string, current: Params, changes: Params) {
  const next = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...current, ...changes })) {
    if (v) next.set(k, v);
  }
  const qs = next.toString();
  return qs ? `${base}?${qs}` : base;
}

/** عدد العناصر لكل قيمة، لإخفاء الفلاتر التي لا تؤدي لأي نتيجة */
export function tally<T>(items: T[], keys: (item: T) => string | string[]) {
  const counts = new Map<string, number>();
  for (const item of items) {
    const k = keys(item);
    for (const key of Array.isArray(k) ? k : [k]) counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

/** يقرأ قيمة نصية واحدة من searchParams */
export const one = (v: string | string[] | undefined) =>
  (Array.isArray(v) ? v[0] : v)?.trim().slice(0, 100) || undefined;

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
  children,
  tone = "clay",
}: {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children?: ReactNode;
  tone?: "clay" | "sage" | "ink";
}) {
  return (
    <section className="relative overflow-hidden border-b border-ink-100/70">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-nuqta-grid [mask-image:linear-gradient(to_bottom,black,transparent)] opacity-70"
      />
      <Nuqta
        rotate={-90}
        className={cn(
          "absolute -top-24 -left-20 size-72",
          tone === "clay" && "text-clay-100/80",
          tone === "sage" && "text-sage-100",
          tone === "ink" && "text-sand-300/60",
        )}
      />
      <Sparks className="absolute top-10 left-[12%] hidden w-12 md:block" animated />
      <Container className="relative pt-12 pb-10 md:pt-16">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-clay-700">
              <Nuqta className="size-2.5 text-clay-600" />
              {eyebrow}
            </p>
            <h1 className="mt-3 text-4xl leading-[1.25] font-black text-ink-900 md:text-5xl">{title}</h1>
            {description ? <p className="mt-4 text-lg leading-[1.9] text-ink-600">{description}</p> : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
        {children ? <div className="mt-8">{children}</div> : null}
      </Container>
    </section>
  );
}

/** لوحة الفلاتر: صفوف مفصولة بخط رفيع، وعناوينها في عمود واحد حتى تبدأ الخيارات من نفس المكان */
export function FilterPanel({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col divide-y divide-ink-100 rounded-[24px] rounded-ee-[7px] bg-white px-5 shadow-soft ring-1 ring-ink-100 sm:px-6">
      {children}
    </div>
  );
}

export function FilterRow({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5 py-4 sm:flex-row sm:items-start sm:gap-4">
      {label ? (
        <span className="shrink-0 text-xs font-semibold text-ink-500 sm:w-16 sm:pt-2 sm:text-sm">
          {label}
        </span>
      ) : null}
      <div className="-mx-5 no-scrollbar flex min-w-0 flex-1 gap-2 overflow-x-auto px-5 sm:mx-0 sm:flex-wrap sm:px-0">
        {children}
      </div>
    </div>
  );
}

export function FilterChip({
  href,
  active,
  icon,
  count,
  children,
}: {
  href: string;
  active?: boolean;
  icon?: CategoryIconKey;
  count?: number;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? "true" : undefined}
      className={cn(
        "relative inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium transition-colors",
        active ? "bg-ink-900 text-sand-50" : "bg-sand-100 text-ink-700 hover:bg-sand-200 hover:text-ink-900",
      )}
    >
      {icon ? (
        <CategoryIcon icon={icon} className={cn("size-4", active ? "text-sage-300" : "text-sage-600")} />
      ) : null}
      {children}
      {count !== undefined ? (
        <span className={cn("text-xs tabular-nums", active ? "text-ink-200" : "text-ink-500")}>
          {formatNumber(count)}
        </span>
      ) : null}
      <PendingHint />
    </Link>
  );
}

export function ResultsBar({
  count,
  filters,
}: {
  count: ReactNode;
  filters: { label: string; clearHref: string }[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <p className="me-2 font-display text-lg font-bold text-ink-900">{count}</p>
      {filters.map((f) => (
        <Link
          key={f.label}
          href={f.clearHref}
          scroll={false}
          className="inline-flex items-center gap-1.5 rounded-full bg-clay-50 px-3 py-1.5 text-sm text-clay-800 ring-1 ring-clay-100 hover:bg-clay-100"
        >
          {f.label}
          <X className="size-3.5" aria-label="إزالة" />
        </Link>
      ))}
    </div>
  );
}
